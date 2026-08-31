# Knowledge Project Pages Design

## Background

The current `/knowledge/` implementation mixes projects, technical topics, troubleshooting snippets, and actual notes under the same "note" model. This creates false categories such as Linux notes and reinforcement-learning notes even when no corresponding public note repository exists.

## Goal

Rebuild the knowledge area so that only real note projects appear in the knowledge library. Each note project gets one dedicated subpage, and the note body is authored as Markdown and rendered as HTML by the site build.

## Source-of-truth rules

1. A knowledge project exists only when it is an actual note set, not merely a technical topic or software project.
2. Public projects such as `agibot_rl_mjlab`, `ubuntu_toolbox`, `Tmux-generator`, and `invoice-manager` remain project entries and are not presented as notes.
3. No Linux note category is created from tooling repositories.
4. No reinforcement-learning note category is created unless a real note source exists.
5. Private repository names, links, and metadata are not surfaced on the public site.

## Initial knowledge projects

The first version contains exactly two knowledge projects:

- `LeetCode Notes`
  - Site-managed Markdown content.
  - Covers algorithm study notes such as binary search, sliding window, DFS/BFS, union-find, topological sorting, and dynamic programming.
- `Machine Learning Notes`
  - Represents the public `avengerdsf/machine-learning-notes` note project.
  - The public repository remains the canonical source link.

No other knowledge category is added in this change.

## Information architecture

```text
/
├── Projects
│   ├── agibot_rl_mjlab
│   ├── invoice-manager
│   ├── ubuntu_toolbox
│   └── other public projects
└── Knowledge
    ├── /knowledge/
    │   ├── LeetCode Notes
    │   └── Machine Learning Notes
    ├── /knowledge/leetcode/
    └── /knowledge/machine-learning/
```

`/knowledge/` is an index and search surface only. It does not expand full note bodies inline.

## Markdown architecture

Use GitHub Pages / Jekyll Markdown rendering instead of browser-side Markdown parsing.

Planned content layout:

```text
knowledge/
├── index.html
├── leetcode/
│   └── index.md
└── machine-learning/
    └── index.md
```

Each Markdown page includes front matter and is rendered through a shared Jekyll layout so Markdown headings, lists, fenced code blocks, tables, blockquotes, links, and inline code render consistently with the existing site design.

The homepage remains ordinary HTML/CSS/JavaScript. Only knowledge article rendering adopts Jekyll.

## Knowledge index behavior

`/knowledge/` becomes a compact card/index page:

- one card per real knowledge project;
- title, short description, tags, and source type;
- optional search limited to knowledge-project metadata;
- no inline full-note rendering;
- no topic cards for Linux, RL, Engineering Practice, or generic systems content.

## Project separation

The homepage project area remains the place for software and engineering repositories. Project cards may reference relevant knowledge pages, but the knowledge index must never infer a note from a project repository.

## Styling

Keep the current shared visual system and wide desktop layout. Add a Markdown article layout with:

- readable centered content column;
- optional table of contents/navigation area on wide screens;
- responsive single-column layout on smaller screens;
- code blocks with horizontal scrolling;
- styled tables, blockquotes, headings, links, and inline code;
- existing light/dark theme compatibility.

## Deployment

Update the GitHub Pages workflow from raw static artifact upload to a Jekyll-compatible build so `.md` pages are rendered before deployment. The build must continue to publish the existing HTML/CSS/JS assets unchanged.

## Validation

Acceptance criteria:

1. `/knowledge/` shows only LeetCode Notes and Machine Learning Notes.
2. Linux, Robotics/RL, Engineering Practice, GDB, Bash, Git SSH, and software projects are not presented as standalone note projects.
3. `/knowledge/leetcode/` renders Markdown correctly.
4. `/knowledge/machine-learning/` renders Markdown correctly and links to the public `machine-learning-notes` repository as source.
5. Markdown headings, lists, fenced code blocks, tables, blockquotes, links, and inline code render correctly in both light and dark themes.
6. Existing homepage project cards remain project cards.
7. GitHub Pages deployment succeeds from `main`.
8. Static validation and link checks continue to pass after the Jekyll migration.

## Non-goals

- Do not create Linux notes from `ubuntu_toolbox` or `Tmux-generator`.
- Do not create reinforcement-learning notes from `agibot_rl_mjlab` or other RL projects.
- Do not migrate every existing HTML article into Markdown in this change unless it belongs to one of the two approved knowledge projects.
- Do not introduce a client-side Markdown parser or a SPA framework.
