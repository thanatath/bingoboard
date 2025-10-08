<template>
  <div class="draw-ticker bg-white rounded-lg shadow-lg p-4">
    <div v-if="latestDraw" class="mb-4">
      <div class="text-center">
        <p class="text-sm text-gray-600 mb-2">เลขล่าสุด</p>
        <div class="text-6xl font-bold text-red-600 animate-pulse">
          {{ latestDraw.number }}
        </div>
        <p class="text-xs text-gray-500 mt-2">
          ครั้งที่ {{ latestDraw.drawIndex }} / 99
        </p>
      </div>
    </div>
    
    <div v-if="drawsUntilQuestion > 0" class="text-center mb-4">
      <p class="text-sm text-blue-600">
        อีก {{ drawsUntilQuestion }} ครั้งถึงคำถาม
      </p>
    </div>
    
    <div v-if="draws.length > 0" class="border-t pt-4">
      <p class="text-xs text-gray-600 mb-2">ประวัติเลขที่ออก:</p>
      <div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
        <span
          v-for="draw in reversedDraws"
          :key="draw.id"
          class="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
        >
          {{ draw.number }}
        </span>
      </div>
    </div>
    
    <div v-else class="text-center text-gray-500">
      <p class="text-sm">ยังไม่มีการสุ่มเลข</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '~/stores/game'

const gameStore = useGameStore()

const latestDraw = computed(() => gameStore.latestDraw)
const draws = computed(() => gameStore.draws)
const drawsUntilQuestion = computed(() => gameStore.drawsUntilQuestion)

const reversedDraws = computed(() => {
  return [...gameStore.draws].reverse()
})
</script>

