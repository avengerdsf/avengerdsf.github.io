# GitHub 笔记同步实现报告

仅同步已确认的 `avengerdsf/machine-learning-notes`，并合并本地 `knowledge/` 力扣笔记。来源仓库、分支、输出目录和 checkout 位置统一在 `knowledge-sources.json`；两个工作流共用 `sync-knowledge.mjs` 和 `prepare-knowledge.mjs`，保留每小时、手动及 main push 发布入口。

同步原样复制文件层级、中文/空格文件名、Markdown 正文与相对图片链接，排除 `.git` 和 `.github`。每次只清洁 `.build/quartz/content/`，因此已删除的源笔记不会残留。已有源 checkout 的 origin 不匹配或含本地修改时停止更新；不替换 Quartz checkout 或插件依赖。

真实 `README.md`、`index.md` 均保留，不重命名、不相互覆盖。含笔记的目录缺少 index 时生成 title 元数据和 `knowledgeGeneratedIndex: true`。来源 helper 保持原签名；生成目录页不提供编辑 URL，新增笔记仍指向真实源目录。prepare 为 copied plugin 写入静态来源配置，使构建产物不依赖仓库根文件。

路径检查在清洁输出前核对 canonical workspace 和已存在祖先的真实位置；工作区内或工作区外的目录重定向都会拒绝，防止清理指向 authored 笔记的 junction/symlink。

## 验证

- 先运行新增用例，观察 9 项同步/映射失败，再实现至通过。
- copied plugin 来源配置单独验证 red → green；测试覆盖更换 target、repository、ref 后的编辑与新增链接。
- junction 路径用例明确复现 authored fixture 笔记被删除，再修复为清洁前拒绝。
- 初次同步交付 `npm test`：48/48 通过，0 失败、0 跳过。包括真实本地 Git clone → commit → fetch → 删除文章流程；同步测试不依赖网络。
- 本任务未提交、推送、部署；真实 Quartz 构建和浏览器集成由 root 执行。

## 入口

```bash
node scripts/sync-knowledge.mjs
node scripts/prepare-knowledge.mjs
```

已有来源 checkout 可使用 `node scripts/sync-knowledge.mjs --skip-fetch` 离线重新生成内容。workflow 使用固定 checkout 内的 `node quartz/bootstrap-cli.mjs` 进行 plugin install 和 build。

## 最终审计：真实文章标题

无 frontmatter 的源文章和 README 原先由 note-properties 回退到文件名，导致 Quartz 文章标题和正文首 H1 重复。新增 `note-title` 本地 transformer，使用固定 Quartz 的正式 `markdownPlugins` 接口，在 note-properties（45）后、TOC（50）前执行（46）。仅对 AST 没有 YAML/TOML frontmatter 的文档，将首个顶层 H1 的文字提升为标题，并移除这一个 AST 节点；不写源文件、content 副本或 VFile 原文，已有 frontmatter 和其余节点保持不变。

GFM 现有选项仅控制排版标点和标题锚点，没有提取 H1 为文章标题的选项，依据 [上游 GFM 配置](https://github.com/quartz-community/github-flavored-markdown#configuration) 与固定 checkout 的 `quartz/plugins/types.ts`、`quartz/processors/parse.ts` 选择聚焦 transformer。插件通过已有复制步骤将 ESM 源文件生成 prebuilt `dist/`，无新增编译工具或依赖。prepare fixture 验证 dist 产物，再加载 copied plugin 的 manifest.main 并验证标题行为。

新增 7 项标题用例先失败后通过，覆盖源原文、frontmatter、README、格式化 H1、其余正文节点和缺失 H1 的边界。修复后最新 `npm test`：57/57 通过，0 失败、0 跳过；包含 root 新增的完整构建路径保护用例。

真实 CLI 初次安装曾因无 dist 被强制执行不存在的 npm build 脚本。依据固定 CLI 的 `buildPluginAsync`/`hasPrebuiltDist` 规则，main/exports 指向 `dist/index.mjs`，并在 `site-ui/build.mjs` 的既有复制循环加入 note-title。先由 fixture 复现 dist 缺失，再修至通过。

隔离临时 cwd 使用固定 checkout 的实际 `quartz/bootstrap-cli.mjs plugin install --from-config --concurrency 2` 验证，输出 `note-title: using pre-built dist/`、`note-title built`、`Resolved 1 plugin(s)`，无 failed，exit 0。随后使用 CLI 安装后的 dist 和真实 unified/remarkParse/NoteProperties 管线处理机器学习首篇文章与真实 README：标题分别为“线性回归模型”“机器学习学习笔记”，首 H1 仅提升为文章标题，VFile 原文完全不变。
