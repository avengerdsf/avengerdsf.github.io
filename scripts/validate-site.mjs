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
  const homepage = await readFile(path.join(root, "index.html"), "utf8");
  if (!homepage.includes('href="assets/css/adaptive-grid.css"')) {
    errors.push("index.html: adaptive grid stylesheet is not loaded");
  }
  if (!homepage.includes('class="brand-avatar"')) {
    errors.push("index.html: the top-left brand must use the profile avatar");
  }
  if (!homepage.includes('href="knowledge/"')) {
    errors.push("index.html: homepage must keep the knowledge-base entry point");
  }
}

async function validateKnowledgeTree() {
  if (mode !== "source") return;

  const knowledgeFiles = [
    "knowledge/index.md",
    "knowledge/leetcode/index.md",
    "knowledge/leetcode/hash-table/index.md",
    "knowledge/leetcode/hash-table/two-sum.md",
    "knowledge/leetcode/binary-search.md",
    "knowledge/leetcode/sliding-window.md",
    "knowledge/leetcode/dfs-bfs.md",
    "knowledge/leetcode/union-find.md",
    "knowledge/leetcode/topological-sort.md",
    "knowledge/leetcode/dynamic-programming.md",
  ];
  await requireFiles(knowledgeFiles);

  if (await exists("knowledge/index.html")) {
    errors.push("knowledge/index.html: legacy generated knowledge template must be replaced by knowledge/index.md");
  }

  const expectedChineseTitles = new Map([
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

  for (const [file, title] of expectedChineseTitles) {
    if (!(await exists(file))) continue;
    const source = await readFile(path.join(root, file), "utf8");
    if (!source.startsWith("---\n") || !source.includes(`\ntitle: ${title}\n`)) {
      errors.push(`${file}: must expose the Chinese navigation title "${title}" through frontmatter`);
    }
  }

  if (await exists("knowledge/leetcode/hash-table/two-sum.md")) {
    const twoSum = await readFile(path.join(root, "knowledge/leetcode/hash-table/two-sum.md"), "utf8");
    if (!twoSum.includes("哈希表记录元素下标，查找当前元素的补数")) {
      errors.push("two-sum.md: missing the approved core idea sentence");
    }
    if (!twoSum.includes("<two-sum-demo")) {
      errors.push("two-sum.md: missing the reusable Quartz algorithm-demo custom element");
    }
  }
}

async function validateQuartzIntegration() {
  if (mode !== "source") return;

  await requireFiles([
    "knowledge-quartz/quartz.config.yaml",
    "knowledge-quartz/custom.scss",
    "knowledge-quartz/plugins/algorithm-demo/package.json",
    "knowledge-quartz/plugins/algorithm-demo/src/components/AlgorithmDemoAssets.tsx",
  ]);

  if (await exists("knowledge-quartz/quartz.config.yaml")) {
    const config = await readFile(path.join(root, "knowledge-quartz/quartz.config.yaml"), "utf8");
    if (!config.includes("locale: zh-CN")) errors.push("Quartz config: locale must be zh-CN");
    if (!config.includes("pageTitle: Chenyinhong / 知识库")) {
      errors.push("Quartz config: page title must use the compact Chinese knowledge-base label");
    }
    if (!config.includes("baseUrl: avengerdsf.github.io/knowledge")) {
      errors.push("Quartz config: baseUrl must target avengerdsf.github.io/knowledge");
    }
    for (const required of ["@quartz-community/note-properties", "@quartz-community/explorer", "@quartz-community/search", "@quartz-community/graph", "@quartz-community/backlinks", "./local-plugins/algorithm-demo"]) {
      if (!config.includes(required)) errors.push(`Quartz config: missing ${required}`);
    }
    const notePropertiesBlock = config.match(/- source: "@quartz-community\/note-properties"[\s\S]*?(?=\n  - source:|\nlayout:)/)?.[0] ?? "";
    if (!notePropertiesBlock.includes("hidePropertiesView: true")) {
      errors.push("Quartz config: frontmatter must be parsed while the properties panel stays hidden");
    }
    if (config.includes("@quartz-community/content-meta")) {
      errors.push("Quartz config: content-meta must stay disabled to avoid low-value date/source microcopy");
    }
    if (!config.includes("header: Inter") || !config.includes("body: Inter")) {
      errors.push("Quartz config: knowledge typography must reuse the homepage Inter family");
    }
    const searchBlock = config.match(/- source: "@quartz-community\/search"[\s\S]*?(?=\n  - source:|\nlayout:)/)?.[0] ?? "";
    if (!searchBlock.includes("position: header")) {
      errors.push("Quartz config: search must live in the top header instead of the left rail");
    }
    const tocBlock = config.match(/- source: "@quartz-community\/table-of-contents"[\s\S]*?(?=\n  - source:|\nlayout:)/)?.[0] ?? "";
    if (!tocBlock.includes("position: right")) {
      errors.push("Quartz config: the right rail must be reserved for the table of contents");
    }
    for (const source of ["graph", "backlinks"]) {
      const block = config.match(new RegExp(`- source: "@quartz-community/${source}"[\\s\\S]*?(?=\\n  - source:|\\nlayout:)`))?.[0] ?? "";
      if (!block.includes("position: afterBody")) {
        errors.push(`Quartz config: ${source} must be demoted below the article body`);
      }
    }
  }

  if (await exists("knowledge-quartz/custom.scss")) {
    const custom = await readFile(path.join(root, "knowledge-quartz/custom.scss"), "utf8");
    for (const required of [
      "--home-bg: #f7f8fb",
      "--home-accent: #3f66f2",
      ".page-header",
      "position: sticky",
      ".sidebar.left",
      "background: transparent",
      "backdrop-filter: blur(18px)",
      "body::before",
      ".sidebar.right",
      "max-width: 700px",
    ]) {
      if (!custom.includes(required)) errors.push(`Quartz compact visual contract: missing ${required}`);
    }
  }

  for (const workflowPath of [".github/workflows/validate.yml", ".github/workflows/deploy.yml"]) {
    if (!(await exists(workflowPath))) continue;
    const workflow = await readFile(path.join(root, workflowPath), "utf8");
    if (!workflow.includes('node-version: "24"')) errors.push(`${workflowPath}: Quartz requires Node 24 in CI`);
    if (!workflow.includes("jackyzha0/quartz")) errors.push(`${workflowPath}: must checkout Quartz`);
    if (!workflow.includes(quartzCommit)) errors.push(`${workflowPath}: Quartz checkout must be pinned to ${quartzCommit}`);
    if (!workflow.includes("quartz plugin install --from-config")) errors.push(`${workflowPath}: must install Quartz plugins from config`);
    if (!workflow.includes("quartz build")) errors.push(`${workflowPath}: must build Quartz`);
  }

  if (await exists(".github/workflows/deploy.yml")) {
    const deploy = await readFile(path.join(root, ".github/workflows/deploy.yml"), "utf8");
    if (!deploy.includes(".build/quartz/public/. _site/knowledge/")) {
      errors.push("deploy.yml: Quartz output must be staged under _site/knowledge/");
    }
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
