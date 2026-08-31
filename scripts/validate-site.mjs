import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const builtRoot = path.join(root, "_site");
const requiredSourceFiles = [
  "index.html",
  "knowledge/index.html",
  "knowledge/leetcode/index.md",
  "knowledge/machine-learning/index.md",
  "_layouts/note.html",
  "_config.yml",
  "assets/css/site.css",
  "assets/css/markdown.css",
  "assets/js/site.js",
];
const requiredBuiltFiles = [
  "index.html",
  "knowledge/index.html",
  "knowledge/leetcode/index.html",
  "knowledge/machine-learning/index.html",
  "assets/css/site.css",
  "assets/css/markdown.css",
  "assets/js/site.js",
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

function relativeTo(base, file) {
  return path.relative(base, file).split(path.sep).join("/");
}

async function collectHtmlFiles(directory, ignoredDirectories = new Set()) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectHtmlFiles(absolutePath, ignoredDirectories)));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(absolutePath);
    }
  }

  return files;
}

async function validateRequiredFiles(base, requiredFiles, label) {
  for (const file of requiredFiles) {
    if (!(await exists(path.join(base, file)))) {
      errors.push(`Missing required ${label} file: ${file}`);
    }
  }
}

async function resolveHref(base, fromFile, rawHref, allowMarkdownIndex) {
  const href = rawHref.trim();
  if (
    !href ||
    href.startsWith("#") ||
    href.includes("{{") ||
    /^(https?:|mailto:|tel:|javascript:|data:)/i.test(href)
  ) {
    return null;
  }

  const cleanHref = decodeURIComponent(href.split("#")[0].split("?")[0]);
  if (!cleanHref) {
    return null;
  }

  const candidate = cleanHref.startsWith("/")
    ? path.resolve(base, `.${cleanHref}`)
    : path.resolve(path.dirname(fromFile), cleanHref);

  if (!(await exists(candidate))) {
    return candidate;
  }

  const candidateStat = await stat(candidate);
  if (!candidateStat.isDirectory()) {
    return candidate;
  }

  const htmlIndex = path.join(candidate, "index.html");
  if (await exists(htmlIndex)) {
    return htmlIndex;
  }

  if (allowMarkdownIndex) {
    const markdownIndex = path.join(candidate, "index.md");
    if (await exists(markdownIndex)) {
      return markdownIndex;
    }
  }

  return htmlIndex;
}

async function validateHtmlFile(base, file, allowMarkdownIndex) {
  const content = await readFile(file, "utf8");
  const fileLabel = relativeTo(base, file);

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
    const target = await resolveHref(base, file, href, allowMarkdownIndex);
    if (!target) {
      continue;
    }

    if (!(await exists(target))) {
      errors.push(`${fileLabel}: broken internal href "${href}" -> ${relativeTo(base, target)}`);
    }
  }
}

await validateRequiredFiles(root, requiredSourceFiles, "source");
const sourceHtmlFiles = await collectHtmlFiles(
  root,
  new Set([".git", "node_modules", "_site", "_layouts", "docs"]),
);
for (const file of sourceHtmlFiles) {
  await validateHtmlFile(root, file, true);
}

let builtHtmlFiles = [];
if (await exists(builtRoot)) {
  await validateRequiredFiles(builtRoot, requiredBuiltFiles, "built");
  builtHtmlFiles = await collectHtmlFiles(builtRoot, new Set());
  for (const file of builtHtmlFiles) {
    await validateHtmlFile(builtRoot, file, false);
  }
}

if (errors.length) {
  console.error(`Site validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const builtSummary = builtHtmlFiles.length
  ? `; ${builtHtmlFiles.length} built HTML files checked`
  : "; _site not present, source-only validation completed";
console.log(`Site validation passed: ${sourceHtmlFiles.length} source HTML files checked${builtSummary}.`);
