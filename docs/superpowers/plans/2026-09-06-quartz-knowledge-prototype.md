# Quartz Knowledge Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the custom knowledge renderer with a Quartz 5 digital garden under `/knowledge/`, preserving the homepage and adding a reusable pointer-driven Two Sum animation.

**Architecture:** The repository keeps the personal homepage as static HTML. `knowledge/` becomes the Markdown source tree. GitHub Actions clones pinned Quartz 5 into `.build/quartz`, copies the content/config/local plugin into that workspace, builds Quartz, and stages its output under `_site/knowledge/` beside the existing homepage.

**Tech Stack:** Quartz 5, Node 24, TypeScript, Preact component plugin, GitHub Actions, Markdown/Obsidian-flavored Markdown.

**Spec:** `docs/superpowers/specs/2026-09-06-quartz-knowledge-design.md`

## Global Constraints

- Keep the root `index.html` unchanged.
- Pin Quartz to `f1fba3fc55cbf60a60a5d09c95a49c042cdab63a`.
- `knowledge/` is the navigation source of truth; no README parsing/build-time card generation.
- Keep the Two Sum core sentence exactly: `哈希表记录元素下标，查找当前元素的补数 target - nums[i]。`
- Do not surface Markdown source paths or source-only metadata in the UI.
- Wide-screen layout must use Quartz Explorer/content/right-context columns rather than a manually constrained central canvas.

---

### Task 1: Convert the LeetCode source into a real knowledge tree

**Files:**
- Replace: `knowledge/index.html` -> `knowledge/index.md`
- Create: `knowledge/leetcode/index.md`
- Move: `knowledge-source/leetcode/binary-search.md` -> `knowledge/leetcode/binary-search.md`
- Move: `knowledge-source/leetcode/sliding-window.md` -> `knowledge/leetcode/sliding-window.md`
- Move: `knowledge-source/leetcode/dfs-bfs.md` -> `knowledge/leetcode/dfs-bfs.md`
- Move: `knowledge-source/leetcode/union-find.md` -> `knowledge/leetcode/union-find.md`
- Move: `knowledge-source/leetcode/topological-sort.md` -> `knowledge/leetcode/topological-sort.md`
- Move: `knowledge-source/leetcode/dynamic-programming.md` -> `knowledge/leetcode/dynamic-programming.md`
- Move: `knowledge-source/leetcode/hash-table.md` -> `knowledge/leetcode/hash-table/index.md`
- Move: `knowledge-source/leetcode/hash-table/two-sum.md` -> `knowledge/leetcode/hash-table/two-sum.md`

**Interfaces:**
- Consumes: existing Markdown note content.
- Produces: a filesystem hierarchy directly consumable by Quartz Explorer.

- [ ] **Step 1: Add source validation assertions for the new tree**

Update `scripts/validate-site.mjs` so source validation requires `knowledge/index.md`, `knowledge/leetcode/index.md`, `knowledge/leetcode/hash-table/index.md`, and `knowledge/leetcode/hash-table/two-sum.md`, and rejects `knowledge/index.html`.

- [ ] **Step 2: Run source validation and confirm it fails before moving files**

Run: `node scripts/validate-site.mjs --source`
Expected: FAIL because the Markdown knowledge tree does not exist yet.

- [ ] **Step 3: Create/move the Markdown files**

Use frontmatter titles and minimal landing text. `two-sum.md` must contain the core-idea callout, `<two-sum-demo values="2,7,11,15" target="9"></two-sum-demo>`, and a collapsed code disclosure.

- [ ] **Step 4: Run source validation again**

Run: `node scripts/validate-site.mjs --source`
Expected: PASS for the knowledge-tree checks.

- [ ] **Step 5: Commit**

Commit message: `refactor: make knowledge files the navigation tree`

---

### Task 2: Build the reusable Quartz algorithm-demo plugin

**Files:**
- Create: `knowledge-quartz/plugins/algorithm-demo/package.json`
- Create: `knowledge-quartz/plugins/algorithm-demo/tsconfig.json`
- Create: `knowledge-quartz/plugins/algorithm-demo/tsconfig.build.json`
- Create: `knowledge-quartz/plugins/algorithm-demo/tsup.config.ts`
- Create: `knowledge-quartz/plugins/algorithm-demo/src/index.ts`
- Create: `knowledge-quartz/plugins/algorithm-demo/src/components/index.ts`
- Create: `knowledge-quartz/plugins/algorithm-demo/src/components/AlgorithmDemoAssets.tsx`
- Create: `knowledge-quartz/plugins/algorithm-demo/src/steps.ts`
- Create: `knowledge-quartz/plugins/algorithm-demo/src/browser.ts`
- Create: `knowledge-quartz/plugins/algorithm-demo/src/styles.ts`
- Create: `knowledge-quartz/plugins/algorithm-demo/test/steps.test.ts`

**Interfaces:**
- Consumes: custom element `<two-sum-demo values="..." target="..."></two-sum-demo>` in Markdown HTML.
- Produces: `AlgorithmDemoAssets` Quartz component with global CSS and SPA-safe browser initialization.
- Produces: `buildTwoSumSteps(nums: number[], target: number)` for deterministic demo states.

- [ ] **Step 1: Write the failing state-sequence test**

