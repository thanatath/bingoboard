<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <h1 class="text-3xl font-bold text-gray-800 text-center mb-6">เข้าร่วมเกม</h1>
        
        <form @submit.prevent="handleJoin" class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
              ชื่อของคุณ
            </label>
            <input
              id="name"
              v-model="name"
              type="text"
              required
              placeholder="กรอกชื่อ..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            type="submit"
            :disabled="loading || !name.trim()"
            class="w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all"
          >
            {{ loading ? 'กำลังสร้าง...' : 'เข้าร่วม' }}
          </button>
        </form>
        
        <div v-if="error" class="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {{ error }}
        </div>
        
        <button
          @click="goBack"
          class="mt-4 w-full py-2 text-gray-600 hover:text-gray-800 text-sm"
        >
          ← กลับ
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePlayerStore } from '~/stores/player'

const router = useRouter()
const playerStore = usePlayerStore()

const name = ref('')
const loading = ref(false)
const error = ref('')

async function handleJoin() {
  if (!name.value.trim()) return
  
  loading.value = true
  error.value = ''
  
  try {
    await playerStore.createPlayer(name.value.trim())
    router.push('/card')
  } catch (err: any) {
    error.value = err.message || 'เกิดข้อผิดพลาดในการสร้างผู้เล่น'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/')
}

// Check if player already exists
onMounted(async () => {
  await playerStore.loadFromLocalStorage()
  if (playerStore.player) {
    // Player already exists, go to card selection or play
    if (playerStore.hasCard) {
      router.push('/play')
    } else {
      router.push('/card')
    }
  }
})
</script>

