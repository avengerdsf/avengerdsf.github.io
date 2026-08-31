# avengerdsf.github.io

个人主页与技术知识库，使用原生 HTML / CSS / JavaScript 构建并通过 GitHub Pages 发布。

## 站点结构

```text
.
├── index.html                         # 个人主页 / 项目 / 力扣入口
├── knowledge/
│   ├── index.html                     # 正文直接展开的可搜索知识库
│   └── articles/                      # 可独立访问的长文章
├── assets/
│   ├── css/
│   │   ├── site.css                   # 基础设计系统
│   │   └── round2.css                 # 双悬浮导航与第二轮知识库布局
│   └── js/
│       ├── site.js                    # 主题、导航、动效等公共交互
│       ├── knowledge-data.js          # 知识正文与公开源数据
│       └── knowledge.js               # 搜索、筛选、正文渲染与锚点恢复
├── scripts/validate-site.mjs          # 无依赖静态校验
└── .github/workflows/
    ├── deploy.yml                     # GitHub Pages 部署
    └── validate.yml                   # PR / main 静态校验
```

## 本地预览

仓库不需要安装 npm 依赖。进入仓库根目录后启动一个静态 HTTP 服务：

```bash
python3 -m http.server 8000
```

访问：

```text
http://localhost:8000/
http://localhost:8000/knowledge/
```

不要直接双击 `knowledge/index.html`，因为知识库使用 ES Module，浏览器在 `file://` 协议下可能阻止模块加载。

## 静态校验

需要 Node.js 20 或更高版本：

```bash
node scripts/validate-site.mjs
```

校验内容包括：

- 关键站点文件是否存在；
- 每个 HTML 页面是否包含非空 `<title>`；
- 单个 HTML 文件是否存在重复 `id`；
- HTML 中的本地 `href` 是否能解析到真实文件或目录首页。

Pull Request 会自动运行同一校验。

## 知识库数据结构

知识库正文默认直接显示在 `/knowledge/`，不需要先进入卡片再打开第二层页面。主要内容维护在 `assets/js/knowledge-data.js`。

### 新增直接显示的笔记

```js
{
  id: "example-note",
  title: "Example Note",
  description: "这篇笔记解决的问题。",
  category: "Linux & Tooling",
  tags: ["Linux", "Debug"],
  source: "Site note",
  kind: "note",
  updated: "2026-08",
  sections: [
    {
      title: "关键步骤",
      paragraphs: ["说明文字。"],
      bullets: ["第一点。", "第二点。"],
      code: "example command"
    }
  ]
}
```

`id` 同时作为知识库锚点，例如：

```text
/knowledge/#example-note
```

### 关联公开仓库

如果一篇笔记有公开源仓库，可以在笔记中增加：

```js
source: "example-repo",
sourceUrl: "https://github.com/avengerdsf/example"
```

需要单独展示公开仓库入口时使用：

```js
{
  id: "example-repo",
  title: "Example Repo · 源仓库",
  description: "公开仓库说明。",
  category: "Engineering Practice",
  tags: ["Repository"],
  source: "GitHub",
  sourceUrl: "https://github.com/avengerdsf/example",
  kind: "repository"
}
```

公开站点只添加公开仓库，不写入私有仓库名称、链接、内部路径或敏感环境信息。

### 独立长文章

`knowledge/articles/` 保留给需要独立 URL、较长篇幅或更适合连续阅读的文章。它们是补充入口，不是知识库阅读的必经层级。

## 当前知识分类

- LeetCode Notes
- Machine Learning
- Robotics & Reinforcement Learning
- Linux & Tooling
- Engineering Practice

力扣笔记当前覆盖二分、滑动窗口、DFS / BFS、并查集、拓扑排序和动态规划，并直接在知识库正文中展开。

当前版本继续保持零构建依赖，不引入 Jekyll、Astro、Vite 或其他站点框架。
