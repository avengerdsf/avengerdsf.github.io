# Chenyinhong · 个人主页与知识库

主页使用原生 HTML / CSS / JavaScript；`/knowledge/` 使用 Quartz 5 渲染 Markdown。知识库沿用主页的头像、主题色、圆角与悬浮导航，保留全文搜索、文章目录、数学公式、代码高亮和算法演示。

## 浏览与返回

知识库首页只显示一级目录入口，例如“力扣算法”和“机器学习”，不展示全站笔记、文章预览或“全部笔记”折叠区。进入目录后直接显示该目录及其子目录中的笔记，使用单列文字列表；点击标题打开正文，不再要求进入第二层目录。左侧目录树仍可用于细分范围。目录页原有的手写导航保留在 Markdown 源文件中，不再作为第二套可见目录展示。

顶部 **← 返回主页** 始终通向个人主页 `/`，不会因平板宽度而隐藏；头像也保留返回主页功能。面包屑中的 **知识库** 返回目录入口 `/knowledge/`，两者不是同一个页面。

## 添加与编辑笔记

进入对应目录后点击 **新增笔记**，会打开 GitHub 的新建文件页，并填好当前目录和 Markdown 模板。修改文件名、标题与正文，提交到 `main` 后自动构建发布。按钮不会直接写入仓库；保存需要 GitHub 登录及相应仓库权限。

也可以直接在 `knowledge/` 的对应目录添加 `.md` 文件，例如 `knowledge/leetcode/my-note.md`：

```markdown
---
title: 笔记标题
tags: [算法]
---

## 核心思路

写正文。

## 代码

这里可以直接粘贴标准 Markdown 代码块。
```

一个文件对应一个阅读页，标题由 `title` 生成，不必在正文重复写一级标题。文件夹构成左侧目录，首页目录入口、笔记列表与篇数由 Markdown 自动生成，不需要修改 HTML、JavaScript 数据清单或首页链接。

新增主题时，建立 `knowledge/主题目录/` 并放入笔记。需要中文目录名称时，在该目录添加 `index.md`，填写 `title` 即可。不设置目录首页也能自动列出该目录。已有文章可以点击 **编辑本文** 修改原始文件。直接放在 `knowledge/` 根目录的散篇仍可通过左侧导航和搜索访问，但不会铺到目录首页；建议放入对应主题目录。

`draft: true` 的笔记不发布；`unlisted: true` 只是不出现在目录中，**不代表私密或访问保护**。公开仓库中不要保存敏感内容。

### 机器学习笔记

`/knowledge/machine-learning/` 来自 `avengerdsf/machine-learning-notes`，部署时同步。这个目录中的新增与编辑按钮会指向源仓库，而不是本仓库的构建副本。源仓库的 `README.md` 提供目录首页元数据；页面直接列出该目录的笔记。

机器学习源仓库提交后，由现有每小时同步任务更新，也可以手动运行本仓库的 **Deploy static content to Pages**。本仓库 `knowledge/` 的提交会直接触发部署。

## 代码位置与验证

```text
index.html                               个人主页
assets/css/site.css                      主页设计变量的唯一来源
knowledge/                               本地 Markdown 笔记
knowledge-quartz/quartz.config.yaml       Quartz 插件与布局
knowledge-quartz/custom.scss              知识库响应式样式
knowledge-quartz/plugins/site-ui/         目录入口、笔记列表、新增/编辑入口、主题同步
knowledge-quartz/plugins/algorithm-demo/  原有算法演示
scripts/prepare-knowledge.mjs             复用主页设计变量并准备本地插件
scripts/test-knowledge-browser.py         目录入口、直接阅读、返回主页与响应式检查
.github/workflows/validate.yml            单元测试、完整构建与多尺寸截图
.github/workflows/deploy.yml              发布到 GitHub Pages
```

知识库的配色、圆角和阴影由构建脚本从主页 `site.css` 提取，不复制主页的全局布局规则。调整主页设计变量后，下一次构建会同步到知识库；两者的深浅色选择也会保持一致。

Node.js 22 或更高版本可以运行无需安装依赖的 UI 回归测试：

```bash
node --test knowledge-quartz/plugins/site-ui/test/*.test.mjs scripts/test/prepare-knowledge.test.mjs
node scripts/validate-site.mjs --source
```

完整 Quartz 构建以工作流为准：固定 Quartz 提交版本，合并本地笔记和机器学习源仓库，再安装插件、构建和校验。不要使用旧的 `scripts/build-knowledge.mjs` 重建现有知识库，它属于迁移前的生成器。

`python3 -m http.server 8000` 在源码根目录只适合预览原生主页，不能直接渲染 Markdown 知识库。验证工作流会上传 `knowledge-ui-preview` 构建产物，解压后在其根目录启动同样的 HTTP 服务，即可连同主页一起预览 `/knowledge/`。截图产物包含目录首页、笔记列表及文章的桌面、平板和手机视图。
