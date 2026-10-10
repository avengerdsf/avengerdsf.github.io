# Chenyinhong · 个人主页与知识库

主页使用原生 HTML / CSS / JavaScript；`/knowledge/` 使用 Quartz 5 渲染 Markdown。配色、字体、圆角与深浅色模式沿用主页，保留搜索、文章目录、公式、代码高亮和代码折叠。

## 浏览与返回

知识库首页显示一级目录。每张目录大卡片列出最多 5 个笔记名称，点击卡片进入对应目录。进入“力扣算法”后选择“二分查找”“滑动窗口”“哈希表”等题型，再进入题型中的具体笔记。目录页展示当前层的子目录和直接属于它的笔记。题型目录可以继续添加任意数量的题目，一题一个 Markdown 文件。

力扣笔记来自 `LeetCode笔记/`，按 18 个题型组织 105 个题目条目，包含题目、输入输出、思路、代码和注意点。多维动态规划的状态含义表位于该题型的 `overview.md`，11 个图片与动图附件位于 `knowledge/leetcode/assets/`。

首页只保留作者简介、项目和知识库入口，笔记正文在独立知识页阅读。两者共用配色、字体和深浅主题。悬浮工具栏中的头像/姓名返回个人主页；“更多操作”内的知识库或上一级链接按真实目录返回，不依赖浏览器历史。目录按钮在桌面收起侧栏，在窄屏打开抽屉；抽屉支持关闭按钮、遮罩、Escape 和选择笔记后关闭。

## 添加与编辑笔记

进入对应题型，点击 **新增笔记**，GitHub 新建页面会带上当前目录及 Markdown 模板。修改文件名、标题与正文后提交到 `main`，工作流自动构建发布。新增/编辑按钮不直接写入仓库，保存需要登录 GitHub 并拥有写权限。

以二分查找为例，现有目录是：

```text
knowledge/leetcode/binary-search/
  index.md       题型名称
  p4023.md       升序数组中的目标下标与插入点
  p4076.md       目标值的起止下标
```

每道题使用独立的 `.md` 文件，文件名可以使用题号和题目名。新文件的最小结构：

```markdown
---
title: 题号 · 题目名称
---

## 思路

## 代码

## 易错点
```

目录入口和笔记列表在构建时自动生成，不需要修改 HTML 或维护文章清单。新增题型时建立文件夹，在 `index.md` 中填写 `title`；即使暂时没有题解，该目录仍会出现。根目录散篇可以通过左侧导航和搜索访问，但不会铺到目录首页。

`draft: true` 不发布；`unlisted: true` 不显示在目录中，但不是访问保护。公开仓库不要存放敏感内容。

### 机器学习笔记

`/knowledge/machine-learning/` 来自 `avengerdsf/machine-learning-notes`，唯一配置在 `knowledge-sources.json`；本地力扣笔记仍由 `knowledge/leetcode/` 提供。新增和编辑指向各自的真实仓库、分支和文件路径。源仓库的章节、中文及带空格的文件名、图片与相对链接原样保留，目录只展示当前层的子目录和笔记。

同步保留真实 `README.md` 和 `index.md`，两者不会相互覆盖。缺少 `index.md` 的笔记目录会生成仅含目录名称的首页；这个生成页面没有编辑按钮，新增笔记仍指向源仓库的对应目录。编辑 README 请进入该 README 笔记页面。

源仓库提交后由每小时第 17 分钟运行的任务拉取最新提交，也可手动运行 **Deploy static content to Pages**。本仓库 `knowledge/` 的提交直接触发部署。每次构建都会重新生成内容输出，源仓库已删除的笔记也会从站点移除；失败的同步会阻止本次发布。

## 代码与验证

```text
assets/css/site.css                      主页设计变量
knowledge/                               Markdown 笔记
knowledge-quartz/quartz.config.yaml       Quartz 插件与布局
knowledge-quartz/custom.scss              知识库样式
knowledge-quartz/plugins/site-ui/         当前层目录、顶部导航、新增与编辑
knowledge-quartz/plugins/algorithm-demo/  算法演示与代码折叠
knowledge-sources.json                   本地和 GitHub 笔记来源
scripts/sync-knowledge.mjs                拉取来源、保留文件层级、清洁内容输出
scripts/prepare-knowledge.mjs             提取主页设计变量、准备本地插件
scripts/test-knowledge-browser.py         目录、题型、文章与交互检查
.github/workflows/validate.yml            回归测试、构建和页面截图
.github/workflows/deploy.yml              GitHub Pages 发布
```

Node.js 24 与 Git：

```bash
node --test knowledge-quartz/plugins/site-ui/test/*.test.mjs scripts/test/*.test.mjs
node scripts/validate-site.mjs --source
```

本地完整构建与预览：

```bash
npm test
npm run build:knowledge
python scripts/serve-site.py
```

构建入口首次会获取固定 Quartz 与已指定笔记源、安装构建依赖，之后复用 `.build/` 缓存。打开 `http://127.0.0.1:4173/`，可同时预览首页、目录和无扩展名文章链接；已有源 checkout 可使用 `npm run build:knowledge -- --skip-fetch` 离线重新生成。首次获取依赖需要联网。

部署工作流使用相同的固定 Quartz 提交及内容准备步骤：

```bash
node scripts/sync-knowledge.mjs
node scripts/prepare-knowledge.mjs
```

同步脚本按配置 clone 或更新机器学习笔记，仅清洁 `.build/quartz/content/`；不会替换 Quartz checkout 或清理已安装的插件依赖。来源 checkout 有未提交的修改时会停止，避免覆盖本地内容。已有 checkout 需要离线重新生成内容时可用 `node scripts/sync-knowledge.mjs --skip-fetch`，它不会联网，但要求配置中的来源目录已存在。

构建通过 checkout 中的 `node quartz/bootstrap-cli.mjs plugin install --from-config --concurrency 2` 和 `node quartz/bootstrap-cli.mjs build` 使用固定版本。当前 `npm run build:knowledge` 使用 `scripts/build-site.mjs`；旧的 `scripts/build-knowledge.mjs` 是迁移前的生成器，不用于当前知识库。

验证工作流会上传 `knowledge-ui-preview` 与 `knowledge-ui-checks`。前者包含可通过 HTTP 服务预览的完整站点，后者包含实际浏览器截图和检查报告。源码根目录直接启动 HTTP 服务仅能预览原生主页，不能渲染 Markdown 知识库。
