<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
    @click.self="() => {}"
  >
    <div class="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">คำถาม!</h2>
      
      <div v-if="!answered" class="space-y-4">
        <p class="text-lg text-gray-700">{{ question.text }}</p>
        
        <div class="space-y-2">
          <button
            v-for="(choice, index) in question.choices"
            :key="index"
            @click="selectAnswer(index)"
            :disabled="submitting"
            class="w-full py-3 px-4 rounded-lg font-medium transition-all"
            :class="[
              submitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            ]"
          >
            {{ choice }}
          </button>
        </div>
      </div>
      
      <div v-else class="text-center space-y-4">
        <div
          :class="[
            'text-6xl mb-4',
            isCorrect ? 'text-green-500' : 'text-red-500'
          ]"
        >
          {{ isCorrect ? '✓' : '✗' }}
        </div>
        
        <p class="text-xl font-bold" :class="isCorrect ? 'text-green-600' : 'text-red-600'">
          {{ isCorrect ? 'ถูกต้อง!' : 'ผิด!' }}
        </p>
        
        <p v-if="isCorrect" class="text-gray-700">
          คุณได้รับช่อง FREE เพิ่ม 1 ช่อง!
        </p>
        
        <p v-else class="text-gray-600">
          คำตอบที่ถูกคือ: {{ question.choices[question.correctIndex] }}
        </p>
        
        <button
          @click="close"
          class="mt-4 px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
        >
          ปิด
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Question } from '~/stores/game'

interface Props {
  show: boolean
  question: Question
  playerId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  answered: [isCorrect: boolean]
}>()

const answered = ref(false)
const isCorrect = ref(false)
const submitting = ref(false)

// Reset when modal opens
watch(() => props.show, (newShow) => {
  if (newShow) {
    answered.value = false
    isCorrect.value = false
    submitting.value = false
  }
})

async function selectAnswer(choiceIndex: number) {
  if (submitting.value || answered.value) return
  
  submitting.value = true
  
  try {
    const gameStore = useGameStore()
    const result = await gameStore.submitAnswer(props.playerId, choiceIndex)
    
    isCorrect.value = result || false
    answered.value = true
    
    emit('answered', isCorrect.value)
  } catch (error) {
    console.error('Failed to submit answer:', error)
    alert('เกิดข้อผิดพลาดในการส่งคำตอบ')
  } finally {
    submitting.value = false
  }
}

function close() {
  emit('close')
}
</script>

