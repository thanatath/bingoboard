<template>
  <div class="bg-white rounded-lg shadow-lg p-6">
    <h2 class="text-xl font-bold text-gray-800 mb-4">📈 Statistics</h2>
    
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="bg-blue-50 p-4 rounded-lg text-center">
        <p class="text-sm text-gray-600 mb-1">ผู้เล่น</p>
        <p class="text-3xl font-bold text-blue-600">{{ adminStore.stats.playersCount }}</p>
      </div>
      
      <div class="bg-green-50 p-4 rounded-lg text-center">
        <p class="text-sm text-gray-600 mb-1">การ์ดที่เลือก</p>
        <p class="text-3xl font-bold text-green-600">{{ adminStore.stats.claimedCardsCount }}</p>
      </div>
      
      <div class="bg-purple-50 p-4 rounded-lg text-center">
        <p class="text-sm text-gray-600 mb-1">เลขที่ออก</p>
        <p class="text-3xl font-bold text-purple-600">{{ adminStore.stats.drawsCount }}</p>
      </div>
      
      <div class="bg-yellow-50 p-4 rounded-lg text-center">
        <p class="text-sm text-gray-600 mb-1">ผู้ชนะ</p>
        <p class="text-3xl font-bold text-yellow-600">{{ adminStore.stats.winnersCount }}</p>
      </div>
      
      <div class="bg-orange-50 p-4 rounded-lg text-center">
        <p class="text-sm text-gray-600 mb-1">ตอบถูก/ทั้งหมด</p>
        <p class="text-3xl font-bold text-orange-600">
          {{ adminStore.stats.questionLatestAccuracy.correct }}/{{ adminStore.stats.questionLatestAccuracy.total }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAdminStore } from '~/stores/admin'

const adminStore = useAdminStore()
</script>

