import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const mode = process.argv.includes("--built") ? "built" : "source";
const errors = [];
const quartzCommit = "f1fba3fc55cbf60a60a5d09c95a49c042cdab63a";
async function exists(file) {
  try { await access(path.join(root, file)); return true; } catch { return false; }
}
async function read(file) { return (await readFile(path.join(root, file), "utf8")).replaceAll("\r\n", "\n"); }
async function requireFiles(files) {
  for (const file of files) if (!(await exists(file))) errors.push(`Missing required ${mode} file: ${file}`);
}
function requireText(text, values, label) {
  for (const value of values) if (!text.includes(value)) errors.push(`${label}: missing ${value}`);
}
function forbidText(text, values, label) {
  for (const value of values) if (text.includes(value)) errors.push(`${label}: unexpected ${value}`);
}

await requireFiles(["index.html", "assets/css/site.css", "assets/js/site.js"]);
if (await exists("index.html")) {
  const home = await read("index.html");
  requireText(home, ['href="assets/css/site.css"', 'class="brand-avatar"', 'href="knowledge/"', 'href="knowledge/leetcode/"', 'href="knowledge/machine-learning/"'], "Homepage");
  forbidText(home, ['href="knowledge/#', 'href="assets/css/round2.css"', 'href="assets/css/adaptive-grid.css"'], "Homepage page boundaries");
}

if (mode === "source") {
  const titles = new Map([
    ["knowledge/leetcode/index.md", "力扣算法笔记"],
    ["knowledge/leetcode/hash-table/index.md", "哈希表"],
    ["knowledge/leetcode/hash-table/two-sum.md", "两数之和"],
    ["knowledge/leetcode/binary-search/index.md", "二分查找"],
    ["knowledge/leetcode/sliding-window/index.md", "滑动窗口"],
    ["knowledge/leetcode/dfs-bfs/index.md", "DFS / BFS"],
    ["knowledge/leetcode/union-find/index.md", "并查集"],
    ["knowledge/leetcode/topological-sort/index.md", "拓扑排序"],
    ["knowledge/leetcode/dynamic-programming/index.md", "动态规划"],
  ]);
  await requireFiles(["knowledge/index.md", ...titles.keys()]);
  if (await exists("knowledge/index.html")) errors.push("knowledge/index.html: a generated page must not replace Markdown sources");
  for (const [file, title] of titles) {
    if (!(await exists(file))) continue;
    const source = await read(file);
    if (!source.startsWith("---\n") || !source.includes(`\ntitle: ${title}\n`)) errors.push(`${file}: missing Chinese frontmatter title ${title}`);
  }
  for (const topic of ['binary-search', 'sliding-window', 'dfs-bfs', 'union-find', 'topological-sort', 'dynamic-programming']) {
    await requireFiles([`knowledge/leetcode/${topic}/overview.md`]);
    if (await exists(`knowledge/leetcode/${topic}.md`)) errors.push(`${topic}: topics must be folders`);
  }
  const demo = "knowledge/leetcode/hash-table/two-sum.md";
  if (await exists(demo)) requireText(await read(demo), ['<two-sum-demo', 'class="algorithm-idea-line"', "## 代码\n\n```python"], demo);

  await requireFiles(["knowledge-sources.json", "scripts/sync-knowledge.mjs", "scripts/prepare-knowledge.mjs", "knowledge-quartz/quartz.config.yaml", "knowledge-quartz/custom.scss", "knowledge-quartz/plugins/site-ui/src/components.mjs", "knowledge-quartz/plugins/site-ui/src/navigation.mjs", "knowledge-quartz/plugins/site-ui/src/data.mjs"]);
  if (await exists("knowledge-sources.json")) {
    try {
      const sources = JSON.parse(await read("knowledge-sources.json"));
      if (!Array.isArray(sources.sources) || !sources.sources.some(source => source.repository === 'avengerdsf/machine-learning-notes' && source.target === 'machine-learning')) errors.push('Source configuration must retain the specified machine-learning notes');
    } catch (error) { errors.push(`Source configuration: ${error.message}`); }
  }
  if (await exists("knowledge-quartz/quartz.config.yaml")) {
    const config = await read("knowledge-quartz/quartz.config.yaml");
    requireText(config, ['locale: zh-CN', 'baseUrl: avengerdsf.github.io/knowledge', '@quartz-community/search', '@quartz-community/explorer', '@quartz-community/latex', './local-plugins/site-ui', './local-plugins/knowledge-actions', './local-plugins/knowledge-overview', './local-plugins/algorithm-demo'], 'Quartz configuration');
    forbidText(config, ['@quartz-community/content-meta', '@quartz-community/graph', '@quartz-community/backlinks', '@quartz-community/breadcrumbs'], 'Reader noise');
  }
  if (await exists("knowledge-quartz/custom.scss")) requireText(await read("knowledge-quartz/custom.scss"), ['@use "./home-tokens"', '.kb-brand', '.kb-tools', 'prefers-reduced-motion'], 'Shared reader theme');
  if (await exists("knowledge-quartz/plugins/site-ui/src/components.mjs")) requireText(await read("knowledge-quartz/plugins/site-ui/src/components.mjs"), ['directoryContents', 'parentDirectoryHref', 'kb-up-link'], 'Structural navigation');
  for (const file of ['.github/workflows/validate.yml', '.github/workflows/deploy.yml']) {
    await requireFiles([file]);
    if (await exists(file)) requireText(await read(file), ['node-version: "24"', 'jackyzha0/quartz', quartzCommit, 'node scripts/sync-knowledge.mjs', 'node scripts/prepare-knowledge.mjs', 'node quartz/bootstrap-cli.mjs plugin install --from-config', 'node quartz/bootstrap-cli.mjs build', 'scripts/test/*.test.mjs'], file);
  }
  if (await exists('.github/workflows/deploy.yml')) requireText(await read('.github/workflows/deploy.yml'), ['cron: "17 * * * *"', 'workflow_dispatch:', '.build/quartz/public/. _site/knowledge/'], 'Automatic Pages build');
} else {
  const output = '.build/quartz/public';
  await requireFiles([`${output}/index.html`, `${output}/leetcode/index.html`, `${output}/machine-learning/index.html`, `${output}/leetcode/hash-table/two-sum.html`]);
  for (const file of [`${output}/index.html`, `${output}/leetcode/hash-table/two-sum.html`]) {
    if (await exists(file)) requireText(await read(file), ['kb-brand', 'kb-tools', 'data-directory-toggle'], file);
  }
  if (await exists(`${output}/leetcode/hash-table/two-sum.html`)) requireText(await read(`${output}/leetcode/hash-table/two-sum.html`), ['two-sum-demo', '哈希表记录元素下标'], 'Preserved article');
}
if (errors.length) {
  console.error(`Site ${mode} validation failed with ${errors.length} error(s):`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`Site ${mode} validation passed.`);
