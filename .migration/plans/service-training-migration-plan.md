# Migration plan: Service Training page (https://www.mybeckman.in/service/training)

Prepared 2026-11-16. Target: AEM author `/content/demo-ma-aem-coder/vishal/service/training`, rendered with code
branch **mgtool** (author URLs carry `?ref=mgtool`).

## 1. Current status

| Step | Status |
|---|---|
| Page analysis | Done 2026-11-02 (`migration-work/analysis/service-training/`) |
| Template `service-training` + selectors | Done (`tools/importer/page-templates.json`) |
| Import script / parsers | Done (`tools/importer/import-service-training.js`) |
| Local page | Done (`content/service/training.plain.html`, 2026-11-03) |
| Live page re-checked 2026-11-16 | No authored changes (only Marketo form fields differ, they load at runtime) |
| Code on mgtool | All blocks/options present; 3 small items only in the pending sync (see 4) |
| AEM author / EDS preview | Not there yet (preview 404 on mgtool and main) |

## 2. Page structure → template, sections, blocks

Page metadata: title "MyBeckman Learning", template `service-training`.

| # | Section | Source | Block / content | Section style |
|---|---|---|---|---|
| 1 | Hero | full-width banner, "MyBeckman Learning" title image, intro, "Sign Up" | **Hero Centered** `left` (desktop + square mobile image) | – |
| 2 | Learn Your Way + Course Catalog | H2 + intro text, 2 training options with icons and "Sign Up" links; H2 Course Catalog + 4 red tiles to the Absorb LMS catalog | default content (H2s, text, "Courses" link → `#course-catalog`) + **Cards Grid** `icon-left` + **Cards Grid** `buttons` | – |
| 3 | Knowledge Awaits | H3 + text beside the Marketo request form 3564 | **Marketo Form** `two-column` | `grey, centered` |
| 4 | Legal note | small print | default content | `grey` |

Images: 9, all absolute media.beckman.com URLs with `?rev=` (hero desktop, mobile, title; 2 option icons; 4 catalog icons).
Links out: Absorb LMS (mybeckman.myabsorb.com) sign-up and catalog links, kept absolute.

## 3. Blocks and code (all exist; no new block needed)

| Block / style | In project | On mgtool (author code) |
|---|---|---|
| hero-centered (`left`) | yes | yes |
| cards-grid (`icon-left`, `buttons`) | yes | yes |
| marketo-form (`two-column`) | yes | yes |
| section styles `grey`, `centered` | yes | yes |
| template styles `.service-training main` (1170px container, type scale) | yes | yes |

## 4. Gaps on mgtool (all in the pending sync, branch merge-search-into-mgtool)
- Page properties: template select has no "Service Training" option (value still stored; only the dropdown).
- In-text links underlined on support-style pages incl. Training (WCAG 1.4.1).
- Header "Request a Quote" + footer contrast fixes.

## 5. Documents / outputs
- `content/service/training.plain.html` (exists)
- Training-only AEM package `migration-work/packages/demo-ma-aem-coder-service-training.zip` (to build: page node only,
  children untouched, absolute media.beckman.com images, same as the Support/Search packages)
- The old full package (`demo-ma-aem-coder.zip`) also holds this page but maps images to `/content/dam/…` (needs asset
  upload) and overwrites 17 pages: do not use it for this page.

## 6. Steps
1. Sync the pending code (merge-search-into-mgtool) and merge it into **mgtool** (PR).
2. Build the Training-only package; validate the XML.
3. Install it on the author (Tools → Deployment → Packages → Upload → Install).
4. Open `/content/demo-ma-aem-coder/vishal/service/training.html?ref=mgtool` in Universal Editor; check hero (desktop/mobile
   image), both card layouts, the Marketo form, grey bands; publish to preview.
5. Compare the preview with the live page at 1440 and 390 (visual critique) and fix any author-only differences.

## 7. Risks
- Marketo form 3564 loads from pages.beckman.com; it needs that domain allowed (as on /support).
- Absorb LMS links point to an external system; unchanged.
- Author-rendered markup (Universal Editor wrappers) can differ from the preview; check step 4.
