# Chenyinhong · 个人主页与知识库

主页使用原生 HTML / CSS / JavaScript；`/knowledge/` 使用 Quartz 5 渲染 Markdown。配色、字体、圆角与深浅色模式沿用主页，保留搜索、文章目录、公式、代码高亮和算法演示。

## 浏览与返回

知识库首页只显示一级目录。进入“力扣算法”后选择“二分查找”“滑动窗口”“哈希表”等题型，再进入题型中的具体笔记。目录页只展示当前层的子目录和直接属于它的笔记，不把所有后代文章摊到一起。题型目录可以继续添加任意数量的题目，一题一个 Markdown 文件。

原先六篇算法概述保留在各自题型目录的 `overview.md`，仅修改标题以区分题型与文章，正文未删改。“两数之和”仍在 `hash-table/two-sum.md`，算法演示不变。没有为了填满列表补造题解。

页面不再展示标题旁的返回文字、面包屑、篇数等辅助小字。顶部 **← 返回主页** 返回个人主页 `/`；**↑ 上一级** 返回当前文章所属题型或父目录。直接打开深层链接也可以逐级返回，不依赖浏览器历史记录。

## 添加与编辑笔记

进入对应题型，点击 **新增笔记**，GitHub 新建页面会带上当前目录及 Markdown 模板。修改文件名、标题与正文后提交到 `main`，工作流自动构建发布。新增/编辑按钮不直接写入仓库，保存需要登录 GitHub 并拥有写权限。

以二分查找为例，现有目录是：

```text
knowledge/leetcode/binary-search/
  index.md       题型名称
  overview.md    原有的边界与模板笔记
```

后续每道题在这个目录新增一个 `.md`，文件名可以使用题号和题目名，不再修改一篇总的 `binary-search.md`。新文件的最小结构：

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

`/knowledge/machine-learning/` 来自 `avengerdsf/machine-learning-notes`。新增和编辑会指向源仓库；源仓库 `README.md` 提供目录元数据。章节按实际文件夹组织，不把所有章节的文章合并成一个列表。

源仓库提交后由现有每小时同步任务更新，也可手动运行 **Deploy static content to Pages**。本仓库 `knowledge/` 的提交直接触发部署。

## 代码与验证

```text
assets/css/site.css                      主页设计变量
knowledge/                               Markdown 笔记
knowledge-quartz/quartz.config.yaml       Quartz 插件与布局
knowledge-quartz/custom.scss              知识库样式
knowledge-quartz/plugins/site-ui/         当前层目录、顶部导航、新增与编辑
knowledge-quartz/plugins/algorithm-demo/  算法演示与代码折叠
scripts/prepare-knowledge.mjs             提取主页设计变量、准备本地插件
scripts/test-knowledge-browser.py         目录、题型、文章与交互检查
.github/workflows/validate.yml            回归测试、构建和页面截图
.github/workflows/deploy.yml              GitHub Pages 发布
```

Node.js 22 或更高版本：

```bash
node --test knowledge-quartz/plugins/site-ui/test/*.test.mjs scripts/test/prepare-knowledge.test.mjs
node scripts/validate-site.mjs --source
```

完整构建以工作流为准，使用固定 Quartz 提交，并合并本地笔记及机器学习源仓库。旧的 `scripts/build-knowledge.mjs` 是迁移前的生成器，不用于当前知识库。

验证工作流会上传 `knowledge-ui-preview` 与 `knowledge-ui-checks`。前者包含可通过 HTTP 服务预览的完整站点，后者包含实际浏览器截图和检查报告。源码根目录直接启动 HTTP 服务仅能预览原生主页，不能渲染 Markdown 知识库。
