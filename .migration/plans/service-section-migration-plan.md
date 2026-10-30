# Service Section Migration Plan — mybeckman.in

## Scope
- **Source:** https://www.mybeckman.in/service and every Service page linked from the site navigation (17 pages).
- **Out of scope for now:** Products, Resources, Support, About Us, eStore/checkout. The site blocks automated access, so the full-site crawl was stopped by user choice and limited to `/service`.
- **Project:** xwalk (Universal Editor), so every block needs a `_<block>.json` model and a section filter entry.

## Global elements (every page)
| Element | Source | What it contains | EDS approach |
|---|---|---|---|
| Header | `#mainNav` | Logo, site search, eStore link, red "Request a Quote" button, mega-menu (Products / Resources / Service / Support / About Us, 3 levels deep), phone / account / country icons | `header` block + `nav` fragment. The mega-menu needs its own migration (navigation orchestrator). |
| Footer | `div.footer2023` | Newsletter sign-up (Marketo form), Careers / Contact / Locations / Help Center links, legal links, social icons, copyright and regulatory text, Danaher brand-logo row | `footer` block + `footer` fragment (footer orchestrator). Newsletter form becomes an embed or EDS form. |
| Breadcrumb | top of 16/17 pages | Home › Service › Page | New `breadcrumb` block, or better, generated automatically from the page path so authors don't maintain it. |

The preview currently shows the starter placeholder header and footer.

## Page templates
| Template | Pages | Layout | Status |
|---|---|---|---|
| `service-landing` | 1 (`/service`) | Photo hero, blue stats band, 6 icon cards, blue "Get in Touch" band | **Migrated** (content + structural blocks). Styling still to do. |
| `service-detail` | 16 | Breadcrumb, optional hero or intro, stacked content (text/media columns, comparison tables, video, card grids, forms), ending in a contact CTA band | To do |

`service-detail` pages: instrument-optimization (+ beckmanconnect-support-tools, remote-support, installation, preventive-maintenance), instrument-qualification-calibration, plans (+ centrifuge, flow-cytometry, liquid-handling, particle-analysis, request), tech-support (+ repairs, windows-10), training.

## Reusable components (block catalog)
| Block | Variants | Pages | Exists in project? | Notes |
|---|---|---|---|---|
| `columns-cta` | default, `dark` | 15 / 8 | Yes (default) | Contact band (Call / Email / Tech Support), on almost every page. `dark` variant to add. |
| `breadcrumb` | — | 16 | No | See global elements. |
| `hero-centered` | default, `left-aligned` | 5 / 1 | Yes (default) | Add `left-aligned` (training page). |
| `table-comparison` | — | 4 | No | Service-plan comparison tables on the 4 plan pages. |
| `columns-intro` | default, `benefits`, `no-box` | 1 each | No | Intro / enrollment bar and blue benefits panel. Low confidence; may split into 2 blocks. |
| `columns-media` | — | 1 | No | Text beside an embedded video (plans page). |
| `cards-grid` | default, `icon-left` | 1 / 1 | Yes (default) | Icon cards. `icon-left` variant for training page. Icons need SVGs (Font Awesome on source). |
| `cards-stats` | default, `alt` | 1 / 1 | Yes | Stats band (service landing, windows-10). |
| `video-player` | default, `red` | 1 / 1 | No | Probably the boilerplate `video`/`embed` block. `red` looks like part of the player chrome, not a real variant. |
| `form` | default, `two-column` | 1 / 1 | No | Marketo forms (service-plan request, training sign-up). Decide: Marketo embed vs EDS form. |
| default content | — | 6 | n/a | Headings, paragraphs, lists (heavy on windows-10). |

**Product listing pages:** none in the Service section. The mega-menu shows a large product catalog (flow cytometry, centrifuges, liquid handling, particle counters, …). That needs its own scope when you're ready.

## Migration phases
1. **Global chrome.** Migrate the header with its mega-menu, then the footer, so every migrated page looks complete.
2. **Shared blocks.** Build the `breadcrumb` block (or auto-breadcrumb), the `columns-cta` `dark` variant and `table-comparison`. Together they cover most of the 16 detail pages.
3. **service-detail template.** Analyze its representative page, map blocks, generate parsers and transformers, then import all 16 pages in one run.
4. **Remaining one-off blocks.** `columns-intro`, `columns-media`, `video-player`, `form`, plus the `hero-centered` `left-aligned` and `cards-grid` `icon-left` variants.
5. **Design migration.** Extract site design tokens (Beckman blue `#0072ce`, red CTA, typography), style every block, and add icon SVGs.
6. **Validation.** Run a visual critique of each page against the source, then a lint and performance check.

## Risks and open decisions
- **Bot protection:** pages are only reachable through a fallback service (~3 s per page, with occasional timeouts). Imports work from saved snapshots, but re-fetching is slow.
- **Marketo forms** (newsletter, plan request, training): embed them or rebuild as EDS forms.
- **Font Awesome icons:** they need SVG equivalents in `icons/`. The current `cards-grid` model stores icons in the image field.
- **Thin pages:** some detail pages (e.g. instrument-optimization) show little authored content beyond the intro and CTA band. Check the live pages for content loaded by script or modals ("Get Help Now").
- **Low-confidence classifications** to review: `columns-intro` (enrollment bar vs benefits panel), `columns-intro` `no-box` (could be default content), `video-player` `red`, `cards-grid` `icon-left` (could be columns), and the grey "Knowledge Awaits" callout (treated as default content).
- **Catalog vs existing build on `/service`:** the catalog classed the service cards as columns, but the migrated page uses `cards-grid`. Keep the existing build.
