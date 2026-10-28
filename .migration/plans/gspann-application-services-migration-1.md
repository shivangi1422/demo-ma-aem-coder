# GSPANN Application Services Page: Migration Plan

**Source page:** https://www.gspann.com/services/application-services-and-modernization
**Target page:** `/services/application-services-and-modernization` (Universal Editor / xwalk project)

> Execution needs Execute mode. This plan is written in Plan mode.

## Your styling choice
**Use the GSPANN page's own styles only.** None of the project's existing styles or blocks will be reused: no Beckman or myBeckman blocks, no `brand.css` look, and no existing hero, cards or carousel styling. Every block on this page gets its own new GSPANN variant, styled from the live page's measured styles. All GSPANN styles are scoped to this page with a page template (`Template: gspann`). The rest of the site keeps its current look.

## Where things stand

| Item | Status |
|---|---|
| Page analysis (8 sections, 9 blocks, section styles, content for all 5 carousel slides) | ✅ Saved from an earlier pass. I'll reuse it, not analyse the page again |
| Imported page content | ⚠️ Present, but it uses blocks that no longer exist, so the preview looks broken |
| The 9 GSPANN blocks | ❌ Missing from the code |
| GSPANN template in the import mapping | ❌ Missing. The mapping only holds Beckman and myBeckman templates |
| GSPANN importer (parsers, transformers, import script) | ❌ Missing |
| Page-scoped stylesheet support | ✅ Already there: page metadata `template` adds a body class, and names listed in `TEMPLATE_STYLES` load `styles/<name>.css` (currently only `mybeckman`) |
| Project setup | Set up for Beckman (beckmancoulter.com, bot-protected) |

## Page structure (from the analysis)

| # | Section | Section style | Content |
|---|---|---|---|
| 1 | Sticky service anchor nav | `blue-red-gradient` | `columns-anchor-nav` |
| 2 | Hero | none | `hero-overlay-left` |
| 3 | Our Capabilities | none | Label, H2 and intro text, then `cards-capability` (5 cards) and `carousel-split-detail` (5 slides) |
| 4 | Technology Partners | `light-blue` | Label, H2 and intro text, then `cards-logo-group` (10 categories) |
| 5 | Modernization partner CTA | `navy-gradient, centered` | H2 and text, then the email `form` |
| 6 | Our Impact | `light-grey` | Label, H2 and intro text, then `cards-stats` (4 tiles) |
| 7 | Insights | `light-grey` | Label, H2 and intro text, then `cards-resources` (6 cards, side-scrolling) |
| 8 | Connect with Us | none | Label and H2, then `cards-leader` (1 person) |

## Approach

### 1. Project setup
- Set the source site to `https://www.gspann.com/`, not bot-protected. Keep project type xwalk.
- Add a `services` template for this URL to the import mapping, next to the existing templates. Nothing existing gets replaced.

### 2. Build the blocks (all new, GSPANN only)
Each block gets its own folder, code and Universal Editor model. Lessons from the first pass:
- **`cards-logo-group`:** each category is one text card followed by one image-only card per logo. The block's code puts them back together into a category card with 4 logos per page and dots to page through them. This is needed because Universal Editor can't hold images inside rich text or several images in one field.
- **`carousel-split-detail`:** each metric is a paragraph that starts with the bold value, e.g. `<p><strong>20+</strong> …</p>`. It has arrows, dots, and a text panel on the left with the image on the right.
- **`cards-capability`:** "Learn More" opens the matching carousel slide.
- **`columns-anchor-nav`:** a sticky bar that highlights the link for the section in view.
- **`cards-resources`:** a side-scrolling track with previous/next arrows.
- Add all blocks to the section's allowed components, then run `npm run build:json` and `npm run lint`.

### 3. Email form
- Run the form block handler. The block keeps the base name `form`, with no variant.
- Run form migration on the source form (email field + "Get Started").
- GSPANN form styles go under `body.gspann` only, so other forms on the site don't change.

