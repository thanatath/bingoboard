<template>
  <div class="bg-white rounded-lg shadow-lg p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">❓ สร้างคำถาม</h2>
        <p class="text-sm text-gray-600 mt-1">
          สร้างคำถาม Sample สำหรับเกม (1 ข้อ/ครั้ง)
        </p>
      </div>
      
      <div class="text-right">
        <p class="text-sm text-gray-600">คำถามทั้งหมด</p>
        <p class="text-3xl font-bold text-purple-600">{{ questionsCount }}</p>
      </div>
    </div>
    
    <!-- Status Card -->
    <div class="bg-purple-50 p-4 rounded-lg text-center mb-6">
      <p class="text-sm text-gray-600 mb-1">คำถาม Sample</p>
      <p class="text-2xl font-bold text-purple-600">1 ข้อ</p>
      <p class="text-xs text-gray-500 mt-1">คำถามทั่วไป ความรู้รอบตัว</p>
    </div>
    
    <!-- Action Buttons -->
    <div class="space-y-3">
      <button
        @click="handleGenerateQuestions"
        :disabled="loading"
        class="w-full py-3 px-6 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2"
      >
        <span v-if="loading">⏳</span>
        <span v-else>❓</span>
        <span>{{ loading ? 'กำลังสร้างคำถาม...' : 'สร้างคำถาม Sample 1 ข้อ' }}</span>
      </button>
      
      <button
        v-if="questionsCount > 0"
        @click="handleDeleteAllQuestions"
        :disabled="loading"
        class="w-full py-3 px-6 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2"
      >
        <span>🗑️</span>
        <span>ลบคำถามทั้งหมด</span>
      </button>
      
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p class="text-sm text-yellow-800">
          <strong>⚠️ คำเตือน:</strong> การสร้างคำถามใหม่จะลบคำถามเก่าทั้งหมด (ถ้ามี) และสร้างคำถามใหม่ 1 ข้อ
        </p>
      </div>
    </div>
    
    <!-- Progress Message -->
    <div v-if="message" class="mt-4 p-4 rounded-lg" :class="messageClass">
      <p class="font-medium">{{ message }}</p>
    </div>
    
    <!-- Questions Preview Summary -->
    <div v-if="questionsCount > 0" class="mt-6 pt-6 border-t">
      <h3 class="text-lg font-bold text-gray-800 mb-3">📊 สรุปคำถาม</h3>
      
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">จำนวนคำถาม:</span>
          <span class="font-medium">{{ questionsCount }} ข้อ</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">ประเภท:</span>
          <span class="font-medium">ความรู้ทั่วไป</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">ตัวเลือก:</span>
          <span class="font-medium">4 ตัวเลือก/ข้อ</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">สถานะ:</span>
          <span class="font-medium text-green-600">✅ พร้อมใช้งาน</span>
        </div>
      </div>
    </div>
    
    <!-- Sample Questions List -->
    <div v-if="questionsCount === 0" class="mt-6 pt-6 border-t">
      <h3 class="text-lg font-bold text-gray-800 mb-3">📝 ตัวอย่างคำถาม</h3>

      <div class="space-y-2 text-sm text-gray-600">
        <p>• ประเทศไทยมีกี่จังหวัด?</p>
        <p class="text-xs text-gray-400 italic mt-2">กดปุ่มด้านบนเพื่อสร้างคำถาม Sample</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '~/stores/admin'

const adminStore = useAdminStore()

const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')
const questionsCount = ref(0)

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

onMounted(async () => {
  await fetchQuestionsCount()
})

async function fetchQuestionsCount() {
  try {
    const { $pb } = useNuxtApp()
    const questions = await $pb.collection('questions').getFullList()
    questionsCount.value = questions.length
  } catch (error) {
    console.error('Failed to fetch questions count:', error)
  }
}

async function handleGenerateQuestions() {
  loading.value = true
  message.value = ''
  
  try {
    const result = await adminStore.generateSampleQuestions()
    
    if (result.success) {
      message.value = result.message
      messageType.value = 'success'
      await fetchQuestionsCount()
    } else {
      message.value = result.message
      messageType.value = 'info'
    }
    
    // Clear message after 5 seconds
    setTimeout(() => {
      message.value = ''
    }, 5000)
    
  } catch (error: any) {
    message.value = error.message || 'เกิดข้อผิดพลาดในการสร้างคำถาม'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

async function handleDeleteAllQuestions() {
  loading.value = true
  message.value = ''
  
  try {
    const result = await adminStore.deleteAllQuestions()
    
    if (result) {
      message.value = result.message
      messageType.value = 'success'
      await fetchQuestionsCount()
      
      // Clear message after 5 seconds
      setTimeout(() => {
        message.value = ''
      }, 5000)
    }
    
  } catch (error: any) {
    message.value = error.message || 'เกิดข้อผิดพลาดในการลบคำถาม'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}
</script>

