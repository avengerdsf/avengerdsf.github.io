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
  "assets/css/knowledge-directory.css",
  "assets/js/site.js",
  "assets/js/knowledge.js",
];

const sourceRequiredFiles = [
  ...sharedRequiredFiles,
  "package.json",
  "scripts/build-knowledge.mjs",
  "knowledge-source/leetcode/README.md",
  "knowledge-source/leetcode/hash-table.md",
  "knowledge-source/leetcode/hash-table/two-sum.md",
  "knowledge-source/leetcode/binary-search.md",
  "knowledge-source/leetcode/sliding-window.md",
  "knowledge-source/leetcode/dfs-bfs.md",
  "knowledge-source/leetcode/union-find.md",
  "knowledge-source/leetcode/topological-sort.md",
  "knowledge-source/leetcode/dynamic-programming.md",
  "assets/css/algorithm-demo.css",
  "assets/js/algorithm-demo.js",
];

const builtRequiredFiles = [
  ...sharedRequiredFiles,
  "assets/vendor/katex/katex.min.css",
  "knowledge/sources/machine-learning-notes/README.md",
  "knowledge/sources/leetcode/README.md",
  "knowledge/machine-learning/chapter_01_supervised_learning/01_learning_regression/index.html",
  "knowledge/machine-learning/chapter_04_decision_trees/05_xgboost/index.html",
  "knowledge/leetcode/binary-search/index.html",
  "knowledge/leetcode/hash-table/index.html",
  "knowledge/leetcode/hash-table/two-sum/index.html",
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

async function validateKnowledgeDirectoryStyles() {
  const directoryCssPath = path.join(root, "assets/css/knowledge-directory.css");
  const articleCssPath = path.join(root, "assets/css/knowledge-markdown.css");
  if (!(await exists(directoryCssPath)) || !(await exists(articleCssPath))) return;

  const directoryCss = await readFile(directoryCssPath, "utf8");
  const articleCss = await readFile(articleCssPath, "utf8");

  if (!/\.knowledge-page-hero h1\s*\{[^}]*font-size\s*:\s*clamp\(/s.test(directoryCss)) {
    errors.push("assets/css/knowledge-directory.css: knowledge title needs its own restrained size");
  }
  if (!/\.knowledge-card-grid\s*\{[^}]*grid-template-columns\s*:\s*repeat\(auto-fit,\s*minmax\(/s.test(directoryCss)) {
    errors.push("assets/css/knowledge-directory.css: knowledge cards must add columns on wide displays");
  }
  if (/\.knowledge-entry-card\s*>\s*p\s*\{/.test(directoryCss)) {
    errors.push("assets/css/knowledge-directory.css: directory cards should not reserve styling for summary microcopy");
  }
  if (!/\.knowledge-header-search\s*\{[^}]*display\s*:\s*flex/s.test(articleCss)) {
    errors.push("assets/css/knowledge-markdown.css: top knowledge search must be shared by index and article pages");
  }
  if (!/\.article-side-nav\s*\{[^}]*position\s*:\s*fixed/s.test(articleCss)) {
    errors.push("assets/css/knowledge-markdown.css: previous/next navigation must float beside desktop article content");
  }
  if (!/\.article-side-link\s*\{[^}]*width\s*:\s*52px/s.test(articleCss)) {
    errors.push("assets/css/knowledge-markdown.css: side navigation must stay compact until interaction");
  }
}

async function validateAlgorithmDemoSource() {
  if (mode !== "source") return;

  const jsPath = path.join(root, "assets/js/algorithm-demo.js");
  const cssPath = path.join(root, "assets/css/algorithm-demo.css");
  if (!(await exists(jsPath)) || !(await exists(cssPath))) return;

  const js = await readFile(jsPath, "utf8");
  const css = await readFile(cssPath, "utf8");

  if (!js.includes("algorithm-demo-pointer")) {
    errors.push("assets/js/algorithm-demo.js: two-sum animation must render a moving array pointer");
  }
  if (!js.includes("algorithm-demo-probe")) {
    errors.push("assets/js/algorithm-demo.js: two-sum animation must render a visual probe toward the hash table");
  }
  if (!/\.algorithm-demo-pointer\s*\{[^}]*transition\s*:\s*transform/s.test(css)) {
    errors.push("assets/css/algorithm-demo.css: array pointer must move with a transform transition");
  }
  if (!/\.algorithm-demo-hash-row\.is-match/.test(css)) {
    errors.push("assets/css/algorithm-demo.css: matched hash rows must have a dedicated visual state");
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
    if (!knowledgePage.includes('href="../assets/css/knowledge-directory.css"')) {
      errors.push("knowledge/index.html: compact directory stylesheet is not loaded");
    }
    if (!knowledgePage.includes('class="knowledge-header-search"')) {
      errors.push("knowledge/index.html: search must live in the top navigation area");
    }
    if (!knowledgePage.includes('data-knowledge-search-form')) {
      errors.push("knowledge/index.html: top search must keep the knowledge filtering hook");
    }
    if (knowledgePage.includes('class="search-panel reveal knowledge-search-panel"')) {
      errors.push("knowledge/index.html: body-level search panel must be removed after moving search to the top");
    }
    if (knowledgePage.includes("01 / LEETCODE") || knowledgePage.includes("02 / ML")) {
      errors.push("knowledge/index.html: topic cards must not add redundant small-code labels");
    }
    if (knowledgePage.includes("Index → Article Subpage → Source Markdown")) {
      errors.push("knowledge/index.html: remove redundant directory pipeline microcopy");
    }
  }

  const hashTablePath = path.join(root, "knowledge-source/leetcode/hash-table.md");
  if (await exists(hashTablePath)) {
    const hashTablePage = await readFile(hashTablePath, "utf8");
    if (hashTablePage.includes("knowledge-card-meta") || hashTablePage.includes("hash-table/two-sum.md")) {
      errors.push("knowledge-source/leetcode/hash-table.md: child directory must not expose source-path metadata");
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
  if (knowledgePage.includes("knowledge-card-meta") || knowledgePage.includes("knowledge-card-open")) {
    errors.push("knowledge/index.html: generated directory cards must not emit source-path/read microcopy");
  }

  const cardAnchors = [...knowledgePage.matchAll(/<a class="knowledge-entry-card"[\s\S]*?<\/a>/g)].map((match) => match[0]);
  if (cardAnchors.some((card) => /<p>/.test(card))) {
    errors.push("knowledge/index.html: top-level directory cards must stay title-only");
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
    'href="leetcode/hash-table/"',
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
  if (leetcodeArticleFiles.length < 8) {
    errors.push(`knowledge/leetcode: expected at least 8 article pages, found ${leetcodeArticleFiles.length}`);
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
    if (!regressionPage.includes('class="knowledge-header-search"')) {
      errors.push("linear regression article: missing top knowledge search control");
    }
    if (!regressionPage.includes('class="article-side-nav"')) {
      errors.push("linear regression article: missing compact previous/next navigation");
    }
    if (regressionPage.includes("knowledge-article-source") || regressionPage.includes("chapter_01_supervised_learning/01_learning_regression.md")) {
      errors.push("linear regression article: source Markdown metadata must not be exposed in the page chrome");
    }
  }

  const twoSumPath = path.join(root, "knowledge/leetcode/hash-table/two-sum/index.html");
  if (await exists(twoSumPath)) {
    const twoSumPage = await readFile(twoSumPath, "utf8");
    if (twoSumPage.includes("knowledge-article-source") || twoSumPage.includes("hash-table/two-sum.md")) {
      errors.push("two-sum article: source Markdown metadata must not be exposed in the page chrome");
    }
    if (!twoSumPage.includes('data-two-sum-demo')) {
      errors.push("two-sum article: missing algorithm animation mount point");
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
await validateKnowledgeDirectoryStyles();
await validateAlgorithmDemoSource();
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
