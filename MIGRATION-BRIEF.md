# mybeckman.in → AEM Edge Delivery (xwalk) — page migration brief

Attach this file to a new chat and add the page URL(s), e.g.:
"Migrate https://www.mybeckman.in/<path> following the attached brief."
Everything below is a standing instruction for every page; do not ask me again about anything decided here.

---

## 1. Project and goal

- Project: AEM Edge Delivery Services with Universal Editor (xwalk). Site content for mybeckman.in lives under
  `/en-in/...` (e.g. https://www.mybeckman.in/service/plans → `/en-in/service/plans`).
- Goal: an EXACT visual match of the live page at 1440, 1024, 768 and 390 px — new dedicated blocks or variants
  are expected when an existing one is not visually identical.
- Do not copy live bugs; build the intended design (e.g. CSS rules that target the wrong class, broken image paths,
  stray `<br>` spacers, collapsed mobile columns). List every bug you did not copy in the summary.
- Never change an existing block, variant or style in a way that alters an already migrated page. Prefer a new block
  or a new one-word variant; if a shared file must change, prove the other pages are unchanged (section 8).
- Work on branch `mybeckman-design-match` (or the branch I name). Do not commit, push, open PRs, publish, preview
  remotely or write to Document Authoring unless I ask in that message.
- Work through the whole page without phase-by-phase confirmations; only stop for real decisions (section 10).

## 2. Already migrated (the reference implementation)

| Live page | Our page | Design |
|---|---|---|
| https://www.mybeckman.in/ | `/en-in` | home design |
| https://www.mybeckman.in/service | `/en-in/service` | inner design |
| https://www.mybeckman.in/service/plans | `/en-in/service/plans` | inner design |
| https://www.mybeckman.in/service/plans/centrifuge | `/en-in/service/plans/centrifuge` | inner design |

Plus the shared header (`/en-in/nav`) and footer (`/en-in/footer`). Treat these as the reference for decisions.

## 3. Setup at the start of a chat

1. Get the import tooling (shared, tooling-only branch; never switch the working branch to it):
   ```bash
   git fetch origin +migration-tooling:refs/remotes/origin/migration-tooling
   mkdir -p migration-work/importer-tooling
   git archive origin/migration-tooling | tar -x -C migration-work/importer-tooling
   ```
   `migration-work/` must be git-ignored (`/migration-work` in `.git/info/exclude`).
   The branch also carries the saved page renders and the verification scripts; put them where the tools expect them:
   ```bash
   cp -a migration-work/importer-tooling/bd-snapshots migration-work/
   cp -a migration-work/importer-tooling/raw-snapshots/. migration-work/
   cp -a migration-work/importer-tooling/verify migration-work/
   ```
2. mybeckman.in is Cloudflare-protected. Capture each new page with the scraping tool's Bright Data fallback
   (needs `BD_ENDPOINT`) into `migration-work/`; copy the snapshot it writes under
   `tools/importer/bd-snapshots/<host>/<path>.html` to `migration-work/bd-snapshots/<host>/<path>.html` and to
   `migration-work/raw-snapshot-<name>.html`, delete `tools/importer/bd-snapshots/`, then clear the bot flag with
   the site-protection utility (`--clear`) — never hand-edit `.migration/project.json`.
3. Serve a cleaned copy of the snapshot locally for measurements and side-by-side checks (consent overlay removed,
   Font Awesome CSS/webfonts restored, SVGs saved as data-URI images restored inline, footer marked
   `role=contentinfo`). media.beckman.com assets download with a browser User-Agent (`?extension=jpg` for originals).
4. Keep all helper/verification scripts in `migration-work/verify/` (never only in /tmp).
5. When a page is done, share its tooling: add the template folder, any changed library parsers/transformers,
   its snapshot (`bd-snapshots/…` and `raw-snapshots/raw-snapshot-<name>.html`) and new verify scripts to the
   `migration-tooling` branch via a separate checkout (`git worktree`) and a PR — only when I ask.

## 4. Design system already in the project

Themes (body classes):
- Home: `theme-mybeckman` — live home uses Tailwind: Inter (self-hosted, family name `mybeckman-inter`, never
  `inter`), red `#d52331`, text `#4d4d4d`, breakpoints 640/768/1024/1280/1536.
- Inner pages: `theme-mybeckman mybeckman-inner` — live inner pages use the classic Bootstrap 3 stylesheet
  (media.beckman.com/assets/css/styles.css) + an inline `<style>` per page; `html { font-size: 10px }`.
  - Gotham is replaced by self-hosted Montserrat (`mybeckman-montserrat`) with weight tokens
    `--mb-weight-regular: 420` / `--mb-weight-medium: 570` (match Gotham's stroke weight at the same width);
    blocks use `var(--mb-weight-regular, 400)` / `var(--mb-weight-medium, 500)`, bold stays 700.
  - Body 16px/1.65 `#4d4d4d`; headings weight 300, line-height 1.1, browser-default margins (h2 25px/500);
    links `#007acb`, no underline; buttons (`.btn-primary`) `#007acb`, 13px 20px, 13.5px/500, radius 2px,
    hover `#0065a7`; footer margin-top 50px; header height 113 / 117 (≥1024) / 123 (≥1120).
  - All inner rules sit at the end of `styles/brand.css` as `body.mybeckman-inner …` (same specificity as the
    home rules, later in the file). Inner hover rules must list `a.button:is(.primary, .secondary, .accent)`
    or the home red hover wins.
- Set the theme two ways: page metadata `theme` (`theme-mybeckman` or `theme-mybeckman, mybeckman-inner`, via the
  import template's `metaOverrides`) AND a `PATH_THEMES` entry in `scripts/scripts.js` for the page's path
  (Universal Editor reads page-property models from `main`, so metadata alone is not enough before a merge).
- Header/footer: blocks `header-mybeckman` / `footer-mybeckman` (always loaded; inner-page overrides at the end of
  their CSS). Reuse them; only verify them against the new page and adjust inner overrides if the page differs.

Section styles (authorable, models/_section.json): home — `light-grey-gradient`, `light-grey`, `off-white`, `split`,
`centered`, Anchor ID field; inner — default (Service `.Section`: 4vw 8vw 0, ≥768 2vw in a 1170px column), `wide`
(Plans: 2vw 4vw, ≥992 2vw 0), `wide-tall` (Centrifuge: 4vw 2vw, then as wide), `blue` (`#007acb`, white text,
outline buttons), `centered`, `split` (≥768 intro margin-right 20px, ≥992 flex 1:2), `blue, centered` = the
"Get in Touch" band. Each inner page's `.Section` padding can differ: measure it, reuse a style if identical,
otherwise add a new one-word style. Source breakpoints 768/992 are allowed (mark `/* breakpoint-exception */`).

Blocks (reuse ONLY when visually identical; otherwise create a new one):
- Home: hero-curved-panel, jump-nav, cards-promo, cards-topic-tiles, cards-service-icon (Heroicons in /icons),
  hero-photo-card, default Columns (diagnostics bar).
- Inner: hero-dim-photo (dimmed photo hero, one outline CTA), hero-dim-buttons (dimmed photo hero, subtitle,
  filled `<strong>` + outline `<em>` CTAs), cards-stats, cards-icon-border (Font Awesome icons via CSS mask),
  cards-button-caption ("Get in Touch" buttons + captions — reused on every inner page), cards-benefit-check,
  cards-product-plan (4-up product cards), table-plan-compare (plan comparison table: groups `Label: n`,
  highlighted column, `:dot:` / `:dot-ring:` tokens), Columns (media) (350px images, click-to-play Wistia),
  Columns (cta) (two text columns, buttons aligned), breadcrumb-mybeckman (auto block on inner pages ≥2 levels
  below /en-in; labels from the URL or `breadcrumb-title` metadata).
- Icons: Font Awesome Free 5.15.4 SVGs in `/icons` (`:fa-name:` tokens).

## 5. Per-page workflow

1. Capture and serve the source (section 3).
2. Page analysis: split into sections; per section decide default content (headings/text/buttons an author types)
   vs block; for each block decide reuse (identical) / new block / new one-word Columns variant / new section style.
   Measure computed styles at 1440 and 390 and read the page's inline `<style>` + the classic stylesheet rules.
3. Block generation for new blocks: write a manifest with the measured source values and these constraints:
   block-scoped CSS, mobile first, inner font/weight tokens, `rowContentCells(row)` from `scripts/scripts.js` for
   every row, models per section 6, add to the section filter, `npm run build:json`, `npm run lint`, no test pages
   under `content/`.
4. Block mapping: selectors + sections in `tools/importer/page-templates.json` (validate the schema).
5. Import tooling: a template folder `migration-work/importer-tooling/mybeckman-<name>/`
   (`page-templates.json` with `site: mybeckman`, blocks, sections, `pathMap`, `metaOverrides` incl. theme,
   optional `sectionAnchors`, `hrefOverrides`; `image-map.json`). Reuse/extend the parsers in
   `lib/mybeckman/parsers` (one per block) and the library transformers (cleanup + sections).
6. Import: back up `tools/importer/page-templates.json`, run
   `BD_SNAPSHOT_DIR=$PWD/migration-work/bd-snapshots bash migration-work/importer-tooling/shared/run-import.sh mybeckman-<name>`
   (it deletes `tools/importer/`), restore the backup, clear the bot flag. Check text completeness against the source.
7. Authoring conversion check on the page (all pages must convert) and fix models/parsers until it passes.
8. Design pass and verification (section 8). Fix until ≥95% at 1440 and only font-wrap/intended differences remain.
9. Summary: what was built/reused, live bugs not copied, remaining differences, files changed, what to sync.

## 6. Content and authoring rules (xwalk)

- Links: links to pages we migrated → relative `/en-in/...` (add the new page to the `pathMap` of EVERY mybeckman
  template and re-import the pages that link to it — but ask before re-importing the home page); every other
  mybeckman.in link → absolute `https://www.mybeckman.in/...`; `tel:` normalised (digits only); in-page anchors via
  `hrefOverrides` + `sectionAnchors` (or heading ids); external links unchanged.
- Images: every image of a page in that page's own folder `content/en-in/<path>/` with descriptive names and
  meaningful alt text, web-size (`convert -strip -interlace Plane -quality 85`; resize huge originals).
  Never put an image inside a link (author image and link separately).
- Video: embedded and playable (click-to-play, no third-party script before the click).
- Third-party (search, Marketo forms, cookie banner): look like the live site, hand off to the live working version.
- Conversion pitfalls:
  - Columns variants survive only as ONE-WORD classes on the `columns` block (`Columns (media)`) and need the
    columns model's `classes` field; a block name or hyphenated class is lost.
  - Never put `|` inside a field value (use `Label: 3`); multi-value fields authored as lists get concatenated —
    use one text field with a comma list.
  - Authoring wraps rich text in extra elements and stored `<p><h2>…</h2></p>` arrives as empty paragraphs →
    every block reads rows through `rowContentCells(row)`.
  - The button paragraph class is `p.button-wrapper`; source buttons that are bare `<a class="btn">` are wrapped as
    `<p><strong><a>` by the cleanup transformer.
  - Block rows max 4 cells (lint rule); raise it only per model in `.eslintrc.js` when unavoidable.
- Never create `content/<page>.html` next to a `.plain.html`; small content fixes = direct edit of the `.plain.html`
  (tell me it's local only).

## 7. Things not to do

- Don't modify `scripts/aem.js`. Don't restyle shared blocks/sections in a way that changes migrated pages.
- Don't accept or ask for tokens in chat; if git/DA returns 401/403, tell me to enable the permission in
  Settings → LLM Permissions.
- Don't delete files under `content/` (tell me which ones to delete).

## 8. Verification (every page)

- Box-and-style comparison source vs ours per key element at 1440, 1024, 768, 390; pixel compare
  (ImageMagick `compare -metric AE -fuzz 8%`); hover/focus states of every button and link type.
- Authoring simulation: render the converted page (JCR) the way authoring delivers it (plain, wrapped rich text,
  icons as `span.icon`, content on the row) — all variants must render identically.
- Regression: `node migration-work/verify/style-dump.mjs dump <url> <file>` for every already migrated page
  before and after shared changes; 0 differences required (`… diff <before> <after>`).
- `npm run lint` clean.

## 9. Speed rules

- Reuse before building: check the block list in section 4 first; reuse the parser library and verification
  scripts instead of writing new ones; batch pages of the same template.
- Generate a block with its final design in one pass (manifest carries the measured source CSS).
- Don't re-verify untouched pages beyond the regression dump.

## 10. Ask me only when

- A component is ambiguous between two existing blocks or a live behaviour can't be reproduced.
- A live bug's "intended design" is unclear.
- A change would alter an already migrated page or the shared header/footer.
- Anything outward-facing (push, PR, publish, Document Authoring).
