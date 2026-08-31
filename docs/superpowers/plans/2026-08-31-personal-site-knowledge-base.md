# Personal Site and Knowledge Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder GitHub Pages site with a responsive personal portfolio and searchable personal knowledge base while keeping deployment dependency-free.

**Architecture:** Use semantic static HTML, one shared CSS design system, small vanilla JavaScript modules for theme/navigation and knowledge filtering, and a dependency-free Node validator. Preserve the existing Pages deployment workflow and add a separate validation workflow for pull requests and pushes.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript (ES modules), Node.js built-ins, GitHub Pages, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-31-personal-site-knowledge-base-design.md`

## Global Constraints

- No package manager, framework, bundler, or runtime dependency.
- Do not expose private repository names or metadata.
- Keep files focused by responsibility instead of putting all CSS/JS in `index.html`.
- Use relative links that work on GitHub Pages.
- Support mobile layouts, dark mode, keyboard focus, and reduced motion.
- Keep `.github/workflows/deploy.yml` as the deployment workflow.

---

### Task 1: Shared Site Foundation

**Files:**
- Create: `assets/css/site.css`
- Create: `assets/js/site.js`

**Interfaces:**
- Produces CSS utility/component classes shared by every page.
- Produces theme persistence, mobile navigation, current year, and reveal behavior initialized from `data-*` hooks.

- [ ] **Step 1:** Add shared design tokens, typography, layout primitives, buttons, cards, navigation, article styles, responsive rules, dark mode, focus states, and reduced-motion overrides in `assets/css/site.css`.
- [ ] **Step 2:** Add `assets/js/site.js` with `initTheme()`, `initNavigation()`, `initReveal()`, and `initYear()` bootstrapped on `DOMContentLoaded`.
- [ ] **Step 3:** Confirm every interactive hook degrades safely when its corresponding element is absent.

### Task 2: Personal Homepage

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `assets/css/site.css`, `assets/js/site.js`.
- Produces: root portfolio route and links into `/knowledge/` and public GitHub repositories.

- [ ] **Step 1:** Replace the placeholder document with full metadata, sticky navigation, hero, technical-focus cards, featured-project cards, knowledge preview, and footer.
- [ ] **Step 2:** Use only public repositories for project cards: `machine-learning-notes`, `agibot_rl_mjlab`, `invoice-manager`, `ubuntu_toolbox`, and `Tmux-generator` where appropriate.
- [ ] **Step 3:** Add clear mobile navigation and theme controls using shared `data-*` hooks.

### Task 3: Knowledge Base Index and Data Model

**Files:**
- Create: `knowledge/index.html`
- Create: `assets/js/knowledge-data.js`
- Create: `assets/js/knowledge.js`

**Interfaces:**
- `knowledge-data.js` exports `knowledgeEntries: KnowledgeEntry[]` with `title`, `description`, `category`, `tags`, `href`, `source`, and `kind`.
- `knowledge.js` consumes `knowledgeEntries` and renders/filter entries into `[data-knowledge-grid]`.

- [ ] **Step 1:** Add normalized entries spanning Machine Learning, Robotics & Reinforcement Learning, Linux & Tooling, and Engineering Practice.
- [ ] **Step 2:** Build the knowledge index shell with search, category filters, result count, empty state, and fallback source links.
- [ ] **Step 3:** Implement case-insensitive search across title, description, category, and tags plus category filtering and reset behavior.
- [ ] **Step 4:** Ensure generated links distinguish local articles from external repositories and external links use safe attributes.

### Task 4: Curated Local Articles

**Files:**
- Create: `knowledge/articles/machine-learning-roadmap.html`
- Create: `knowledge/articles/reinforcement-learning-workflow.html`
- Create: `knowledge/articles/linux-engineering-toolbox.html`

**Interfaces:**
- Consumes shared CSS/JS.
- Produces stable local article URLs referenced by `knowledge-data.js`.

- [ ] **Step 1:** Create a machine-learning roadmap article that summarizes the organization of the public `machine-learning-notes` repository and points readers to the source repository.
- [ ] **Step 2:** Create a reinforcement-learning workflow article explaining the train/play/config structure represented by `agibot_rl_mjlab` without claiming private project details.
- [ ] **Step 3:** Create a Linux engineering toolbox article organizing reusable command-line/tooling habits and linking to the public toolbox repositories.
- [ ] **Step 4:** Include article breadcrumbs, metadata, section navigation, source links, and back-to-knowledge navigation.

### Task 5: Static Validation and CI

**Files:**
- Create: `scripts/validate-site.mjs`
- Create: `.github/workflows/validate.yml`

**Interfaces:**
- `node scripts/validate-site.mjs` exits `0` on a valid site and non-zero with actionable messages on validation errors.

- [ ] **Step 1:** Traverse repository HTML files using Node built-ins.
- [ ] **Step 2:** Verify required files, `<title>` presence, duplicate IDs, and local `href` targets.
- [ ] **Step 3:** Add GitHub Actions workflow running the validator on `pull_request` and `push`.

### Task 6: Maintenance Documentation

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces contributor-facing instructions for previewing, validating, and adding knowledge entries/articles.

- [ ] **Step 1:** Document site structure and local preview with `python3 -m http.server 8000`.
- [ ] **Step 2:** Document `node scripts/validate-site.mjs`.
- [ ] **Step 3:** Document the exact process for adding a repository entry or local article without introducing a framework.

### Task 7: Verification and Delivery

**Files:**
- Verify all changed files.

- [ ] **Step 1:** Run/confirm the static validator against the completed branch.
- [ ] **Step 2:** Compare the feature branch against `main` and review per-file additions/deletions.
- [ ] **Step 3:** Open a pull request summarizing product changes, validation, and maintenance model.
- [ ] **Step 4:** Report total additions, deletions, and net line change to the user.
