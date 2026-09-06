# Quartz Knowledge Base Design

## Goal

Replace the hand-built `/knowledge/` renderer with a modular Quartz 5 digital-garden build while keeping the existing personal homepage unchanged.

## Scope

- Keep `/` and the existing homepage assets/layout intact.
- Make `knowledge/` the Markdown knowledge tree in the repository.
- Build `/knowledge/` with Quartz 5 pinned to commit `f1fba3fc55cbf60a60a5d09c95a49c042cdab63a`.
- Preserve the current LeetCode hierarchy, especially `leetcode/hash-table/two-sum`.
- Continue importing `avengerdsf/machine-learning-notes` during CI.
- Remove the old custom knowledge index renderer, knowledge-specific CSS/JS, and `build-knowledge.mjs` after Quartz replaces them.

## Information architecture

Repository source:

```text
knowledge/
├─ index.md
├─ leetcode/
│  ├─ index.md
│  ├─ hash-table/
│  │  ├─ index.md
│  │  └─ two-sum.md
│  ├─ binary-search.md
│  ├─ sliding-window.md
│  ├─ dfs-bfs.md
│  ├─ union-find.md
│  ├─ topological-sort.md
│  └─ dynamic-programming.md
└─ machine-learning/  # populated from the external repo during CI
```

`knowledge/` is the source of truth for site structure. Folder hierarchy, not a custom README parser, determines navigation.

## Quartz layout

Use the Quartz 5 Obsidian-style plugin set with restrained defaults:

- Left rail: page title, search, dark-mode toggle, Explorer.
- Center: article content.
- Right rail: graph, table of contents, backlinks.
- Folder pages: no right rail so directory browsing stays clean.
- Disable low-value article metadata such as generated dates/source paths.
- Use `zh-CN` locale.
- Configure `baseUrl` as `avengerdsf.github.io/knowledge`.
- Do not impose an artificial 1400–1500 px ceiling on wide displays; wide screens should use the three-column workspace.

## Algorithm animation architecture

Interactive algorithm demos are a local Quartz component plugin under:

```text
knowledge-quartz/plugins/algorithm-demo/
```

The Markdown page contains only a semantic custom element:

```html
<two-sum-demo values="2,7,11,15" target="9"></two-sum-demo>
```

The plugin owns CSS and browser behavior. The Two Sum demo uses a moving `i` pointer, complement calculation, a visual probe toward the hash table, insert/match states, and compact play/step/reset controls. Future algorithms can reuse the same plugin rather than adding page-specific scripts.

## Two Sum page

The content hierarchy is deliberately minimal:

1. Page title from Quartz.
2. One core-idea callout: “哈希表记录元素下标，查找当前元素的补数 `target - nums[i]`。”
3. Pointer-driven animation.
4. Collapsible code section.

Do not show Markdown file paths, source labels, “查看源 Markdown”, duplicated category labels, or decorative microcopy.

## Build and deployment

GitHub Actions will:

1. Checkout this repository and `avengerdsf/machine-learning-notes`.
2. Validate the static homepage and Quartz source structure.
3. Clone Quartz 5 at the pinned commit into `.build/quartz`.
4. Copy `knowledge/` into `.build/quartz/content`.
5. Import machine-learning notes under `.build/quartz/content/machine-learning`.
6. Overlay `knowledge-quartz/quartz.config.yaml`, `knowledge-quartz/custom.scss`, and the local algorithm-demo plugin.
7. Run the algorithm-demo plugin tests and build.
8. Install Quartz plugins from config and build Quartz.
9. Stage the original homepage at `_site/` and Quartz output at `_site/knowledge/`.
10. Deploy the combined `_site` directory to GitHub Pages.

## Validation

The change is acceptable when:

- Existing homepage source remains unchanged.
- Quartz builds successfully on GitHub Actions with Node 24.
- `/knowledge/` is Quartz-generated and includes Explorer/search/right-side context.
- `/knowledge/leetcode/hash-table/two-sum` renders the core idea, custom demo element output, and code disclosure.
- Algorithm-demo unit tests verify the Two Sum state sequence.
- Old knowledge renderer files are no longer referenced or deployed.
