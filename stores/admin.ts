import { defineStore } from 'pinia'
import { sample, generate120Cards } from '~/utils/bingo'
import type { Card } from './player'

export const useAdminStore = defineStore('admin', {
  state: () => ({
    allCards: [] as Card[],
    allPlayers: [] as any[],
    stats: {
      playersCount: 0,
      claimedCardsCount: 0,
      drawsCount: 0,
      winnersCount: 0,
      questionLatestAccuracy: { correct: 0, total: 0 }
    },
    isLoading: false,
    isSubscribed: false
  }),

  getters: {
    claimedCards: (state) => state.allCards.filter(c => c.inUse),
    availableCards: (state) => state.allCards.filter(c => !c.inUse),
    sortedCardsByProgress: (state) => {
      return [...state.allCards]
        .filter(c => c.inUse)
        .sort((a, b) => {
          // Sort by lines complete (desc), then by linesOneAway (desc), then by maxLineProgress (desc)
          if (b.linesComplete !== a.linesComplete) {
            return b.linesComplete - a.linesComplete
          }
          if (b.progress.linesOneAway !== a.progress.linesOneAway) {
            return b.progress.linesOneAway - a.progress.linesOneAway
          }
          return b.progress.maxLineProgress - a.progress.maxLineProgress
        })
    }
  },

  actions: {
    async init() {
      const { $pb } = useNuxtApp()

      this.isLoading = true

      try {
        // Fetch all cards
        this.allCards = await $pb.collection('cards').getFullList({
          sort: 'code',
          expand: 'assignedTo'
        }) as any

        // Fetch all players
        this.allPlayers = await $pb.collection('players').getFullList({
          sort: '-joinedAt'
        }) as any

        // Calculate stats
        await this.updateStats()

        // Subscribe to realtime updates
        this.subscribe()

      } catch (error) {
        console.error('Failed to initialize admin store:', error)
      } finally {
        this.isLoading = false
      }
    },

    subscribe() {
      const { $pb } = useNuxtApp()

      if (this.isSubscribed) return

      try {
        // Subscribe to cards changes
        $pb.collection('cards').subscribe('*', async (e: any) => {
          console.log('📇 Card update:', e.action, e.record.code)

          if (e.action === 'create') {
            this.allCards.push(e.record as any)
            this.allCards.sort((a, b) => a.code.localeCompare(b.code))
          } else if (e.action === 'update') {
            const index = this.allCards.findIndex(c => c.id === e.record.id)
            if (index !== -1) {
              // Fetch with expand to get assignedTo data
              const card = await $pb.collection('cards').getOne(e.record.id, {
                expand: 'assignedTo'
              })
              this.allCards[index] = card as any
            }
          } else if (e.action === 'delete') {
            this.allCards = this.allCards.filter(c => c.id !== e.record.id)
          }

          await this.updateStats()
        })

        // Subscribe to players changes
        $pb.collection('players').subscribe('*', async (e: any) => {
          console.log('👤 Player update:', e.action, e.record.name)

          if (e.action === 'create') {
            this.allPlayers.unshift(e.record as any)
          } else if (e.action === 'update') {
            const index = this.allPlayers.findIndex(p => p.id === e.record.id)
            if (index !== -1) {
              this.allPlayers[index] = e.record as any
            }
          } else if (e.action === 'delete') {
            this.allPlayers = this.allPlayers.filter(p => p.id !== e.record.id)
          }

          await this.updateStats()
        })

        this.isSubscribed = true
        console.log('✅ Admin realtime subscriptions active for cards and players')

      } catch (error) {
        console.error('❌ Admin realtime subscription failed:', error)
      }
    },

    unsubscribe() {
      const { $pb } = useNuxtApp()

      if (this.isSubscribed) {
        $pb.collection('cards').unsubscribe()
        $pb.collection('players').unsubscribe()
        this.isSubscribed = false
        console.log('🔌 Admin unsubscribed from realtime updates')
      }
    },

    async updateStats() {
      const { $pb } = useNuxtApp()
      const gameStore = useGameStore()

      try {
        this.stats.playersCount = this.allPlayers.length
        this.stats.claimedCardsCount = this.allCards.filter(c => c.inUse).length
        this.stats.drawsCount = gameStore.draws.length
        this.stats.winnersCount = gameStore.winners.length

        // Get latest question accuracy
        if (gameStore.activeQuestion) {
          const answers = await $pb.collection('questionAnswers').getFullList({
            filter: `questionEvent="${gameStore.activeQuestion.id}"`
          }) as any

          const correct = answers.filter((a: any) => a.isCorrect).length
          this.stats.questionLatestAccuracy = {
            correct,
            total: answers.length
          }
        }

      } catch (error) {
        console.error('Failed to update stats:', error)
      }
    },

    async startGame() {
      const { $pb } = useNuxtApp()
      const gameStore = useGameStore()

      if (!gameStore.game) return

      try {
        await $pb.collection('game').update(gameStore.game.id, {
          status: 'running',
          startedAt: new Date().toISOString()
        })
      } catch (error) {
        console.error('Failed to start game:', error)
        throw error
      }
    },

    async randomNumber() {
      const { $pb } = useNuxtApp()
      const gameStore = useGameStore()

      if (!gameStore.game || gameStore.game.status !== 'running') {
        throw new Error('Game is not running')
      }

      if (gameStore.game.currentDrawIndex >= 99) {
        throw new Error('All numbers have been drawn')
      }

      try {
        // Get used numbers
        const used = gameStore.draws.map(d => d.number)
        const all = Array.from({ length: 99 }, (_, i) => i + 1)
        const remaining = all.filter(n => !used.includes(n))

        if (remaining.length === 0) {
          throw new Error('No numbers remaining')
        }

        const number = sample(remaining)
        const nextDrawIndex = gameStore.game.currentDrawIndex + 1

        // Create draw
        await $pb.collection('draws').create({
          drawIndex: nextDrawIndex,
          number,
          createdAt: new Date().toISOString()
        })

        // Update game
        const patch: any = { currentDrawIndex: nextDrawIndex }

        // Check if we need to trigger a question
        if (nextDrawIndex % gameStore.game.questionEvery === 0) {
          // Get all asked question IDs
          const askedQuestionEvents = await $pb.collection('questionEvents').getFullList({
            fields: 'question'
          }) as any

          const askedQuestionIds = new Set(askedQuestionEvents.map((e: any) => e.question))
          console.log(`📊 Already asked ${askedQuestionIds.size} questions`)
          console.log(`📋 Asked question IDs:`, Array.from(askedQuestionIds))

          // Pick a weighted active question that hasn't been asked yet
          const allQuestions = await $pb.collection('questions').getFullList({
            filter: 'isActive=true',
            sort: 'created' // Sort by created date (oldest first)
          }) as any

          console.log(`📚 Total active questions: ${allQuestions.length}`)
          console.log(`📚 All question IDs:`, allQuestions.map((q: any) => q.id))

          // Filter out questions that have been asked
          const availableQuestions = allQuestions.filter((q: any) => !askedQuestionIds.has(q.id))

          console.log(`✅ Available questions: ${availableQuestions.length} / ${allQuestions.length}`)
          if (availableQuestions.length > 0) {
            console.log(`✅ Available question IDs:`, availableQuestions.map((q: any) => q.id))
          }

          if (availableQuestions.length > 0) {
            // Simple weighted random selection from available questions
            const totalWeight = availableQuestions.reduce((sum: number, q: any) => sum + (q.weight || 1), 0)
            let random = Math.random() * totalWeight
            let selectedQuestion = availableQuestions[0]

            for (const q of availableQuestions) {
              random -= q.weight || 1
              if (random <= 0) {
                selectedQuestion = q
                break
              }
            }

            console.log(`🎯 Selected question ID: ${selectedQuestion.id}`)
            console.log(`🎯 Selected question text: ${selectedQuestion.text}`)

            // Create question event
            const event = await $pb.collection('questionEvents').create({
              drawIndex: nextDrawIndex,
              question: selectedQuestion.id,
              createdAt: new Date().toISOString()
            })

            console.log(`✅ Created questionEvent: ${event.id} for question: ${selectedQuestion.id}`)

            patch.activeQuestionEventId = event.id
          } else {
            console.log('⚠️ No available questions (all questions have been asked)')
            // Don't set activeQuestionEventId if no questions available
            patch.activeQuestionEventId = null
          }
        } else {
          // Clear active question if not a question round
          patch.activeQuestionEventId = null
        }

        await $pb.collection('game').update(gameStore.game.id, patch)

        // Refresh stats
        await this.updateStats()

      } catch (error) {
        console.error('Failed to draw random number:', error)
        throw error
      }
    },

    async resetGame() {
      const { $pb } = useNuxtApp()
      const gameStore = useGameStore()

      if (!gameStore.game) return

      try {
        console.log('🔄 Starting game reset - clearing all collections except game...')

        // IMPORTANT: Reset game.activeQuestionEventId FIRST
        // This removes the reference to questionEvents before deleting them
        console.log('🔄 Resetting game references...')
        await $pb.collection('game').update(gameStore.game.id, {
          status: 'idle',
          currentDrawIndex: 0,
          activeQuestionEventId: null, // ← Clear reference first!
          startedAt: null,
          endedAt: null
        })
        console.log('✅ Game references cleared')

        // Now delete in order: child collections first, then parent collections
        // This prevents foreign key constraint errors

        // 1. Delete questionAnswers (child of players and questionEvents)
        console.log('🗑️ Deleting questionAnswers...')
        const answers = await $pb.collection('questionAnswers').getFullList()
        for (const answer of answers) {
          await $pb.collection('questionAnswers').delete(answer.id)
        }
        console.log(`✅ Deleted ${answers.length} questionAnswers`)

        // 2. Delete winners (child of players)
        console.log('🗑️ Deleting winners...')
        const winners = await $pb.collection('winners').getFullList()
        for (const winner of winners) {
          await $pb.collection('winners').delete(winner.id)
        }
        console.log(`✅ Deleted ${winners.length} winners`)

        // 3. Delete players (child of cards)
        console.log('🗑️ Deleting players...')
        const players = await $pb.collection('players').getFullList()
        for (const player of players) {
          await $pb.collection('players').delete(player.id)
        }
        console.log(`✅ Deleted ${players.length} players`)

        // 4. Delete questionEvents (child of questions)
        // Now safe to delete because game.activeQuestionEventId is null
        console.log('🗑️ Deleting questionEvents...')
        const events = await $pb.collection('questionEvents').getFullList()
        for (const event of events) {
          await $pb.collection('questionEvents').delete(event.id)
        }
        console.log(`✅ Deleted ${events.length} questionEvents`)

        // 5. Delete cards (no children)
        console.log('🗑️ Deleting cards...')
        const cards = await $pb.collection('cards').getFullList()
        for (const card of cards) {
          await $pb.collection('cards').delete(card.id)
        }
        console.log(`✅ Deleted ${cards.length} cards`)

        // 6. Delete questions (no children)
        console.log('🗑️ Deleting questions...')
        const questions = await $pb.collection('questions').getFullList()
        for (const question of questions) {
          await $pb.collection('questions').delete(question.id)
        }
        console.log(`✅ Deleted ${questions.length} questions`)

        // 7. Delete draws (no children)
        console.log('🗑️ Deleting draws...')
        const draws = await $pb.collection('draws').getFullList()
        for (const draw of draws) {
          await $pb.collection('draws').delete(draw.id)
        }
        console.log(`✅ Deleted ${draws.length} draws`)

        // Refresh data
        console.log('🔄 Refreshing stores...')
        await this.init()
        await gameStore.init()

        console.log('✅ Game reset complete!')

      } catch (error) {
        console.error('❌ Failed to reset game:', error)
        throw error
      }
    },

    async generateCards() {
      const { $pb } = useNuxtApp()

      this.isLoading = true

      try {
        // Check if cards already exist
        const existingCards = await $pb.collection('cards').getFullList()

        if (existingCards.length > 0) {
          const confirm = window.confirm(
            `มีการ์ดอยู่แล้ว ${existingCards.length} ใบ\nต้องการลบและสร้างใหม่หรือไม่?`
          )

          if (!confirm) {
            this.isLoading = false
            return { success: false, message: 'ยกเลิกการสร้างการ์ด' }
          }

          // Delete existing cards
          for (const card of existingCards) {
            await $pb.collection('cards').delete(card.id)
          }
        }

        // Generate 120 new cards
        const cards = generate120Cards()
        let created = 0

        for (const card of cards) {
          await $pb.collection('cards').create(card)
          created++

          // Update progress every 10 cards
          if (created % 10 === 0) {
            console.log(`สร้างการ์ดแล้ว ${created}/120`)
          }
        }

        // Refresh cards list
        await this.init()

        return {
          success: true,
          message: `สร้างการ์ดสำเร็จ ${created} ใบ!`
        }

      } catch (error) {
        console.error('Failed to generate cards:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteAllCards() {
      const { $pb } = useNuxtApp()

      const confirm = window.confirm(
        'คุณแน่ใจหรือไม่ที่จะลบการ์ดทั้งหมด?\nการกระทำนี้ไม่สามารถย้อนกลับได้'
      )

      if (!confirm) return

      this.isLoading = true

      try {
        const cards = await $pb.collection('cards').getFullList()

        for (const card of cards) {
          await $pb.collection('cards').delete(card.id)
        }

        // Refresh cards list
        await this.init()

        return { success: true, message: 'ลบการ์ดทั้งหมดสำเร็จ!' }

      } catch (error) {
        console.error('Failed to delete cards:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async generateSampleQuestions() {
      const { $pb } = useNuxtApp()

      this.isLoading = true

      try {
        // Check if questions already exist
        const existingQuestions = await $pb.collection('questions').getFullList()

        if (existingQuestions.length > 0) {
          const confirm = window.confirm(
            `มีคำถามอยู่แล้ว ${existingQuestions.length} ข้อ\nต้องการลบและสร้างใหม่หรือไม่?`
          )

          if (!confirm) {
            this.isLoading = false
            return { success: false, message: 'ยกเลิกการสร้างคำถาม' }
          }

          // Delete existing questions
          for (const question of existingQuestions) {
            await $pb.collection('questions').delete(question.id)
          }
        }

        // Sample question (1 question only)
        const questions = [
          {
            text: 'ประเทศไทยมีกี่จังหวัด?',
            choices: ['75', '76', '77', '78'],
            correctIndex: 2,
            weight: 1,
            isActive: true
          }
        ]

        let created = 0

        for (const question of questions) {
          await $pb.collection('questions').create(question)
          created++
          console.log(`สร้างคำถามแล้ว ${created}/${questions.length}`)
        }

        return {
          success: true,
          message: `สร้างคำถามสำเร็จ ${created} ข้อ!`
        }

      } catch (error) {
        console.error('Failed to generate questions:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteAllQuestions() {
      const { $pb } = useNuxtApp()

      const confirm = window.confirm(
        'คุณแน่ใจหรือไม่ที่จะลบคำถามทั้งหมด?\nการกระทำนี้ไม่สามารถย้อนกลับได้'
      )

      if (!confirm) return

      this.isLoading = true

      try {
        const questions = await $pb.collection('questions').getFullList()

        for (const question of questions) {
          await $pb.collection('questions').delete(question.id)
        }

        return { success: true, message: 'ลบคำถามทั้งหมดสำเร็จ!' }

      } catch (error) {
        console.error('Failed to delete questions:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    }
  }
})

