<template>
  <div v-if="show" class="article-meta">
    <span class="meta-item" v-if="category">
      <span class="meta-icon">📂</span>
      <span class="meta-text">{{ category }}</span>
    </span>
    <span class="meta-item" v-if="readingTime">
      <span class="meta-icon">⏱️</span>
      <span class="meta-text">{{ readingTime }}</span>
    </span>
    <span class="meta-item" v-if="charCount">
      <span class="meta-icon">📝</span>
      <span class="meta-text">{{ t(lang, 'chars', { n: charCount.toLocaleString() }) }}</span>
    </span>
    <span class="meta-item" v-if="lastUpdated">
      <span class="meta-icon">📅</span>
      <span class="meta-text">{{ t(lang, 'updatedAt') }} {{ lastUpdated }}</span>
    </span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useData } from 'vitepress'
import { t, getLang } from '../locales'

const route = useRoute()
const { page } = useData()

const charCount = ref(0)

// 当前语言：'zh' | 'en'
const lang = computed(() => getLang(route.path))

const show = computed(() => {
  const p = route.path
  // 只在文章页面显示，首页、跳转页和登录页不显示
  return p !== '/' &&
    p !== '/zh/' && p !== '/en/' &&
    !p.startsWith('/zh/login') && !p.startsWith('/en/login')
})

const category = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  // 去掉语言前缀（/zh/... /en/... → python/...）
  if (segments[0] === 'zh' || segments[0] === 'en') segments.shift()
  if (segments.length > 0) {
    // 取第一段路径作为分类名，首字母大写
    const raw = segments[0]
    // 处理特殊大小写：drf → DRF, django → Django
    const upperMap = { drf: 'DRF', git: 'Git', vue: 'Vue', go: 'Go' }
    return upperMap[raw.toLowerCase()] || raw.charAt(0).toUpperCase() + raw.slice(1)
  }
  return ''
})

const readingTime = computed(() => {
  if (charCount.value === 0) return ''
  // 中文阅读速度：约 400 字/分钟
  const minutes = Math.max(1, Math.ceil(charCount.value / 400))
  return t(lang.value, 'readingTime', { n: minutes })
})

const lastUpdated = computed(() => {
  const ts = page.value?.lastUpdated
  if (!ts) return ''
  const locale = lang.value === 'en' ? 'en-US' : 'zh-CN'
  return new Date(ts).toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
})

function updateCharCount() {
  nextTick(() => {
    const doc = document.querySelector('.vp-doc')
    if (doc) {
      // 去掉空白字符后统计中英文混合字数
      charCount.value = doc.textContent?.replace(/\s/g, '').length || 0
    }
  })
}

onMounted(updateCharCount)
watch(() => route.path, updateCharCount)
</script>

<style scoped>
.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.4rem;
  padding: 0 0 0.8rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  user-select: none;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
}

.meta-icon {
  font-size: 0.9rem;
  line-height: 1;
}
</style>
