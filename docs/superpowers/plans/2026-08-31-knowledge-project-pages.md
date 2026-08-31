# Knowledge Project Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current catch-all knowledge-note model with two real knowledge projects, each with a dedicated Markdown-rendered subpage.

**Architecture:** Keep the homepage and knowledge index as normal HTML/CSS/JavaScript, but use GitHub Pages/Jekyll only for knowledge-project Markdown pages. Remove the current `knowledge-data.js` note model entirely; the knowledge index becomes static project cards with lightweight metadata search. Jekyll builds Markdown into HTML before validation and deployment.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, GitHub Pages, Jekyll/Kramdown, GitHub Actions, Node.js 20 validation.

**Spec:** `docs/superpowers/specs/2026-08-31-knowledge-project-pages-design.md`

## Global Constraints

- `/knowledge/` contains exactly two knowledge projects in this change: `LeetCode Notes` and `Machine Learning Notes`.
- `agibot_rl_mjlab`, `ubuntu_toolbox`, `Tmux-generator`, `invoice-manager`, GDB, Bash, Git SSH, Linux, Robotics/RL, and Engineering Practice must not be presented as standalone note projects.
- No private repository name, link, or metadata may appear on the public site.
- Markdown rendering must happen during the GitHub Pages/Jekyll build; do not add a browser-side Markdown parser.
- Existing homepage project cards remain project cards.
- Preserve the current shared light/dark design system, responsive behavior, and wide-desktop layout.

---

### Task 1: Add the Jekyll Markdown rendering shell and build validation

**Files:**
- Create: `_config.yml`
- Create: `_layouts/note.html`
- Create: `assets/css/markdown.css`
- Modify: `.github/workflows/validate.yml`
- Modify: `.github/workflows/deploy.yml`
- Modify: `scripts/validate-site.mjs`

**Interfaces:**
- Consumes: existing `assets/css/site.css`, `assets/css/round2.css`, `assets/js/site.js`.
- Produces: a reusable `note` Jekyll layout and `_site/` build output containing rendered Markdown pages.

- [ ] **Step 1: Add source/build expectations to the validator before creating the pages**

Update `scripts/validate-site.mjs` so source validation requires:

```js
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
```

When `_site/` exists, validate generated HTML under `_site/` and require:

```js
const requiredBuiltFiles = [
  "index.html",
  "knowledge/index.html",
  "knowledge/leetcode/index.html",
  "knowledge/machine-learning/index.html",
  "assets/css/site.css",
  "assets/css/markdown.css",
  "assets/js/site.js",
];
```

The generated-site link checker must treat directory links as `index.html`, as the current validator already does.

- [ ] **Step 2: Run validation and verify it fails for the not-yet-created Markdown/Jekyll files**

Run:

```bash
node scripts/validate-site.mjs
```

Expected: failure listing missing `_config.yml`, `_layouts/note.html`, `assets/css/markdown.css`, and both Markdown knowledge pages.

- [ ] **Step 3: Add Jekyll configuration and the shared note layout**

Create `_config.yml`:

```yml
title: Chenyinhong Knowledge Base
url: https://avengerdsf.github.io
baseurl: ""
markdown: kramdown
kramdown:
  input: GFM
exclude:
  - docs
  - scripts
  - README.md
```

Create `_layouts/note.html` with the existing floating header, theme control, footer, and:

```html
<link rel="stylesheet" href="{{ '/assets/css/site.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/round2.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/markdown.css' | relative_url }}">
...
<article class="markdown-shell">
  <header class="markdown-header">
    <p class="eyebrow">{{ page.kicker | default: "Knowledge Project" }}</p>
    <h1>{{ page.title }}</h1>
    {% if page.description %}<p>{{ page.description }}</p>{% endif %}
  </header>
  <div class="markdown-body">
    {{ content }}
  </div>
  {% if page.source_url %}
  <footer class="markdown-source">
    <span>{{ page.source_label | default: "Source" }}</span>
    <a class="button button-ghost" href="{{ page.source_url }}" target="_blank">查看公开源仓库 ↗</a>
  </footer>
  {% endif %}
</article>
```

Load `{{ '/assets/js/site.js' | relative_url }}` with `defer` so the existing theme and navigation behavior remain shared.

- [ ] **Step 4: Add Markdown typography styles**

Create `assets/css/markdown.css` with focused rules for:

