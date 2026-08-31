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