### 4. Importer
- **Mapping:** block selectors and the 8 section mappings, checked against the saved source HTML and the template schema.
- **Transformers (GSPANN only):**
  - **Cleanup** removes the header, footer, mobile menu, cookie banner, the hidden screen-reader list, and decorative dividers.
  - **Sections** adds section breaks and section metadata.
  - **Metadata** adds `Template: gspann` to the page metadata.
- **Parsers:** one per block. They convert SVG logos to PNG and turn Next.js image links into direct image URLs.
- **Import script:** `import-services.js` uses only the GSPANN transformers. Bundle it.

### 5. Import and validate content
- Re-import the page, run the content score, then compare the text line by line to confirm nothing is missing.
- Run the Universal Editor conversion check until the page passes.

### 6. GSPANN page stylesheet (`styles/gspann.css`)
- Add `gspann` to `TEMPLATE_STYLES` in `scripts/scripts.js`. The file then loads only on pages with `Template: gspann`.
- Take the values from the source page's measured styles. Everything is scoped under `body.gspann`:
  - **Fonts:** the source fonts (Inter for body text, Source Serif 4 for headings), loaded only from this file.
  - **Colours:** text, heading, accent and hover colours.
  - **Gradient section labels.**
  - **Type scale:** h1–h4, body text and subtitles.
  - **Buttons and links.**
  - **Layout:** content width, side padding and section spacing.
  - **Section styles:** `blue-red-gradient`, `light-blue`, `navy-gradient`, `centered`, `light-grey`.
- Don't edit `styles.css`, `brand.css`, `fonts.css`, `lazy-styles.css` or `head.html`.

### 7. Style each block from the source
- Run one block design pass per block. Each pass copies the source's exact styles, including hover, focus and active states, at 375, 768 and 1440px.
- Each block's CSS only covers its own GSPANN variant. Nothing is shared with existing blocks.

### 8. Page check
- Compare the preview with the source at desktop and mobile widths. The target is at least an 85% visual match. Fix the biggest gaps and re-run a block's design pass if it falls short.
- Confirm a Beckman page and a myBeckman page still look the same as before.

## Checklist

- [ ] Update project setup: source gspann.com, not bot-protected, xwalk
- [ ] Add the GSPANN `services` template to the import mapping without changing existing templates
- [ ] Rebuild the block list from the saved analysis (8 new GSPANN variants + `form`)
- [ ] Generate `columns-anchor-nav`, `hero-overlay-left`, `cards-capability`, `carousel-split-detail`, `cards-logo-group`, `cards-stats`, `cards-resources` and `cards-leader` as new blocks
- [ ] Add the blocks to the section's allowed components; run `npm run build:json` and `npm run lint`
- [ ] Run the form block handler (base `form`, no variant) and form migration for the email + "Get Started" form
- [ ] Add the block selectors and the 8 section mappings, and check them against the template schema
- [ ] Create the GSPANN cleanup, sections and metadata (`Template: gspann`) transformers
- [ ] Create the 9 parsers and check each against the source HTML
- [ ] Create and bundle `import-services.js` (GSPANN transformers only)
- [ ] Re-import the page, run the content score, and confirm with a text comparison that nothing is missing
- [ ] Run the Universal Editor conversion check until the page passes
- [ ] Create `styles/gspann.css` from the source's measured styles, all scoped to `body.gspann`
- [ ] Register `gspann` in `TEMPLATE_STYLES`
- [ ] Style all 9 blocks from the source's measured styles at 375, 768 and 1440px, including hover and focus states
- [ ] Compare the page with the source (85%+ target) and fix the largest gaps
- [ ] Confirm Beckman and myBeckman pages still look the same
- [ ] Remove temporary design and comparison files

## Out of scope / notes
- **Header and footer:** GSPANN's header and footer are a separate migration. Until then the page keeps the current site header and footer.
- **Site-wide base styles:** the global `styles.css` still loads on every page, because the platform needs it. The GSPANN stylesheet overrides it on this page only, so the page shows the GSPANN look.
- **Where changes go:** everything stays in the local workspace. Nothing is uploaded to Document Authoring, previewed remotely, published or committed unless you ask.
