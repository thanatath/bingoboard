<template>
  <div class="min-h-screen bg-gradient-to-br from-green-500 to-blue-500 p-4">
    <div class="max-w-4xl mx-auto">
      <div class="bg-white rounded-2xl shadow-2xl p-6">
        <h1 class="text-3xl font-bold text-gray-800 text-center mb-2">เลือกการ์ดของคุณ</h1>
        <p class="text-center text-gray-600 mb-2">เลือก 1 ใบจาก {{ availableCards.length }} ใบที่เหลือ</p>
        <p class="text-center text-sm text-gray-500 mb-6">
          <span class="inline-block w-3 h-3 bg-gray-100 border border-gray-200 rounded mr-1"></span>
          = ถูกเลือกแล้ว (อัพเดทแบบ Realtime)
        </p>
        
        <div v-if="loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p class="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
        
        <div v-else-if="availableCards.length === 0" class="text-center py-12">
          <p class="text-xl text-gray-600">ไม่มีการ์ดว่างแล้ว</p>
          <button
            @click="goBack"
            class="mt-4 px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
          >
            กลับ
          </button>
        </div>
        
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <button
            v-for="card in allCards"
            :key="card.id"
            @click="selectCard(card)"
            :disabled="claiming || card.inUse"
            :class="[
              'p-4 border-2 rounded-lg transition-all',
              card.inUse
                ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
            ]"
          >
            <div
              :class="[
                'text-2xl font-bold',
                card.inUse ? 'text-gray-400' : 'text-gray-800'
              ]"
            >
              {{ card.code }}
            </div>
            <div
              :class="[
                'text-xs mt-1',
                card.inUse ? 'text-gray-400' : 'text-gray-500'
              ]"
            >
              {{ card.inUse ? '🔒 ถูกเลือกแล้ว' : 'คลิกเพื่อเลือก' }}
            </div>
          </button>
        </div>
        
        <div v-if="error" class="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from '~/stores/player'
import type { Card } from '~/stores/player'

const router = useRouter()
const playerStore = usePlayerStore()
const { $pb } = useNuxtApp()

const allCards = ref<Card[]>([])
const loading = ref(true)
const claiming = ref(false)
const error = ref('')

const availableCards = computed(() => {
  return allCards.value.filter(c => !c.inUse)
})

onMounted(async () => {
  // Check if player exists
  await playerStore.loadFromLocalStorage()

  if (!playerStore.player) {
    router.push('/join')
    return
  }

  // Check if player already has a card
  if (playerStore.hasCard) {
    router.push('/play')
    return
  }

  // Load available cards
  await loadCards()

  // Subscribe to realtime updates
  subscribeToCards()
})

onUnmounted(() => {
  // Unsubscribe from cards
  try {
    $pb.collection('cards').unsubscribe()
  } catch (error) {
    console.error('Failed to unsubscribe from cards:', error)
  }
})

async function loadCards() {
  loading.value = true
  error.value = ''

  try {
    allCards.value = await $pb.collection('cards').getFullList({
      sort: 'code'
    }) as any
    console.log(`Loaded ${allCards.value.length} cards, ${availableCards.value.length} available`)
  } catch (err: any) {
    error.value = 'ไม่สามารถโหลดการ์ดได้'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function subscribeToCards() {
  try {
    // Subscribe to all cards for realtime updates
    $pb.collection('cards').subscribe('*', (e: any) => {
      if (e.action === 'update') {
        // Update the card in the list
        const index = allCards.value.findIndex(c => c.id === e.record.id)
        if (index !== -1) {
          allCards.value[index] = e.record as Card
          console.log(`Card ${e.record.code} updated: inUse = ${e.record.inUse}`)
        }
      }
    })
    console.log('✅ Subscribed to cards realtime updates')
  } catch (error) {
    console.error('Failed to subscribe to cards:', error)
  }
}

async function selectCard(card: Card) {
  if (claiming.value || !playerStore.player) return

  // Check if card is still available (race condition check)
  if (card.inUse) {
    error.value = 'การ์ดนี้ถูกเลือกไปแล้ว กรุณาเลือกใบอื่น'
    return
  }

  claiming.value = true
  error.value = ''

  try {
    await playerStore.claimCard(card.id)
    router.push('/play')
  } catch (err: any) {
    error.value = 'การ์ดนี้ถูกเลือกไปแล้ว กรุณาเลือกใบอื่น'
    console.error('Failed to claim card:', err)
    // Cards will be updated via realtime subscription
  } finally {
    claiming.value = false
  }
}

function goBack() {
  router.push('/')
}
</script>