```css
.markdown-shell { width: min(calc(100% - 40px), 1120px); margin: 0 auto; padding: 132px 0 88px; }
.markdown-body { font-size: 1rem; line-height: 1.78; }
.markdown-body h2 { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--line); }
.markdown-body pre { overflow-x: auto; border: 1px solid var(--line); border-radius: 16px; background: var(--surface-solid); }
.markdown-body code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; }
.markdown-body table { width: 100%; border-collapse: collapse; display: block; overflow-x: auto; }
.markdown-body th, .markdown-body td { border: 1px solid var(--line); padding: 10px 12px; }
.markdown-body blockquote { margin-inline: 0; padding: 4px 0 4px 18px; border-left: 3px solid var(--accent); color: var(--muted); }
```

Add responsive rules below 720px reducing horizontal padding and heading sizes. Use only design tokens already defined by the shared theme so dark mode works automatically.

- [ ] **Step 5: Change PR validation to build Jekyll before link validation**

Update `.github/workflows/validate.yml` to run:

```yml
- name: Setup Pages
  uses: actions/configure-pages@v5

- name: Build with Jekyll
  uses: actions/jekyll-build-pages@v1
  with:
    source: ./
    destination: ./_site

- name: Validate site structure and links
  run: node scripts/validate-site.mjs
```

Keep Node.js 20 setup because the validator remains Node-based.

- [ ] **Step 6: Change Pages deployment to publish the Jekyll output**

Update `.github/workflows/deploy.yml` so the build job runs `actions/jekyll-build-pages@v1` and `actions/upload-pages-artifact@v4` uploads `./_site` instead of the repository root.

- [ ] **Step 7: Commit the build shell**

```bash
git add _config.yml _layouts/note.html assets/css/markdown.css .github/workflows/validate.yml .github/workflows/deploy.yml scripts/validate-site.mjs
git commit -m "feat: add jekyll markdown rendering shell"
```

---

### Task 2: Replace the catch-all knowledge model with a two-project index

**Files:**
- Modify: `knowledge/index.html`
- Create: `assets/js/knowledge-index.js`
- Delete: `assets/js/knowledge-data.js`
- Delete: `assets/js/knowledge.js`

**Interfaces:**
- Consumes: two canonical routes, `/knowledge/leetcode/` and `/knowledge/machine-learning/`.
- Produces: a knowledge index that searches only the metadata of real knowledge projects.

- [ ] **Step 1: Write the new static index markup before the filtering script**

Replace the five topic cards, inline note list, generated filters, result count, public-source cards, and old noscript article links with exactly two `.knowledge-project-card` anchors:

```html
<a class="knowledge-project-card" href="leetcode/" data-knowledge-project data-search-text="力扣 leetcode algorithms 二分 滑动窗口 dfs bfs 并查集 拓扑排序 dp">
  <span>01 / LEETCODE</span>
  <h2>力扣笔记</h2>
  <p>按算法模式整理题型、边界、状态定义与常见错误。</p>
  <div class="tag-row"><span class="tag">Algorithms</span><span class="tag">C++</span></div>
</a>

<a class="knowledge-project-card" href="machine-learning/" data-knowledge-project data-search-text="机器学习 machine learning 监督学习 深度学习 模型评估 决策树 无监督学习 pytorch">
  <span>02 / MACHINE LEARNING</span>
  <h2>Machine Learning Notes</h2>
  <p>监督学习、深度学习、模型评估、决策树与无监督学习。</p>
  <div class="tag-row"><span class="tag">Machine Learning</span><span class="tag">PyTorch</span></div>
</a>
```

Update page title/description/OG copy so it no longer names Linux, Robotics/RL, or Engineering Practice as notes.

- [ ] **Step 2: Add a minimal metadata-only search script**

Create `assets/js/knowledge-index.js`:

```js
function initKnowledgeProjectSearch() {
  const input = document.querySelector("[data-knowledge-search]");
  const cards = [...document.querySelectorAll("[data-knowledge-project]")];
  const empty = document.querySelector("[data-empty-state]");
  const count = document.querySelector("[data-result-count]");

  if (!input || !cards.length || !empty || !count) return;

  const filter = () => {
    const query = input.value.trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const matches = !query || (card.dataset.searchText || "").toLowerCase().includes(query);
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    count.textContent = `${visible} 个笔记项目`;
    empty.classList.toggle("is-visible", visible === 0);
  };

  input.addEventListener("input", filter);
  filter();
}

document.addEventListener("DOMContentLoaded", initKnowledgeProjectSearch);
```

- [ ] **Step 3: Remove the obsolete catch-all model**

Delete `assets/js/knowledge-data.js` and `assets/js/knowledge.js`. No replacement data structure should contain entries for GDB, Bash, Git SSH, Linux, Robotics/RL, or software projects.

- [ ] **Step 4: Run source validation**

Run:

