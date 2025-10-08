<template>
  <div class="bingo-card">
    <div class="grid grid-cols-5 gap-1 bg-gray-800 p-2 rounded-lg shadow-xl">
      <div
        v-for="(cell, index) in grid"
        :key="index"
        @click="onCellClick(index)"
        :class="[
          'aspect-square flex items-center justify-center rounded text-sm font-bold cursor-pointer transition-all',
          getCellClass(index)
        ]"
      >
        <span>{{ cell }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  grid: (number | string)[]
  marks: boolean[]
  interactive?: boolean
  size?: 'small' | 'normal'
}

const props = withDefaults(defineProps<Props>(), {
  interactive: true,
  size: 'normal'
})

const emit = defineEmits<{
  cellClick: [index: number]
}>()

function getCellClass(index: number) {
  const isMarked = props.marks[index]
  const isFree = props.grid[index] === 'FREE'
  
  if (isMarked) {
    if (isFree) {
      return 'bg-gray-400 text-gray-700'
    }
    return 'bg-red-500 text-white'
  }
  
  return 'bg-white text-gray-800 hover:bg-gray-100'
}

function onCellClick(index: number) {
  if (props.interactive) {
    emit('cellClick', index)
  }
}
</script>

<style scoped>
.bingo-card {
  max-width: 400px;
  margin: 0 auto;
}
</style>

