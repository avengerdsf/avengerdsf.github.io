import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const requiredFiles = [
  "index.html",
  "knowledge/index.html",
  "knowledge/articles/machine-learning-roadmap.html",
  "knowledge/articles/reinforcement-learning-workflow.html",
  "knowledge/articles/linux-engineering-toolbox.html",
  "assets/css/site.css",
  "assets/css/adaptive-grid.css",
  "assets/js/site.js",
  "assets/js/knowledge-data.js",
  "assets/js/knowledge.js",
];

const errors = [];

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
    if ([".git", "node_modules"].includes(entry.name)) {
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
  for (const file of requiredFiles) {
    if (!(await exists(path.join(root, file)))) {
      errors.push(`Missing required file: ${file}`);
    }
  }
}

async function validateHomepageAdaptiveGrid() {
  const homepagePath = path.join(root, "index.html");
  const adaptiveCssPath = path.join(root, "assets/css/adaptive-grid.css");
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

  if (!(await exists(adaptiveCssPath))) {
    return;
  }

  const adaptiveCss = await readFile(adaptiveCssPath, "utf8");
  if (!/\.adaptive-grid\s*\{[^}]*grid-template-columns\s*:\s*repeat\(auto-fit,\s*minmax\(/s.test(adaptiveCss)) {
    errors.push("assets/css/adaptive-grid.css: .adaptive-grid must use auto-fit + minmax for fluid columns");
  }

  const adaptiveSections = ["project-grid", "card-grid", "capability-flow", "now-stack", "home-direct-knowledge"];
  for (const sectionClass of adaptiveSections) {
    const pattern = new RegExp(`class=["'][^"']*\\b${sectionClass}\\b[^"']*\\badaptive-grid\\b[^"']*["']`);
    if (!pattern.test(homepage)) {
      errors.push(`index.html: ${sectionClass} must opt in to adaptive-grid`);
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
    if (seenIds.has(id)) {
      errors.push(`${fileLabel}: duplicate id "${id}"`);
    }
    seenIds.add(id);
  }

  const hrefs = [...content.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const href of hrefs) {
    const target = await resolveHref(file, href);
    if (!target) {
      continue;
    }

    if (!(await exists(target))) {
      errors.push(`${fileLabel}: broken internal href "${href}" -> ${relative(target)}`);
    }
  }
}

await validateRequiredFiles();
await validateHomepageAdaptiveGrid();
const htmlFiles = await collectHtmlFiles(root);
for (const file of htmlFiles) {
  await validateHtmlFile(file);
}

if (errors.length) {
  console.error(`Site validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Site validation passed: ${htmlFiles.length} HTML files checked, ${requiredFiles.length} required files present.`);
