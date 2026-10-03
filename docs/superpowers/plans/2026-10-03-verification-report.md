# Knowledge Redesign Verification

Date: 2026-10-03. Base: 8425112. Branch: codex/knowledge-redesign.

## Result

- Final npm test: 57 passing, 0 failures.
- Existing algorithm-demo test and build: passed.
- Source validation and actual built-site validation: passed.
- Complete pinned Quartz build: 47 Markdown inputs, 177 emitted files; generated site staged in .build/preview.
- Final Chrome browser suite: 48 knowledge-page cases and 6 homepage cases at 320, 390, 768, 1024, 1440 and 2048px; all pass with no horizontal overflow or JavaScript page errors.
- Search, parent navigation, source authoring paths, cross-page theme persistence, drawer closure, focus restoration, resize, fixed toolbar and preserved algorithm demo: passed.
- Independent fresh-context checks: initial deep article scroll remains zero at 1024/1440/2048px, direct heading anchors clear the toolbar, and expanded directory trees scroll independently.
- Both Control+K and Meta+K from an open mobile drawer focus a usable search input after clearing the drawer and scroll lock.
- Mobile drawer heading-to-tree gap: 8px at 390x844 after removing the old spacer. This is covered by a <=24px browser assertion.
- Independent source comparison: all 53 machine-learning source files keep their original paths and bytes in the content copy. Existing local Markdown has no source diff.
- Source checkout fetch: actual GitHub main commit 115aaa8; clean rebuild removal is also tested with a real local Git upstream fixture.
- Fixed Quartz CLI isolated first installation of note-title: prebuilt dist used and installation succeeds. Real Markdown parser verifies inferred titles while retaining original source text.

## Reviewable outputs

The preview runs at http://127.0.0.1:4173/ while the local preview server is active. Screenshots and the browser report are in git-ignored ui-checkpoints/. Rebuild with npm run build:knowledge and preview with python scripts/serve-site.py.

Independent design/code audit: 2026-10-03-audit-report.md. Implementation reports: 2026-10-03-ui-report.md and 2026-10-03-sync-report.md.

## Publication boundary

These checks verify the local implementation. A draft pull request preserves review before merging to main and publishing through GitHub Pages. Hourly and manual source synchronization are encoded in the deployment workflow.
