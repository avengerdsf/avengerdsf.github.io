# avengerdsf.github.io

个人主页与技术知识库，使用原生 HTML / CSS / JavaScript 构建并通过 GitHub Pages 发布。

## 站点结构

```text
.
├── index.html                         # 个人主页
├── knowledge/
│   ├── index.html                     # 可搜索 / 筛选的知识库首页
│   └── articles/                      # 本地知识文章
├── assets/
│   ├── css/site.css                   # 全站共享设计系统
│   └── js/
│       ├── site.js                    # 主题、导航、动效等公共交互
│       ├── knowledge-data.js          # 知识条目数据
│       └── knowledge.js               # 搜索、筛选与卡片渲染
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

然后访问：

```text
http://localhost:8000/
http://localhost:8000/knowledge/
```

不要直接双击 `knowledge/index.html` 预览，因为知识库使用 ES Module，浏览器在 `file://` 协议下可能阻止模块加载。

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

## 新增知识条目

### 仅链接公开仓库

在 `assets/js/knowledge-data.js` 的 `knowledgeEntries` 中新增一项：

```js
{
  title: "Example Project",
  description: "一句话说明这个条目解决什么问题。",
  category: "Engineering Practice",
  tags: ["Example", "Tooling"],
  href: "https://github.com/avengerdsf/example",
  source: "GitHub",
  kind: "repository",
}
```

公开站点只添加公开仓库，不要写入私有仓库名称、链接或内部信息。

### 新增本地文章

1. 在 `knowledge/articles/` 新建语义化 HTML 页面。
2. 复用 `../../assets/css/site.css` 与 `../../assets/js/site.js`。
3. 在 `knowledge-data.js` 新增 `kind: "article"` 条目，`href` 写成 `articles/<filename>.html`。
4. 运行 `node scripts/validate-site.mjs` 检查内部链接。

示例：

```js
{
  title: "New Article",
  description: "文章摘要。",
  category: "Linux & Tooling",
  tags: ["Linux"],
  href: "articles/new-article.html",
  source: "Local note",
  kind: "article",
}
```

## 当前知识分类

- Machine Learning
- Robotics & Reinforcement Learning
- Linux & Tooling
- Engineering Practice

当前版本刻意不引入 Jekyll、Astro、Vite 或其他构建框架。文章规模明显增长后，再评估是否迁移到 Markdown 驱动的静态站点生成器。
