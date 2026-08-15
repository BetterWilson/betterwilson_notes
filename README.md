# BetterWilson Notes 📝

个人技术笔记站点，基于 [VitePress](https://vitepress.dev/) 静态生成，中英双语（中文为主，英文逐步翻译）。

## 技术栈

| 组件 | 说明 |
| --- | --- |
| [VitePress](https://vitepress.dev/) | 静态站点生成器（Vue 3 + Vite） |
| [markdown-it-mathjax3](https://www.npmjs.com/package/markdown-it-mathjax3) | Markdown 中的 LaTeX 数学公式渲染 |
| [medium-zoom](https://www.npmjs.com/package/medium-zoom) | 文章图片点击放大 |
| [Giscus](https://giscus.app/) | 基于 GitHub Discussions 的评论系统 |

> 无后端服务，全部内容由 VitePress 静态构建。`docs/login/` 页面为纯前端 UI 演示，不是真实登录流程。

## 环境要求

- Node.js **18+**（推荐 20+）

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发（热更新）
npm run docs:dev

# 构建静态站点（输出到 docs/.vitepress/dist）
npm run docs:build

# 预览构建产物
npm run docs:preview
```

## 目录结构

```
docs/
├── zh/                        # 中文内容（默认语言，路径 /zh/）
│   ├── python/  git/  django/  drf/  vue/  redis/  linux/
│   ├── machine_learning/  deep_learning/
│   └── login/                 # 登录页（UI mock）
├── en/                        # 英文内容（路径 /en/，部分翻译）
├── public/                    # 站点级静态资源（logo、favicon、hero 图）
├── index.md                   # 根路径跳转页 → /zh/
└── .vitepress/
    ├── config.mjs             # 导航栏、语言(locales)、搜索、页脚、公式插件
    ├── sidebar-data.js        # 侧边栏唯一数据源（SIDEBAR / SIDEBAR_EN）
    └── theme/                 # 自定义主题（见下）
```

## 内容约定

### 新增一篇文章（重要）

仅创建 `.md` 文件还不够，**必须在 `docs/.vitepress/sidebar-data.js` 中注册**：

1. 在 `docs/zh/<topic>/` 下新建 `xxx.md`；
2. 在 `sidebar-data.js` 的 `SIDEBAR` 中，找到对应的 `/<topic>` 分组，追加 `{ text: '标题', link: '/zh/<topic>/xxx' }`；
3. 如需英文版，在 `docs/en/<topic>/` 同步翻译，并注册到 `SIDEBAR_EN`。

> `sidebar-data.js` 是侧边栏和"相关文章"组件的**唯一数据源**（`config.mjs` 与 `RelatedArticles.vue` 共用）。漏注册 = 页面在 UI 上无法访问，也不会出现在相关文章里。

### 图片资源

- 文章内配图：放在 `docs/<topic>/assets/`，Markdown 里用相对路径引用；
- 站点级图片（logo、favicon、hero 插图）：放 `docs/public/`，用 `/logo.png`、`/picture1.svg` 引用。

### 数学公式

已集成 `markdown-it-mathjax3`，Markdown 中直接书写 `$...$` / `$$...$$` 即可。

## 自定义主题

主题扩展了 VitePress 默认主题，位于 `docs/.vitepress/theme/`：

| 文件 | 作用 |
| --- | --- |
| `index.ts` | 注册插槽（阅读进度条、hero 图、文章元信息、相关文章、Giscus 评论），并在运行时初始化图片缩放与滚动渐显 |
| `components/ArticleMeta.vue` | 文章分类 / 阅读时长 / 字数 / 更新时间（浏览器端计算） |
| `components/RelatedArticles.vue` | 根据 `sidebar-data.js` 推导"相关文章" |
| `components/GiscusComment.vue` | Giscus 评论（仓库固定为 `BetterWilson/blogs-comment-store`） |
| `components/ReadingProgress.vue` | 顶部阅读进度条 |
| `components/HeroVisual.vue` | 首页 hero 插图 |
| `components/LoginPage.vue` | 登录页组件（纯演示） |
| `locales.ts` | 自定义组件的中英文文案字典 |
| `global.css` | 毛玻璃透明背景、首页单屏锁定、动效偏好等样式 |

> ⚠️ 样式注意：导航栏 / 侧边栏 / 页脚均为**半透明 + 背景模糊**，依赖固定的粒子背景透出。给这些元素加不透明背景会破坏视觉效果。另：**文字选中与复制当前是启用的**（相关限制已在 `global.css` 中注释掉）。

## 国际化

- 中英文各有一套 `nav`（`config.mjs` 的 `locales`）和侧边栏（`SIDEBAR` / `SIDEBAR_EN`），手工同步；
- 英文侧边栏只列出**已翻译**的页面（如 `deep_learning` 尚未翻译，英文导航中未列出）；
- 新增英文页面时记得同时更新两处，否则会出现 404 链接（`ignoreDeadLinks` 已开启，构建不会报错）。

## 部署

当前工作流：`npm run docs:build` 产出 `docs/.vitepress/dist/`，构建产物直接提交进 git（因此提交中常出现 hashed 文件名的变更）。如果改为 CI 自动构建部署，可把 `dist` 加入 `.gitignore`，避免仓库膨胀。
