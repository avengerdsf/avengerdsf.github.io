# Personal Site and Knowledge Base Design

## Goal

Build `avengerdsf.github.io` into a lightweight personal portfolio and personal knowledge base that can be maintained directly in GitHub without introducing a package manager or site-generation dependency.

## Product Structure

The site has two primary surfaces:

1. `/` — personal homepage and portfolio.
2. `/knowledge/` — searchable personal knowledge base.

The homepage introduces the owner, current technical focus, representative public projects, and clear entry points into the knowledge base. The knowledge base organizes existing public study/project material into reusable topic cards and local articles.

## Information Architecture

### Homepage

The homepage is organized in this order:

- Sticky top navigation.
- Hero section with avatar, name, concise technical positioning, primary calls to action, and current-focus tags.
- Focus section covering robotics / reinforcement learning, engineering systems, and learning notes.
- Featured public projects.
- Knowledge-base preview.
- Contact / GitHub footer.

Private repositories must never be exposed as public portfolio entries.

### Knowledge Base

The knowledge base contains:

- Search input.
- Category filter chips.
- Topic cards rendered from a small JavaScript data module.
- Local article pages for curated notes.
- External source links when the source of truth is another public repository.

Initial categories:

- Machine Learning
- Robotics & Reinforcement Learning
- Linux & Tooling
- Engineering Practice

## Initial Content Sources

Public repositories used as source material and portfolio links:

- `avengerdsf/machine-learning-notes`
- `avengerdsf/agibot_rl_mjlab`
- `avengerdsf/invoice-manager`
- `avengerdsf/ubuntu_toolbox`
- `avengerdsf/Tmux-generator`

The site may summarize these repositories but must link back to the original GitHub repository for full source material.

## Visual Direction

The site uses a light-first visual system rather than a dark terminal aesthetic.

Key principles:

- Generous whitespace.
- Soft borders and restrained shadows.
- Rounded cards with consistent radius.
- One accent color family.
- Responsive single-column layouts on narrow viewports.
- Dark mode supported through `prefers-color-scheme` and an explicit toggle.
- Motion is subtle and non-blocking; respect `prefers-reduced-motion`.

## Technical Architecture

No package manager, framework, bundler, or runtime dependency is introduced.

Files are split by responsibility:

- `index.html` — homepage document only.
- `knowledge/index.html` — knowledge-base shell.
- `knowledge/articles/*.html` — standalone curated articles.
- `assets/css/site.css` — shared design system and responsive layout.
- `assets/js/site.js` — shared navigation, theme, and reveal interactions.
- `assets/js/knowledge-data.js` — knowledge-card metadata only.
- `assets/js/knowledge.js` — search/filter/render behavior.
- `scripts/validate-site.mjs` — dependency-free repository checks.
- `.github/workflows/validate.yml` — run validation for pushes and pull requests.

Existing `.github/workflows/deploy.yml` remains the Pages deployment workflow.

## Data Flow

`knowledge-data.js` exports a small array of normalized entries. `knowledge.js` reads the entries, applies the active category and search query, and renders cards into the knowledge grid.

Each entry has:

- `title`
- `description`
- `category`
- `tags`
- `href`
- `source`
- `kind` (`article` or `repository`)

The knowledge index remains usable if JavaScript is unavailable by including explanatory fallback content and direct navigation to the local article directory / GitHub sources.

## Interaction Requirements

- Sticky top navigation with a mobile navigation trigger.
- Theme toggle persists in `localStorage`.
- Search matches title, description, category, and tags.
- Category filters can be reset to `All`.
- Search result count updates immediately.
- Empty search states provide a clear reset action.
- External repository links open safely with `rel="noreferrer"`.
- Internal navigation uses relative links that remain valid on GitHub Pages.

## Accessibility

- Semantic landmarks (`header`, `nav`, `main`, `section`, `footer`).
- Visible focus states.
- Buttons have accessible labels.
- Search is connected to a visible label or accessible name.
- Decorative elements are hidden from assistive technologies.
- Color contrast remains readable in light and dark themes.
- Reduced-motion users do not receive reveal/transform animations.

## SEO and Metadata

Homepage and knowledge index include:

- Unique `<title>`.
- Meta description.
- Canonical GitHub Pages URL.
- Open Graph title, description, URL, and type.
- Theme-color metadata.

## Validation

A dependency-free Node.js validator checks:

- Required site files exist.
- Every HTML file contains a `<title>`.
- Internal `href` targets that point to repository files resolve on disk.
- Duplicate `id` attributes do not occur within one HTML document.

GitHub Actions runs this validator on pull requests and pushes.

## Non-Goals for This Version

- No Jekyll, Astro, Vite, React, Vue, or other build framework.
- No backend.
- No comments system.
- No analytics integration.
- No automatic synchronization of private repositories.
- No publication of private repository names or metadata.
- No full Markdown renderer; local articles are authored as semantic HTML for now.

## Success Criteria

- The root URL presents a complete professional personal homepage instead of the current placeholder.
- `/knowledge/` is a usable searchable/filterable knowledge index.
- At least three local curated articles are included.
- Representative public repositories are linked from the homepage and/or knowledge base.
- Layout works on desktop and narrow mobile widths.
- Dark mode and reduced-motion behavior are supported.
- Repository validation passes without third-party dependencies.
