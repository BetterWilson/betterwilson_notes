import {defineConfig} from 'vitepress'
import {SIDEBAR, SIDEBAR_EN} from './sidebar-data.js'

// 站点线上地址：sitemap 与 og 标签共用
const SITE_URL = 'https://www.betterwilson.com'

// 中文分词：MiniSearch 默认按空白+标点切词，对中文等于整段匹配（搜"序列化器"召回极差）。
// 用 Intl.Segmenter 按词切分，再把每个词也按单字切开，兼顾词匹配与单字匹配。
// 注意：该函数同时在构建期（Node 建索引）和浏览器端（查询时切词）运行，
// VitePress 通过 serializeFunctions 把它序列化进客户端 bundle，
// 所以函数体必须自包含——不能引用模块作用域的任何变量。
const tokenizeCJK = (text) => {
	const latin = text.toLowerCase().split(/[\s\n\r\t\p{P}\p{S}]+/u).filter(Boolean)
	const out = new Set()
	for (const term of latin) {
		// 不含 CJK 的词（英文、代码标识符、数字）原样保留
		if (!/[一-鿿㐀-䶿぀-ヿ가-힯]/.test(term)) {
			out.add(term)
			continue
		}
		if (typeof Intl !== 'undefined' && Intl.Segmenter) {
			const seg = new Intl.Segmenter('zh-CN', {granularity: 'word'})
			for (const {segment, isWordLike} of seg.segment(term)) {
				if (isWordLike) out.add(segment)
			}
		}
		// 单字兜底：Segmenter 不可用时仍能检索，且支持用户只输入单字
		for (const ch of term) {
			if (/[一-鿿㐀-䶿぀-ヿ가-힯]/.test(ch)) out.add(ch)
		}
	}
	return [...out]
}

// sidebar-data.js 以"单分组对象"组织数据（供 RelatedArticles.vue 共用），
// 此处包一层数组以满足 VitePress 的 SidebarMulti 类型：'/path/': [{ text, items }]
/**
 * @param {Record<string, { text: string, items: Array<{ text: string, link: string }> }>} sidebar
 * @returns {Record<string, Array<{ text: string, items: Array<{ text: string, link: string }> }>>}
 */
const sidebarOf = (sidebar) =>
	Object.fromEntries(Object.entries(sidebar).map(([k, v]) => [k, [v]]))

// 把 VitePress 传入的 markdown 路径规范成线上真实 URL 路径。
// 未启用 cleanUrls，所以文章页的真实地址带 .html —— canonical 必须与站内链接一致，
// 否则搜索引擎会认为规范地址和实际可访问地址是两个页面。
const ogPath = (page) => {
	const p = page.replace(/\.md$/, '').replace(/^\/+/, '')
	if (p === 'index') return '/'
	if (p.endsWith('/index')) return `/${p.slice(0, -'/index'.length)}/`
	return `/${p}.html`
}

// 同一篇文章的中英两版互为 alternate。zh/en 目录结构镜像，
// 把路径里的语言前缀对换即可得到另一语言的 URL。
const alternateLinks = (page) => {
	const path = ogPath(page)
	const m = path.match(/^\/(zh|en)(\/.*)$/)
	if (!m) return []
	const [, lang, rest] = m
	const other = lang === 'zh' ? 'en' : 'zh'
	return [
		['link', {rel: 'alternate', hreflang: lang === 'zh' ? 'zh-CN' : 'en-US', href: `${SITE_URL}${path}`}],
		['link', {rel: 'alternate', hreflang: other === 'zh' ? 'zh-CN' : 'en-US', href: `${SITE_URL}/${other}${rest}`}],
		// 语言不匹配时的默认版本：中文是本站主语言
		['link', {rel: 'alternate', hreflang: 'x-default', href: `${SITE_URL}/zh${rest}`}],
	]
}

