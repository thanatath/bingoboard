import { defineStore } from 'pinia'
import type { RecordModel } from 'pocketbase'

export interface GameState {
  status: 'idle' | 'running' | 'ended'
  startedAt?: string
  endedAt?: string
  currentDrawIndex: number
  questionEvery: number
  activeQuestionEventId?: string
}

export interface Draw {
  id: string
  drawIndex: number
  number: number
  createdAt: string
}

export interface Winner {
  id: string
  player: string
  playerName?: string
  drawIndex: number
  lines: string[]
  createdAt: string
}

export interface QuestionEvent {
  id: string
  drawIndex: number
  question: string
  questionData?: Question
  createdAt: string
}

export interface Question {
  id: string
  text: string
  choices: string[]
  correctIndex: number
  weight: number
  isActive: boolean
}

export const useGameStore = defineStore('game', {
  state: () => ({
    game: null as (GameState & { id: string }) | null,
    draws: [] as Draw[],
    winners: [] as Winner[],
    activeQuestion: null as (QuestionEvent & { questionData: Question }) | null,
    isSubscribed: false,
    availableQuestionsCount: 0 // จำนวนคำถามที่ยังไม่ถูกถาม
  }),

  getters: {
    isGameRunning: (state) => state.game?.status === 'running',
    latestDraw: (state) => state.draws[state.draws.length - 1],
    drawnNumbers: (state) => state.draws.map(d => d.number),
    nextQuestionAt: (state) => {
      if (!state.game) return 0
      const next = Math.ceil((state.game.currentDrawIndex + 1) / state.game.questionEvery) * state.game.questionEvery
      return next
    },
    drawsUntilQuestion: (state) => {
      if (!state.game) return 0
      // ถ้าไม่มีคำถามเหลือ ไม่ต้องแสดง
      if (state.availableQuestionsCount === 0) return 0
      const next = Math.ceil((state.game.currentDrawIndex + 1) / state.game.questionEvery) * state.game.questionEvery
      return next - state.game.currentDrawIndex
    }
  },

  actions: {
    async init() {
      const { $pb } = useNuxtApp()

      try {
        // Fetch initial game state
        const games = await $pb.collection('game').getFullList()

        if (games.length > 0) {
          this.game = games[0] as any
        } else {
          // Create initial game record if not exists
          console.log('No game record found, creating one...')
          this.game = await $pb.collection('game').create({
            status: 'idle',
            currentDrawIndex: 0,
            activeQuestionEventId: null,
            startedAt: null,
            endedAt: null
          }) as any
          console.log('Game record created:', this.game)
        }

        // Fetch draws
        this.draws = await $pb.collection('draws').getFullList({
          sort: 'drawIndex'
        }) as any

        // Fetch winners
        this.winners = await $pb.collection('winners').getFullList({
          sort: '-createdAt',
          expand: 'player'
        }) as any

        // Fetch active question if exists
        if (this.game?.activeQuestionEventId) {
          await this.fetchActiveQuestion()
        }

        // Update available questions count
        await this.updateAvailableQuestionsCount()

        // Subscribe to realtime updates
        this.subscribe()

      } catch (error) {
        console.error('Failed to initialize game store:', error)
        throw error
      }
    },

    async updateAvailableQuestionsCount() {
      const { $pb } = useNuxtApp()

      try {
        // Get all asked question IDs
        const askedQuestionEvents = await $pb.collection('questionEvents').getFullList({
          fields: 'question'
        }) as any

        const askedQuestionIds = new Set(askedQuestionEvents.map((e: any) => e.question))

        // Get all active questions
        const allQuestions = await $pb.collection('questions').getFullList({
          filter: 'isActive=true'
        }) as any

        // Filter out questions that have been asked
        const availableQuestions = allQuestions.filter((q: any) => !askedQuestionIds.has(q.id))

        this.availableQuestionsCount = availableQuestions.length

        console.log(`📊 Available questions: ${this.availableQuestionsCount} / ${allQuestions.length}`)

      } catch (error) {
        console.error('Failed to update available questions count:', error)
      }
    },

    async fetchActiveQuestion() {
      const { $pb } = useNuxtApp()

      try {
        if (this.game?.activeQuestionEventId) {
          const event = await $pb.collection('questionEvents').getOne(this.game.activeQuestionEventId, {
            expand: 'question'
          }) as any

          this.activeQuestion = {
            ...event,
            questionData: event.expand?.question
          }
        }
      } catch (error) {
        console.error('Failed to fetch active question:', error)
      }
    },

    subscribe() {
      const { $pb } = useNuxtApp()

      if (this.isSubscribed) return

      try {
        // Subscribe to game changes
        $pb.collection('game').subscribe('*', (e: any) => {
          if (e.action === 'update') {
            this.game = e.record as any
            if (e.record.activeQuestionEventId) {
              this.fetchActiveQuestion()
            } else {
              this.activeQuestion = null
            }
          }
        })

        // Subscribe to draws
        $pb.collection('draws').subscribe('*', (e: any) => {
          if (e.action === 'create') {
            this.draws.push(e.record as any)
            this.draws.sort((a, b) => a.drawIndex - b.drawIndex)
          }
        })

        // Subscribe to winners
        $pb.collection('winners').subscribe('*', async (e: any) => {
          if (e.action === 'create') {
            const winner = await $pb.collection('winners').getOne(e.record.id, {
              expand: 'player'
            }) as any
            this.winners.unshift(winner)
          }
        })

        // Subscribe to questionEvents (to update available questions count)
        $pb.collection('questionEvents').subscribe('*', (e: any) => {
          if (e.action === 'create') {
            // เมื่อมีคำถามใหม่ถูกถาม ให้ update count
            this.updateAvailableQuestionsCount()
          }
        })

        // Subscribe to questions (to update count when questions are added/removed)
        $pb.collection('questions').subscribe('*', (e: any) => {
          if (e.action === 'create' || e.action === 'delete' || e.action === 'update') {
            // เมื่อมีการเพิ่ม/ลบ/แก้ไขคำถาม ให้ update count
            this.updateAvailableQuestionsCount()
          }
        })

        this.isSubscribed = true
        console.log('✅ Realtime subscriptions active for game, draws, winners, questionEvents, and questions')

      } catch (error) {
        console.error('❌ Realtime subscription failed:', error)
        throw error
      }
    },

    unsubscribe() {
      const { $pb } = useNuxtApp()

      if (this.isSubscribed) {
        $pb.collection('game').unsubscribe()
        $pb.collection('draws').unsubscribe()
        $pb.collection('winners').unsubscribe()
        $pb.collection('questionEvents').unsubscribe()
        $pb.collection('questions').unsubscribe()
        this.isSubscribed = false
        console.log('🔌 Unsubscribed from realtime updates')
      }
    },

    async submitAnswer(playerId: string, choiceIndex: number) {
      const { $pb } = useNuxtApp()

      if (!this.activeQuestion) return

      try {
        const isCorrect = choiceIndex === this.activeQuestion.questionData.correctIndex

        // Create answer record
        await $pb.collection('questionAnswers').create({
          player: playerId,
          questionEvent: this.activeQuestion.id,
          choiceIndex,
          isCorrect,
          answeredAt: new Date().toISOString()
        })

        // If correct, grant a FREE cell
        if (isCorrect) {
          try {
            // Get player's card
            const player = await $pb.collection('players').getOne(playerId, {
              expand: 'card'
            }) as any

            if (player.card) {
              const card = await $pb.collection('cards').getOne(player.card) as any

              // Pick a random unmarked cell (not FREE)
              const { pickFreeableCell, calculateBingoProgress } = await import('~/utils/bingo')
              const cellIndex = pickFreeableCell(card.grid, card.marksServer)

              if (cellIndex !== null) {
                // Mark the cell as FREE
                const newMarks = [...card.marksServer]
                newMarks[cellIndex] = true

                // Change the grid cell to 'FREE'
                const newGrid = [...card.grid]
                newGrid[cellIndex] = 'FREE'

                const cellsMarked = newMarks.filter((m: boolean) => m).length
                const progress = calculateBingoProgress(newMarks)

                // Update card
                await $pb.collection('cards').update(card.id, {
                  grid: newGrid,
                  marksServer: newMarks,
                  cellsMarked,
                  linesComplete: progress.linesComplete,
                  progress,
                  lastMarkedAt: new Date().toISOString()
                })

                console.log(`✅ Granted FREE cell at index ${cellIndex} for player ${playerId}`)
              } else {
                console.log(`⚠️ No available cells to grant FREE for player ${playerId}`)
              }

              // Update player's correct answer count
              await $pb.collection('players').update(playerId, {
                answersCorrect: (player.answersCorrect || 0) + 1
              })
            }
          } catch (error) {
            console.error('Failed to grant FREE cell:', error)
            // Don't throw - answer was already recorded
          }
        }

        return isCorrect
      } catch (error) {
        console.error('Failed to submit answer:', error)
        throw error
      }
    }
  }
})

