<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="text-5xl font-bold text-white mb-2">🎯 BINGO</h1>
        <p class="text-white text-lg">เกมบิงโกมหาสนุก</p>
      </div>

      <div class="bg-white rounded-2xl shadow-2xl p-8 space-y-4">
        <h2 class="text-2xl font-bold text-gray-800 text-center mb-6">พร้อมแล้ว เข้าเล่นเลย !</h2>

        <NuxtLink
          to="/join"
          class="block w-full py-4 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-xl transition-all shadow-lg text-center"
        >
          เข้าเล่น
        </NuxtLink>
      </div>

      <div class="mt-6 text-center text-white text-sm">
        <p>เกมบิงโกมหาสนุก By STEL</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Simple script
</script>

