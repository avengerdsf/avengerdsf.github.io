# Knowledge Article Subpages Design

## Goal

Replace the current knowledge page that expands every Markdown document inline with a directory-first architecture: `/knowledge/` is an index, while each Markdown document is rendered to its own static article page.

## Information architecture

- `/knowledge/`: topic cards, search/filter controls, chapter groups, article cards only.
- `/knowledge/leetcode/<slug>/`: one generated LeetCode article per source Markdown file.
- `/knowledge/machine-learning/<slug>/`: one generated Machine Learning article per source Markdown file.
- `knowledge/sources/**`: copied source Markdown/assets used by generated pages.

## Build behavior

`machine-learning-notes` remains the only Machine Learning content source. `knowledge-source/leetcode/*.md` remains the LeetCode source. The build reads README ordering/descriptions, generates article metadata/cards, then renders each Markdown file into a dedicated HTML page.

Markdown links between notes are rewritten to generated article-page URLs. Relative images/assets are rewritten to copied static assets. KaTeX remains build-time and local. Article pages include breadcrumb/back navigation, source path, source Markdown link, and previous/next article links within the same source ordering.

## Index behavior

The knowledge index must not contain `.markdown-body`, KaTeX-rendered article content, or full Markdown text. Search uses only generated metadata: title, README description, chapter, category, and source path. Filtering hides cards/groups without loading article bodies.

Legacy hashes `#leetcode-core-patterns` and `#machine-learning-roadmap` continue mapping to the corresponding source sections.

## Validation

Built validation must verify:

- at least 20 Machine Learning article cards and 20 generated Machine Learning article pages;
- at least 6 LeetCode article cards and 6 generated LeetCode article pages;
- the index contains no expanded Markdown body or KaTeX article markup;
- representative generated article pages contain source Markdown content and KaTeX where expected;
- generated local links and image paths resolve;
- article-to-article Markdown links resolve to generated subpages.
