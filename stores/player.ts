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
      if (!state.card) return false
      return hasWon(state.card.marksServer)
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
        this.card = await $pb.collection('cards').getOne(cardId) as any
        this.localMarks = [...this.card.marksServer]
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
        // Update card
        await $pb.collection('cards').update(cardId, {
          assignedTo: this.player.id,
          assignedAt: new Date().toISOString(),
          inUse: true
        })

        // Update player
        await $pb.collection('players').update(this.player.id, {
          card: cardId
        })

        // Load the card
        await this.loadCard(cardId)
        this.player.card = cardId

        this.subscribeToCard()

        return true
      } catch (error) {
        console.error('Failed to claim card:', error)
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

        await $pb.collection('cards').update(this.card.id, {
          marksServer: newMarks,
          cellsMarked,
          linesComplete: progress.linesComplete,
          progress,
          lastMarkedAt: new Date().toISOString()
        })

        // Check if won
        if (hasWon(newMarks) && !this.player.bingoAtDraw) {
          const gameStore = useGameStore()
          const lines = getCompleteLines(newMarks)

          // Create winner record
          await $pb.collection('winners').create({
            player: this.player.id,
            drawIndex: gameStore.game?.currentDrawIndex || 0,
            lines,
            createdAt: new Date().toISOString()
          })

          // Update player
          await $pb.collection('players').update(this.player.id, {
            bingoAtDraw: gameStore.game?.currentDrawIndex || 0
          })
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
        $pb.collection('cards').subscribe(this.card.id, (e: any) => {
          if (e.action === 'update') {
            this.card = e.record as any
            this.localMarks = [...this.card.marksServer]
          }
        })

        this.isSubscribed = true
      } catch (error) {
        console.error('Failed to subscribe to card:', error)
      }
    },

    unsubscribe() {
      const { $pb } = useNuxtApp()

      if (this.isSubscribed && this.card) {
        $pb.collection('cards').unsubscribe(this.card.id)
        this.isSubscribed = false
      }
    }
  }
})

