# Kaluza C Analysis Software: Migration Plan

**Source:** https://www.mybeckman.in/flow-cytometry/software/kaluza-c
**Target:** `/sai/flow-cytometry/software/kaluza-c` (content file `content/sai/flow-cytometry/software/kaluza-c.plain.html`)
**Template:** `software-product-detail`, shared with Cytobank Enterprise, Cytobank Premium and Kaluza
**Approach:** Reuse → Variation → New Block. The existing product-detail blocks and styles are the source of truth.

> This plan was built from a first read of the live page. Several sections on this site (licence/model table, Content and Resources, Related Products) are loaded by the live search service after the page opens, so they don't appear in the page's raw HTML. Step 1 of the checklist captures the rendered page to confirm them before any build work. Every decision below marked **(verify)** depends on that capture.

> **Optional tooling:** a "modern web guidance" plugin is available that can check the build against current web best practices, and a forms plugin for converting HTML forms. This page has no form of its own (the newsletter form belongs to the footer, which is already migrated), so I don't think the forms plugin is needed. If you'd like either one enabled, tell me and I'll switch it on before execution.

---

## 1. Page audit

### 1.1 Structure and section order (from the live page)

| # | Source section | Live content | Kaluza equivalent |
|---|---|---|---|
| 0 | Breadcrumb | Home › Flow Cytometry › Flow Cytometry Software › Kaluza C | same |
| 1 | Product hero | H1 "Kaluza C Analysis Software"; intro paragraph; 3 highlight bullets; "Download your free 30-day trial" text link; "Explore Kaluza C" jump link; "Request a Quote" button; "Resources + Tools" links (Software Downloads, Release Notes, Free Trial, Troubleshooting); 3-image gallery with arrows and thumbnails | same pattern as Kaluza (gallery, jump link, text-link trial) |
| 2 | Section tabs | Features · Explore Kaluza C · Content and Resources · Technical Documents · Related Products | Kaluza had 4 tabs; Kaluza C adds Related Products |
| 3 | Features (H3) | 4-item feature list, plus 3 columns with H4 headings (Medical Device, Comprehensive Compatibility, Enhanced LIS Integration) and **paragraph** text rather than bullet lists **(verify)** | Kaluza had 4 columns of H4 + lists |
| 4 | Explore Kaluza C (licence/model table) | anchor target `#product-table-wrapper`; filled in by live search **(verify heading, models, filters)** | Kaluza: 8 models, 3 filter groups |
| 5 | Content and Resources | filter bar + resource rows, filled in by live search **(verify)** | Kaluza: 1 resource |
| 6 | Technical Documents (H3) | "Didn't find what you are looking for? For more results click here." → `/search#q=Kaluza C&t=coveo-tab-techdocs` | same |
| 7 | Related Products | carousel, filled in by live search **(verify)** | not on Kaluza; on the Cytobank pages |
| 8 | Regulatory note | Kaluza C is an FDA-listed medical device / CE-IVD; check for a page-level "For In Vitro Diagnostic Use" line **(verify)** | Premium had "For Research Use Only" |

### 1.2 Component inventory

| Pattern | Count | Notes |
|---|---|---|
| H1 | 1 | hero title |
| H3 section headings | 4–5 | accent-underlined section headings (template style) |
| H4 | 3 | feature column headings |
| Check-mark highlight list | 1 (3 items) | hero |
| Plain bullet list | 1 (4 items) | Features intro **(verify placement)** |
| CTAs | 3 + 4 | trial text link, jump link, quote button; 4 resource links |
| Image gallery | 1 (3 images) | logo, QC functions screen, report screen |
| Anchor tab bar | 1 (5 tabs) | sticky on scroll |
| Filterable product table | 1 **(verify)** | |
| Resource list with type filter | 1 **(verify)** | |
| Related-products carousel | 1 **(verify)** | |
| Tabs (content-switching) / accordions / forms / video | none in main content | the newsletter form is in the shared footer |

### 1.3 Media