```bash
node scripts/validate-site.mjs
```

Expected: it may still fail only because the two Markdown pages are not created yet; there must be no missing references to `knowledge-data.js` or `knowledge.js`.

- [ ] **Step 5: Commit the new index**

```bash
git add knowledge/index.html assets/js/knowledge-index.js assets/js/knowledge-data.js assets/js/knowledge.js
git commit -m "refactor: make knowledge base project-oriented"
```

---

### Task 3: Create the LeetCode Markdown knowledge page

**Files:**
- Create: `knowledge/leetcode/index.md`

**Interfaces:**
- Consumes: `_layouts/note.html`.
- Produces: `/knowledge/leetcode/index.html` after Jekyll build.

- [ ] **Step 1: Add Jekyll front matter and a real Markdown document**

Create `knowledge/leetcode/index.md` starting with:

```md
---
layout: note
title: 力扣笔记
kicker: LeetCode Notes
description: 按解题模式整理二分、滑动窗口、DFS/BFS、并查集、拓扑排序与动态规划。
---
```

The body must use actual Markdown features that exercise the renderer:

```md
## 二分查找

> 先定义搜索区间的语义，再决定 `while` 条件和边界收缩方式。

| 模板 | 区间 | 条件 |
| --- | --- | --- |
| 闭区间 | `[l, r]` | `l <= r` |
| 半开区间 | `[l, r)` | `l < r` |

```cpp
while (l <= r) {
    int mid = l + (r - l) / 2;
    if (check(mid)) r = mid - 1;
    else l = mid + 1;
}
```
```

Then add `## 滑动窗口`, `## DFS / BFS`, `## 并查集`, `## 拓扑排序`, and `## 动态规划` sections with concise process notes and common pitfalls.

- [ ] **Step 2: Build Jekyll and verify rendered Markdown features exist in HTML**

Run the same Jekyll build used by CI, then verify `_site/knowledge/leetcode/index.html` contains `<table>`, `<blockquote>`, and a highlighted or fenced-code `<pre>` block.

Expected: generated page exists and contains all three rendered structures.

- [ ] **Step 3: Commit the LeetCode page**

```bash
git add knowledge/leetcode/index.md
git commit -m "docs: add leetcode markdown notes"
```

---

### Task 4: Create the Machine Learning Markdown project page from the real public note project

**Files:**
- Create: `knowledge/machine-learning/index.md`

**Interfaces:**
- Consumes: the public `avengerdsf/machine-learning-notes` repository as canonical source context.
- Produces: `/knowledge/machine-learning/index.html` after Jekyll build.

- [ ] **Step 1: Add front matter with the public source link**

```md
---
layout: note
title: Machine Learning Notes
kicker: Machine Learning
source_label: Source · machine-learning-notes
source_url: https://github.com/avengerdsf/machine-learning-notes
description: 按现有公开笔记结构整理监督学习、深度学习、模型评估、决策树与无监督学习。
---
```

- [ ] **Step 2: Mirror the real repository chapter structure without inventing new note categories**

The Markdown page must contain these five top-level sections matching the public repository structure:

```md
## 01 · Supervised Learning
- Linear regression and gradient descent
- Logistic regression
- Overfitting and regularization

## 02 · Deep Learning
- Neural-network layers
- Building neural networks
- Activation functions
- Softmax multiclass classification
- Multilabel classification

## 03 · Model Evaluation
- Model evaluation
- Model selection
- Machine-learning development process

## 04 · Decision Trees
- Decision trees
- One-hot encoding
- Tree ensembles / related methods

## 05 · Unsupervised Learning
- K-means
- Anomaly detection
- Recommender systems
- PCA
```

Each section should link to the corresponding public repository directory/file for full source detail. Do not create separate knowledge-project cards for those chapters.

- [ ] **Step 3: Build and verify the source link and Markdown output**

Build Jekyll and verify `_site/knowledge/machine-learning/index.html` contains the public `machine-learning-notes` source URL and generated `<h2>` sections.

- [ ] **Step 4: Commit the Machine Learning page**

```bash
git add knowledge/machine-learning/index.md
git commit -m "docs: add machine learning markdown project page"
```

---

### Task 5: Remove fake-note previews from the homepage and point to the two real note projects

**Files:**
- Modify: `assets/js/site.js`
- Modify: `index.html` only if static homepage copy still names fake note categories.

**Interfaces:**
- Consumes: `/knowledge/leetcode/` and `/knowledge/machine-learning/`.
- Produces: a homepage knowledge preview containing only the two real note projects.

- [ ] **Step 1: Replace `createHomeNote` with linked knowledge-project previews**

