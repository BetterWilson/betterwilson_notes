<template>
  <div class="hero-visual" aria-hidden="true">
    <div class="orbit orbit-outer">
      <span
        v-for="(tag, i) in outer"
        :key="'o-' + i"
        class="chip"
        :style="chipStyle(i, outer.length, 'outer')"
      >
        <span class="chip-inner">{{ tag }}</span>
      </span>
    </div>

    <div class="orbit orbit-inner">
      <span
        v-for="(tag, i) in inner"
        :key="'i-' + i"
        class="chip chip-sm"
        :style="chipStyle(i, inner.length, 'inner')"
      >
        <span class="chip-inner">{{ tag }}</span>
      </span>
    </div>

    <div class="core">
      <div class="core-ring"></div>
      <div class="core-glow"></div>
      <div class="core-label">
        <span class="bracket">&lt;</span>
        <span class="core-w">Code</span>
        <span class="bracket">/&gt;</span>
      </div>
    </div>

    <svg class="rings" viewBox="0 0 320 320" fill="none">
      <circle cx="160" cy="160" r="150" class="ring ring-outer" />
      <circle cx="160" cy="160" r="100" class="ring ring-inner" />
    </svg>
  </div>
</template>

<script setup>
const outer = ['Django', 'Vue', 'Redis']
const inner = ['Python', 'Git', 'Linux']

function chipStyle(i, total, ring) {
  const angle = (360 / total) * i
  // ring 半径改用 var(--vh-size) * 比例，让 chip 轨道随容器大小缩放，不会溢出
  return {
    '--angle': `${angle}deg`,
    '--ring': ring === 'outer'
      ? 'calc(var(--vh-size, 340px) * 0.44)'
      : 'calc(var(--vh-size, 340px) * 0.29)',
  }
}
</script>

<style scoped>
.hero-visual {
  --vh-size: 340px;
  position: relative;
  width: var(--vh-size);
  height: var(--vh-size);
  max-width: 100%;
  aspect-ratio: 1;
  margin: 0 auto;
  /* 桌面：提到 nav 之上，避免顶部 chip 被磨砂遮挡 */
  z-index: 3;
}

/* 移动端：图放到按钮之下，避免圆圈盖住 Notes/Login 按钮 */
@media (max-width: 960px) {
  .hero-visual {
    z-index: 0;
  }
}

.rings {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.ring {
  stroke-width: 1;
  stroke-dasharray: 4 6;
  animation: ring-spin 40s linear infinite;
  transform-origin: 160px 160px;
}
.ring-outer { stroke: rgba(189, 52, 254, 0.35); }
.ring-inner {
  stroke: rgba(65, 209, 255, 0.35);
  animation-direction: reverse;
  animation-duration: 28s;
}

@keyframes ring-spin {
  to { transform: rotate(360deg); }
}

/* Orbits carrying the chips */
.orbit {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  animation: orbit-spin 30s linear infinite;
}
.orbit-outer { animation-duration: 32s; }
.orbit-inner {
  animation-duration: 22s;
  animation-direction: reverse;
}

@keyframes orbit-spin {
  to { transform: rotate(360deg); }
}

.chip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%)
    rotate(var(--angle))
    translateY(calc(var(--ring) * -1))
    rotate(calc(var(--angle) * -1));
}

/* Counter-rotate the chip content to keep text upright */
.chip-inner {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  border: 1px solid rgba(189, 52, 254, 0.35);
  box-shadow: 0 4px 14px -6px rgba(65, 209, 255, 0.5);
  backdrop-filter: blur(4px);
  animation: chip-counter 32s linear infinite;
  white-space: nowrap;
}
.orbit-inner .chip .chip-inner {
  animation-duration: 22s;
  animation-direction: reverse;
  border-color: rgba(65, 209, 255, 0.4);
  font-size: 12px;
  padding: 5px 10px;
}

@keyframes chip-counter {
  from { transform: rotate(0); }
  to   { transform: rotate(-360deg); }
}

/* Central core */
.core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 110px;
  height: 110px;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.core-glow {
  position: absolute;
  inset: -30px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(189, 52, 254, 0.55) 0%,
    rgba(65, 209, 255, 0.35) 40%,
    transparent 70%
  );
  filter: blur(12px);
  animation: pulse 3.5s ease-in-out infinite;
}
.core-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #bd34fe, #41d1ff);
  padding: 2px;
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
}
.core-label {
  position: relative;
  z-index: 1;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 2px;
}
.core-w {
  background: linear-gradient(120deg, #bd34fe, #41d1ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 30px;
}
.bracket {
  color: var(--vp-c-text-2);
  opacity: 0.7;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50%      { transform: scale(1.15); opacity: 1; }
}

@media (min-width: 961px) and (max-width: 1200px) {
  .hero-visual { --vh-size: 300px; }
}

@media (max-width: 960px) {
  .hero-visual { --vh-size: 240px; }
  .chip-inner { font-size: 12px; padding: 4px 10px; }
  .orbit-inner .chip .chip-inner { font-size: 11px; }
  .core { width: 90px; height: 90px; }
  .core-w { font-size: 24px; }
  .core-label { font-size: 20px; }
}

@media (max-width: 480px) {
  .hero-visual { --vh-size: 200px; }
  .chip-inner { font-size: 11px; padding: 3px 8px; }
  .orbit-inner .chip .chip-inner { font-size: 10px; }
}

/* 矮屏：图缩小让整体挤进一屏 */
@media (min-width: 961px) and (max-height: 720px) {
  .hero-visual { --vh-size: 280px; }
}

@media (prefers-reduced-motion: reduce) {
  .ring,
  .orbit,
  .chip-inner,
  .core-glow {
    animation: none;
  }
}
</style>
