import { defineStore } from 'pinia'
import { calculateBingoProgress, hasWon, getCompleteLines } from '~/utils/bingo'

export interface Player {
  id: string
  name: string
  joinedAt: string
  card?: string
  answersCorrect: number
  bingoAtDraw?: number
}

export interface Card {
  id: string
  code: string
  grid: (number | string)[]
  assignedTo?: string
  assignedAt?: string
  inUse: boolean
  marksServer: boolean[]
  cellsMarked: number
  linesComplete: number
  progress: {
    row: number[]
    col: number[]
    diag: number[]
    linesOneAway: number
    maxLineProgress: number
  }
  lastMarkedAt?: string
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    player: null as Player | null,
    card: null as Card | null,
    localMarks: [] as boolean[], // Client-side marks for optimistic updates
    isSubscribed: false
  }),

  getters: {
    hasCard: (state) => !!state.card,
    playerId: (state) => state.player?.id,
    playerName: (state) => state.player?.name,
    hasWonBingo: (state) => {
      // Check if player has bingoAtDraw set (means they won)
      if (state.player?.bingoAtDraw) {
        console.log(`✅ Player has won at draw ${state.player.bingoAtDraw}`)
        return true
      }

      // Otherwise check current card state
      if (!state.card) return false

      const won = hasWon(state.card.marksServer)
      if (won) {
        console.log(`✅ Card has winning pattern! linesComplete=${state.card.linesComplete}`)
      }

      return won
    }
  },

  actions: {
    async loadFromLocalStorage() {
      if (process.client) {
        const playerId = localStorage.getItem('playerId')
        if (playerId) {
          await this.loadPlayer(playerId)
        }
      }
    },

    async loadPlayer(playerId: string) {
      const { $pb } = useNuxtApp()

      try {
        this.player = await $pb.collection('players').getOne(playerId, {
          expand: 'card'
        }) as any

        if (this.player.card) {
          await this.loadCard(this.player.card)
        }

        this.subscribeToCard()
      } catch (error) {
        console.error('Failed to load player:', error)
        // Clear invalid player ID
        if (process.client) {
          localStorage.removeItem('playerId')
        }
      }
    },

    async loadCard(cardId: string) {
      const { $pb } = useNuxtApp()

      try {
        const card = await $pb.collection('cards').getOne(cardId) as any

        // Force update by creating new object (trigger Vue reactivity)
        this.card = {
          ...card,
          grid: [...card.grid],
          marksServer: [...card.marksServer]
        } as any

        this.localMarks = [...this.card.marksServer]

        const freeCells = this.card.grid.filter((c: any) => c === 'FREE').length
        console.log(`📥 Loaded card ${this.card.code}: cellsMarked=${this.card.cellsMarked}, FREE cells=${freeCells}`)
      } catch (error) {
        console.error('Failed to load card:', error)
      }
    },

    async createPlayer(name: string) {
      const { $pb } = useNuxtApp()

      try {
        this.player = await $pb.collection('players').create({
          name,
          joinedAt: new Date().toISOString(),
          answersCorrect: 0
        }) as any

        // Save to localStorage
        if (process.client) {
          localStorage.setItem('playerId', this.player.id)
        }

        return this.player
      } catch (error) {
        console.error('Failed to create player:', error)
        throw error
      }
    },

    async claimCard(cardId: string) {
      const { $pb } = useNuxtApp()

      if (!this.player) throw new Error('No player found')

      try {
        // Check if card is still available (race condition check)
        const card = await $pb.collection('cards').getOne(cardId)

        if (card.inUse) {
          throw new Error('Card is already in use')
        }

        // Update card with filter to ensure it's not in use
        // This prevents race condition at database level
        const updatedCard = await $pb.collection('cards').update(cardId, {
          assignedTo: this.player.id,
          assignedAt: new Date().toISOString(),
          inUse: true
        })

        // Verify the update was successful
        if (!updatedCard.inUse || updatedCard.assignedTo !== this.player.id) {
          throw new Error('Failed to claim card - race condition detected')
        }

        // Update player
        await $pb.collection('players').update(this.player.id, {
          card: cardId
        })

        // Load the card
        await this.loadCard(cardId)
        this.player.card = cardId

        this.subscribeToCard()

        console.log(`✅ Successfully claimed card ${updatedCard.code}`)
        return true
      } catch (error: any) {
        console.error('Failed to claim card:', error)

        // Provide user-friendly error message
        if (error.message?.includes('in use') || error.message?.includes('race condition')) {
          throw new Error('การ์ดนี้ถูกเลือกไปแล้ว')
        }

        throw error
      }
    },

    async markCell(cellIndex: number, drawnNumbers: number[], latestDrawNumber?: number) {
      const { $pb } = useNuxtApp()

      if (!this.card || !this.player) return

      const cellValue = this.card.grid[cellIndex]

      // Check if cell is already marked
      if (this.card.marksServer[cellIndex]) {
        return
      }

      // Check if it's FREE
      if (cellValue === 'FREE') {
        return
      }

      // Check if number has been drawn
      if (!drawnNumbers.includes(cellValue as number)) {
        alert('ไม่โกงนะจ๊ะ')
        return
      }

      // Check if the number was drawn in the past (not the latest draw)
      if (latestDrawNumber && cellValue !== latestDrawNumber && drawnNumbers.includes(cellValue as number)) {
        alert('เสียใจด้วยนะ เลขนั้นผ่านไปแล้ว')
        return
      }

      // Optimistic update
      this.localMarks[cellIndex] = true

      try {
        // Update server
        const newMarks = [...this.card.marksServer]
        newMarks[cellIndex] = true

        const cellsMarked = newMarks.filter(m => m).length
        const progress = calculateBingoProgress(newMarks)

        const updatedCard = await $pb.collection('cards').update(this.card.id, {
          marksServer: newMarks,
          cellsMarked,
          linesComplete: progress.linesComplete,
          progress,
          lastMarkedAt: new Date().toISOString()
        })

        // Update local card state immediately
        this.card = updatedCard as any

        console.log(`📝 Marked cell ${cellIndex}: cellsMarked=${cellsMarked}, linesComplete=${progress.linesComplete}`)

        // Check if won
        if (hasWon(newMarks) && !this.player.bingoAtDraw) {
          console.log('🎉 BINGO detected! Creating winner record...')
          const gameStore = useGameStore()
          const lines = getCompleteLines(newMarks)

          // Create winner record
          await $pb.collection('winners').create({
            player: this.player.id,
            drawIndex: gameStore.game?.currentDrawIndex || 0,
            lines,
            createdAt: new Date().toISOString()
          })

          // Update player in database
          const updatedPlayer = await $pb.collection('players').update(this.player.id, {
            bingoAtDraw: gameStore.game?.currentDrawIndex || 0
          })

          // Update local state
          this.player = updatedPlayer as Player

          console.log(`🎉 Player ${this.player.name} won at draw ${updatedPlayer.bingoAtDraw}!`)
        }

      } catch (error) {
        console.error('Failed to mark cell:', error)
        // Revert optimistic update
        this.localMarks[cellIndex] = false
      }
    },

    subscribeToCard() {
      const { $pb } = useNuxtApp()

      if (!this.card || this.isSubscribed) return

      try {
        // Subscribe to card updates
        $pb.collection('cards').subscribe(this.card.id, (e: any) => {
          if (e.action === 'update') {
            console.log('📥 Card updated from server:', e.record.code)

            // Count FREE cells in grid
            const freeCellsBefore = this.card.grid.filter((c: any) => c === 'FREE').length
            const freeCellsAfter = e.record.grid.filter((c: any) => c === 'FREE').length

            // Force update by creating new object (trigger Vue reactivity)
            this.card = {
              ...e.record,
              grid: [...e.record.grid],
              marksServer: [...e.record.marksServer]
            } as any

            this.localMarks = [...this.card.marksServer]

            console.log(`Updated card: cellsMarked=${this.card.cellsMarked}, linesComplete=${this.card.linesComplete}`)
            console.log(`FREE cells: ${freeCellsBefore} → ${freeCellsAfter}`)
            console.log(`Grid sample: [${this.card.grid.slice(0, 5).join(', ')}]`)

            if (freeCellsAfter > freeCellsBefore) {
              console.log('🎁 New FREE cell granted!')
            }
          }
        })

        // Subscribe to player updates (for bingoAtDraw)
        if (this.player) {
          $pb.collection('players').subscribe(this.player.id, (e: any) => {
            if (e.action === 'update') {
              this.player = e.record as Player
              console.log(`Player updated: bingoAtDraw = ${this.player.bingoAtDraw}`)
            }
          })
        }

        this.isSubscribed = true
      } catch (error) {
        console.error('Failed to subscribe to card:', error)
      }
    },

    unsubscribe() {
      const { $pb } = useNuxtApp()

      if (this.isSubscribed) {
        if (this.card) {
          $pb.collection('cards').unsubscribe(this.card.id)
        }
        if (this.player) {
          $pb.collection('players').unsubscribe(this.player.id)
        }
        this.isSubscribed = false
      }
    }
  }
})

