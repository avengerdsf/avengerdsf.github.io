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

  await requireFiles([
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
  ]);

  if (await exists("knowledge/index.html")) {
    errors.push("knowledge/index.html: legacy generated knowledge template must be replaced by knowledge/index.md");
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
    if (!config.includes("baseUrl: avengerdsf.github.io/knowledge")) {
      errors.push("Quartz config: baseUrl must target avengerdsf.github.io/knowledge");
    }
    for (const required of ["@quartz-community/explorer", "@quartz-community/search", "@quartz-community/graph", "@quartz-community/backlinks", "./local-plugins/algorithm-demo"]) {
      if (!config.includes(required)) errors.push(`Quartz config: missing ${required}`);
    }
    if (config.includes("@quartz-community/content-meta")) {
      errors.push("Quartz config: content-meta must stay disabled to avoid low-value date/source microcopy");
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