| Asset | Source | Handling |
|---|---|---|
| `flow-cytometry-kaluza-c-logo.jpg`, `…-qc-functions.png`, `…-report.png` | `media.beckman.com` | the existing cleanup transformer reduces the address to `?rev=` only, so AEM can ingest it |
| Licence/product images | `/pimassets/…` | rewritten to the PIM image host by the existing transformer; check each one loads, since some PIM images are missing at source (9 of Cytobank Premium's were also broken on live) |
| Alt text | live uses "Product Image - N" | keep for parity; recommend authors add descriptive alt text (accessibility, WCAG 2.1 AA) |

---

## 2. Section-by-section mapping

### S0 · Breadcrumb
- **Recommended:** `breadcrumbs` (auto block, built from page metadata)
- **Decision:** Reuse
- **Authoring:** page metadata `Breadcrumb Labels` = `Flow Cytometry | Flow Cytometry Software | Kaluza C`
- **Design alignment:** none needed.

### S1 · Product hero + gallery
- **Recommended:** `product-hero` + `product-gallery` in the same section (exactly as on Kaluza)
- **Decision:** Reuse, with existing options:
  - 3 gallery images → `product-gallery`; the parser leaves the hero image empty and moves the gallery into the hero's media column (the 2+ images rule is already in place).
  - "Explore Kaluza C" → the existing boxed jump link (`product-hero-jump`, "⌄⌄" double chevron).
  - "Request a Quote" → the existing solid quote button.
  - "Download your free 30-day trial" → a plain paragraph link, as on Kaluza.
  - Highlight list spacing → the `compact-list` variant is set automatically when the live bullets have no gap; check the live spacing.
- **Variation needed:** none expected. The only possible new case is a 4-link Resources + Tools grid (Kaluza had 2), which the grid already handles as 2 rows of 2.
- **Authoring fields:**
  - product-hero: image (empty), text (H1, paragraphs, list, links), buttons, Resources + Tools title and links, option `compact-list` if needed
  - product-gallery: one Gallery Image item (image, alt) per image
- **Design alignment:** H1 42px weight 300 navy from 1024px (36px on phones); body 14px/1.65; quote button `--brand-blue`; jump box 58px tall (62px from 768px) with a 1px `#ddd` border; gallery thumbnails 80px from 768px. Measure the gallery against live: the logo image has different proportions from Kaluza's first image.

### S2 · Section tabs
- **Recommended:** `page-tabs`
- **Decision:** Reuse
- **Variation needed:** none. The parser already skips tabs hidden on live or whose target section is missing. If live search returns no related products, the tab is hidden on live and must be skipped here too **(verify)**.
- **Authoring:** a list of links (label + `#section-id`)
- **Design alignment:** sticky behaviour and active-tab underline as on the other three pages.

### S3 · Features
- **Recommended:** H3 heading (page text) + `feature-columns`
- **Decision:** Reuse; possibly a small parser fix (not a new variant):
  - **3 columns instead of 4:** the block is equal-width flex from 768px, so 3 columns already work. No variant.
  - **H4 + paragraphs (no list):** the block already styles paragraphs (14px, 1.65, 14px margins). Check that the parser keeps every column's paragraphs, including links.
  - **The 4-item list:** if live shows it above the columns, author it as page text in the same section (a list under the H3), not as a new block. If it sits inside the columns, keep it in the first column.
- **Authoring:** one Feature Column item per column, each a rich-text field (H4 + paragraphs/lists)
- **Design alignment:** H4 16px weight 600 navy; column gutter 20px from 768px; section H3 with the template's accent underline.

### S4 · Explore Kaluza C (licence/model table)
- **Recommended:** `product-table`
- **Decision:** Reuse **(verify)**
- **Data:** capture the rendered table from live: models, part numbers, images, store links, quote links and filter values. Add a `/flow-cytometry/software/kaluza-c` entry to `tools/importer/data/product-tables.js`. The data is captured once and authored as block rows; filtering then happens in the browser.
- **Variation needed:** none. The block already handles any filter group names and counts (expected: Part Number, Product Line Regulatory = Cytometry, Regulatory Status = IVD/CE), the Search row and show-more for groups over 5 values, OR within a group and AND across groups, 8 per page, the Filters dropdown below 992px and the compact list below 768px.
- **Heading:** if the heading sits inside the search widget (as on Kaluza), the parser already writes it as an H3 before the block.
- **Authoring:** per product: image, image alt, name + product number, filters (`Name: Value` lines), quote link.
- **Design alignment:** 4 columns from 1024px, 3 columns from 768px; pager line kept even with one page.

### S5 · Content and Resources
- **Recommended:** H3 + `resource-list`
- **Decision:** Reuse **(verify)**
- **Variation needed:** none. The block covers the type icon, title link, optional description and the Resource Type filter. A single resource drops the pager spacing (already built).
- **Authoring:** per resource: type, title link, description (optional)

### S6 · Technical Documents
- **Recommended:** H3 + page text (paragraph with link)
- **Decision:** Reuse (default content, no block)
- **Notes:** the existing cleanup swaps in the "Didn't find what you are looking for?" line when live search shows its error state. Search query: `Kaluza C`.

### S7 · Related Products
- **Recommended:** H3 + `related-products`
- **Decision:** Reuse **(verify)**
- **Authoring:** per product: image, title link, description link
- **Design alignment:** same carousel arrows, card sizes and responsive steps as the Cytobank pages.

### S8 · Regulatory note (if present)
- **Recommended:** page text (italic paragraph), as with Premium's "For Research Use Only" line
- **Decision:** Reuse (default content)

### Page metadata
Title, Description and canonical from live; `Breadcrumb Labels`; `template` = `software-product-detail` (lower-case key, which the local preview needs).

---

## 3. Reuse / Variation / New Block summary

| Section | Block | Decision |
|---|---|---|
| Breadcrumb | breadcrumbs | Reuse |
| Hero | product-hero + product-gallery | Reuse (existing jump link, quote button, `compact-list` option) |
| Tabs | page-tabs | Reuse |
| Features | default content + feature-columns | Reuse (parser check for paragraph-only columns) |
| Licence/model table | product-table | Reuse + new data entry |
| Content and Resources | resource-list | Reuse |
| Technical Documents | default content | Reuse |
| Related Products | related-products | Reuse |
| Regulatory note | default content | Reuse |

**New blocks: none.** Every pattern on Kaluza C already exists on Kaluza or the Cytobank pages. A new block or variant would only be justified if the capture shows a pattern none of these blocks covers; that would come back to you for a decision first.

---

## 4. Design-system gap checks (to measure against live)

| Area | What to check | Likely outcome |
|---|---|---|
| Typography | H1 wrapping (shorter title), H4 and paragraph sizes in 3 columns | matches the existing styles |
| Spacing | hero list gaps (`compact-list`), gap below a 3-column feature row, spacing between Features and the table | small CSS changes inside existing blocks at most |
| Layout | 3-column feature row widths; 2×2 Resources + Tools grid | already supported |
| Responsive | 1440 / 1024 / 992 / 768 / 390 widths, especially table layouts and the sticky tabs | already built to live's breakpoints |
| Imagery | the logo image in the gallery (aspect, centring, 400px height cap) | may need a check like the earlier Premium logo fix |
| CTA patterns | text-link trial, boxed jump link, solid quote button, resource links | all exist; check the order and spacing of the 3 hero CTAs |

**Known template-wide limits (as on Kaluza):** blank `&nbsp;` lines in live columns are dropped by the importer; filter value order is alphabetical rather than live's search ranking; on tablets the page container is 720px rather than live's 696px.

---

## 5. Links and navigation updates
- Add `/flow-cytometry/software/kaluza-c` to the migrated-pages list in `tools/importer/transformers/beckman-cleanup.js`, so links to it are rewritten to `/sai/...`.
- Re-import the Flow Cytometry Software page so its Kaluza C tile points to the new page. The tile currently links to the old address.
- Update the 2 Kaluza C links in the menu (`content/sai/nav.plain.html`) by hand. This is a local edit that a future import would overwrite.
- Add the page to the planning catalog under `software-product-detail` with its blocks, as was done for the other three.

---

## Checklist

**Execution requires Execute mode.** Nothing below has been run.

- [ ] Capture the live page (desktop 1440, phone 390): screenshots, computed styles, main HTML, metadata
- [ ] Capture the licence/model table from live search: products, filters, quote links and images; record the responses
- [ ] Capture the live search sections (Content and Resources, Related Products) and confirm which tabs are visible
- [ ] Write the analysis report (`migration-work/analysis/kaluza-c/report.md`), confirming or correcting every **(verify)** item above
- [ ] Bring back to you any pattern that existing blocks can't cover, before building anything new
- [ ] Add the Kaluza C address to the `software-product-detail` template in `tools/importer/page-templates.json`, and regenerate the import script's embedded template
- [ ] Add the Kaluza C entry to `tools/importer/data/product-tables.js` and cross-check counts against live
- [ ] Check the feature-columns parser keeps paragraph-only columns and the 4-item features list
- [ ] Add Kaluza C to the migrated-pages list in the cleanup transformer
- [ ] Create `tools/importer/urls-kaluza-c.txt`, rebundle the import script and import the page
- [ ] Check images load (gallery and licence images), content coverage and the AEM conversion check
- [ ] Re-import Kaluza, Cytobank Enterprise and Cytobank Premium and confirm they're unchanged
- [ ] Compare preview vs live at 1440, 1024, 992, 768 and 390; fix differences inside existing blocks only
- [ ] Test interactions: gallery, tabs, jump link, filters (Search, show-more, Filters dropdown), resource filter, carousel, quote links
- [ ] Re-import the Flow Cytometry Software page and update the menu's Kaluza C links
- [ ] Add the page and its blocks to the planning catalog
- [ ] Run the full lint, rebuild the component models, then summarise what changed and any remaining differences (local workspace only; nothing uploaded or published)
