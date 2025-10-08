<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex justify-between items-start mb-4">
          <h1 class="text-3xl font-bold text-gray-800">🎮 Admin Console</h1>

          <!-- Connection Status -->
          <div class="flex items-center gap-2">
            <div
              class="w-3 h-3 rounded-full"
              :class="{
                'bg-yellow-500 animate-pulse': connectionStatus === 'checking',
                'bg-green-500': connectionStatus === 'connected',
                'bg-red-500': connectionStatus === 'error'
              }"
            ></div>
            <span class="text-sm text-gray-600">
              {{
                connectionStatus === 'checking' ? 'กำลังเชื่อมต่อ...' :
                connectionStatus === 'connected' ? 'เชื่อมต่อแล้ว' :
                'ไม่สามารถเชื่อมต่อได้'
              }}
            </span>
          </div>
        </div>

        <!-- Game Status -->
        <div v-if="gameStore.game" class="mb-4 p-3 bg-gray-50 rounded-lg">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">สถานะเกม:</span>
            <span
              class="px-3 py-1 rounded-full text-sm font-bold"
              :class="{
                'bg-green-100 text-green-800': gameStore.game.status === 'running',
                'bg-gray-100 text-gray-800': gameStore.game.status === 'idle',
                'bg-blue-100 text-blue-800': gameStore.game.status === 'ended'
              }"
            >
              {{
                gameStore.game.status === 'running' ? '🟢 กำลังเล่น' :
                gameStore.game.status === 'idle' ? '⚪ รอเริ่ม' :
                '🔵 จบแล้ว'
              }}
            </span>
          </div>
        </div>

        <!-- Control Buttons -->
        <div class="flex flex-wrap gap-4">
          <button
            @click="handleStart"
            :disabled="gameStore.game?.status === 'running' || loading"
            class="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all"
          >
            ▶️ Start Game
          </button>
          
          <button
            @click="handleRandom"
            :disabled="gameStore.game?.status !== 'running' || loading"
            class="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all"
          >
            🎲 Random Number
          </button>
          
          <button
            @click="showResetConfirm = true"
            :disabled="loading"
            class="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all"
          >
            🔄 Reset Game
          </button>
          
          <button
            @click="goHome"
            class="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold transition-all"
          >
            🏠 Home
          </button>
        </div>
        
        <div v-if="error" class="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {{ error }}
        </div>
      </div>
      
      <!-- Stats -->
      <AdminStats />

      <!-- Cards Manager -->
      <AdminCardsManager />

      <!-- Questions Manager -->
      <AdminQuestionsManager />

      <!-- Draw History & Winners -->
      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">📊 Draw History</h2>
          <DrawTicker />
        </div>
        
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">🏆 Winners</h2>
          <div v-if="gameStore.winners.length > 0" class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="winner in gameStore.winners"
              :key="winner.id"
              class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <p class="font-bold text-gray-800">{{ getWinnerName(winner) }}</p>
              <p class="text-sm text-gray-600">ชนะที่ตา {{ winner.drawIndex }}</p>
              <p class="text-xs text-gray-500">{{ winner.lines.join(', ') }}</p>
            </div>
          </div>
          <div v-else class="text-center text-gray-500 py-8">
            <p>ยังไม่มีผู้ชนะ</p>
          </div>
        </div>
      </div>
      
      <!-- Cards Preview -->
      <AdminCardsPreview />
    </div>
    
    <!-- Reset Confirmation Modal -->
    <div
      v-if="showResetConfirm"
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      @click.self="showResetConfirm = false"
    >
      <div class="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        <h2 class="text-2xl font-bold text-red-600 mb-4">⚠️ ยืนยันการรีเซ็ต</h2>
        <p class="text-gray-700 mb-6">
          คุณแน่ใจหรือไม่ที่จะรีเซ็ตเกม? การกระทำนี้จะลบข้อมูลทั้งหมดและไม่สามารถย้อนกลับได้
        </p>
        
        <div class="flex gap-4">
          <button
            @click="showResetConfirm = false"
            class="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium"
          >
            ยกเลิก
          </button>
          <button
            @click="handleReset"
            :disabled="loading"
            class="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg font-bold"
          >
            {{ loading ? 'กำลังรีเซ็ต...' : 'ยืนยัน' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '~/stores/game'
import { useAdminStore } from '~/stores/admin'

const router = useRouter()
const gameStore = useGameStore()
const adminStore = useAdminStore()

const loading = ref(false)
const error = ref('')
const showResetConfirm = ref(false)
const connectionStatus = ref<'checking' | 'connected' | 'error'>('checking')

onMounted(async () => {
  try {
    console.log('Initializing admin page...')
    const { $pb } = useNuxtApp()

    // Check PocketBase connection
    try {
      await $pb.health.check()
      console.log('PocketBase connected!')
      connectionStatus.value = 'connected'
    } catch (err) {
      console.error('PocketBase connection failed:', err)
      connectionStatus.value = 'error'
      error.value = 'ไม่สามารถเชื่อมต่อ PocketBase ได้'
      return
    }

    // Initialize stores
    await gameStore.init()
    await adminStore.init()

    console.log('Game data:', gameStore.game)
    console.log('Admin data loaded')

  } catch (err: any) {
    console.error('Initialization error:', err)
    error.value = err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
    connectionStatus.value = 'error'
  }
})

onUnmounted(() => {
  gameStore.unsubscribe()
  adminStore.unsubscribe()
})

async function handleStart() {
  loading.value = true
  error.value = ''

  try {
    console.log('Starting game...')
    console.log('Game status:', gameStore.game?.status)
    console.log('Game ID:', gameStore.game?.id)

    if (!gameStore.game) {
      throw new Error('ไม่พบข้อมูลเกม กรุณารีเฟรชหน้า')
    }

    if (gameStore.game.status === 'running') {
      throw new Error('เกมกำลังเล่นอยู่แล้ว')
    }

    await adminStore.startGame()
    console.log('Game started successfully!')

    // Show success message
    error.value = ''
    alert('เริ่มเกมสำเร็จ! ✅')

  } catch (err: any) {
    console.error('Start game error:', err)
    error.value = err.message || 'ไม่สามารถเริ่มเกมได้'
    alert('เกิดข้อผิดพลาด: ' + error.value)
  } finally {
    loading.value = false
  }
}

async function handleRandom() {
  loading.value = true
  error.value = ''

  try {
    console.log('Drawing random number...')
    console.log('Current draw index:', gameStore.game?.currentDrawIndex)

    if (!gameStore.game) {
      throw new Error('ไม่พบข้อมูลเกม')
    }

    if (gameStore.game.status !== 'running') {
      throw new Error('กรุณาเริ่มเกมก่อน')
    }

    await adminStore.randomNumber()
    console.log('Number drawn successfully!')

  } catch (err: any) {
    console.error('Random number error:', err)
    error.value = err.message || 'ไม่สามารถสุ่มเลขได้'
    alert('เกิดข้อผิดพลาด: ' + error.value)
  } finally {
    loading.value = false
  }
}

async function handleReset() {
  loading.value = true
  error.value = ''
  
  try {
    await adminStore.resetGame()
    showResetConfirm.value = false
    alert('รีเซ็ตเกมสำเร็จ')
  } catch (err: any) {
    error.value = err.message || 'ไม่สามารถรีเซ็ตเกมได้'
  } finally {
    loading.value = false
  }
}

function getWinnerName(winner: any) {
  if (winner.expand?.player?.name) {
    return winner.expand.player.name
  }
  return 'ผู้เล่น'
}

function goHome() {
  router.push('/')
}
</script>

