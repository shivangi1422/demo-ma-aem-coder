# Migration tooling (shared)

Import tooling used to migrate live pages into this project. This branch holds tooling only and is never
merged into `main`. `.hlxignore` keeps these files from being served by Edge Delivery.

Two kinds of templates:
- **Content only** (beckmancoulter.com templates, `mybeckman-*-content-only.page-templates.json` backups):
  existing blocks and variants only, no block, model, style or script changes.
- **Exact match** (`mybeckman-home`, `mybeckman-service`, `mybeckman-plans`, `mybeckman-centrifuge`):
  pixel-match imports into the mybeckman.in home / inner-page design and the dedicated blocks built for it
  (hero-dim-photo, hero-dim-buttons, cards-stats, cards-icon-border, cards-button-caption,
  cards-benefit-check, cards-product-plan, table-plan-compare, Columns (media) / (cta) variants, ...).
  Those blocks live on the design branch `mybeckman-design-match`, not here.

## Rules the tooling applies

- Links:
  - pages already migrated → relative paths;
  - everything else on the live site → absolute live URL;
  - in-page jump links → the target section's heading id;
  - `tel:` numbers normalised;
  - approved fixes for broken or expiring links via `hrefOverrides`.
- Images: every image of a page goes in that page's own folder (page path without the locale), with descriptive names. Sync → Content uploads them to `<AEM Assets root>/<folder>/<name>`.
- Section anchors: a template's `sectionAnchors` (`{ "<section id>": "<anchor>" }`) adds an `anchor` row to the
  section metadata (supported by the mybeckman library sections transformer and the home copy).
- Every mybeckman template carries the same `pathMap`; add each newly migrated page to all of them and re-run.

## xwalk conversion gotchas (content that must survive html2md + md2jcr)

- Columns variants survive only as **one-word classes** on the `columns` block (`Columns (media)`), and only
  if the columns model has a `classes` field; a block name or a hyphenated class is lost.
- Never put a `|` inside a field value (it is the grid-table cell delimiter); use e.g. `Label: 3`.
- Multi-value text fields authored as lists are joined without a separator; use one text field with a
  comma-separated value instead.
- Stored `<p><h2>...</h2></p>` reaches the browser as empty paragraphs around the heading; blocks read rows
  through `rowContentCells(row)` (scripts.js on the design branch) to cope with that and with wrapped rich text.

## Layout

| Folder | Contents |
|---|---|
| `shared/` | `gen-import.cjs` (builds the import script; adds link rules, path map, image map, metadata overrides), `beckmancoulter-0-links.js` (link step, runs first), `make-image-map.cjs`, `run-import.sh` |
| `<template>/` | `page-templates.json`, `parsers/`, `transformers/`, and optional `image-map.json` and `link-overrides.json` |

Templates:
- **beckmancoulter.com:** `products`, `products-legacy`, `solutions`, `blog`.
- **mybeckman.in:** `mybeckman-*`, which land under `/en-in/...`.

## Use it in a workspace (stay on your own working branch)

From the project root:

```bash
git fetch origin migration-tooling
mkdir -p migration-work/importer-tooling
git archive origin/migration-tooling | tar -x -C migration-work/importer-tooling
```

`migration-work/` should be git-ignored. Add `/migration-work` to `.git/info/exclude` if it isn't.

Import one template:

```bash
bash migration-work/importer-tooling/shared/run-import.sh <template>
```

For Cloudflare-protected sites (mybeckman.in), also set:
- `BD_SNAPSHOT_DIR=$PWD/migration-work/bd-snapshots`: saved renders at `<host>/<path>.html`, with scripts stripped. These snapshots are not in this branch.
- New pages: capture one with the Bright Data scrape (needs `BD_ENDPOINT`), which writes
  `tools/importer/bd-snapshots/<host>/<path>.html`; copy it to `migration-work/bd-snapshots/` and clear the
  protection flag (`site-protection.js --clear`).

`run-import.sh` deletes `tools/importer/`: back up `tools/importer/page-templates.json` first if you keep one there.

After the import, run `git checkout -- .migration/project.json`: the importer sets a `botProtected` flag there.

## Sharing new or updated parsers

Commit only tooling files to this branch from a separate checkout (e.g. `git worktree add /tmp/mt origin/migration-tooling`), then push. Never switch your working branch to this one.
