# Markdown Knowledge Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the knowledge page render the real Markdown content from `avengerdsf/machine-learning-notes` at build time, while keeping LeetCode notes as Markdown files inside this site repository.

**Architecture:** GitHub Actions checks out both repositories. `scripts/build-knowledge.mjs` parses Markdown, rewrites relative links/assets, injects rendered articles into `knowledge/index.html`, copies note assets into the deploy tree, and removes the need for `knowledge-data.js`. `assets/js/knowledge.js` only filters/searches already-rendered DOM content. Pages remains a static deployment and does not fetch GitHub Raw at runtime.

**Tech Stack:** GitHub Actions, Node.js 20, `marked`, static HTML/CSS/JS.

**Spec:** User-approved build-time Markdown sync design from the 2026-09-01 conversation.

## Global Constraints

- `machine-learning-notes` is the single source of truth for machine-learning note body content.
- Do not maintain a second hand-written machine-learning summary in `knowledge-data.js`.
- Knowledge content remains directly readable on `/knowledge/`; no mandatory second-level navigation.
- Preserve relative images and internal Markdown links when rendering.
- Keep the deployed site static; no runtime GitHub Raw dependency.
- LeetCode content lives under `knowledge-source/leetcode/*.md` and is rendered by the same build pipeline.
- Every change must pass the repository validation workflow before merge.

---

### Task 1: Lock the build-time source-of-truth behavior

**Files:**
- Modify: `scripts/validate-site.mjs`

**Interfaces:**
- Consumes: repository source tree.
- Produces: failing validation until the Markdown build architecture exists.

- [ ] Add validation that requires `scripts/build-knowledge.mjs`, `package.json`, the LeetCode Markdown source directory, and the knowledge template marker.
- [ ] Add validation that rejects `assets/js/knowledge-data.js` as a content source.
- [ ] Add validation that deploy/validate workflows checkout `avengerdsf/machine-learning-notes` and run the build script.
- [ ] Run CI and confirm the new assertions fail against the old architecture.

### Task 2: Add Markdown source and build pipeline

**Files:**
- Create: `package.json`
- Create: `scripts/build-knowledge.mjs`
- Create: `knowledge-source/leetcode/README.md`
- Create: `knowledge-source/leetcode/binary-search.md`
- Create: `knowledge-source/leetcode/sliding-window.md`
- Create: `knowledge-source/leetcode/dfs-bfs.md`
- Create: `knowledge-source/leetcode/union-find.md`
- Create: `knowledge-source/leetcode/topological-sort.md`
- Create: `knowledge-source/leetcode/dynamic-programming.md`

**Interfaces:**
- Consumes: local LeetCode Markdown and a checked-out `machine-learning-notes` directory supplied via `--ml-source`.
- Produces: rendered knowledge articles injected into `knowledge/index.html` and copied source assets under `knowledge/sources/` in the runner workspace.

- [ ] Parse source README ordering and linked Markdown files.
- [ ] Render each Markdown file with `marked`.
- [ ] Rewrite relative image URLs to copied static assets.
- [ ] Rewrite relative `.md` links to inline note anchors.
- [ ] Copy source repository files needed by rendered content.
- [ ] Inject generated HTML into the knowledge template marker.

### Task 3: Convert the knowledge page to rendered-DOM search

**Files:**
- Modify: `knowledge/index.html`
- Modify: `assets/js/knowledge.js`
- Modify: `assets/css/round2.css`
- Delete: `assets/js/knowledge-data.js`
- Delete: `knowledge/articles/machine-learning-roadmap.html`

**Interfaces:**
- Consumes: build-generated `<article data-knowledge-entry>` elements.
- Produces: category filtering, full-text search, result counts, hash navigation, and readable Markdown styling without a duplicated data model.

- [ ] Replace the empty JS-rendered container with a build marker.
- [ ] Make `knowledge.js` filter existing DOM articles and chapter groups.
- [ ] Add Markdown typography, tables, images, blockquotes, code blocks, and heading spacing.
- [ ] Keep source links to the original GitHub Markdown files.

### Task 4: Build and deploy from both repositories

**Files:**
- Modify: `.github/workflows/validate.yml`
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: site checkout plus `avengerdsf/machine-learning-notes` checkout at `.build/machine-learning-notes`.
- Produces: validated static Pages artifact containing current machine-learning Markdown.

- [ ] Install Node dependencies.
- [ ] Checkout the notes repository into `.build/machine-learning-notes`.
- [ ] Run `node scripts/build-knowledge.mjs --ml-source .build/machine-learning-notes`.
- [ ] Run full site validation after generation.
- [ ] Remove temporary build/node_modules directories before Pages upload.
- [ ] Add a scheduled Pages rebuild so upstream notes eventually propagate without a homepage commit.

### Task 5: Verify and merge

**Files:**
- No new production files.

**Interfaces:**
- Consumes: completed branch and GitHub Actions runs.
- Produces: merged `main` with verified Pages deployment.

- [ ] Confirm PR validation succeeds.
- [ ] Inspect PR diff for generated-content duplication or stale manual summaries.
- [ ] Merge/fast-forward to `main`.
- [ ] Confirm `main` validation and Pages deploy both succeed.
- [ ] Report exact additions, deletions, and net line change.
