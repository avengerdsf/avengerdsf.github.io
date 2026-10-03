# Knowledge Redesign Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development with independent file ownership. Track each task below.

**Goal:** Deliver a unified responsive personal homepage and hierarchical knowledge reader with reliable GitHub note synchronization.
**Architecture:** Keep the native homepage and the existing pinned Quartz 5 build. Share homepage design tokens with Quartz. Move duplicated source synchronization into a tested Node script and a single source configuration.
**Tech Stack:** HTML, CSS, browser JavaScript, Quartz 5, Node.js 24, GitHub Actions, Playwright.
**Spec:** ../specs/2026-10-03-knowledge-redesign.md

## Global Constraints

- Preserve all authored Markdown, code, formula and algorithm demo content.
- Sync only avengerdsf/machine-learning-notes and keep the local knowledge/leetcode notes, as confirmed by the user.
- Homepage is an overview; knowledge root, directories and articles each show their own level. No descendant flattening or home sections inside the reader.
- Use a shared light/dark theme, floating tools, accessible labels and 320px through 2048px responsive layouts.
- Keep the current pinned Quartz commit and do not migrate frameworks.
- Independent workers own disjoint files. No commits, pushes or deployment until integration is verified.

## Review Focus

- Floating tools must remain usable while scrolling, and headings must clear them.
- Resizing between desktop and mobile must not leave an obstructing navigation panel.
- Original Chinese/spaced filenames and relative image links must survive synchronization.
- Deleted source notes disappear on the next clean build; README and index cannot overwrite one another.
- Windows CRLF checkout must validate like the Linux CI checkout.

### Task 1: Homepage and reader UI

**Owner:** ui_implementation.
**Files:** index.html, assets/css/site.css, assets/js/site.js, knowledge-quartz/custom.scss, knowledge-quartz/quartz.config.yaml, knowledge-quartz/plugins/site-ui/src/components.mjs, src/navigation.mjs, src/theme.mjs, matching navigation tests. Keep old CSS files but stop loading obsolete layers for this homepage.
**Interfaces:** Keep sourceFor/newNoteUrl signatures, kb-* selectors, existing Quartz explorer/search/darkmode and algorithm demo hooks. Share :root and html[data-theme="dark"] token blocks.

- [x] Simplify the homepage to identity, project list and real knowledge directory links; remove repeated metadata/microcopy.
- [x] Implement one coherent floating toolbar, desktop directory collapse and a closeable mobile directory. Keep source editing/new note actions accessible without making home content part of articles.
- [x] Limit reading width and prevent horizontal overflow while preserving TOC and existing interactions.
- [x] Extend focused navigation tests for any new state behavior; verify existing UI helper tests.
- [x] Supply an implementation report for visual audit.

### Task 2: Configured source synchronization

**Owner:** sync_engine.
**Files:** knowledge-sources.json, scripts/sync-knowledge.mjs, scripts/test/sync-knowledge.test.mjs, scripts/prepare-knowledge.mjs, .github/workflows/deploy.yml, .github/workflows/validate.yml, site-ui/src/data.mjs and its source mapping tests, README.md.
**Interfaces:** Existing sourceFor(file) and newNoteUrl(file, allFiles) stay compatible. Generate source metadata in the copied site-ui plugin from the configured source and actual README/index decision. UI components remain independent.

- [x] Write failing fixture tests for nested/Chinese/spaced paths, assets, deleted notes, README/index coexistence and source edit URLs.
- [x] Implement the minimum configured synchronization script with clean output rebuild and guarded output paths; preserve all source-relative file paths.
- [x] Use one script in both workflows. Retain hourly and manual deployment and local knowledge push triggers.
- [x] Preserve an authored index.md; when no index exists, generate its directory metadata without removing the original README.md.
- [x] Document the source configuration and run commands; verify synchronization and metadata helper tests.

### Task 3: Integration, portability and independent audit

**Owner:** root; design_audit reviews read-only.
**Files:** scripts/validate-site.mjs, scripts/test/validate-site.test.mjs, scripts/test-knowledge-browser.py, package.json, .gitignore, local ignored build/preview outputs.

- [x] Reproduce baseline source-validation failure from CRLF and add regression coverage before fixing it.
- [x] Update obsolete static assertions to verify current source architecture without exact CSS formatting or duplicated shell synchronization assumptions.
- [x] Build the actual pinned Quartz site and existing algorithm plugin using the same commands as CI.
- [x] Run browser checks at 320, 390, 768, 1024, 1440 and 2048px, including homepage, directory levels, article, search, themes, scroll, directory collapse and resize.
- [x] Have design_audit inspect screenshots and final implementation, fix actionable findings and repeat only affected checks.
- [x] Deliver the local reviewable result and clearly state publication status.
