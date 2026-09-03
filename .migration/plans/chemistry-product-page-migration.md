I'll analyze the chemistry page so the plan is grounded in its actual structure.# Chemistry Page Migration Plan

## Overview
Migrate **https://www.beckmancoulter.com/en/products/chemistry** into a new **Chemistry page under `home`**, authored at **`/content/home/chemistry`** (`content/home/chemistry.plain.html`). This is a **standard content product page** (not a commerce PDP). Per your earlier direction, I'll **match the live-site layout** (clean white sections, image + title + "Learn more" cards) rather than the demo's branded styling — reusing existing blocks and adding new Style variants where the live layout needs them.

> **Note (xwalk):** reused blocks need no model changes; new variants/blocks need a `_{block}.json` model + `models/_section.json` filter entry + `npm run build:json`. Content authored with md2jcr field hints; header/footer inherited via a metadata block; images staged under `content/images/chemistry/`.

## ⚠️ In-flight work this builds on
I was mid-way through rebuilding the **products** page to the live layout (your "Match live site layout" choice). Partially done: added a `plain` hero variant (white bg, dark text) to `_hero.json` + `hero.css`. Still pending (tasks #33–36): `simple` cards variant, "More Solutions" pill-link row, and the products-page rewrite. **These same new variants are exactly what the chemistry page needs**, so I'll finish them here and reuse them for both pages.

## Source → block mapping (live layout)
| # | Live section | Block |
|---|--------------|-------|
| 1 | Hero: "Clinical Chemistry Analyzers and Assays" + "View products" + image | `hero split` (image beside text) |
| 2 | "Support improved patient care with:" — 3 value props | `columns` (or new `feature-list` variant) |
| 3 | Testimonial quote (Dr. Hoosien, Ampath) | **new `quote` block** |
| 4 | "Scalable Solutions for All Laboratories" — 5 product cards w/ volume tag | `cards-grid` **new `simple` variant** (image + tag + title + desc + Learn more) |
| 5 | "Trusted, Reliable Performance" — image + text | `content-reversed` |
| 6 | 3-column feature cards (Quality / Scalable / Test Menu) | `cards-grid` (productlines) or `columns` |
| 7 | "About Clinical Chemistry Analyzers" explainer | `hero plain` / default content |
| 8 | Lab Automation spotlight + Learn more | `content-reversed` / `product-banner` |
| 9 | Immunoassay cross-promo + Learn more | `content-reversed` |
| 10 | "Educational Resources" — tabbed resource lists | `tabs-products` (or `cards-grid insights`) |

## Checklist

- [x] **Fetch & analyze source** — enumerated 11 sections of the chemistry page.
- [x] **Classify page type** — standard content product page (not commerce PDP).
- [ ] **Finish shared variants** — complete `hero plain`, add `cards-grid simple` (4/5-up, image+tag+title+desc+Learn more), add "More Solutions" pill-link row; register in `_*.json` + `models/_section.json`.
- [ ] **Add `quote` block** — new block for the testimonial (quote text + attribution) with model + filter entry.
- [ ] **Map remaining sections** — confirm feature-list & 3-column features reuse `columns`/`cards-grid`; resources reuse `tabs-products`.
- [ ] **Stage assets** — create `content/images/chemistry/`, source/reuse suitable images (analyzers, spotlights).
- [ ] **Author the page** — write `content/home/chemistry.plain.html` with mapped blocks + metadata block, md2jcr field hints.
- [ ] **Wire nav** — add/point a "Chemistry" link (likely under Products) → `/content/home/chemistry`.
- [ ] **Regenerate aggregates** — `npm run build:json` after new blocks/variants.
- [ ] **Preview & verify** — render `/content/home/chemistry`, compare to live layout, iterate CSS.
- [ ] **Lint** — `npm run lint` (+ `lint:fix`).
- [ ] **Upload to DA** — POST page + images + nav to `admin.da.live` so it's editable/publishable.
- [ ] **Summarize** — reused blocks, new blocks/variants, and how to edit.

## Known Risks
- **New blocks/variants**: `quote` and `cards-grid simple` must follow md2jcr-safe patterns (single reference field per simple cell; container+item for card collections; field hints on every non-empty cell).
- **Images**: the live analyzer photos aren't downloadable into the repo directly; I'll reuse existing optimized lab images as placeholders unless you provide the real ones.
- **Deploy visibility**: hosted preview needs the block code on `main` (GitHub push blocked by 403) and content published (`admin.hlx.page` 403). DA upload works; publish/preview promotion needs your permission toggle.

## Execution Readiness
Analysis is done and the mapping is set. Remaining steps are all write operations and **require Execute mode** — this turn is in plan mode. Approve/switch to Execute and I'll finish the shared variants, add the `quote` block, author `content/home/chemistry.plain.html` to match the live layout, wire nav, preview, lint, and upload to DA.
