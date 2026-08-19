/// <reference types="vitepress/client" />

// VitePress 主题里引用的 .vue 单文件组件（自定义组件）没有对应的类型声明，
// 这里统一退化为通用组件类型，避免 tsc 报 TS7016「找不到 .vue 模块的声明」。
declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}
