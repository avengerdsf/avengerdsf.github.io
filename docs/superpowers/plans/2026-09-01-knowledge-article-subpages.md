# Knowledge Article Subpages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the knowledge index into a lightweight directory and generate one static subpage per Markdown note.

**Architecture:** Keep the existing build-time Markdown source sync. Change the generator so README metadata produces index cards and each Markdown file produces a dedicated article HTML file; rewrite relative Markdown links/assets for the article-page location and keep search metadata-only.

**Tech Stack:** Node.js 20, `marked`, `marked-katex-extension`, KaTeX, static HTML/CSS/JS, GitHub Actions Pages.

**Spec:** `docs/superpowers/specs/2026-09-01-knowledge-article-subpages-design.md`

## Global Constraints

- `avengerdsf/machine-learning-notes` is the only Machine Learning content source.
- Do not duplicate article bodies in JavaScript or the knowledge index.
- Keep build-time local KaTeX and copied local image/assets.
- Preserve legacy knowledge hashes.
- Keep source and built validation green before merge.

---

### Task 1: Lock the subpage contract in validation

**Files:**
- Modify: `scripts/validate-site.mjs`

**Interfaces:**
- Consumes: generated `knowledge/index.html` and generated article directories.
- Produces: failing checks against the current inline architecture and passing checks for the subpage architecture.

- [ ] Require generated article pages for both knowledge sources and representative pages.
- [ ] Reject `.markdown-body` and KaTeX article markup on the built index.
- [ ] Require index cards with article `href`s and metadata.
- [ ] Run the PR validation workflow and confirm RED against the inline implementation.

### Task 2: Generate article subpages and index cards

**Files:**
- Modify: `scripts/build-knowledge.mjs`
- Modify: `knowledge/index.html`

**Interfaces:**
- Produces: `/knowledge/leetcode/<slug>/index.html`, `/knowledge/machine-learning/<slug>/index.html`, and card markup in `/knowledge/index.html`.

- [ ] Give each Markdown entry a stable slug and public article URL.
- [ ] Render index cards only from README/title metadata.
- [ ] Render one full article page per Markdown file using a shared generated HTML shell.
- [ ] Rewrite Markdown-to-Markdown links to generated article URLs and relative assets to `/knowledge/sources/**`.
- [ ] Add breadcrumb/back, source link, and previous/next navigation to article pages.
- [ ] Keep KaTeX CSS local on article pages only.

### Task 3: Make search/filter operate on cards only

**Files:**
- Modify: `assets/js/knowledge.js`
- Modify: `assets/css/knowledge-markdown.css`

**Interfaces:**
- Consumes: `[data-knowledge-entry]` card metadata from the generated index.
- Produces: card filtering, chapter/source hiding, responsive index cards, readable article-page layout.

- [ ] Search only title/description/chapter/category/source path metadata.
- [ ] Keep topic filtering and legacy hash mapping.
- [ ] Replace inline-article layout rules with card-grid and article-shell rules.

### Task 4: Verify and merge

**Files:**
- Verify: `.github/workflows/validate.yml`
- Verify: `.github/workflows/deploy.yml`

- [ ] Run source validation, Markdown build, and built validation in CI.
- [ ] Confirm 20 Machine Learning + 6 LeetCode subpages are generated.
- [ ] Confirm representative KaTeX and SVG/image resources resolve.
- [ ] Review PR diff and line counts.
- [ ] Merge only after PR CI passes, then verify `main` validation and Pages deployment.