// https://vitepress.dev/reference/site-config
// 国际化目录结构：
//   docs/en/         → 英文（路径 /en/ 前缀）
//   docs/zh/         → 中文（路径 /zh/ 前缀，默认语言）
//   docs/index.md    → 根路径跳转页，跳转到 /zh/
// 每个 locale 可配置自己的 label / lang / link / title / description / themeConfig
export default defineConfig({
	title: "BetterWilson Notes",

	// 死链检查保持开启——此前设为 true 时掩盖了 4 张图片路径带空格解析失败的问题。
	// 这里只豁免确实需要的例外，而不是整体关闭。
	ignoreDeadLinks: [
		// 根跳转页用 meta refresh 跳到 /zh/，不是 markdown 链接，VitePress 无法解析
		/^\/zh\/$/,
	],

	// 启用后 VitePress 才会向每个页面注入 git 最后提交时间（page.lastUpdated）。
	// 两个 locale 的 themeConfig.lastUpdated.text 以及 ArticleMeta.vue 的日期都依赖它；
	// 不设这个开关，page.lastUpdated 恒为 undefined，文章页的"更新于"永远不显示。
	lastUpdated: true,

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
		// 两类页面标了 noindex，不该出现在 sitemap 里（否则等于一边告诉搜索引擎
		// "别收录"、一边又在 sitemap 里提交它）：
		//   /            根路径 meta refresh 跳转页
		//   /{zh,en}/login/  纯前端 UI 演示，无真实登录逻辑
		transformItems: (items) =>
			items.filter(({url}) => url !== '' && url !== '/' && !/(^|\/)login\/?$/.test(url)),
	},

	// 启用 VitePress 内置数学公式支持（内部即 markdown-it-mathjax3），
	// 关键：它会把 mjx-* 标签注册为 isCustomElement，否则 Vue 编译时会被剥离成 <!---->
	markdown: {
		math: true
	},

	head: [
		// 网站图标：SVG 优先（搜索引擎 SERP 与高清屏首选），再按 ICO / PNG 回退
		['link', {rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg'}],
		['link', {rel: 'shortcut icon', type: 'image/x-icon', href: '/favicon.ico'}],
		['link', {rel: 'icon', type: 'image/x-icon', href: '/favicon.ico'}],
		['link', {rel: 'icon', type: 'image/png', href: '/favicon.png'}],
		['link', {rel: 'apple-touch-icon', href: '/apple-touch-icon.png'}],
		['meta', {name: 'author', content: 'BetterWilson'}],
		// WebSite 结构化数据：让搜索引擎识别站点名称/别名/正式域名（url 复用 SITE_URL 常量）
		['script', {type: 'application/ld+json'}, JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: 'BetterWilson Notes',
			alternateName: 'BetterWilson 技术笔记',
			url: SITE_URL,
		})],
	],

	// 每个页面统一注入 Open Graph / Twitter 标签，方便社交分享与搜索引擎展示
	transformHead({page, pageData, title, description, siteData}) {
		const isArticle = pageData?.frontmatter?.layout !== 'home'
		const url = `${SITE_URL}${ogPath(page)}`
		const suffix = ` | ${siteData.title}`
		const ogTitle = title.endsWith(suffix) ? title.slice(0, -suffix.length) : title
		return [
			// canonical：与 og:url 同一 URL（ogPath 已含 locale 前缀，多语言各自指向自身，无重复）
			['link', {rel: 'canonical', href: url}],
			// hreflang：告诉搜索引擎 zh/en 两版是同一内容的不同语言，避免判为重复内容
			...alternateLinks(page),
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

				// 默认主题的下列 UI 文案不随 lang 自动切换，必须逐项覆盖，
				// 否则中文页上仍会出现 Previous page / Return to top / Menu 等英文
				docFooter: {
					prev: '上一页',
					next: '下一页',
				},
				darkModeSwitchLabel: '外观',
				lightModeSwitchTitle: '切换到浅色模式',
				darkModeSwitchTitle: '切换到深色模式',
				sidebarMenuLabel: '菜单',
				returnToTopLabel: '回到顶部',
				langMenuLabel: '切换语言',
				skipToContentLabel: '跳转到正文',

				notFound: {
					title: '页面不存在',
					quote: '这个链接可能已经失效，或者文章已被移动。',
					linkLabel: '返回首页',
					linkText: '回到首页',
					code: '404',
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
				// 英文导航列出已翻译的主题
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
					{text: 'Deep Learning', link: '/en/deep_learning/'},
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
			provider: 'local',
			options: {
				// 中文分词（见文件顶部 tokenizeCJK）。同一个函数既用于建索引也用于解析查询串，
				// 两端必须一致，否则查询词切不出索引里的 token。
				miniSearch: {
					options: {
						tokenize: tokenizeCJK,
					},
					searchOptions: {
						// 中文已按词切分，模糊匹配会引入大量噪音；前缀匹配仍保留以支持英文边打边搜
						fuzzy: 0.1,
						prefix: true,
						boost: {title: 4, text: 2, titles: 1},
					},
				},
				// 搜索框自身的 UI 文案同样不随 lang 切换，按 locale 分别覆盖
				locales: {
					zh: {
						translations: {
							button: {
								buttonText: '搜索文档',
								buttonAriaLabel: '搜索文档',
							},
							modal: {
								displayDetails: '展开详情',
								resetButtonTitle: '清除查询条件',
								backButtonTitle: '返回',
								noResultsText: '无法找到相关结果',
								footer: {
									selectText: '选择',
									selectKeyAriaLabel: '回车',
									navigateText: '切换',
									navigateUpKeyAriaLabel: '上箭头',
									navigateDownKeyAriaLabel: '下箭头',
									closeText: '关闭',
									closeKeyAriaLabel: 'esc',
								},
							},
						},
					},
				},
			},
		},

		siteTitle: "BetterWilson Notes",

		logo: "/logo.png",

		socialLinks: [
			{icon: 'github', link: 'https://github.com/BetterWilson/Blogs'},
		],
	}
})
