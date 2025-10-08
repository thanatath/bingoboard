<template>
  <div class="min-h-screen bg-blue-500 flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-xl">
      <h1 class="text-4xl font-bold text-gray-800 mb-4">Test Page</h1>
      <p class="text-lg text-gray-600">If you can see this, Nuxt is working!</p>
      <button @click="count++" class="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg">
        Count: {{ count }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

