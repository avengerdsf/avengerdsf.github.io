import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const mode = process.argv.includes("--built") ? "built" : "source";
const errors = [];

const sharedRequiredFiles = [
  "index.html",
  "knowledge/index.html",
  "assets/css/site.css",
  "assets/css/adaptive-grid.css",
  "assets/css/round2.css",
  "assets/js/site.js",
  "assets/js/knowledge.js",
];

const sourceRequiredFiles = [
  ...sharedRequiredFiles,
  "package.json",
  "scripts/build-knowledge.mjs",
  "knowledge-source/leetcode/README.md",
  "knowledge-source/leetcode/binary-search.md",
  "knowledge-source/leetcode/sliding-window.md",
  "knowledge-source/leetcode/dfs-bfs.md",
  "knowledge-source/leetcode/union-find.md",
  "knowledge-source/leetcode/topological-sort.md",
  "knowledge-source/leetcode/dynamic-programming.md",
];

const builtRequiredFiles = [
  ...sharedRequiredFiles,
  "knowledge/sources/machine-learning-notes/README.md",
  "knowledge/sources/leetcode/README.md",
];

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if ([".git", ".build", "node_modules"].includes(entry.name)) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectHtmlFiles(absolutePath)));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(absolutePath);
    }
  }

  return files;
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

async function resolveHref(fromFile, rawHref) {
  const href = rawHref.trim();
  if (
    !href ||
    href.startsWith("#") ||
    /^(https?:|mailto:|tel:|javascript:|data:)/i.test(href)
  ) {
    return null;
  }

  const cleanHref = decodeURIComponent(href.split("#")[0].split("?")[0]);
  if (!cleanHref) {
    return null;
  }

  const candidate = cleanHref.startsWith("/")
    ? path.resolve(root, `.${cleanHref}`)
    : path.resolve(path.dirname(fromFile), cleanHref);

  if (!(await exists(candidate))) {
    return candidate;
  }

  const candidateStat = await stat(candidate);
  if (candidateStat.isDirectory()) {
    return path.join(candidate, "index.html");
  }

  return candidate;
}

async function validateRequiredFiles() {
  const requiredFiles = mode === "built" ? builtRequiredFiles : sourceRequiredFiles;
  for (const file of requiredFiles) {
    if (!(await exists(path.join(root, file)))) {
      errors.push(`Missing required ${mode} file: ${file}`);
    }
  }
}

