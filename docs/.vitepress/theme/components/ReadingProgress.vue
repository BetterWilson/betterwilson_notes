<template>
  <div class="reading-progress-bar" :style="{ width: progress + '%' }" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const progress = ref(0)

function update() {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  progress.value = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
}

onMounted(() => {
  window.addEventListener('scroll', update, { passive: true })
  update()
})
onUnmounted(() => {
  window.removeEventListener('scroll', update)
})
</script>

<style scoped>
.reading-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #bd34fe, #41d1ff);
  z-index: 9999;
  transition: width 0.1s linear;
  border-radius: 0 2px 2px 0;
  pointer-events: none;
}
</style>
