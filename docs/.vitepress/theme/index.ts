import DefaultTheme from 'vitepress/theme'
import { onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'
import mediumZoom from 'medium-zoom'
import './global.css'

import {h} from 'vue';
import Theme from 'vitepress/theme';
import GiscusComment from './components/GiscusComment.vue';
import LoginPage from './components/LoginPage.vue';

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
        })
        watch(
            () => route.path,
            () => nextTick(() => initZoom())
        )
    },
    Layout() {
        return h(Theme.Layout, null, {
            'doc-after': () => h(GiscusComment),
        });
    },
}
