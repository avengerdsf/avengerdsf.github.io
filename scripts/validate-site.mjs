import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const mode = process.argv.includes("--built") ? "built" : "source";
const errors = [];
const quartzCommit = "f1fba3fc55cbf60a60a5d09c95a49c042cdab63a";

async function exists(relativePath) {
  try { await access(path.join(root, relativePath)); return true; } catch { return false; }
}
async function read(relativePath) { return readFile(path.join(root, relativePath), "utf8"); }
async function requireFiles(files) {
  for (const file of files) if (!(await exists(file))) errors.push(`Missing required ${mode} file: ${file}`);
}
function requireText(text, values, label) {
  for (const value of values) if (!text.includes(value)) errors.push(`${label}: missing ${value}`);
}
function forbidText(text, values, label) {
  for (const value of values) if (text.includes(value)) errors.push(`${label}: unexpected ${value}`);
}

async function validateHomepage() {
  await requireFiles(["index.html", "assets/css/site.css", "assets/css/round2.css", "assets/css/adaptive-grid.css", "assets/js/site.js"]);
  if (await exists("index.html")) requireText(await read("index.html"), ['href="assets/css/adaptive-grid.css"', 'class="brand-avatar"', 'href="knowledge/"'], "Homepage");
}

async function validateKnowledgeTree() {
  if (mode !== "source") return;
  const expectedTitles = new Map([
    ["knowledge/leetcode/index.md", "力扣算法笔记"],
    ["knowledge/leetcode/hash-table/index.md", "哈希表"],
    ["knowledge/leetcode/hash-table/two-sum.md", "两数之和"],
    ["knowledge/leetcode/binary-search.md", "二分查找"],
    ["knowledge/leetcode/sliding-window.md", "滑动窗口"],
    ["knowledge/leetcode/dfs-bfs.md", "DFS / BFS"],
    ["knowledge/leetcode/union-find.md", "并查集"],
    ["knowledge/leetcode/topological-sort.md", "拓扑排序"],
    ["knowledge/leetcode/dynamic-programming.md", "动态规划"],
  ]);
  await requireFiles(["knowledge/index.md", ...expectedTitles.keys()]);
  if (await exists("knowledge/index.html")) errors.push("knowledge/index.html: the legacy generated page must not replace Markdown sources");
  for (const [file, title] of expectedTitles) {
    if (!(await exists(file))) continue;
    const source = await read(file);
    if (!source.startsWith("---\n") || !source.includes(`\ntitle: ${title}\n`)) errors.push(`${file}: missing Chinese frontmatter title ${title}`);
  }
  const file = "knowledge/leetcode/hash-table/two-sum.md";
  if (await exists(file)) {
    const source = await read(file);
    requireText(source, ["哈希表记录元素下标，查找当前元素的补数", "<two-sum-demo", 'class="algorithm-idea-line"', "<strong>核心思路：</strong>", "## 代码\n\n```python"], file);
    forbidText(source, ["[!summary]", '<details class="algorithm-code">'], file);
  }
}

