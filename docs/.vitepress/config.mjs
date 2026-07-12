import {defineConfig} from 'vitepress'
import {SIDEBAR} from './sidebar-data.js'
import katex from 'markdown-it-katex'

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "BetterWilson Notes",
	description: "Notes from BetterWilson",
	ignoreDeadLinks: true,

	markdown: {
		config: (md) => {
			md.use(katex)
		}
	},

	themeConfig: {

		search: {
			provider: 'local'
		},

		// https://vitepress.dev/reference/default-theme-config
		siteTitle: "BetterWilson Notes",

		logo: "/logo.png",

		head: [
			['link', {rel: 'icon', href: '/logo.png'}],
		],

		nav: [
			{
				text: 'Python', items: [
					{text: 'python并发编程', link: '/python/ConcurrentProgramming/'},
					{text: 'python面向对象', link: '/python/ObjectOriented/'},
					{text: 'python补充', link: '/python/supplement/'},
				],
			},
			{text: 'Git', link: '/git/'},
			{text: 'Django', link: '/django/'},
			{text: 'DRF', link: '/drf/'},
			{text: 'Vue', link: '/vue/'},
			{text: 'Redis', link: '/redis/'},
			{text: 'Linux', link: '/linux/'},
			{text: 'Machine Learning', link: '/machine_learning/'},
			{text: 'Deep Learning', link: '/deep_learning/'},
		],

		sidebar: SIDEBAR,

		socialLinks: [
			{icon: 'github', link: 'https://github.com/BetterWilson/Blogs'},
		],

		lastUpdated: true,

		footer: {
			message: '部分内容网络所学，如有侵权可联系QQ:3127993395',
			copyright: '苏ICP备2023051137号',
		}
	}
})
