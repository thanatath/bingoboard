<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4 pb-20">
    <div class="max-w-2xl mx-auto space-y-4">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-lg p-4">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-xl font-bold text-gray-800">{{ playerStore.playerName }}</h1>
            <p class="text-sm text-gray-600">{{ playerStore.card?.code }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600">สถานะ</p>
            <p class="text-lg font-bold" :class="gameStore.isGameRunning ? 'text-green-600' : 'text-gray-600'">
              {{ gameStore.isGameRunning ? '🟢 กำลังเล่น' : '⚪ รอเริ่ม' }}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Winners Marquee -->
      <WinnersMarquee />
      
      <!-- Draw Ticker -->
      <DrawTicker />
      
      <!-- Bingo Card -->
      <div class="bg-white rounded-lg shadow-lg p-4">
        <h2 class="text-lg font-bold text-gray-800 mb-4 text-center">การ์ดของคุณ</h2>
        
        <div v-if="playerStore.card">
          <PlayerCard
            :grid="playerStore.card.grid"
            :marks="playerStore.localMarks"
            :interactive="true"
            @cell-click="handleCellClick"
          />
          
          <div class="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div class="bg-gray-50 p-2 rounded">
              <p class="text-gray-600">ช่องที่ทำ</p>
              <p class="text-xl font-bold text-blue-600">{{ playerStore.card.cellsMarked }}</p>
            </div>
            <div class="bg-gray-50 p-2 rounded">
              <p class="text-gray-600">เส้นสำเร็จ</p>
              <p class="text-xl font-bold text-green-600">{{ playerStore.card.linesComplete }}</p>
            </div>
            <div class="bg-gray-50 p-2 rounded">
              <p class="text-gray-600">ใกล้ชนะ</p>
              <p class="text-xl font-bold text-orange-600">{{ playerStore.card.progress.linesOneAway }}</p>
            </div>
          </div>
        </div>
        
        <div v-else class="text-center py-8 text-gray-600">
          <p>ไม่พบการ์ด</p>
        </div>
      </div>
      
      <!-- Win Notification -->
      <div v-if="playerStore.hasWonBingo" class="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-lg p-6 text-center animate-bounce">
        <p class="text-3xl font-bold text-white mb-2">🎉 BINGO! 🎉</p>
        <p class="text-white text-lg">คุณชนะแล้ว!</p>
      </div>
    </div>
    
    <!-- Question Modal -->
    <QuestionModal
      v-if="showQuestion && gameStore.activeQuestion"
      :show="showQuestion"
      :question="gameStore.activeQuestion.questionData"
      :player-id="playerStore.playerId || ''"
      @close="showQuestion = false"
      @answered="handleAnswered"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from '~/stores/player'
import { useGameStore } from '~/stores/game'

const router = useRouter()
const playerStore = usePlayerStore()
const gameStore = useGameStore()

const showQuestion = ref(false)
const answeredQuestions = ref<Set<string>>(new Set())
const isLoadingAnswers = ref(true) // Flag to prevent watch from triggering too early

onMounted(async () => {
  // Check if player exists and has card
  await playerStore.loadFromLocalStorage()

  if (!playerStore.player) {
    router.push('/join')
    return
  }

  if (!playerStore.hasCard) {
    router.push('/card')
    return
  }

  // Initialize game store
  await gameStore.init()

  // Load answered questions from database
  await loadAnsweredQuestions()

  // Mark as loaded
  isLoadingAnswers.value = false

  // Check if there's an active question
  if (gameStore.activeQuestion && !answeredQuestions.value.has(gameStore.activeQuestion.id)) {
    showQuestion.value = true
  }
})

async function loadAnsweredQuestions() {
  if (!playerStore.playerId) return

  try {
    const { $pb } = useNuxtApp()
    const answers = await $pb.collection('questionAnswers').getFullList({
      filter: `player = "${playerStore.playerId}"`,
      fields: 'questionEvent'
    })

    // Add all answered question event IDs to the set
    answers.forEach((answer: any) => {
      answeredQuestions.value.add(answer.questionEvent)
      console.log(`Added answered question: ${answer.questionEvent}`)
    })

    console.log(`Loaded ${answers.length} answered questions for player ${playerStore.playerId}`)
    console.log('Answered questions:', Array.from(answeredQuestions.value))

    if (gameStore.activeQuestion) {
      console.log(`Current active question: ${gameStore.activeQuestion.id}`)
      console.log(`Is answered: ${answeredQuestions.value.has(gameStore.activeQuestion.id)}`)
    }

    // Subscribe to new answers for this player
    subscribeToAnswers()
  } catch (error) {
    console.error('Failed to load answered questions:', error)
  }
}

function subscribeToAnswers() {
  if (!playerStore.playerId) return

  try {
    const { $pb } = useNuxtApp()

    // Subscribe to questionAnswers for this player
    $pb.collection('questionAnswers').subscribe('*', (e: any) => {
      if (e.action === 'create' && e.record.player === playerStore.playerId) {
        answeredQuestions.value.add(e.record.questionEvent)
        console.log(`Added answered question: ${e.record.questionEvent}`)
      }
    }, {
      filter: `player = "${playerStore.playerId}"`
    })
  } catch (error) {
    console.error('Failed to subscribe to answers:', error)
  }
}

onUnmounted(() => {
  const { $pb } = useNuxtApp()

  gameStore.unsubscribe()
  playerStore.unsubscribe()

  // Unsubscribe from questionAnswers
  try {
    $pb.collection('questionAnswers').unsubscribe()
  } catch (error) {
    console.error('Failed to unsubscribe from answers:', error)
  }
})

// Watch for new questions
watch(() => gameStore.activeQuestion, (newQuestion) => {
  // Don't show modal if still loading answered questions
  if (isLoadingAnswers.value) {
    console.log('Still loading answered questions, skipping watch trigger')
    return
  }

  if (newQuestion && !answeredQuestions.value.has(newQuestion.id)) {
    console.log(`New question detected: ${newQuestion.id}, showing modal`)
    showQuestion.value = true
  } else if (newQuestion && answeredQuestions.value.has(newQuestion.id)) {
    console.log(`Question ${newQuestion.id} already answered, not showing modal`)
  }
})

function handleCellClick(index: number) {
  if (!gameStore.isGameRunning) {
    alert('เกมยังไม่เริ่ม')
    return
  }

  const latestDrawNumber = gameStore.latestDraw?.number
  playerStore.markCell(index, gameStore.drawnNumbers, latestDrawNumber)
}

function handleAnswered(isCorrect: boolean) {
  if (gameStore.activeQuestion) {
    answeredQuestions.value.add(gameStore.activeQuestion.id)
  }
  
  // Keep modal open to show result
  // User will close it manually
}
</script>

