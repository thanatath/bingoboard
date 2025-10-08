<template>
  <div class="bg-white rounded-lg shadow-lg p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-gray-800">🎴 Cards Preview</h2>
      
      <div class="flex gap-2">
        <button
          @click="filterMode = 'all'"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            filterMode === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          ทั้งหมด ({{ adminStore.allCards.length }})
        </button>
        <button
          @click="filterMode = 'claimed'"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            filterMode === 'claimed'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          ถูกเลือก ({{ adminStore.claimedCards.length }})
        </button>
      </div>
    </div>
    
    <div class="mb-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="ค้นหาชื่อผู้เล่นหรือรหัสการ์ด..."
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
    
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
      <div
        v-for="card in filteredCards"
        :key="card.id"
        class="border-2 rounded-lg p-4"
        :class="card.inUse ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'"
      >
        <!-- Card Header -->
        <div class="mb-3">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-lg font-bold text-gray-800">{{ card.code }}</p>
              <p v-if="card.inUse" class="text-sm text-blue-600 font-medium">
                {{ getPlayerName(card) }}
              </p>
              <p v-else class="text-sm text-gray-500">ว่าง</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-gray-500">เส้น</p>
              <p class="text-2xl font-bold text-green-600">{{ card.linesComplete }}</p>
            </div>
          </div>
        </div>
        
        <!-- Mini Card Grid -->
        <div class="grid grid-cols-5 gap-0.5 bg-gray-800 p-1 rounded mb-3">
          <div
            v-for="(cell, index) in card.grid"
            :key="index"
            :class="[
              'aspect-square flex items-center justify-center text-[8px] font-bold',
              card.marksServer[index]
                ? cell === 'FREE'
                  ? 'bg-gray-400 text-gray-700'
                  : 'bg-red-500 text-white'
                : 'bg-white text-gray-800'
            ]"
          >
            {{ typeof cell === 'number' ? cell : 'F' }}
          </div>
        </div>
        
        <!-- Card Stats -->
        <div class="grid grid-cols-3 gap-2 text-center text-xs">
          <div class="bg-white p-1 rounded">
            <p class="text-gray-600">ทำแล้ว</p>
            <p class="font-bold text-blue-600">{{ card.cellsMarked }}</p>
          </div>
          <div class="bg-white p-1 rounded">
            <p class="text-gray-600">ใกล้ชนะ</p>
            <p class="font-bold text-orange-600">{{ card.progress.linesOneAway }}</p>
          </div>
          <div class="bg-white p-1 rounded">
            <p class="text-gray-600">สูงสุด</p>
            <p class="font-bold text-purple-600">{{ card.progress.maxLineProgress }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="filteredCards.length === 0" class="text-center py-12 text-gray-500">
      <p>ไม่พบการ์ดที่ตรงกับเงื่อนไข</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAdminStore } from '~/stores/admin'

const adminStore = useAdminStore()

const filterMode = ref<'all' | 'claimed'>('claimed')
const searchQuery = ref('')

const filteredCards = computed(() => {
  let cards = filterMode.value === 'all' 
    ? adminStore.allCards 
    : adminStore.sortedCardsByProgress
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    cards = cards.filter(card => {
      const playerName = getPlayerName(card).toLowerCase()
      const cardCode = card.code.toLowerCase()
      return playerName.includes(query) || cardCode.includes(query)
    })
  }
  
  return cards
})

function getPlayerName(card: any) {
  if (card.expand?.assignedTo?.name) {
    return card.expand.assignedTo.name
  }
  
  // Try to find player from adminStore
  const player = adminStore.allPlayers.find(p => p.id === card.assignedTo)
  return player?.name || 'ไม่ทราบชื่อ'
}
</script>

