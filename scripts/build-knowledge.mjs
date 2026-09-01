import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { marked } from "marked";
import markedKatex from "marked-katex-extension";

const root = process.cwd();
const args = process.argv.slice(2);

function argValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const mlSource = path.resolve(root, argValue("--ml-source", ".build/machine-learning-notes"));
const leetcodeSource = path.join(root, "knowledge-source/leetcode");
const knowledgePath = path.join(root, "knowledge/index.html");
const knowledgeMarker = "<!-- KNOWLEDGE_CONTENT -->";
const katexMarker = "<!-- KATEX_CSS -->";

const sources = [
  {
    key: "leetcode",
    anchor: "leetcode",
    category: "LeetCode Notes",
    label: "力扣算法笔记",
    description: "站内 Markdown 源，按算法模式直接渲染。",
    root: leetcodeSource,
    destination: "leetcode",
    repoBaseUrl: "https://github.com/avengerdsf/avengerdsf.github.io/blob/main/knowledge-source/leetcode",
  },
  {
    key: "ml",
    anchor: "machine-learning",
    category: "Machine Learning",
    label: "Machine Learning Notes",
    description: "构建时直接读取 avengerdsf/machine-learning-notes，不维护第二份摘要正文。",
    root: mlSource,
    destination: "machine-learning-notes",
    repoBaseUrl: "https://github.com/avengerdsf/machine-learning-notes/blob/main",
  },
];

let renderContext = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value) {
  return String(value)
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function noteId(sourceKey, relativePath) {
  const stem = relativePath.replace(/\.md$/i, "").replaceAll("\\", "/");
  return `${sourceKey}-${slugify(stem.replaceAll("/", "-"))}`;
}

function encodePath(relativePath) {
  return relativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function isExternalUrl(value) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value);
}

function splitHref(href) {
  const hashIndex = href.indexOf("#");
  const queryIndex = href.indexOf("?");
  const cutCandidates = [hashIndex, queryIndex].filter((index) => index >= 0);
  const cut = cutCandidates.length ? Math.min(...cutCandidates) : href.length;
  return {
    pathname: href.slice(0, cut),
    suffix: href.slice(cut),
  };
}

function normalizeSourcePath(fromRelativePath, targetPath) {
  const decoded = decodeURIComponent(targetPath || "");
  return path.posix.normalize(path.posix.join(path.posix.dirname(fromRelativePath), decoded));
}

function rewriteHref(rawHref, isImage = false) {
  if (!renderContext || !rawHref) return rawHref;

  if (rawHref.startsWith("#")) {
    const fragment = decodeURIComponent(rawHref.slice(1));
    return `#${renderContext.noteId}-${slugify(fragment)}`;
  }

  if (isExternalUrl(rawHref) || rawHref.startsWith("/")) {
    return rawHref;
  }

  const { pathname, suffix } = splitHref(rawHref);
  const resolved = normalizeSourcePath(renderContext.relativePath, pathname);

  if (resolved.startsWith("../")) {
    return `${renderContext.source.repoBaseUrl}/${encodePath(resolved.replace(/^\.\.\//, ""))}${suffix}`;
  }

  if (/\.md$/i.test(resolved) && renderContext.idMap.has(resolved)) {
    const targetId = renderContext.idMap.get(resolved);
    if (suffix.startsWith("#")) {
      return `#${targetId}-${slugify(decodeURIComponent(suffix.slice(1)))}`;
    }
    return `#${targetId}`;
  }

  const copiedPath = `sources/${renderContext.source.destination}/${encodePath(resolved)}`;
  return `${copiedPath}${suffix}`;
}

const renderer = {
  heading(token) {
    const html = this.parser.parseInline(token.tokens);
    const baseSlug = slugify(token.text) || `section-${token.depth}`;
    const count = renderContext.headingCounts.get(baseSlug) || 0;
    renderContext.headingCounts.set(baseSlug, count + 1);
    const suffix = count ? `-${count + 1}` : "";
    const id = `${renderContext.noteId}-${baseSlug}${suffix}`;
    return `<h${token.depth} id="${escapeHtml(id)}">${html}</h${token.depth}>\n`;
  },
  link(token) {
    const text = this.parser.parseInline(token.tokens);
    const href = rewriteHref(token.href, false);
    const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
    const external = isExternalUrl(href) ? ' target="_blank" rel="noreferrer noopener"' : "";
    return `<a href="${escapeHtml(href)}"${title}${external}>${text}</a>`;
  },
  image(token) {
    const src = rewriteHref(token.href, true);
    const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(token.text || "")}"${title} loading="lazy">`;
  },
};

marked.use(markedKatex({ throwOnError: false, nonStandard: true, strict: "ignore" }));
marked.use({ gfm: true, renderer });

async function collectMarkdownFiles(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === ".git") continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(absolutePath, base)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      const relativePath = path.relative(base, absolutePath).split(path.sep).join("/");
      if (relativePath.toLowerCase() !== "readme.md") files.push(relativePath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }));
}

