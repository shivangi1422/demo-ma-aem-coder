# GSPANN Application Services Page: EDS Migration Plan

**Source page:** https://www.gspann.com/services/application-services-and-modernization
**Target:** `/services/application-services-and-modernization` in this Universal Editor (xwalk) project

> **Approved, but still not started.** This chat is still in Plan mode, so I can only read files. Typing "execute the plan" here doesn't change the mode. Use the mode switch in the chat to choose Execute mode, then send any message, such as "go". I'll start with the first checklist item.

## Where things stand

The repository's code changed after the first migration pass: new commits came in and the GSPANN code is gone. The migration working files and the imported page are still there. Nothing has changed since my last check.

| Item | Status |
|---|---|
| Page analysis: 8 sections, 9 blocks, screenshot, cleaned source HTML, brand extraction | ✅ Still present |
| Saved source HTML for each block | ✅ Still present, so parsers can be rebuilt without fetching the page again |
| Imported page content | ✅ Still present, but it points at blocks that no longer exist, so the preview renders unstyled or broken |
| The 9 GSPANN blocks (`columns-anchor-nav`, `hero-overlay-left`, `cards-capability`, `carousel-split-detail`, `cards-logo-group`, `cards-stats`, `cards-resources`, `cards-leader`, and the email form) | ❌ Gone from the code |
| GSPANN importer (template mapping, parsers, cleanup and section transformers, `import-services.js`) | ❌ Gone. `page-templates.json` now only holds the Beckman `learning-and-events` template |
| Project setup | ❌ Back to Beckman settings (base URL beckmancoulter.com, bot-protected = true) |
| Site-wide styles (`brand.css`, `fonts.css`) | Beckman Coulter look with the Montserrat font. **Kept as is**, as you chose |
| Form block | Now the full standard forms block |
| Page theme support | ✅ Already there: a page's "theme" metadata adds a body class, and `scripts.js` loads `styles/<name>.css` for names listed in `TEMPLATE_STYLES` |

**Your decisions:**
1. **Styles:** the GSPANN look applies only to GSPANN pages, through a page theme. Beckman stays the site-wide look.
2. **Form:** the email sign-up uses the standard form migration, with the base `form` block and no variant.

## Approach

### 1. Project setup
- Point the source site at `https://www.gspann.com/`, set bot-protected = false, and keep project type xwalk.
- Add the GSPANN `services` template to `page-templates.json` next to the Beckman template, without replacing it.

### 2. Reuse the analysis
Don't analyse the page again. The existing analysis already records:
- the 8 sections and their styles: `blue-red-gradient`, `light-blue`, `navy-gradient, centered`, `light-grey`
- all 9 block variants
- the carousel content for slides 2–5, which the live page doesn't show at once

### 3. Rebuild the blocks
Regenerate the 8 non-form blocks, each in its own folder. Keep what the first pass taught us:
- **`cards-logo-group`:** each category is a text card followed by one image-only card per logo, and the block groups them back together. Universal Editor rejects images inside rich text, and it can't hold several images in one field.
- **`carousel-split-detail`:** each metric is a paragraph that starts with the bold value, e.g. `<p><strong>20+</strong> …</p>`.
- **`cards-capability`:** clicking "Learn More" opens the matching carousel slide.
- **Universal Editor setup:** add all blocks to the section's allowed components, then run `npm run build:json` and `npm run lint`.

### 4. Email form (standard forms)
- Run the form block handler. The block must keep the base name `form`, with no variant.
- Run form migration on the source form (email field + "Get Started") to produce the form definition, and wire the importer to output it.

### 5. Importer
- **Block mapping:** re-add the block selectors and the 8 section mappings, checked against the cleaned source HTML. Reuse the saved per-block source HTML.
- **Transformers** (GSPANN only):
  - **Cleanup** removes the header, footer, mobile menu, cookie banner, hidden screen-reader list, and the decorative divider line in the Capabilities section.
  - **Sections** inserts section breaks and section metadata.
  - **Metadata** adds `Theme: gspann` to the page metadata.
