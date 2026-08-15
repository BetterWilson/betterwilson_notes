import {defineConfig} from 'vitepress'
import {SIDEBAR, SIDEBAR_EN} from './sidebar-data.js'
import mathjax3 from 'markdown-it-mathjax3'

// sidebar-data.js 以"单分组对象"组织数据（供 RelatedArticles.vue 共用），
// 此处包一层数组以满足 VitePress 的 SidebarMulti 类型：'/path/': [{ text, items }]
/**
 * @param {Record<string, { text: string, items: Array<{ text: string, link: string }> }>} sidebar
 * @returns {Record<string, Array<{ text: string, items: Array<{ text: string, link: string }> }>>}
 */
const sidebarOf = (sidebar) =>
	Object.fromEntries(Object.entries(sidebar).map(([k, v]) => [k, [v]]))

// https://vitepress.dev/reference/site-config
// 国际化目录结构：
//   docs/en/         → 英文（路径 /en/ 前缀）
//   docs/zh/         → 中文（路径 /zh/ 前缀，默认语言）
//   docs/index.md    → 根路径跳转页，跳转到 /zh/
// 每个 locale 可配置自己的 label / lang / link / title / description / themeConfig
export default defineConfig({
	title: "BetterWilson Notes",
	ignoreDeadLinks: true,

	markdown: {
		config: (md) => {
			md.use(mathjax3)
		}
	},

	head: [
		['link', {rel: 'icon', href: '/logo.png'}],
	],

	// 语言配置：root 为中文（路径不带前缀），en 为英文（/en/ 前缀）
	// 语言切换下拉框由 VitePress 根据 locales 自动生成
	locales: {
		zh: {
			label: '简体中文',
			lang: 'zh-CN',
			link: '/zh/',
			description: 'BetterWilson 的个人技术笔记',
			themeConfig: {
				nav: [
					{
						text: 'Python', items: [
							{text: 'python并发编程', link: '/zh/python/ConcurrentProgramming/'},
							{text: 'python面向对象', link: '/zh/python/ObjectOriented/'},
							{text: 'python补充', link: '/zh/python/supplement/'},
						],
					},
					{text: 'Git', link: '/zh/git/'},
					{text: 'Django', link: '/zh/django/'},
					{text: 'DRF', link: '/zh/drf/'},
					{text: 'Vue', link: '/zh/vue/'},
					{text: 'Redis', link: '/zh/redis/'},
					{text: 'Linux', link: '/zh/linux/'},
					{text: 'Machine Learning', link: '/zh/machine_learning/'},
					{text: 'Deep Learning', link: '/zh/deep_learning/'},
				],

				sidebar: sidebarOf(SIDEBAR),

				outline: {
					level: [2, 6],
					label: '目录'
				},

				lastUpdated: {
					text: '更新于'
				},

				footer: {
					message: '部分内容网络所学，如有侵权可联系QQ:3127993395',
					copyright: '苏ICP备2023051137号',
				}
			}
		},
		en: {
			label: 'English',
			lang: 'en-US',
			link: '/en/',
			description: 'Notes from BetterWilson',
			themeConfig: {
				// 英文导航列出已翻译的主题（deep_learning 暂未翻译，不列出）
				nav: [
					{
						text: 'Python', items: [
							{text: 'Python Concurrency', link: '/en/python/ConcurrentProgramming/'},
							{text: 'Python OOP', link: '/en/python/ObjectOriented/'},
							{text: 'Python Supplement', link: '/en/python/supplement/'},
						],
					},
					{text: 'Git', link: '/en/git/'},
					{text: 'Django', link: '/en/django/'},
					{text: 'DRF', link: '/en/drf/'},
					{text: 'Vue', link: '/en/vue/'},
					{text: 'Redis', link: '/en/redis/'},
					{text: 'Linux', link: '/en/linux/'},
					{text: 'Machine Learning', link: '/en/machine_learning/'},
				],

				sidebar: sidebarOf(SIDEBAR_EN),

				outline: {
					level: [2, 6],
					label: 'On this page'
				},

				lastUpdated: {
					text: 'Updated'
				},

				footer: {
					message: 'Some content is learned from the internet. If any infringement, please contact QQ:3127993395',
					copyright: '苏ICP备2023051137号',
				}
			}
		}
	},

	themeConfig: {
		search: {
			provider: 'local'
		},

		siteTitle: "BetterWilson Notes",

		logo: "/logo.png",

		socialLinks: [
			{icon: 'github', link: 'https://github.com/BetterWilson/Blogs'},
		],
	}
})
