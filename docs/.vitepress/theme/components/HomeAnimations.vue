<template>
  <div class="home-animations" aria-hidden="true">
    <div
      v-for="p in particles"
      :key="p.id"
      class="particle"
      :style="p.style"
    ></div>
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const rand = (min, max) => Math.random() * (max - min) + min

const particles = ref(
  Array.from({ length: 22 }, (_, i) => {
    const size = rand(6, 16)
    const duration = rand(9, 18)
    const delay = rand(-15, 0)
    const left = rand(0, 100)
    const drift = rand(-40, 40)
    const hue = Math.random() > 0.5 ? '189, 52, 254' : '65, 209, 255'
    return {
      id: i,
      style: {
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        '--drift': `${drift}px`,
        '--tint': hue,
      },
    }
  })
)
</script>

<style scoped>
.home-animations {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.particle {
  position: absolute;
  bottom: -40px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(var(--tint), 0.55),
    rgba(var(--tint), 0) 70%
  );
  filter: blur(1px);
  animation-name: rise;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  opacity: 0.7;
}

@keyframes rise {
  0% {
    transform: translate3d(0, 0, 0) scale(0.6);
    opacity: 0;
  }
  15% {
    opacity: 0.9;
  }
  85% {
    opacity: 0.6;
  }
  100% {
    transform: translate3d(var(--drift), -110vh, 0) scale(1.1);
    opacity: 0;
  }
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.45;
  animation: drift 18s ease-in-out infinite;
  mix-blend-mode: screen;
}

.blob-1 {
  width: 420px;
  height: 420px;
  top: -120px;
  left: -80px;
  background: radial-gradient(circle, #bd34fe, transparent 70%);
}

.blob-2 {
  width: 380px;
  height: 380px;
  bottom: -100px;
  right: -60px;
  background: radial-gradient(circle, #41d1ff, transparent 70%);
  animation-delay: -6s;
}

.blob-3 {
  width: 320px;
  height: 320px;
  top: 40%;
  left: 55%;
  background: radial-gradient(circle, #ffb454, transparent 70%);
  animation-delay: -12s;
  opacity: 0.3;
}

.dark .blob {
  opacity: 0.15;
}

@keyframes drift {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(60px, -40px) scale(1.1);
  }
  66% {
    transform: translate(-40px, 30px) scale(0.95);
  }
}

@media (prefers-reduced-motion: reduce) {
  .particle,
  .blob {
    animation: none;
  }
}
</style>
