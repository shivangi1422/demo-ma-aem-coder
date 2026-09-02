# Figma-to-Blocks Migration Plan

## Overview
Migrate the Figma design (ContentGenAI, node `214-563`) into reusable AEM Edge Delivery Services **blocks** using the dedicated Figma-to-EDS tooling to extract the design and content directly from Figma, then generate properly modeled, styled, and authorable blocks. If the frame contains multiple distinct sections, each becomes its own independent block.

> **Note:** This is a Universal Editor (crosswalk/xwalk) project, so each block also requires a `_{blockname}.json` model, a `models/_section.json` filter entry, and a `npm run build:json` regeneration step.

## Source
- **Figma file:** ContentGenAI (`di82oKZ00hH1BNqHJ3waL3`)
- **Node:** `214-563` (the prototype URL points at the same design node `214:563`)
- **Structure:** unknown until the frame is read — block count, types, and content models will be determined from Figma metadata.

## Known Risk / Blocker
- The Figma design API has been failing this session: first HTTP 429 ("rate limit exceeded"), then HTTP 403 ("Invalid token"). The 403 is an **authentication failure** — the injected Figma credential is invalid/expired or lacks access to this file. You indicated you'd re-check Figma access in Settings → LLM Permissions. Migration cannot start until a design fetch succeeds. If auth stays broken, an exported PNG/JPG of the frame is the fallback input.

## Checklist

- [ ] **Verify Figma access** — after you re-enable/refresh the Figma credential in Settings, confirm the design fetch authenticates (no 403/429).
- [ ] **Read frame structure** — fetch metadata for node `214:563`, capture a reference screenshot.
- [ ] **Segment & identify blocks** — determine whether it's one block or several; map each section to an EDS block type (hero, cards, columns, etc.) and assign variant names.
- [ ] **Per block — check for reuse** — compare against existing blocks/variants; reuse a match or create a new variant.
- [ ] **Per block — extract design tokens** — pull exact layout, colors, typography, spacing, and assets.
- [ ] **Per block — build the block** — create `blocks/{blockname}/{blockname}.js` + `.css` (mobile-first, scoped, accessible) and the `_{blockname}.json` UE model.
- [ ] **Per block — register in UE** — append each variant to `models/_section.json`'s section filter.
- [ ] **Regenerate aggregates** — run `npm run build:json` so the blocks appear in Universal Editor.
- [ ] **Per block — generate content** — produce EDS plain HTML with field hints; download images locally.
- [ ] **Preview & verify** — render each block in the local preview and compare against the Figma design; iterate on CSS until it matches.
- [ ] **Lint & validate** — run `npm run lint` (and `lint:fix`) and confirm model rules pass.
- [ ] **Summarize** — report every block created/reused, its content model, and how to author it.

## Open Questions (resolve once the frame is readable)
- Whether node `214-563` is a single block or multiple sections → multiple independent blocks.
- What block type(s) it maps to and whether any match existing variants (reuse vs. create).

## Execution Readiness
Plan is ready. Execution requires **Execute mode** and a working Figma connection. On execution I'll first retry the fetch for node `214:563`; if it still returns 403/429, I'll pause and ask you to confirm the Figma credential is refreshed in Settings, or to provide an exported image of the frame as a fallback. Once the fetch succeeds I'll work through the per-block build/verify workflow above.