Test the input `[2, 7, 11, 15]`, target `9`. Assert the step types are `probe`, `store`, `probe`, `found`, and the final match is indices `0` and `1`.

- [ ] **Step 2: Run the plugin test and verify failure**

Run from plugin directory: `npm install --no-audit --no-fund && npm test`
Expected: FAIL because `buildTwoSumSteps` is not implemented.

- [ ] **Step 3: Implement `buildTwoSumSteps`**

Use a `Map<number, number>` storing value -> index. Probe before storing the current value. Stop on the first match.

- [ ] **Step 4: Implement the browser custom-element upgrader**

On Quartz `nav` and `render` events, initialize unmounted `<two-sum-demo>` elements. Render compact play/step/reset controls, array cells, the moving `i` pointer, complement calculation, probe arrow, and hash rows. Track listeners with Quartz cleanup hooks where available.

- [ ] **Step 5: Implement component CSS**

The pointer moves with a transform transition based on measured cell coordinates. Wide screens use array/probe/hash columns; narrow screens stack them. No page-specific fixed widths.

- [ ] **Step 6: Run test and build**

Run: `npm test && npm run build`
Expected: PASS and `dist/index.js` exists.

- [ ] **Step 7: Commit**

Commit message: `feat: add reusable Quartz algorithm demo plugin`

---

### Task 3: Configure Quartz and build it beside the existing homepage

**Files:**
- Create: `knowledge-quartz/quartz.config.yaml`
- Create: `knowledge-quartz/custom.scss`
- Modify: `.github/workflows/validate.yml`
- Modify: `.github/workflows/deploy.yml`
- Modify: `scripts/validate-site.mjs`

**Interfaces:**
- Consumes: `knowledge/`, external machine-learning notes checkout, algorithm-demo local plugin.
- Produces: `.build/quartz/public` and staged `_site/knowledge/`.

- [ ] **Step 1: Add validation for Quartz config/workflow requirements**

Require Node 24, pinned Quartz commit, `baseUrl: avengerdsf.github.io/knowledge`, local algorithm-demo plugin reference, and staging from `.build/quartz/public` to `_site/knowledge`.

- [ ] **Step 2: Run source validation and verify it fails before config/workflow changes**

Run: `node scripts/validate-site.mjs --source`
Expected: FAIL on Quartz integration checks.

- [ ] **Step 3: Add `quartz.config.yaml`**

Start from Quartz 5 Obsidian defaults, set `zh-CN`, no analytics, Explorer/search/dark mode left, graph/TOC/backlinks right, no content-meta/date microcopy, and enable the local algorithm-demo component in `afterBody`.

- [ ] **Step 4: Add `custom.scss`**

Keep styling minimal: comfortable wide-screen three-column spacing, compact article body, compact folder pages, and clean `<details>` code disclosure. Do not rebuild Quartz controls in custom CSS.

- [ ] **Step 5: Update validation workflow**

Checkout both repositories, use Node 24, validate source, clone pinned Quartz, copy content/config/custom plugin, import ML notes, run plugin tests/build, run Quartz plugin install and Quartz build, then assert the Two Sum HTML exists.

- [ ] **Step 6: Update deploy workflow**

Use the same build steps, then stage `index.html` + `assets/` at root and Quartz `public/` under `_site/knowledge/`.

- [ ] **Step 7: Run source validation**

Run: `node scripts/validate-site.mjs --source`
Expected: PASS.

- [ ] **Step 8: Commit**

Commit message: `build: deploy Quartz knowledge base under knowledge`

---

### Task 4: Remove the legacy knowledge renderer after Quartz passes CI

**Files:**
- Delete: `scripts/build-knowledge.mjs`
- Delete: `assets/css/knowledge-directory.css`
- Delete: `assets/css/knowledge-markdown.css`
- Delete: `assets/css/algorithm-demo.css`
- Delete: `assets/js/knowledge.js`
- Delete: `assets/js/algorithm-demo.js`
- Delete: `knowledge-source/leetcode/**`
- Modify: `package.json`
- Delete or regenerate: `package-lock.json` if no root dependencies remain
- Modify: `scripts/validate-site.mjs`

**Interfaces:**
- Consumes: successful Quartz CI build from Task 3.
- Produces: no obsolete knowledge renderer in production or source validation.

- [ ] **Step 1: Add validation that rejects legacy knowledge renderer files**

Source validation must fail if `scripts/build-knowledge.mjs`, the knowledge-specific CSS/JS files, or `knowledge-source/leetcode` remain.

- [ ] **Step 2: Confirm validation fails before deletion**

Run: `node scripts/validate-site.mjs --source`
Expected: FAIL listing the legacy files.

- [ ] **Step 3: Remove legacy files and unused root dependencies**

Keep only homepage dependencies/scripts actually used by the repository.

- [ ] **Step 4: Run source validation**

Run: `node scripts/validate-site.mjs --source`
Expected: PASS.

- [ ] **Step 5: Verify GitHub Actions**

Required successful checks: source validation, algorithm-demo unit test/build, Quartz plugin installation, Quartz build, generated Two Sum page assertion, Pages build/deploy.

- [ ] **Step 6: Commit**

Commit message: `chore: remove legacy knowledge renderer`
