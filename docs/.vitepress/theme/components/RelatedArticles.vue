<template>
  <div v-if="related.length > 0" class="related-articles">
    <h3 class="related-heading">{{ t(lang, 'relatedHeading') }}</h3>
    <div class="related-grid">
      <a
        v-for="item in related"
        :key="item.link"
        :href="item.link"
        class="related-card"
      >
        <span class="related-card-text">{{ item.text }}</span>
        <span class="related-card-arrow">→</span>
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vitepress'
import { SIDEBAR, SIDEBAR_EN } from '../../sidebar-data.js'
import { t, getLang } from '../locales'

const route = useRoute()

// 当前语言：'zh' | 'en'
const lang = computed(() => getLang(route.path))

// 当前语言对应的侧边栏数据
const activeSidebar = computed(() =>
  route.path.startsWith('/zh/') ? SIDEBAR : SIDEBAR_EN
)

const related = computed(() => {
  const currentPath = route.path
  // 首页、跳转页和登录页不显示推荐
  if (
    currentPath === '/' ||
    currentPath === '/zh/' ||
    currentPath === '/en/' ||
    currentPath.startsWith('/zh/login') ||
    currentPath.startsWith('/en/login')
  ) return []

  // ---------- 在当前 sidebar 组中定位当前页面 ----------
  let currentGroupItems = null
  let currentGroupKey = ''
  let currentIndex = -1

  for (const [key, group] of Object.entries(activeSidebar.value)) {
    if (!group || !group.items || !Array.isArray(group.items)) continue

    const idx = group.items.findIndex(
      (item) => normalize(item.link) === normalize(currentPath)
    )
    if (idx !== -1) {
      currentGroupItems = group.items
      currentGroupKey = key
      currentIndex = idx
      break
    }
  }

  // 如果当前页面是某个分类的索引页（sidebar key 匹配 path）
  let isIndexPage = false
  if (!currentGroupItems) {
    for (const [key, group] of Object.entries(activeSidebar.value)) {
      if (!group || !group.items) continue
      if (normalize(key) === normalize(currentPath)) {
        currentGroupItems = group.items
        currentGroupKey = key
        isIndexPage = true
        break
      }
    }
  }

  if (!currentGroupItems || currentGroupItems.length === 0) return []

  const result = []
  const seen = new Set()

  if (isIndexPage) {
    // 索引页：取同组前 3 篇
    for (const item of currentGroupItems) {
      if (result.length >= 3) break
      result.push(item)
    }
    return result
  }

  // 普通文章页：优先相邻篇，再补同组
  seen.add(normalize(currentPath))

  // 1. 前一篇
  if (currentIndex > 0) {
    const prev = currentGroupItems[currentIndex - 1]
    if (!seen.has(normalize(prev.link))) {
      result.push(prev)
      seen.add(normalize(prev.link))
    }
  }

  // 2. 后一篇
  if (currentIndex < currentGroupItems.length - 1) {
    const next = currentGroupItems[currentIndex + 1]
    if (!seen.has(normalize(next.link))) {
      result.push(next)
      seen.add(normalize(next.link))
    }
  }

  // 3. 同组补充（跳过当前和已选）
  for (const item of currentGroupItems) {
    if (result.length >= 3) break
    if (!seen.has(normalize(item.link))) {
      result.push(item)
      seen.add(normalize(item.link))
    }
  }

  // 4. 如果还不够，从兄弟分组中补（同一顶级路径下）
  if (result.length < 3) {
    const parentPath = getParentPath(currentGroupKey)
    for (const [key, group] of Object.entries(activeSidebar.value)) {
      if (result.length >= 3) break
      if (key === currentGroupKey) continue
      if (!group || !group.items) continue
      if (getParentPath(key) !== parentPath && parentPath !== '/') continue

      for (const item of group.items) {
        if (result.length >= 3) break
        if (!seen.has(normalize(item.link))) {
          result.push(item)
          seen.add(normalize(item.link))
        }
      }
    }
  }

  return result.slice(0, 3)
})

// ---------- 工具函数 ----------
function normalize(p) {
  if (!p) return ''
  // 去掉 .md / .html 后缀、首尾斜杠，统一为小写
  return p
    .replace(/\.(md|html)$/, '')
    .replace(/\/+$/, '')
    .replace(/^\//, '')
    .toLowerCase()
}

function getParentPath(key) {
  // 从 sidebar key 中提取父路径
  // '/python/ConcurrentProgramming/' → 'python'
  const parts = key.replace(/\/+$/, '').replace(/^\//, '').split('/')
  return parts[0] || '/'
}
</script>

<style scoped>
.related-articles {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-divider);
}

.related-heading {
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 1rem;
  letter-spacing: 0.3px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.related-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    transform 0.25s ease;
}

.related-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 6px 20px -8px rgba(100, 108, 255, 0.35);
  transform: translateY(-2px);
}

.related-card-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.related-card-arrow {
  flex-shrink: 0;
  font-size: 1rem;
  color: var(--vp-c-brand-1);
  opacity: 0;
  transform: translateX(-4px);
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.related-card:hover .related-card-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* 窄屏（<640px）：单列 */
@media (max-width: 640px) {
  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
