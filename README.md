# avengerdsf.github.io

个人主页与知识库。主页保持原生 HTML / CSS / JavaScript；知识项目使用 Markdown 编写，由 GitHub Pages / Jekyll 在部署阶段渲染为 HTML。

## 站点结构

```text
.
├── index.html                          # 个人主页 / 项目 / 力扣入口
├── _config.yml                         # Jekyll 配置
├── _layouts/
│   └── note.html                       # Markdown 笔记项目共享布局
├── knowledge/
│   ├── index.html                      # 笔记项目索引与元数据搜索
│   ├── leetcode/
│   │   └── index.md                    # 力扣笔记
│   └── machine-learning/
│       └── index.md                    # Machine Learning Notes
├── assets/
│   ├── css/
│   │   ├── site.css                    # 基础设计系统
│   │   ├── round2.css                  # 双悬浮导航与扩展布局
│   │   ├── wide-desktop.css            # 宽屏布局
│   │   └── markdown.css                # Markdown 正文样式
│   └── js/
│       ├── site.js                     # 主题、导航与公共交互
│       └── knowledge-index.js          # 两个笔记项目的元数据搜索
├── scripts/validate-site.mjs           # 源码 / Jekyll 生成物校验
└── .github/workflows/
    ├── deploy.yml                      # Jekyll 构建 + GitHub Pages 部署
    └── validate.yml                    # PR / main 构建与校验
```

## 知识库规则

**Knowledge project = 一个真实、持续维护的笔记集合。**

**Project repository != knowledge project。** 项目使用了 Linux、强化学习、GDB、Electron 等技术，并不意味着这些技术自动成为新的笔记分类。

当前知识库只包含：

- `knowledge/leetcode/index.md`：力扣笔记。
- `knowledge/machine-learning/index.md`：Machine Learning Notes，对应公开源仓库 `avengerdsf/machine-learning-notes`。

`agibot_rl_mjlab`、`ubuntu_toolbox`、`Tmux-generator`、`invoice-manager` 等仍属于项目，不作为笔记项目展示。只有确实存在新的维护型笔记集合时，才增加新的知识项目子页。

## Markdown 渲染

知识项目页使用 Jekyll front matter：

```md
---
layout: note
title: Example Notes
kicker: Example
description: 这个笔记项目的范围。
---

## 章节标题

正文支持列表、表格、引用、链接、行内代码和 fenced code block。
```

共享布局位于 `_layouts/note.html`，Markdown 样式位于 `assets/css/markdown.css`。不要引入浏览器侧 Markdown 解析器。

## 本地预览

GitHub Actions 是 Markdown 最终渲染结果的基准验证环境。安装 Jekyll 后可以在仓库根目录运行：

```bash
jekyll build
jekyll serve
```

也可以只预览已经生成的 `_site/`：

```bash
python3 -m http.server 8000 --directory _site
```

然后访问：

```text
http://localhost:8000/
http://localhost:8000/knowledge/
http://localhost:8000/knowledge/leetcode/
http://localhost:8000/knowledge/machine-learning/
```

## 校验

CI 会先使用 GitHub Pages 的 Jekyll 构建动作生成 `_site/`，再运行：

```bash
node scripts/validate-site.mjs
```

校验包括：

- 必要源码文件是否存在；
- Jekyll 是否生成两个 Markdown 子页；
- HTML 是否有非空 `<title>`；
- 是否存在重复 `id`；
- 本地 `href` 是否能解析到真实文件或目录首页。

公开站点不得写入私有仓库名称、链接、内部路径或敏感环境信息。
