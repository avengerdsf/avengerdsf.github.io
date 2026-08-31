# Personal Site Round 2 Design

## Goal

Upgrade the first working personal site into a clearer research/engineering portfolio and a more useful long-term technical knowledge base without introducing a build framework.

## Scope

### Homepage

- Keep the current light-first visual system and overall information order.
- Add a compact `Now` / current-work section that communicates active technical themes without exposing private repository metadata.
- Improve project cards so each project communicates type, maturity, purpose, and the engineering problem it represents rather than only listing a stack.
- Add a small capability map that connects research, simulation, systems debugging, and engineering tooling.
- Preserve responsive behavior, dark mode, reduced-motion support, semantic HTML, and keyboard accessibility.

### Knowledge Base

- Add a topic overview above search so visitors can understand the structure before using filters.
- Expand local reusable articles in public-safe areas: GDB debugging workflow, Bash history reliability, Git SSH connectivity troubleshooting, and Sim-to-Sim / Sim-to-Real engineering workflow.
- Enrich knowledge entries with reading type and practical intent while keeping the existing data-driven rendering model.
- Keep repository links and local articles visually distinguishable.
- Do not publish private repository names, private source paths, internal company/project details, credentials, or user-specific infrastructure data.

### Maintenance

- Keep the site dependency-free and directly deployable by GitHub Pages.
- Extend static validation so every local knowledge article referenced by `knowledge-data.js` exists.
- Update README with the new content-authoring convention.

## Information Architecture

```text
/
├── Hero
├── Now / Current work
├── Capability map
├── Selected public work
└── Knowledge base preview

/knowledge/
├── Topic overview
├── Search + filters
└── Data-driven entry grid

/knowledge/articles/
├── machine-learning-roadmap.html
├── reinforcement-learning-workflow.html
├── linux-engineering-toolbox.html
├── gdb-debugging-workflow.html
├── bash-history-reliability.html
├── git-ssh-troubleshooting.html
└── sim-transfer-workflow.html
```

## Visual Direction

The visual language remains restrained: off-white/near-black surfaces, thin borders, generous whitespace, rounded cards, and one accent system. Round 2 adds hierarchy through small status labels, compact metric blocks, and stronger typography rather than decorative graphics.

## Interaction

- Search remains client-side and instantaneous.
- Topic cards set the active knowledge filter through buttons instead of navigating to duplicate pages.
- Cards and controls must work with keyboard focus states.
- No interaction may depend on hover alone.

## Validation

CI must verify:

1. Required site files exist.
2. HTML pages have non-empty titles.
3. HTML IDs are unique per page.
4. Internal HTML links resolve.
5. Every local article `href` declared in `assets/js/knowledge-data.js` resolves to a real file.
