# About Us Page Migration Plan

## Overview
Migrate the Figma design (ContentGenAI, node `227-563`) into an **About Us page created under `home`** in this AEM Edge Delivery Services project. **Reuse the existing block library first** — the blocks already built for the homepage (hero-home, hero-banner, cards-solutions, cards-product-lines, carousel-instruments, tabs-products, content-reversed, cards-insights, form-request, content-product-detail, content-product-form) plus the boilerplate cards/columns/hero — and only create a new block if a section has no suitable match.

> **Note:** This is a Universal Editor (crosswalk/xwalk) project. New blocks (only if needed) require a `_{blockname}.json` model, a `models/_section.json` filter entry, and `npm run build:json`. Reused blocks need no model changes. New page content goes to `content/about-us.plain.html`; nav/footer are inherited via page metadata.

## Source & Target
- **Figma file:** ContentGenAI (`di82oKZ00hH1BNqHJ3waL3`)
- **Node:** `227-563` (the About Us frame)
- **New page path:** `/content/about-us` (authored as `content/about-us.plain.html`, linked under home)
- **Strategy:** reuse-first — map each section to an existing block; create new only as a last resort.

## Reuse Candidates (existing blocks to match against)
- Hero / banner → `hero-home`, `hero-banner`
- Card grids → `cards-solutions`, `cards-product-lines`, `cards-insights`, boilerplate `cards`
- Image + text / two-column → `content-reversed`, boilerplate `columns`
- Tabs → `tabs-products`
- Forms → `form-request`, `content-product-form`
- Product/detail galleries → `content-product-detail`
- Header/Footer → existing `header` / `footer` (branded)

## Checklist

- [ ] **Confirm Figma access** — ensure the Figma tooling is connected; retry the fetch if rate-limited (429) or auth-failed (403).
- [ ] **Read frame structure** — fetch metadata + screenshot for node `227:563`; enumerate the About Us sections.
- [ ] **Map sections to existing blocks** — for each section, pick the best-matching existing block; flag any section with no match.
- [ ] **Decide reuse vs. create (per section)** — reuse existing block variants wherever they fit; only design a new block if truly unmatched (confirm with user before creating).
- [ ] **Extract content & assets** — pull text, images, and tokens for each section; download images locally to `content/images/about-us/`.
- [ ] **Author the page** — build `content/about-us.plain.html` using reused block classes, correct table/row structure, and md2jcr field hints (xwalk).
- [ ] **Wire nav/footer + link under home** — add page metadata (`nav`/`footer`) and ensure About Us is reachable from the home nav.
- [ ] **Regenerate aggregates (only if new blocks)** — run `npm run build:json` if any new block/model was added.
- [ ] **Preview & verify** — render `/content/about-us` locally, compare against the Figma design, iterate on CSS until it matches; confirm full-bleed and md2jcr-safe structure.
- [ ] **Lint & validate** — run `npm run lint` (and `lint:fix`); confirm model rules pass and no md2jcr mapping issues.
- [ ] **Summarize** — report which existing blocks were reused, any new blocks created, and how to author/edit the page.

## Open Questions (resolve once the frame is readable)
- How many sections node `227-563` contains and which existing block each maps to.
- Whether any section genuinely needs a new block (I'll confirm before creating one, per "use existing blocks").
- Exact nav placement for the About Us link (top-level nav item vs. under an existing menu).

## Known Risks
- **Figma API**: prior sessions hit 429 (rate limit) and 403 (auth). If the fetch fails, I'll retry with cooldown or ask for an exported image of the frame.
- **md2jcr safety**: any new block must follow the established safe patterns (single reference field in simple blocks; container+item for image collections; hyphenated names that avoid the reserved `columns` prefix; field hints on every non-empty cell).
- **Deploy/push**: the current branch has unpushed commits blocked by a GitHub 403 permission; the new page won't appear on the preview/author environments until the push is unblocked.

## Execution Readiness
Plan is ready. Execution requires **Execute mode** and a working Figma connection. On execution I'll fetch node `227:563`, map its sections to existing blocks (reuse-first), author `content/about-us.plain.html` linked under home, and verify against the design — creating a new block only if a section has no suitable existing match (and confirming with you first).
