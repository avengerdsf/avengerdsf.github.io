import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const mode = process.argv.includes("--built") ? "built" : "source";
const errors = [];

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

await validateHomepage();
await validateKnowledgeTree();

if (errors.length) {
  console.error(`Site ${mode} validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Site ${mode} validation passed.`);
