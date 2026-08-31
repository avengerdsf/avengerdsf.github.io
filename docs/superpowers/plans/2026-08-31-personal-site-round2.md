# Personal Site Round 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the portfolio hierarchy and turn the knowledge base into a broader reusable technical reference while staying dependency-free.

**Architecture:** Continue using semantic static HTML, shared CSS, vanilla JavaScript modules, and data-driven knowledge cards. Add new content as focused HTML articles and validate local article references in CI.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript ES modules, Node.js validation, GitHub Pages / Actions.

**Spec:** `docs/superpowers/specs/2026-08-31-personal-site-round2-design.md`

## Global Constraints

- No npm/runtime site dependencies.
- No private repository names or private infrastructure details in public pages.
- Preserve dark mode, responsive layouts, reduced-motion support, and keyboard accessibility.
- Keep knowledge entries data-driven through `assets/js/knowledge-data.js`.

---

### Task 1: Homepage hierarchy

**Files:**
- Modify: `index.html`
- Modify: `assets/css/site.css`

- [ ] Add a `Now` section with current themes and compact status metadata.
- [ ] Add a capability map connecting robotics, RL/simulation, systems debugging, and engineering tooling.
- [ ] Upgrade public project cards with stronger problem/role/maturity signals.
- [ ] Verify all new anchors and responsive states are represented in shared CSS.

### Task 2: Knowledge structure

**Files:**
- Modify: `knowledge/index.html`
- Modify: `assets/js/knowledge-data.js`
- Modify: `assets/js/knowledge.js`
- Modify: `assets/css/site.css`

- [ ] Add four topic overview cards above search.
- [ ] Make topic cards apply the existing category filter.
- [ ] Add reading-type / intent metadata to rendered cards.
- [ ] Preserve search, reset, empty-state, and no-JS fallback behavior.

### Task 3: Reusable technical articles

**Files:**
- Create: `knowledge/articles/gdb-debugging-workflow.html`
- Create: `knowledge/articles/bash-history-reliability.html`
- Create: `knowledge/articles/git-ssh-troubleshooting.html`
- Create: `knowledge/articles/sim-transfer-workflow.html`
- Modify: `assets/js/knowledge-data.js`

- [ ] Add a practical GDB workflow article.
- [ ] Add a Bash history reliability article.
- [ ] Add a Git SSH troubleshooting article.
- [ ] Add a Sim-to-Sim / Sim-to-Real workflow article.
- [ ] Register all articles in the knowledge dataset with public-safe wording.

### Task 4: Validation and maintenance docs

**Files:**
- Modify: `scripts/validate-site.mjs`
- Modify: `README.md`

- [ ] Parse local article hrefs from `assets/js/knowledge-data.js` and verify the files exist.
- [ ] Update README authoring instructions for local articles and knowledge metadata.
- [ ] Run `node scripts/validate-site.mjs` in GitHub Actions and require success before PR completion.
