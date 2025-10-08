<template>
  <div class="bg-white rounded-lg shadow-lg p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">🎴 จัดการการ์ด Bingo</h2>
        <p class="text-sm text-gray-600 mt-1">
          สร้างและจัดการการ์ดบิงโก 120 ใบ
        </p>
      </div>
      
      <div class="text-right">
        <p class="text-sm text-gray-600">การ์ดทั้งหมด</p>
        <p class="text-3xl font-bold text-blue-600">{{ adminStore.allCards.length }}</p>
      </div>
    </div>
    
    <!-- Status Cards -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="bg-blue-50 p-4 rounded-lg text-center">
        <p class="text-sm text-gray-600 mb-1">การ์ดทั้งหมด</p>
        <p class="text-2xl font-bold text-blue-600">{{ adminStore.allCards.length }}</p>
      </div>
      
      <div class="bg-green-50 p-4 rounded-lg text-center">
        <p class="text-sm text-gray-600 mb-1">ถูกเลือกแล้ว</p>
        <p class="text-2xl font-bold text-green-600">{{ adminStore.claimedCards.length }}</p>
      </div>
      
      <div class="bg-gray-50 p-4 rounded-lg text-center">
        <p class="text-sm text-gray-600 mb-1">ว่าง</p>
        <p class="text-2xl font-bold text-gray-600">{{ adminStore.availableCards.length }}</p>
      </div>
    </div>
    
    <!-- Action Buttons -->
    <div class="space-y-3">
      <button
        @click="handleGenerateCards"
        :disabled="loading"
        class="w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2"
      >
        <span v-if="loading">⏳</span>
        <span v-else>🎲</span>
        <span>{{ loading ? 'กำลังสร้างการ์ด...' : 'สร้างการ์ด 120 ใบ' }}</span>
      </button>
      
      <button
        v-if="adminStore.allCards.length > 0"
        @click="handleDeleteAllCards"
        :disabled="loading"
        class="w-full py-3 px-6 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2"
      >
        <span>🗑️</span>
        <span>ลบการ์ดทั้งหมด</span>
      </button>
      
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p class="text-sm text-yellow-800">
          <strong>⚠️ คำเตือน:</strong> การสร้างการ์ดใหม่จะลบการ์ดเก่าทั้งหมด (ถ้ามี) และสร้างการ์ดใหม่ 120 ใบ
        </p>
      </div>
    </div>
    
    <!-- Progress Message -->
    <div v-if="message" class="mt-4 p-4 rounded-lg" :class="messageClass">
      <p class="font-medium">{{ message }}</p>
    </div>
    
    <!-- Cards Preview Summary -->
    <div v-if="adminStore.allCards.length > 0" class="mt-6 pt-6 border-t">
      <h3 class="text-lg font-bold text-gray-800 mb-3">📊 สรุปการ์ด</h3>
      
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">รหัสการ์ด:</span>
          <span class="font-medium">C001 - C120</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">ขนาดตาราง:</span>
          <span class="font-medium">5×5 (25 ช่อง)</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">ช่อง FREE:</span>
          <span class="font-medium">ตรงกลาง (index 12)</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">ช่วงตัวเลข:</span>
          <span class="font-medium">1-99</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAdminStore } from '~/stores/admin'

const adminStore = useAdminStore()

const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')

const messageClass = computed(() => {
  switch (messageType.value) {
    case 'success':
      return 'bg-green-100 text-green-800 border border-green-200'
    case 'error':
      return 'bg-red-100 text-red-800 border border-red-200'
    default:
      return 'bg-blue-100 text-blue-800 border border-blue-200'
  }
})

async function handleGenerateCards() {
  loading.value = true
  message.value = ''
  
  try {
    const result = await adminStore.generateCards()
    
    if (result.success) {
      message.value = result.message
      messageType.value = 'success'
    } else {
      message.value = result.message
      messageType.value = 'info'
    }
    
    // Clear message after 5 seconds
    setTimeout(() => {
      message.value = ''
    }, 5000)
    
  } catch (error: any) {
    message.value = error.message || 'เกิดข้อผิดพลาดในการสร้างการ์ด'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

async function handleDeleteAllCards() {
  loading.value = true
  message.value = ''
  
  try {
    const result = await adminStore.deleteAllCards()
    
    if (result) {
      message.value = result.message
      messageType.value = 'success'
      
      // Clear message after 5 seconds
      setTimeout(() => {
        message.value = ''
      }, 5000)
    }
    
  } catch (error: any) {
    message.value = error.message || 'เกิดข้อผิดพลาดในการลบการ์ด'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}
</script>

