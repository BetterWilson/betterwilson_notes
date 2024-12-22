import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			'@': '/src', // 将 '@' 定义为 src 文件夹
		},
	},
});
