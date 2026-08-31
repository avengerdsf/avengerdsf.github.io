# Personal Site Round 2 Design

## Goal

Upgrade the first working personal site into a clearer research/engineering portfolio and a more useful long-term technical knowledge base without introducing a build framework.

## Scope

### Homepage

- Keep the current light-first visual system and overall information order.
- Add a compact `Now` / current-work section that communicates active technical themes without exposing private repository metadata.
- Improve project cards so each project communicates the engineering capability it represents rather than only listing a stack.
- Add a capability map connecting research, training, simulation/debugging, and engineering reuse.
- Replace the full-width top bar on desktop with two independent floating navigation capsules: brand on the left and navigation/actions on the right.
- On mobile, merge the two capsules into one compact floating bar.
- Expose representative knowledge notes directly on the homepage so knowledge is visible without first entering a directory page.
- Preserve responsive behavior, dark mode, reduced-motion support, semantic HTML, and keyboard accessibility.

### Knowledge Base

- Make `/knowledge/` a direct-reading library: filtering and search reveal full note content on the same page instead of routing article cards through a second page transition.
- Keep standalone article pages only as stable direct links and no-JavaScript fallbacks, not as the primary browsing interaction.
- Add `LeetCode Notes` as a first-class category covering binary search, sliding window, DFS/BFS, union-find, topological sorting, and dynamic programming.
- Add a topic overview above search so visitors can understand the structure before using filters.
- Add public-safe reusable notes for GDB debugging, Bash history reliability, and Git SSH connectivity troubleshooting.
- Keep public repositories as source/context references and visually separate them from note content.
- Do not publish private repository names, private source paths, internal company/project details, credentials, or user-specific infrastructure data.

### Maintenance

- Keep the site dependency-free and directly deployable by GitHub Pages.
- Keep `knowledge-data.js` as the source of truth for searchable inline note content and public source references.
- Retain standalone HTML articles where useful for stable URLs and fallback navigation.

## Information Architecture

```text
/
├── Hero
├── Now / Current work
├── Capability map
├── Selected public work
└── Direct knowledge preview

/knowledge/
├── Topic overview
├── Search + filters
├── Directly expanded note content
└── Public source repositories

/knowledge/articles/
├── machine-learning-roadmap.html
├── reinforcement-learning-workflow.html
├── linux-engineering-toolbox.html
├── gdb-debugging-workflow.html
├── bash-history-reliability.html
└── git-ssh-troubleshooting.html
```

## Visual Direction

The visual language remains restrained: off-white/near-black surfaces, thin borders, generous whitespace, rounded cards, and one accent system. Wide screens use the otherwise-unused side area for floating navigation instead of drawing a full-width header through empty space.

## Interaction

- Search is client-side and instantaneous.
- Topic cards set the active knowledge category without page navigation.
- Matching notes render their readable sections directly on `/knowledge/`.
- Repository links remain explicit external source actions.
- Cards and controls work with keyboard focus states.
- No interaction depends on hover alone.

## Validation

CI must continue to verify:

1. Required site files exist.
2. HTML pages have non-empty titles.
3. HTML IDs are unique per page.
4. Internal HTML links resolve.
5. The static site can still be deployed without a package/build dependency.