async function validateHomepageAdaptiveGrid() {
  const homepagePath = path.join(root, "index.html");
  const adaptiveCssPath = path.join(root, "assets/css/adaptive-grid.css");
  if (!(await exists(homepagePath))) return;

  const homepage = await readFile(homepagePath, "utf8");

  if (!homepage.includes('href="assets/css/adaptive-grid.css"')) {
    errors.push("index.html: adaptive grid stylesheet is not loaded");
  }

  if (!homepage.includes('class="brand-avatar"')) {
    errors.push("index.html: the top-left brand must use the profile avatar");
  }

  if (/class=["'][^"']*\bhero-profile\b/.test(homepage)) {
    errors.push("index.html: duplicate large hero profile card must be removed");
  }

  if (!(await exists(adaptiveCssPath))) return;

  const adaptiveCss = await readFile(adaptiveCssPath, "utf8");
  if (!/\.adaptive-grid\s*\{[^}]*grid-template-columns\s*:\s*repeat\(auto-fit,\s*minmax\(/s.test(adaptiveCss)) {
    errors.push("assets/css/adaptive-grid.css: .adaptive-grid must use auto-fit + minmax for fluid columns");
  }

  const adaptiveSections = ["project-grid", "capability-flow", "now-stack", "home-direct-knowledge"];
  for (const sectionClass of adaptiveSections) {
    const pattern = new RegExp(`class=["'][^"']*\\b${sectionClass}\\b[^"']*\\badaptive-grid\\b[^"']*["']`);
    if (!pattern.test(homepage)) {
      errors.push(`index.html: ${sectionClass} must opt in to adaptive-grid`);
    }
  }
}

async function validateProjectTaxonomy() {
  const homepagePath = path.join(root, "index.html");
  if (!(await exists(homepagePath))) return;
  const homepage = await readFile(homepagePath, "utf8");

  if (homepage.includes('href="#leetcode"') || /<section[^>]+id=["']leetcode["']/.test(homepage)) {
    errors.push("index.html: LeetCode must stay inside the knowledge base instead of becoming a top-level section");
  }

  const projectCards = [...homepage.matchAll(/class=["'][^"']*\bproject-card\b[^"']*["']/g)].length;
  if (projectCards !== 4) {
    errors.push(`index.html: expected exactly 4 project cards, found ${projectCards}`);
  }

  for (const repo of ["agibot_rl_mjlab", "invoice-manager", "Tmux-generator", "ubuntu_toolbox"]) {
    if (!homepage.includes(`github.com/avengerdsf/${repo}`)) {
      errors.push(`index.html: missing project repository ${repo}`);
    }
  }
}

async function validateSourceArchitecture() {
  if (mode !== "source") return;

  const knowledgePagePath = path.join(root, "knowledge/index.html");
  if (await exists(knowledgePagePath)) {
    const knowledgePage = await readFile(knowledgePagePath, "utf8");
    if (!knowledgePage.includes("<!-- KNOWLEDGE_CONTENT -->")) {
      errors.push("knowledge/index.html: missing build-time KNOWLEDGE_CONTENT marker");
    }
  }

  if (await exists(path.join(root, "assets/js/knowledge-data.js"))) {
    errors.push("assets/js/knowledge-data.js: duplicated hand-written knowledge content must be removed");
  }

  if (await exists(path.join(root, "knowledge/articles/machine-learning-roadmap.html"))) {
    errors.push("knowledge/articles/machine-learning-roadmap.html: duplicated machine-learning article must be removed");
  }

  const deployPath = path.join(root, ".github/workflows/deploy.yml");
  const validatePath = path.join(root, ".github/workflows/validate.yml");
  for (const workflowPath of [deployPath, validatePath]) {
    if (!(await exists(workflowPath))) continue;
    const content = await readFile(workflowPath, "utf8");
    const label = relative(workflowPath);
    if (!content.includes("avengerdsf/machine-learning-notes")) {
      errors.push(`${label}: must checkout avengerdsf/machine-learning-notes`);
    }
    if (!content.includes("build-knowledge.mjs")) {
      errors.push(`${label}: must run the Markdown knowledge build`);
    }
  }
}

async function validateBuiltKnowledge() {
  if (mode !== "built") return;

  const knowledgePagePath = path.join(root, "knowledge/index.html");
  if (!(await exists(knowledgePagePath))) return;
  const knowledgePage = await readFile(knowledgePagePath, "utf8");

  if (knowledgePage.includes("<!-- KNOWLEDGE_CONTENT -->")) {
    errors.push("knowledge/index.html: build marker still exists after Markdown generation");
  }

  const mlEntries = [...knowledgePage.matchAll(/data-category=["']Machine Learning["']/g)].length;
  const leetcodeEntries = [...knowledgePage.matchAll(/data-category=["']LeetCode Notes["']/g)].length;
  if (mlEntries < 20) {
    errors.push(`knowledge/index.html: expected at least 20 rendered machine-learning notes, found ${mlEntries}`);
  }
  if (leetcodeEntries < 6) {
    errors.push(`knowledge/index.html: expected at least 6 rendered LeetCode notes, found ${leetcodeEntries}`);
  }

  for (const expectedText of ["线性回归模型", "构建神经网络", "机器学习的开发过程", "XGBoost", "PCA 主成分分析"]) {
    if (!knowledgePage.includes(expectedText)) {
      errors.push(`knowledge/index.html: rendered machine-learning source is missing "${expectedText}"`);
    }
  }

  if (!knowledgePage.includes("data-source-path=")) {
    errors.push("knowledge/index.html: rendered notes must retain their source Markdown path");
  }
}

async function validateHtmlFile(file) {
  const content = await readFile(file, "utf8");
  const fileLabel = relative(file);

  if (!/<title>\s*[^<]+\s*<\/title>/i.test(content)) {
    errors.push(`${fileLabel}: missing non-empty <title>`);
  }

  const ids = [...content.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
  const seenIds = new Set();
  for (const id of ids) {
    if (seenIds.has(id)) {
      errors.push(`${fileLabel}: duplicate id "${id}"`);
    }
    seenIds.add(id);
  }

  const hrefs = [...content.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const href of hrefs) {
    const target = await resolveHref(file, href);
    if (!target) continue;
    if (!(await exists(target))) {
      errors.push(`${fileLabel}: broken internal href "${href}" -> ${relative(target)}`);
    }
  }
}

await validateRequiredFiles();
await validateHomepageAdaptiveGrid();
await validateProjectTaxonomy();
await validateSourceArchitecture();
await validateBuiltKnowledge();

const htmlFiles = await collectHtmlFiles(root);
for (const file of htmlFiles) {
  await validateHtmlFile(file);
}

if (errors.length) {
  console.error(`Site ${mode} validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Site ${mode} validation passed: ${htmlFiles.length} HTML files checked.`);
