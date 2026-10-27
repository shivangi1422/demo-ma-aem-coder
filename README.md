# Migration tooling (shared)

Import tooling used to migrate live pages into this project's existing blocks, as **content only**:
no block, model, style or script changes. This branch holds tooling only and is never merged into `main`.
`.hlxignore` keeps these files from being served by Edge Delivery.

## Rules the tooling applies

- Existing blocks and variants only; no design migration.
- Links:
  - pages already migrated → relative paths;
  - everything else on the live site → absolute live URL;
  - in-page jump links → the target section's heading id;
  - `tel:` numbers normalised;
  - approved fixes for broken or expiring links via `hrefOverrides`.
- Images: every image of a page goes in that page's own folder (page path without the locale), with descriptive names. Sync → Content uploads them to `<AEM Assets root>/<folder>/<name>`.

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

After the import, run `git checkout -- .migration/project.json`: the importer sets a `botProtected` flag there.

## Sharing new or updated parsers

Commit only tooling files to this branch from a separate checkout (e.g. `git worktree add /tmp/mt origin/migration-tooling`), then push. Never switch your working branch to this one.
