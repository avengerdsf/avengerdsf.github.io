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

const sources = [
  {
    key: "leetcode",
    route: "leetcode",
    anchor: "leetcode",
    category: "LeetCode Notes",
    label: "力扣算法笔记",
    description: "按算法模式整理的站内 Markdown 笔记。",
    root: leetcodeSource,
    copyDestination: "leetcode",
    repoBaseUrl: "https://github.com/avengerdsf/avengerdsf.github.io/blob/main/knowledge-source/leetcode",
  },
  {
    key: "ml",
    route: "machine-learning",
    anchor: "machine-learning",
    category: "Machine Learning",
    label: "Machine Learning Notes",
    description: "目录与文章均在构建时直接读取 avengerdsf/machine-learning-notes。",
    root: mlSource,
    copyDestination: "machine-learning-notes",
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

function encodePath(relativePath) {
  return relativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function sourceStem(relativePath) {
  return relativePath.replace(/\.md$/i, "").replaceAll("\\", "/");
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

function rewriteFragment(rawFragment) {
  if (!rawFragment) return "";
  const decoded = decodeURIComponent(rawFragment.replace(/^#/, ""));
  return decoded ? `#${slugify(decoded)}` : "";
}

function rewriteHref(rawHref) {
  if (!renderContext || !rawHref) return rawHref;

  if (rawHref.startsWith("#")) {
    return rewriteFragment(rawHref);
  }

  if (isExternalUrl(rawHref) || rawHref.startsWith("/")) {
    return rawHref;
  }

  const { pathname, suffix } = splitHref(rawHref);
  const resolved = normalizeSourcePath(renderContext.entry.relativePath, pathname);

  if (/\.md$/i.test(resolved)) {
    const targetEntry = renderContext.entryMap.get(resolved);
    if (targetEntry) {
      return `${targetEntry.publicUrl}${suffix.startsWith("#") ? rewriteFragment(suffix) : suffix}`;
    }
    return `${renderContext.source.repoBaseUrl}/${encodePath(resolved)}${suffix}`;
  }

  if (resolved.startsWith("../")) {
    const repoPath = resolved.replace(/^(?:\.\.\/)+/, "");
    return `${renderContext.source.repoBaseUrl}/${encodePath(repoPath)}${suffix}`;
  }

  return `/knowledge/sources/${renderContext.source.copyDestination}/${encodePath(resolved)}${suffix}`;
}

const renderer = {
  heading(token) {
    const html = this.parser.parseInline(token.tokens);
    const baseSlug = slugify(token.text) || `section-${token.depth}`;
    const count = renderContext.headingCounts.get(baseSlug) || 0;
    renderContext.headingCounts.set(baseSlug, count + 1);
    const id = `${baseSlug}${count ? `-${count + 1}` : ""}`;
    return `<h${token.depth} id="${escapeHtml(id)}">${html}</h${token.depth}>\n`;
  },
  link(token) {
    const text = this.parser.parseInline(token.tokens);
    const href = rewriteHref(token.href);
    const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
    const external = isExternalUrl(href) ? ' target="_blank" rel="noreferrer noopener"' : "";
    return `<a href="${escapeHtml(href)}"${title}${external}>${text}</a>`;
  },
  image(token) {
    const src = rewriteHref(token.href);
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

function stripLeadingTitle(markdown) {
  return markdown.replace(/^\s*#\s+.+?(?:\r?\n|$)/, "").trimStart();
}

function stripInlineMarkdown(text) {
  return String(text)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_>#~-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSummary(markdown) {
  const body = stripLeadingTitle(markdown);
  const paragraphs = body.split(/\r?\n\s*\r?\n/);
  for (const paragraph of paragraphs) {
    const text = paragraph.trim();
    if (!text) continue;
    if (/^(?:#{1,6}\s|```|~~~|\$\$|!\[|\||[-*+]\s|\d+\.\s|>)/.test(text)) continue;
    const clean = stripInlineMarkdown(text);
    if (clean) return clean.length > 180 ? `${clean.slice(0, 177)}…` : clean;
  }
  return "";
}

function assignArticleLocation(source, entry) {
  const stem = sourceStem(entry.relativePath);
  entry.stem = stem;
  entry.href = `${source.route}/${encodePath(stem)}/`;
  entry.publicUrl = `/knowledge/${source.route}/${encodePath(stem)}/`;
  entry.outputPath = path.join(root, "knowledge", source.route, ...stem.split("/"), "index.html");
}

async function loadSource(source) {
  const readme = await readFile(path.join(source.root, "README.md"), "utf8");
  const markdownFiles = await collectMarkdownFiles(source.root);
  const knownFiles = new Set(markdownFiles);
  const groups = parseReadmeOutline(readme, knownFiles);

  for (const group of groups) {
    for (const entry of group.entries) {
      const markdown = await readFile(path.join(source.root, entry.relativePath), "utf8");
      entry.markdown = markdown;
      entry.title = extractTitle(markdown, entry.label || path.basename(entry.relativePath, ".md"));
      entry.summary = entry.description || extractSummary(markdown);
      entry.chapter = group.title;
      assignArticleLocation(source, entry);
    }
  }

  const orderedEntries = groups.flatMap((group) => group.entries);
  const entryMap = new Map(orderedEntries.map((entry) => [entry.relativePath, entry]));
  return { source, groups, orderedEntries, entryMap };
}

function renderCard(bundle, entry) {
  const searchText = [
    entry.title,
    entry.summary,
    entry.chapter,
    bundle.source.category,
    entry.relativePath,
  ].filter(Boolean).join(" ");

  const summary = entry.summary
    ? `<p>${escapeHtml(entry.summary)}</p>`
    : `<p class="knowledge-card-path">${escapeHtml(entry.relativePath)}</p>`;

  return `
<a class="knowledge-entry-card" href="${escapeHtml(entry.href)}" data-category="${escapeHtml(bundle.source.category)}" data-knowledge-entry data-source-path="${escapeHtml(entry.relativePath)}" data-search="${escapeHtml(searchText)}">
  <div class="knowledge-card-meta">
    <span>${escapeHtml(bundle.source.category)}</span>
    <code>${escapeHtml(entry.relativePath)}</code>
  </div>
  <h4>${escapeHtml(entry.title)}</h4>
  ${summary}
  <span class="knowledge-card-open">阅读笔记 <span aria-hidden="true">→</span></span>
</a>`;
}

function renderIndexBundle(bundle) {
  const groups = bundle.groups.map((group) => {
    const cards = group.entries.map((entry) => renderCard(bundle, entry)).join("\n");
    return `
<section class="knowledge-chapter" data-knowledge-group>
  <div class="knowledge-chapter-head">
    <span>${escapeHtml(bundle.source.label)}</span>
    <h3>${escapeHtml(group.title)}</h3>
  </div>
  <div class="knowledge-card-grid">${cards}
  </div>
</section>`;
  }).join("\n");

  return `
<section class="knowledge-source-block" id="${escapeHtml(bundle.source.anchor)}" data-knowledge-source data-source-category="${escapeHtml(bundle.source.category)}">
  <header class="knowledge-source-header">
    <p class="eyebrow">${escapeHtml(bundle.source.category)}</p>
    <h2>${escapeHtml(bundle.source.label)}</h2>
    <p>${escapeHtml(bundle.source.description)}</p>
  </header>
  ${groups}
</section>`;
}

function renderSiblingLink(label, entry) {
  if (!entry) return `<span class="article-sibling is-empty"></span>`;
  return `
<a class="article-sibling" href="${escapeHtml(entry.publicUrl)}">
  <span>${escapeHtml(label)}</span>
  <strong>${escapeHtml(entry.title)}</strong>
</a>`;
}

function renderArticlePage(bundle, entry, previousEntry, nextEntry) {
  renderContext = {
    source: bundle.source,
    entry,
    entryMap: bundle.entryMap,
    headingCounts: new Map(),
  };

  const body = marked.parse(stripLeadingTitle(entry.markdown));
  const titleId = slugify(entry.title) || "article-title";
  const sourceUrl = `${bundle.source.repoBaseUrl}/${encodePath(entry.relativePath)}`;
  const canonicalUrl = `https://avengerdsf.github.io${entry.publicUrl}`;
  const summaryMeta = entry.summary ? `<meta name="description" content="${escapeHtml(entry.summary)}">` : "";
  const summary = entry.summary ? `<p class="knowledge-article-summary">${escapeHtml(entry.summary)}</p>` : "";

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${summaryMeta}
  <meta name="theme-color" content="#f7f8fb">
  <meta property="og:title" content="${escapeHtml(entry.title)} · Chenyinhong">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <link rel="stylesheet" href="/assets/css/site.css">
  <link rel="stylesheet" href="/assets/css/round2.css">
  <link rel="stylesheet" href="/assets/css/knowledge-markdown.css">
  <link rel="stylesheet" href="/assets/vendor/katex/katex.min.css">
  <title>${escapeHtml(entry.title)} · Knowledge Base</title>
</head>
<body class="knowledge-article-page">
  <a class="skip-link" href="#main">跳到主要内容</a>

  <header class="site-header">
    <div class="container nav-shell">
      <a class="brand" href="/" aria-label="返回主页">
        <img class="brand-avatar" src="https://avatars.githubusercontent.com/u/119413549?v=4" alt="" width="34" height="34">
        <span>Chenyinhong</span>
      </a>
      <button class="nav-control icon-button nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="site-nav" aria-label="打开导航">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      <nav class="nav-links" id="site-nav" data-nav-menu aria-label="主导航">
        <a href="/">主页</a>
        <a href="/knowledge/" aria-current="page">知识库</a>
        <a href="/knowledge/#leetcode">力扣</a>
        <a href="/knowledge/#machine-learning">机器学习</a>
        <a href="https://github.com/avengerdsf" target="_blank" rel="noreferrer noopener">GitHub</a>
        <button class="nav-control icon-button" type="button" data-theme-toggle aria-label="切换主题">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.64 5.64 7.2 7.2M16.8 16.8l1.56 1.56M18.36 5.64 16.8 7.2M7.2 16.8l-1.56 1.56" /><circle cx="12" cy="12" r="4.2" /></svg>
        </button>
      </nav>
    </div>
  </header>

  <main id="main" class="knowledge-article-main">
    <div class="container knowledge-article-container">
      <nav class="knowledge-breadcrumb" aria-label="面包屑">
        <a href="/knowledge/">知识库</a>
        <span aria-hidden="true">/</span>
        <a href="/knowledge/#${escapeHtml(bundle.source.anchor)}">${escapeHtml(bundle.source.label)}</a>
        <span aria-hidden="true">/</span>
        <span>${escapeHtml(entry.chapter)}</span>
      </nav>

      <article class="knowledge-article">
        <header class="knowledge-article-header">
          <p class="eyebrow">${escapeHtml(bundle.source.category)} · ${escapeHtml(entry.chapter)}</p>
          <h1 id="${escapeHtml(titleId)}">${escapeHtml(entry.title)}</h1>
          ${summary}
          <div class="knowledge-article-source">
            <code>${escapeHtml(entry.relativePath)}</code>
            <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer noopener">查看源 Markdown ↗</a>
          </div>
        </header>
        <div class="markdown-body">${body}</div>
      </article>

      <nav class="article-sibling-nav" aria-label="上一篇和下一篇">
        ${renderSiblingLink("上一篇", previousEntry)}
        ${renderSiblingLink("下一篇", nextEntry)}
      </nav>
    </div>
  </main>

  <footer class="site-footer">
    <div class="container footer-row">
      <span>© <span data-current-year>2026</span> Chenyinhong · Knowledge Base.</span>
      <div class="footer-links"><a href="/knowledge/">知识库</a><a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer noopener">Source ↗</a></div>
    </div>
  </footer>

  <script src="/assets/js/site.js" defer></script>
</body>
</html>
`;
}

async function writeArticlePages(bundle) {
  const destinationRoot = path.join(root, "knowledge", bundle.source.route);
  await rm(destinationRoot, { recursive: true, force: true });

  for (let index = 0; index < bundle.orderedEntries.length; index += 1) {
    const entry = bundle.orderedEntries[index];
    const previousEntry = index > 0 ? bundle.orderedEntries[index - 1] : null;
    const nextEntry = index + 1 < bundle.orderedEntries.length ? bundle.orderedEntries[index + 1] : null;
    await mkdir(path.dirname(entry.outputPath), { recursive: true });
    await writeFile(entry.outputPath, renderArticlePage(bundle, entry, previousEntry, nextEntry), "utf8");
  }
}

async function copySource(source) {
  const destination = path.join(root, "knowledge/sources", source.copyDestination);
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

  const bundles = [];
  for (const source of sources) {
    const bundle = await loadSource(source);
    bundles.push(bundle);
    await copySource(source);
    await writeArticlePages(bundle);
  }

  await copyKatexAssets();
  renderContext = null;

  const indexContent = bundles.map(renderIndexBundle).join("\n");
  await writeFile(knowledgePath, template.replace(knowledgeMarker, indexContent), "utf8");

  const counts = bundles.map((bundle) => bundle.orderedEntries.length);
  console.log(`Knowledge build complete: ${counts[0]} LeetCode subpages, ${counts[1]} machine-learning subpages.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
