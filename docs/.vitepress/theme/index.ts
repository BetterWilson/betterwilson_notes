import DefaultTheme from 'vitepress/theme'
import { onMounted, watch, nextTick } from 'vue'
import { useRoute, useData } from 'vitepress'
import mediumZoom from 'medium-zoom'
import './global.css'

import {h} from 'vue';
import Theme from 'vitepress/theme';
import GiscusComment from './components/GiscusComment.vue';
import LoginPage from './components/LoginPage.vue';
import HomeAnimations from './components/HomeAnimations.vue';
import HeroVisual from './components/HeroVisual.vue';
import ReadingProgress from './components/ReadingProgress.vue';
import ArticleMeta from './components/ArticleMeta.vue';
import RelatedArticles from './components/RelatedArticles.vue';

// ---------- 滚动揭示（IntersectionObserver）----------
let revealObserver: IntersectionObserver | null = null

function initScrollReveal() {
    nextTick(() => {
        // 断开旧的 observer，避免重复监听
        if (revealObserver) revealObserver.disconnect()

        revealObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible')
                        revealObserver!.unobserve(entry.target)
                    }
                })
            },
            {
                threshold: 0.08,
                rootMargin: '0px 0px -30px 0px',
            }
        )

        // 为正文中的主要元素添加揭示动画
        const selectors = [
            '.vp-doc h2',
            '.vp-doc h3',
            '.vp-doc h4',
            '.vp-doc p',
            '.vp-doc pre',
            '.vp-doc ul',
            '.vp-doc ol',
            '.vp-doc blockquote',
            '.vp-doc table',
            '.vp-doc img',
            '.vp-doc .custom-block',
        ]

        selectors.forEach((sel) => {
            document.querySelectorAll(sel).forEach((el) => {
                el.classList.add('reveal')
                revealObserver!.observe(el)
            })
        })
    })
}

// ---------- 主题切换圆形扩散动画（View Transitions API）----------
// 拦截 VitePress 的亮/暗切换按钮，用 startViewTransition 包裹，
// 从点击位置向外做圆形 clip-path 扩散，亮↔暗两个方向都有动画。
// 不支持 View Transitions API 的浏览器自动回退到 global.css 里的颜色过渡。
function setupThemeTransition(isDark) {
    if (typeof document === 'undefined') return
    // 不支持 API 时直接放行，让 VitePress 默认切换 + CSS 颜色过渡接管
    if (!document.startViewTransition) return

    // 捕获阶段拦截，确保早于 VitePress 自身的 click 监听
    document.addEventListener(
        'click',
        (e) => {
            const switchEl = e.target.closest('.VPSwitchAppearance')
            if (!switchEl) return
            e.preventDefault()
            e.stopPropagation()

            const x = e.clientX
            const y = e.clientY
            // 计算到视口最远角的距离，保证圆形扩散能完全覆盖屏幕
            const endRadius = Math.hypot(
                Math.max(x, window.innerWidth - x),
                Math.max(y, window.innerHeight - y)
            )

            // 尊重 reduced-motion：直接切换，不做扩散动画
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                isDark.value = !isDark.value
                return
            }

            const transition = document.startViewTransition(() => {
                isDark.value = !isDark.value
            })

            transition.ready.then(() => {
                const root = document.documentElement
                const clipPath = [
                    `circle(0px at ${x}px ${y}px)`,
                    `circle(${endRadius}px at ${x}px ${y}px)`,
                ]
                root.animate(
                    { clipPath },
                    {
                        duration: 480,
                        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                        pseudoElement: '::view-transition-new(root)',
                    }
                )
            })
        },
        true
    )
}

// ---------- 主题导出 ----------
export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        app.component('LoginPage', LoginPage)
    },

    setup() {
        const route = useRoute()
        const { isDark } = useData()
        const initZoom = () => {
            // 为所有图片增加缩放功能
            mediumZoom('.main img', {background: 'var(--vp-c-bg)'})
        }
        onMounted(() => {
            initZoom()
            initScrollReveal()
            // 启用基于 View Transitions API 的圆形扩散切换动画
            setupThemeTransition(isDark)
            // 延迟注入 theme-ready，启用暗色模式切换过渡动画
            // 避免页面初始加载时出现颜色过渡闪烁
            setTimeout(() => {
                document.documentElement.classList.add('theme-ready')
            }, 150)
        })
        watch(
            () => route.path,
            () => {
                nextTick(() => {
                    initZoom()
                    initScrollReveal()
                })
            }
        )
    },
    Layout() {
        return h(Theme.Layout, null, {
            'layout-top': () => [h(HomeAnimations), h(ReadingProgress)],
            'home-hero-image': () => h(HeroVisual),
            'doc-before': () => h(ArticleMeta),
            'doc-after': () => [h(RelatedArticles), h(GiscusComment)],
        });
    },
}