function parseReadmeOutline(readme, knownFiles) {
  const groups = [];
  const seen = new Set();
  let currentGroup = null;

  for (const line of readme.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      const title = heading[1].trim();
      currentGroup = title === "目录" ? null : { title, entries: [] };
      if (currentGroup) groups.push(currentGroup);
      continue;
    }

    const item = line.match(/^\s*\d+\.\s+\[([^\]]+)\]\(([^)#?]+\.md)(?:#[^)]+)?\)(?:[：:]\s*(.*))?\s*$/i);
    if (!item || !currentGroup) continue;

    const relativePath = path.posix.normalize(decodeURIComponent(item[2]));
    if (!knownFiles.has(relativePath) || seen.has(relativePath)) continue;

    currentGroup.entries.push({
      relativePath,
      label: item[1].trim(),
      description: (item[3] || "").trim(),
    });
    seen.add(relativePath);
  }

  const missing = [...knownFiles].filter((file) => !seen.has(file));
  if (missing.length) {
    groups.push({
      title: "其他笔记",
      entries: missing.map((relativePath) => ({ relativePath, label: "", description: "" })),
    });
  }

  return groups.filter((group) => group.entries.length);
}

function extractTitle(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+?)\s*$/m);
  return match ? match[1].trim() : fallback;
}

async function loadSource(source) {
  const readmePath = path.join(source.root, "README.md");
  const readme = await readFile(readmePath, "utf8");
  const markdownFiles = await collectMarkdownFiles(source.root);
  const knownFiles = new Set(markdownFiles);
  const idMap = new Map(markdownFiles.map((relativePath) => [relativePath, noteId(source.key, relativePath)]));
  const groups = parseReadmeOutline(readme, knownFiles);

  for (const group of groups) {
    for (const entry of group.entries) {
      const markdown = await readFile(path.join(source.root, entry.relativePath), "utf8");
      entry.markdown = markdown;
      entry.title = extractTitle(markdown, entry.label || path.basename(entry.relativePath, ".md"));
      entry.id = idMap.get(entry.relativePath);
    }
  }

  return { source, groups, idMap };
}

function renderEntry(bundle, entry) {
  renderContext = {
    source: bundle.source,
    relativePath: entry.relativePath,
    noteId: entry.id,
    idMap: bundle.idMap,
    headingCounts: new Map(),
  };

  const body = marked.parse(entry.markdown);
  const sourceUrl = `${bundle.source.repoBaseUrl}/${encodePath(entry.relativePath)}`;
  const description = entry.description
    ? `<p class="knowledge-inline-description">${escapeHtml(entry.description)}</p>`
    : "";

  return `
<article class="knowledge-inline-note markdown-note reveal is-visible" id="${escapeHtml(entry.id)}" data-knowledge-entry data-category="${escapeHtml(bundle.source.category)}" data-source-path="${escapeHtml(entry.relativePath)}">
  <div class="knowledge-inline-topline">
    <span class="knowledge-meta-line">${escapeHtml(bundle.source.category)}</span>
    <code>${escapeHtml(entry.relativePath)}</code>
  </div>
  ${description}
  <div class="markdown-body">${body}</div>
  <div class="knowledge-inline-footer">
    <span>Source · ${escapeHtml(bundle.source.label)}</span>
    <a class="button button-ghost" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer noopener">查看源 Markdown ↗</a>
  </div>
</article>`;
}

function renderBundle(bundle) {
  const sourceHeader = `
<header class="knowledge-source-header" id="${escapeHtml(bundle.source.anchor)}">
  <p class="eyebrow">${escapeHtml(bundle.source.category)}</p>
  <h2>${escapeHtml(bundle.source.label)}</h2>
  <p>${escapeHtml(bundle.source.description)}</p>
</header>`;

  const groups = bundle.groups
    .map((group) => {
      const entries = group.entries.map((entry) => renderEntry(bundle, entry)).join("\n");
      return `
<section class="knowledge-chapter" data-knowledge-group>
  <div class="knowledge-chapter-head">
    <span>${escapeHtml(bundle.source.label)}</span>
    <h3>${escapeHtml(group.title)}</h3>
  </div>
  <div class="knowledge-chapter-entries">${entries}
  </div>
</section>`;
    })
    .join("\n");

  return `
<section class="knowledge-source-block" data-knowledge-source data-source-category="${escapeHtml(bundle.source.category)}">
${sourceHeader}
${groups}
</section>`;
}

async function copySource(source) {
  const destination = path.join(root, "knowledge/sources", source.destination);
  await rm(destination, { recursive: true, force: true });
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source.root, destination, {
    recursive: true,
    filter: (sourcePath) => !sourcePath.split(path.sep).includes(".git"),
  });
}

async function copyKatexAssets() {
  const katexDist = path.join(root, "node_modules/katex/dist");
  const destination = path.join(root, "assets/vendor/katex");
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  await cp(path.join(katexDist, "katex.min.css"), path.join(destination, "katex.min.css"));
  await cp(path.join(katexDist, "fonts"), path.join(destination, "fonts"), { recursive: true });
}

async function main() {
  const template = await readFile(knowledgePath, "utf8");
  if (!template.includes(knowledgeMarker)) {
    throw new Error(`Missing ${knowledgeMarker} in knowledge/index.html`);
  }
  if (!template.includes(katexMarker)) {
    throw new Error(`Missing ${katexMarker} in knowledge/index.html`);
  }

  const bundles = [];
  for (const source of sources) {
    bundles.push(await loadSource(source));
    await copySource(source);
  }

  await copyKatexAssets();
  renderContext = null;

  const rendered = bundles.map(renderBundle).join("\n");
  const builtPage = template
    .replace(katexMarker, '<link rel="stylesheet" href="../assets/vendor/katex/katex.min.css">')
    .replace(knowledgeMarker, rendered);

  await writeFile(knowledgePath, builtPage, "utf8");

  const counts = bundles.map((bundle) => bundle.groups.reduce((sum, group) => sum + group.entries.length, 0));
  console.log(`Knowledge build complete: ${counts[0]} LeetCode notes, ${counts[1]} machine-learning notes.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
