# Migration tooling (mybeckman.in)

Import tooling for the mybeckman.in pages migrated in exact-match mode into this project. This branch holds
tooling only and is never merged into `main`. `.hlxignore` keeps these files from being served by Edge Delivery.
The blocks, styles and models the imports target live on the design branch `mybeckman-design-match`.

Pages covered:

| Template | Live page | Our page |
|---|---|---|
| `mybeckman-home` | https://www.mybeckman.in/ | `/en-in` (home design: Inter, Tailwind-based) |
| `mybeckman-service` | https://www.mybeckman.in/service | `/en-in/service` |
| `mybeckman-plans` | https://www.mybeckman.in/service/plans | `/en-in/service/plans` |
| `mybeckman-centrifuge` | https://www.mybeckman.in/service/plans/centrifuge | `/en-in/service/plans/centrifuge` |

## Layout

| Folder | Contents |
|---|---|
| `shared/` | `run-import.sh` (copies a template into `tools/importer`, imports, deletes `tools/importer`), `gen-import.cjs` (builds the import script: link rules, path map, image map, metadata overrides), `beckmancoulter-0-links.js` (link step, runs first), `make-image-map.cjs` |
| `lib/mybeckman/parsers/` | one parser per block (hero-curved-panel, jump-nav, cards-promo, cards-topic-tiles, cards-service-icon, hero-photo-card, columns-diagnostics-bar, hero-dim-photo, cards-stats, cards-icon-border, cards-button-caption, cards-benefit-check, cards-product-plan, columns-media-text → `Columns (media)`, hero-dim-buttons, table-plan-compare, columns-cta → `Columns (cta)`) |
| `lib/mybeckman/transformers/` | cleanup (removes chrome, keeps Font Awesome icons for icon cards, wraps bare source buttons as `<p><strong><a>`) and sections (section styles and `sectionAnchors`) |
| `<template>/` | `page-templates.json` (`site: mybeckman`, blocks, sections, `pathMap`, `metaOverrides` incl. theme, optional `sectionAnchors`, `hrefOverrides`), `image-map.json`, optional `link-overrides.json`; the home template has its own transformers |
| `bd-snapshots/` | saved renders the imports read (`www.mybeckman.in/<path>.html`, scripts stripped) |
| `raw-snapshots/` | full saved renders per page (`raw-snapshot-<name>.html`) for analysis and side-by-side checks |
| `verify/` | verification scripts, e.g. `style-dump.mjs` (computed-style dump/diff for regression checks) |
| `MIGRATION-BRIEF.md` | the standing brief to attach in a new chat with each page URL: goal, design system, blocks, workflow, rules |

## Rules the tooling applies

- Links: mybeckman.in pages we migrated (`pathMap`) → relative `/en-in/...`; every other mybeckman.in link →
  absolute `https://www.mybeckman.in/...`; `tel:` normalised; in-page anchors via `hrefOverrides` +
  `sectionAnchors` or heading ids. Add each newly migrated page to the `pathMap` of every template.
- Images: each page's images in its own folder `content/en-in/<path>/`, descriptive names, web-size.
- Page metadata `theme`: `theme-mybeckman` (home) or `theme-mybeckman, mybeckman-inner` (inner pages).

## Use it in a workspace (stay on your own working branch)

```bash
git fetch origin +migration-tooling:refs/remotes/origin/migration-tooling
mkdir -p migration-work/importer-tooling
git archive origin/migration-tooling | tar -x -C migration-work/importer-tooling
```

`migration-work/` should be git-ignored (add `/migration-work` to `.git/info/exclude`). Then put the snapshots and
verify scripts where the tools expect them:

```bash
cp -a migration-work/importer-tooling/bd-snapshots migration-work/
cp -a migration-work/importer-tooling/raw-snapshots/. migration-work/
cp -a migration-work/importer-tooling/verify migration-work/
```

mybeckman.in is Cloudflare-protected, so imports run from saved renders:

```bash
BD_SNAPSHOT_DIR=$PWD/migration-work/bd-snapshots bash migration-work/importer-tooling/shared/run-import.sh <template>
```

- Snapshots live at `migration-work/bd-snapshots/www.mybeckman.in/<path>.html` (scripts stripped). Capture a new
  page with the Bright Data scrape (needs `BD_ENDPOINT`), which writes `tools/importer/bd-snapshots/...`; copy it to
  `migration-work/bd-snapshots/` and add it to this branch's `bd-snapshots/` (and `raw-snapshots/`) with the page's
  template when you share it.
- Afterwards clear the protection flag the importer sets: `node <excat>/utils/site-protection.js --clear`.
- `run-import.sh` deletes `tools/importer/`: back up `tools/importer/page-templates.json` first.
- The home template now also picks up an "Upcoming events" section from the saved home render that the
  approved page doesn't have; review the diff before keeping a home re-import.

## xwalk conversion gotchas (content that must survive html2md + md2jcr)

- Columns variants survive only as **one-word classes** on the `columns` block (`Columns (media)`), and only
  if the columns model has a `classes` field; a block name or a hyphenated class is lost.
- Never put a `|` inside a field value (it is the grid-table cell delimiter); use e.g. `Label: 3`.
- Multi-value text fields authored as lists are joined without a separator; use one text field with a
  comma-separated value instead.
- Stored `<p><h2>...</h2></p>` reaches the browser as empty paragraphs around the heading; blocks read rows
  through `rowContentCells(row)` (scripts.js on the design branch) to cope with that and with wrapped rich text.

## Sharing new or updated parsers

Commit only tooling files to this branch from a separate checkout (e.g. `git worktree add /tmp/mt migration-tooling`),
then push. Never switch your working branch to this one.
