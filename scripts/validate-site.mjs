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
  "assets/css/knowledge-markdown.css",
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
  "assets/vendor/katex/katex.min.css",
  "knowledge/sources/machine-learning-notes/README.md",
  "knowledge/sources/leetcode/README.md",
  "knowledge/machine-learning/chapter_01_supervised_learning/01_learning_regression/index.html",
  "knowledge/machine-learning/chapter_04_decision_trees/05_xgboost/index.html",
  "knowledge/leetcode/binary-search/index.html",
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
  if (!(await exists(directory))) return [];

  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if ([".git", ".build", "node_modules"].includes(entry.name)) continue;

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

async function resolveLocalReference(fromFile, rawReference) {
  const reference = rawReference.trim();
  if (
    !reference ||
    reference.startsWith("#") ||
    /^(https?:|mailto:|tel:|javascript:|data:|blob:)/i.test(reference)
  ) {
    return null;
  }

  const cleanReference = decodeURIComponent(reference.split("#")[0].split("?")[0]);
  if (!cleanReference) return null;

  const candidate = cleanReference.startsWith("/")
    ? path.resolve(root, `.${cleanReference}`)
    : path.resolve(path.dirname(fromFile), cleanReference);

  if (!(await exists(candidate))) return candidate;

  const candidateStat = await stat(candidate);
  return candidateStat.isDirectory() ? path.join(candidate, "index.html") : candidate;
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

  for (const sectionClass of ["project-grid", "capability-flow", "now-stack", "home-direct-knowledge"]) {
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
    if (!knowledgePage.includes('data-knowledge-search-form')) {
      errors.push("knowledge/index.html: search must use the compact embedded-button form");
    }
    if (!knowledgePage.includes('data-knowledge-search-submit')) {
      errors.push("knowledge/index.html: search submit button must live inside the search field");
    }
    if (knowledgePage.includes("01 / LEETCODE") || knowledgePage.includes("02 / ML")) {
      errors.push("knowledge/index.html: topic cards must not add redundant small-code labels");
    }
    if (knowledgePage.includes("Index → Article Subpage → Source Markdown")) {
      errors.push("knowledge/index.html: remove redundant directory pipeline microcopy");
    }
  }

  if (await exists(path.join(root, "assets/js/knowledge-data.js"))) {
    errors.push("assets/js/knowledge-data.js: duplicated hand-written knowledge content must be removed");
  }
  if (await exists(path.join(root, "knowledge/articles/machine-learning-roadmap.html"))) {
    errors.push("knowledge/articles/machine-learning-roadmap.html: duplicated machine-learning article must be removed");
  }

  for (const workflowPath of [
    path.join(root, ".github/workflows/deploy.yml"),
    path.join(root, ".github/workflows/validate.yml"),
  ]) {
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
    errors.push("knowledge/index.html: build marker still exists after knowledge generation");
  }
  if (knowledgePage.includes('class="markdown-body') || knowledgePage.includes('class="katex')) {
    errors.push("knowledge/index.html: article bodies/formulas must live on subpages, not the index");
  }
  if (knowledgePage.includes('class="knowledge-card-meta"')) {
    errors.push("knowledge/index.html: article cards must not repeat category/source-path metadata");
  }
  if (knowledgePage.includes('class="knowledge-card-open"')) {
    errors.push("knowledge/index.html: article cards must not add redundant read-note microcopy");
  }
  if (/<div class="knowledge-chapter-head">\s*<span>/s.test(knowledgePage)) {
    errors.push("knowledge/index.html: chapter headings must be plain section titles without source-label microcopy");
  }
  if (/<header class="knowledge-source-header">\s*<p class="eyebrow">/s.test(knowledgePage)) {
    errors.push("knowledge/index.html: source headings must not repeat category eyebrow labels");
  }

  const mlCards = [...knowledgePage.matchAll(/data-category=["']Machine Learning["'][^>]*data-knowledge-entry/g)].length;
  const leetcodeCards = [...knowledgePage.matchAll(/data-category=["']LeetCode Notes["'][^>]*data-knowledge-entry/g)].length;
  if (mlCards < 20) {
    errors.push(`knowledge/index.html: expected at least 20 machine-learning article cards, found ${mlCards}`);
  }
  if (leetcodeCards < 6) {
    errors.push(`knowledge/index.html: expected at least 6 LeetCode article cards, found ${leetcodeCards}`);
  }

  for (const expectedHref of [
    'href="machine-learning/chapter_01_supervised_learning/01_learning_regression/"',
    'href="machine-learning/chapter_04_decision_trees/05_xgboost/"',
    'href="leetcode/binary-search/"',
  ]) {
    if (!knowledgePage.includes(expectedHref)) {
      errors.push(`knowledge/index.html: missing generated article link ${expectedHref}`);
    }
  }

  const mlArticleFiles = await collectHtmlFiles(path.join(root, "knowledge/machine-learning"));
  const leetcodeArticleFiles = await collectHtmlFiles(path.join(root, "knowledge/leetcode"));
  if (mlArticleFiles.length < 20) {
    errors.push(`knowledge/machine-learning: expected at least 20 article pages, found ${mlArticleFiles.length}`);
  }
  if (leetcodeArticleFiles.length < 6) {
    errors.push(`knowledge/leetcode: expected at least 6 article pages, found ${leetcodeArticleFiles.length}`);
  }

  const regressionPath = path.join(root, "knowledge/machine-learning/chapter_01_supervised_learning/01_learning_regression/index.html");
  if (await exists(regressionPath)) {
    const regressionPage = await readFile(regressionPath, "utf8");
    if (!regressionPage.includes('class="markdown-body"')) {
      errors.push("linear regression article: missing rendered Markdown body");
    }
    if (!regressionPage.includes('class="katex')) {
      errors.push("linear regression article: missing build-time KaTeX formulas");
    }
    if (!regressionPage.includes("chapter_01_supervised_learning/01_learning_regression.md")) {
      errors.push("linear regression article: missing source Markdown path");
    }
  }

  const xgboostPath = path.join(root, "knowledge/machine-learning/chapter_04_decision_trees/05_xgboost/index.html");
  if (await exists(xgboostPath)) {
    const xgboostPage = await readFile(xgboostPath, "utf8");
    if (!xgboostPage.includes("/knowledge/sources/machine-learning-notes/chapter_04_decision_trees/assets/xgboost_sequential_boosting.svg")) {
      errors.push("XGBoost article: source SVG asset was not rewritten to the copied static asset");
    }
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
    if (seenIds.has(id)) errors.push(`${fileLabel}: duplicate id "${id}"`);
    seenIds.add(id);
  }

  for (const attribute of ["href", "src"]) {
    const references = [...content.matchAll(new RegExp(`\\b${attribute}\\s*=\\s*["']([^"']+)["']`, "gi"))].map((match) => match[1]);
    for (const reference of references) {
      const target = await resolveLocalReference(file, reference);
      if (!target) continue;
      if (!(await exists(target))) {
        errors.push(`${fileLabel}: broken internal ${attribute} "${reference}" -> ${relative(target)}`);
      }
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
