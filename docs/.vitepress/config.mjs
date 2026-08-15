import {defineConfig} from 'vitepress'
import {SIDEBAR, SIDEBAR_EN} from './sidebar-data.js'
import mathjax3 from 'markdown-it-mathjax3'

// 站点线上地址：sitemap 与 og 标签共用
const SITE_URL = 'https://www.betterwilson.com'

// sidebar-data.js 以"单分组对象"组织数据（供 RelatedArticles.vue 共用），
// 此处包一层数组以满足 VitePress 的 SidebarMulti 类型：'/path/': [{ text, items }]
/**
 * @param {Record<string, { text: string, items: Array<{ text: string, link: string }> }>} sidebar
 * @returns {Record<string, Array<{ text: string, items: Array<{ text: string, link: string }> }>>}
 */
const sidebarOf = (sidebar) =>
	Object.fromEntries(Object.entries(sidebar).map(([k, v]) => [k, [v]]))

// 把 VitePress 传入的 markdown 路径规范成干净 URL 路径（去掉 .md、前导斜杠、目录页的 /index）
const ogPath = (page) => {
	const p = page.replace(/\.md$/, '').replace(/^\/+/, '')
	if (p === 'index') return '/'
	if (p.endsWith('/index')) return `/${p.slice(0, -'/index'.length)}/`
	return `/${p}`
}

// https://vitepress.dev/reference/site-config
// 国际化目录结构：
//   docs/en/         → 英文（路径 /en/ 前缀）
//   docs/zh/         → 中文（路径 /zh/ 前缀，默认语言）
//   docs/index.md    → 根路径跳转页，跳转到 /zh/
// 每个 locale 可配置自己的 label / lang / link / title / description / themeConfig
export default defineConfig({
	title: "BetterWilson Notes",
	ignoreDeadLinks: true,

	// 每个 .md 页面都会被打包成独立的懒加载 chunk，
	// 长文页面（如 deep_learning/neural_network）压缩后超过默认 500KB 阈值，
	// 触发打包警告。这里是纯文档站，按需加载不会拖慢其他页面，调高阈值消除噪音。
	// 注意：Vite 构建选项必须写在 vite.build 下，顶层 build 不会被 VitePress 透传。
	vite: {
		build: {
			chunkSizeWarningLimit: 6000, // kB
		},
	},

	// 自动生成 sitemap.xml（https://vitepress.dev/reference/site-config#sitemap）
	sitemap: {
		hostname: SITE_URL,
	},

	markdown: {
		config: (md) => {
			md.use(mathjax3)
		}
	},

	head: [
		['link', {rel: 'icon', href: '/logo.png'}],
	],

	// 每个页面统一注入 Open Graph / Twitter 标签，方便社交分享与搜索引擎展示
	transformHead({page, pageData, title, description, siteData}) {
		const isArticle = pageData?.frontmatter?.layout !== 'home'
		const url = `${SITE_URL}${ogPath(page)}`
		const suffix = ` | ${siteData.title}`
		const ogTitle = title.endsWith(suffix) ? title.slice(0, -suffix.length) : title
		return [
			['meta', {property: 'og:type', content: isArticle ? 'article' : 'website'}],
			['meta', {property: 'og:url', content: url}],
			['meta', {property: 'og:title', content: ogTitle}],
			['meta', {property: 'og:description', content: description}],
			['meta', {property: 'og:image', content: `${SITE_URL}/logo.png`}],
			['meta', {property: 'og:site_name', content: 'BetterWilson Notes'}],
			['meta', {name: 'twitter:card', content: 'summary_large_image'}],
			['meta', {name: 'twitter:title', content: ogTitle}],
			['meta', {name: 'twitter:description', content: description}],
		]
	},

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