- **Parsers:** one per block. They convert SVG logos to PNG, turn Next.js image links into direct image URLs, and point "Get In Touch" to `#connect`.
- **Import script:** `import-services.js` uses only the GSPANN transformers, never the Beckman ones.

### 6. Re-import and validate
- Bundle and run the import, then run the content score.
- Last time the score was about 89%. That came from extra slide and logo text, not missing content, so re-confirm with a line-by-line text comparison.
- Run the Universal Editor conversion check until the GSPANN page passes.

### 7. GSPANN theme, scoped to the page
- Create `styles/gspann.css` and add `gspann` to `TEMPLATE_STYLES` in `scripts/scripts.js`. The file then loads only on pages themed `gspann`.
- Everything in it is scoped under `body.gspann`:
  - **Fonts:** Inter (body) and Source Serif 4 (headings), from Google Fonts. Imported only here, so Beckman pages don't load them.
  - **Colours:** navy text `#1a1a2e`, headings `#0f122e`, blue accent `#005dff` (hover `#0048cc`).
  - **Section labels:** the gradient text above headings, purple through pink to red.
  - **Headings and paragraphs:**
    - h1: 44px serif, 600 weight
    - h2: 30px serif, 600 weight
    - h3: 19.2px Inter, bold
    - subtitles: 18px in `#5a5a6e`
  - **Layout:** 1280px content width, 24px side padding, and 60/80/100px section spacing.
  - **Section styles:**
    - `blue-red-gradient`
    - `light-blue` (`#f8faff`)
    - `navy-gradient` with white text
    - `centered`
    - `light-grey` (`#f8fafc`)
- Don't change `brand.css`, `styles.css`, `fonts.css` or `head.html`.

### 8. Block design
- Run one design expert per block, in parallel. Each one matches the source's exact computed styles, including hover and focus states, at 375, 768 and 1440px.
- GSPANN form styles go in the form block's CSS, scoped under `body.gspann`.

### 9. Page check
- Compare the preview against the source at desktop and mobile widths. The target is at least an 85% visual match.
- If a block falls short, run its design step again.
- Confirm a Beckman page still looks unchanged.

## Checklist

- [ ] Update project setup for GSPANN: base URL gspann.com, not bot-protected, xwalk
- [ ] Add the GSPANN `services` template to `page-templates.json` next to the Beckman template
- [ ] Rebuild the block generation list from the existing analysis
- [ ] Regenerate the 8 non-form blocks, including the one-row-per-logo `cards-logo-group`
- [ ] Add the blocks to the section's allowed components; run `npm run build:json` and `npm run lint`
- [ ] Run the form block handler so the block uses the base `form` name with no variant
- [ ] Run form migration for the email + "Get Started" form
- [ ] Re-add block selectors and the 8 section mappings, check them against the template schema, and confirm the saved block source HTML is still valid
- [ ] Create the GSPANN cleanup, sections and metadata (`Theme: gspann`) transformers
- [ ] Regenerate the 9 parsers and check each against the live page
- [ ] Create `import-services.js` using only the GSPANN transformers, and bundle it
- [ ] Re-import the page and run the content score, then confirm with a text comparison that no content is missing
- [ ] Run the Universal Editor conversion check until the GSPANN page passes
- [ ] Create `styles/gspann.css` (fonts, colours, section labels, typography, section styles) and add `gspann` to `TEMPLATE_STYLES`
- [ ] Style all 9 blocks from the source's computed styles, with GSPANN form styles scoped to `body.gspann`
- [ ] Compare the GSPANN page against the source (85%+ match target) and fix the largest gaps
- [ ] Confirm a Beckman page still renders unchanged
- [ ] Delete the temporary `.tmp-design/` folder

## Out of scope / notes

- **Header and footer:** GSPANN's are a separate step. The page keeps the current header and footer until then.
- **Earlier pages:** the 14 Beckman pages that fail the Universal Editor check were already failing and won't be touched.
- **Where changes go:** everything stays in the local workspace. Nothing is uploaded to Document Authoring, previewed remotely, published or committed unless you ask.
