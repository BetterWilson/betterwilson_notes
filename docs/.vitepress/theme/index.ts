import DefaultTheme from 'vitepress/theme'
import { onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'
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

// ---------- 主题导出 ----------
export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        app.component('LoginPage', LoginPage)
    },

    setup() {
        const route = useRoute()
        const initZoom = () => {
            // 为所有图片增加缩放功能
            mediumZoom('.main img', {background: 'var(--vp-c-bg)'})
        }
        onMounted(() => {
            initZoom()
            initScrollReveal()
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