Change the helper to create an anchor, not a generic article:

```js
function createHomeKnowledgeProject(title, description, tags, href) {
  const card = document.createElement("a");
  card.className = "home-direct-note";
  card.href = href;
  // append title, description and tags using the existing DOM-safe textContent approach
  return card;
}
```

- [ ] **Step 2: Remove GDB and RL from `initHomeKnowledgePreview()`**

The preview must contain only:

```js
createHomeKnowledgeProject(
  "力扣笔记",
  "二分、滑动窗口、DFS/BFS、并查集、拓扑排序与动态规划。",
  ["Algorithms", "C++"],
  "knowledge/leetcode/",
),
createHomeKnowledgeProject(
  "Machine Learning Notes",
  "监督学习、深度学习、模型评估、决策树与无监督学习。",
  ["Machine Learning", "PyTorch"],
  "knowledge/machine-learning/",
),
```

Change the section copy to describe these as `笔记项目`, not generic technical topics.

- [ ] **Step 3: Scan homepage copy for false note claims**

Search `index.html` and `assets/js/site.js` for `GDB`, `Linux`, `RL`, `Robotics`, `Engineering Practice`, and `笔记`. Keep those terms where they describe skills/projects, but remove any wording that presents them as knowledge-note projects.

- [ ] **Step 4: Commit the homepage correction**

```bash
git add assets/js/site.js index.html
git commit -m "fix: show only real note projects on homepage"
```

---

### Task 6: Remove obsolete standalone pseudo-note pages and update maintenance docs

**Files:**
- Delete: `knowledge/articles/gdb-debugging-workflow.html`
- Delete: `knowledge/articles/bash-history-reliability.html`
- Delete: `knowledge/articles/git-ssh-troubleshooting.html`
- Delete: `knowledge/articles/machine-learning-roadmap.html`
- Delete: `knowledge/articles/reinforcement-learning-workflow.html`
- Delete: `knowledge/articles/linux-engineering-toolbox.html`
- Modify: `README.md`

**Interfaces:**
- Consumes: the new two-project knowledge architecture.
- Produces: documentation that prevents future projects/topics from being mislabeled as notes.

- [ ] **Step 1: Delete the old standalone pages**

Remove the six files listed above. Before deletion, confirm no homepage or knowledge-index link still targets them.

- [ ] **Step 2: Rewrite the README knowledge-maintenance section**

Document:

```text
Knowledge project = an actual maintained note set.
Project repository != knowledge project.
Current knowledge projects:
- knowledge/leetcode/index.md
- knowledge/machine-learning/index.md
```

Add the rule: do not add a category just because a project uses that technology.

Document local preview as a Jekyll build/serve workflow rather than the old `python3 -m http.server`-only workflow. If a no-install local Jekyll environment is unavailable, document GitHub Actions as the canonical render verification and keep the simple static server only for already-built `_site/` output.

- [ ] **Step 3: Commit cleanup/docs**

```bash
git add knowledge/articles README.md
git commit -m "chore: remove pseudo-note pages and document knowledge rules"
```

---

### Task 7: Full verification, PR, and merge readiness

**Files:**
- Verify all changed files; no new production file required.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: a CI-verified PR ready to merge.

- [ ] **Step 1: Build the full site with Jekyll**

Run the same build command/action contract as CI. Expected generated routes:

```text
_site/index.html
_site/knowledge/index.html
_site/knowledge/leetcode/index.html
_site/knowledge/machine-learning/index.html
```

- [ ] **Step 2: Run the Node validator against source and `_site`**

```bash
node scripts/validate-site.mjs
```

Expected: PASS with no missing required files, duplicate IDs, or broken internal links.

- [ ] **Step 3: Search for forbidden false-note categories**

Search public site source for these combinations and confirm they do not appear as knowledge-project labels:

```text
Linux notes / Linux 笔记
Reinforcement Learning Notes / 强化学习笔记
Engineering Practice note
GDB note project
```

Project/skill mentions are allowed outside the knowledge-project model.

- [ ] **Step 4: Compare branch against `main` and record diff statistics**

Record changed files, additions, deletions, and net line change for delivery.

- [ ] **Step 5: Open a PR and require both build and static validation to pass**

PR summary must state:

```text
- knowledge index reduced to two real note projects
- each note project has a dedicated Markdown/Jekyll subpage
- projects and technical topics are no longer mislabeled as notes
- Pages deployment now builds Jekyll before publishing
```

- [ ] **Step 6: Do not claim completion until PR CI is green**

Verify the PR workflow conclusion is `success`. Only then report the branch as merge-ready.
