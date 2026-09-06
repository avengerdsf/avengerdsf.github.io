import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const mode = process.argv.includes("--built") ? "built" : "source";
const errors = [];
const quartzCommit = "f1fba3fc55cbf60a60a5d09c95a49c042cdab63a";

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function requireFiles(files) {
  for (const file of files) {
    if (!(await exists(file))) errors.push(`Missing required ${mode} file: ${file}`);
  }
}

async function validateHomepage() {
  await requireFiles([
    "index.html",
    "assets/css/site.css",
    "assets/css/round2.css",
    "assets/css/adaptive-grid.css",
    "assets/js/site.js",
  ]);
  if (!(await exists("index.html"))) return;

  const homepage = await read("index.html");
  if (!homepage.includes('href="assets/css/adaptive-grid.css"')) errors.push("index.html: adaptive grid stylesheet is not loaded");
  if (!homepage.includes('class="brand-avatar"')) errors.push("index.html: the top-left brand must use the profile avatar");
  if (!homepage.includes('href="knowledge/"')) errors.push("index.html: homepage must keep the knowledge-base entry point");
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
  if (await exists("knowledge/index.html")) errors.push("knowledge/index.html: legacy generated knowledge template must be replaced by knowledge/index.md");

  for (const [file, title] of expectedTitles) {
    if (!(await exists(file))) continue;
    const source = await read(file);
    if (!source.startsWith("---\n") || !source.includes(`\ntitle: ${title}\n`)) {
      errors.push(`${file}: must expose the Chinese navigation title "${title}" through frontmatter`);
    }
  }

  const twoSumPath = "knowledge/leetcode/hash-table/two-sum.md";
  if (await exists(twoSumPath)) {
    const twoSum = await read(twoSumPath);
    if (!twoSum.includes("哈希表记录元素下标，查找当前元素的补数")) errors.push("two-sum.md: missing the approved core idea sentence");
    if (!twoSum.includes("<two-sum-demo")) errors.push("two-sum.md: missing the reusable Quartz algorithm-demo custom element");
    if (twoSum.includes("[!summary]")) errors.push("two-sum.md: the core idea must be flat prose, not a callout card");
    if (!twoSum.includes('class="algorithm-idea-line"') || !twoSum.includes("<strong>核心思路：</strong>")) {
      errors.push("two-sum.md: the flat core idea label is missing");
    }
  }
}