async function validateQuartzIntegration() {
  if (mode !== "source") return;
  const configPath = "knowledge-quartz/quartz.config.yaml";
  const stylesPath = "knowledge-quartz/custom.scss";
  const inlinePath = "knowledge-quartz/plugins/algorithm-demo/src/components/algorithm-demo.inline.ts";
  const demoStylesPath = "knowledge-quartz/plugins/algorithm-demo/src/components/styles.ts";
  await requireFiles([
    configPath, stylesPath, inlinePath, demoStylesPath,
    "knowledge-quartz/plugins/algorithm-demo/package.json",
    "knowledge-quartz/plugins/algorithm-demo/src/components/AlgorithmDemoAssets.tsx",
    "knowledge-quartz/plugins/site-ui/package.json",
    "knowledge-quartz/plugins/site-ui/src/components.mjs",
    "knowledge-quartz/plugins/site-ui/src/data.mjs",
    "knowledge-quartz/plugins/site-ui/src/theme.mjs",
    "scripts/prepare-knowledge.mjs",
  ]);
  if (await exists(configPath)) {
    const config = await read(configPath);
    requireText(config, ["locale: zh-CN", "pageTitle: Chenyinhong / 知识库", "baseUrl: avengerdsf.github.io/knowledge", "@quartz-community/note-properties", "@quartz-community/explorer", "@quartz-community/search", "./local-plugins/algorithm-demo", "./local-plugins/site-ui", "header: Inter", "body: Inter"], "Quartz config");
    forbidText(config, ["@quartz-community/content-meta", "@quartz-community/graph", "@quartz-community/backlinks", "@quartz-community/footer"], "Quartz layout");
    const pluginBlock = (name) => config.match(new RegExp('- source: "@quartz-community/' + name + '"[\\s\\S]*?(?=\\n  - source:|\\nlayout:)'))?.[0] ?? "";
    requireText(pluginBlock("note-properties"), ["hidePropertiesView: true"], "Note properties");
    requireText(pluginBlock("search"), ["position: header"], "Search position");
    requireText(pluginBlock("table-of-contents"), ["position: right"], "TOC position");
    requireText(pluginBlock("breadcrumbs"), ['rootName: "知识库"', 'spacerSymbol: "/"', "showCurrentPage: false"], "Breadcrumbs");
  }
  if (await exists(stylesPath)) {
    const custom = await read(stylesPath);
    // Check the maintained UI contract, not one historical collection of pixel values.
    requireText(custom, ['@use "./home-tokens"', "--home-bg: var(--bg)", "--home-accent: var(--accent)", ".page-header > header", ".page-header > .popover-hint", "button.desktop-explorer", "max-width: none !important", ".sidebar.right:not(:has(.toc li a))", "body::before", ".article-back-link", ".kb-brand", ".kb-actions", ".kb-notebooks", "flex-wrap: wrap", "prefers-reduced-motion"], "Knowledge UI");
    requireText(custom, [".page > #quartz-body .page-header {\n  display: block;"], "Toolbar/title stack");
  }
  if (await exists(inlinePath)) {
    const inline = await read(inlinePath);
    forbidText(inline, ["nums = [${nums.join", "指针从左向右扫描数组。"], "Algorithm demo");
    requireText(inline, ["target = ${target}", "mountArticleBackLink", "article-back-link", "mountMarkdownCodeBlocks", "algorithm-code"], "Article behavior");
  }
  if (await exists(demoStylesPath)) requireText(await read(demoStylesPath), ["grid-template-columns: minmax(0, 1.65fr) 44px minmax(220px, 0.72fr)", "background: transparent", "min-height: 150px"], "Algorithm demo compact layout");
  for (const file of [".github/workflows/validate.yml", ".github/workflows/deploy.yml"]) {
    if (await exists(file)) requireText(await read(file), ['node-version: "24"', "jackyzha0/quartz", quartzCommit, "quartz plugin install --from-config", "quartz build", "title: 机器学习学习笔记", "node scripts/prepare-knowledge.mjs", "Test knowledge UI and shared theme"], file);
  }
  if (await exists(".github/workflows/validate.yml")) requireText(await read(".github/workflows/validate.yml"), ["Render 2048px visual checkpoint", "--window-size=2048,1152", "two-sum-visual.png", "knowledge-mobile.png", "knowledge-ui-preview"], "Visual checkpoints");
  if (await exists(".github/workflows/deploy.yml")) requireText(await read(".github/workflows/deploy.yml"), [".build/quartz/public/. _site/knowledge/"], "Pages output");
}

await validateHomepage();
await validateKnowledgeTree();
await validateQuartzIntegration();
if (errors.length) {
  console.error(`Site ${mode} validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`Site ${mode} validation passed.`);
