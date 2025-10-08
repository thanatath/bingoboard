<template>
  <div v-if="winners.length > 0" class="winners-marquee bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 px-4 rounded-lg shadow-lg">
    <div class="flex items-center space-x-2">
      <span class="text-2xl">🏆</span>
      <div class="flex-1 overflow-hidden">
        <div class="animate-marquee whitespace-nowrap">
          <span v-for="(winner, index) in winners" :key="winner.id" class="inline-block mx-4">
            <span class="font-bold">{{ getPlayerName(winner) }}</span>
            <span class="text-sm ml-2">ชนะที่ตา {{ winner.drawIndex }}</span>
            <span v-if="index < winners.length - 1" class="mx-2">•</span>
          </span>
        </div>
      </div>
      <span class="text-2xl">🏆</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '~/stores/game'

const gameStore = useGameStore()

const winners = computed(() => gameStore.winners)

function getPlayerName(winner: any) {
  if (winner.expand?.player?.name) {
    return winner.expand.player.name
  }
  return winner.playerName || 'ผู้เล่น'
}
</script>

<style scoped>
@keyframes marquee {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-50%);
  }
}

.animate-marquee {
  display: inline-block;
  animation: marquee 20s linear infinite;
}
</style>