async function validateQuartzIntegration() {
  if (mode !== "source") return;

  const configPath = "knowledge-quartz/quartz.config.yaml";
  const stylesPath = "knowledge-quartz/custom.scss";
  const inlinePath = "knowledge-quartz/plugins/algorithm-demo/src/components/algorithm-demo.inline.ts";
  const demoStylesPath = "knowledge-quartz/plugins/algorithm-demo/src/components/styles.ts";

  await requireFiles([
    configPath,
    stylesPath,
    "knowledge-quartz/plugins/algorithm-demo/package.json",
    "knowledge-quartz/plugins/algorithm-demo/src/components/AlgorithmDemoAssets.tsx",
    inlinePath,
    demoStylesPath,
  ]);

  if (await exists(configPath)) {
    const config = await read(configPath);
    for (const required of [
      "locale: zh-CN",
      "pageTitle: Chenyinhong / 知识库",
      "baseUrl: avengerdsf.github.io/knowledge",
      "@quartz-community/note-properties",
      "@quartz-community/explorer",
      "@quartz-community/search",
      "./local-plugins/algorithm-demo",
      "header: Inter",
      "body: Inter",
    ]) {
      if (!config.includes(required)) errors.push(`Quartz config: missing ${required}`);
    }

    for (const removed of ["@quartz-community/content-meta", "@quartz-community/graph", "@quartz-community/backlinks", "@quartz-community/footer"]) {
      if (config.includes(removed)) errors.push(`Quartz config: ${removed} must stay out of the visible knowledge layout`);
    }

    const noteProperties = config.match(/- source: "@quartz-community\/note-properties"[\s\S]*?(?=\n  - source:|\nlayout:)/)?.[0] ?? "";
    if (!noteProperties.includes("hidePropertiesView: true")) errors.push("Quartz config: frontmatter must be parsed while the properties panel stays hidden");

    const search = config.match(/- source: "@quartz-community\/search"[\s\S]*?(?=\n  - source:|\nlayout:)/)?.[0] ?? "";
    if (!search.includes("position: header")) errors.push("Quartz config: search must live in the top header");

    const toc = config.match(/- source: "@quartz-community\/table-of-contents"[\s\S]*?(?=\n  - source:|\nlayout:)/)?.[0] ?? "";
    if (!toc.includes("position: right")) errors.push("Quartz config: the right rail must be reserved for the table of contents");

    const breadcrumbs = config.match(/- source: "@quartz-community\/breadcrumbs"[\s\S]*?(?=\n  - source:|\nlayout:)/)?.[0] ?? "";
    for (const required of ['rootName: "知识库"', 'spacerSymbol: "/"', "showCurrentPage: false"]) {
      if (!breadcrumbs.includes(required)) errors.push(`Quartz config: breadcrumbs missing ${required}`);
    }
  }

  if (await exists(stylesPath)) {
    const custom = await read(stylesPath);
    for (const required of [
      "--home-bg: #f7f8fb",
      "--home-accent: #3f66f2",
      ".page-header > header",
      ".page-header > .popover-hint",
      "button.desktop-explorer",
      "max-width: none !important",
      "grid-template-columns: 240px minmax(0, 1fr) 190px !important",
      ".sidebar.right:not(:has(.toc li a))",
      "max-width: 640px",
      "body::before",
      "footer,",
    ]) {
      if (!custom.includes(required)) errors.push(`Quartz visual reflow contract: missing ${required}`);
    }
    if (!custom.includes(".page > #quartz-body .page-header {\n  display: block;")) {
      errors.push("Quartz visual reflow: page-header must stack the toolbar above the title block");
    }
  }

  if (await exists(inlinePath)) {
    const inline = await read(inlinePath);
    if (inline.includes("nums = [${nums.join")) errors.push("algorithm demo: do not repeat the whole nums array above the visible array");
    if (!inline.includes("target = ${target}")) errors.push("algorithm demo: target must remain visible in the compact toolbar");
    if (inline.includes("指针从左向右扫描数组。")) errors.push("algorithm demo: initial helper microcopy must be removed");
  }

  if (await exists(demoStylesPath)) {
    const demoStyles = await read(demoStylesPath);
    for (const required of [
      "grid-template-columns: minmax(0, 1.65fr) 44px minmax(220px, 0.72fr)",
      "background: transparent",
      "min-height: 150px",
    ]) {
      if (!demoStyles.includes(required)) errors.push(`algorithm demo compact layout: missing ${required}`);
    }
  }

  for (const workflowPath of [".github/workflows/validate.yml", ".github/workflows/deploy.yml"]) {
    if (!(await exists(workflowPath))) continue;
    const workflow = await read(workflowPath);
    for (const required of ['node-version: "24"', "jackyzha0/quartz", quartzCommit, "quartz plugin install --from-config", "quartz build", "title: 机器学习学习笔记"]) {
      if (!workflow.includes(required)) errors.push(`${workflowPath}: missing ${required}`);
    }
  }

  if (await exists(".github/workflows/validate.yml")) {
    const validate = await read(".github/workflows/validate.yml");
    for (const required of ["Render 2048px visual checkpoint", "--window-size=2048,1152", "two-sum-visual.png"]) {
      if (!validate.includes(required)) errors.push(`validate.yml: missing visual checkpoint ${required}`);
    }
  }

  if (await exists(".github/workflows/deploy.yml")) {
    const deploy = await read(".github/workflows/deploy.yml");
    if (!deploy.includes(".build/quartz/public/. _site/knowledge/")) errors.push("deploy.yml: Quartz output must be staged under _site/knowledge/");
  }
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
