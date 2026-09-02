# Figma-to-Independent-Blocks Migration Plan

## Overview
Migrate the Figma design (ContentGenAI, node `214-563`) into **multiple independent, reusable AEM Edge Delivery Services blocks** — one block per distinct section of the frame — rather than a single combined block. Each block gets its own `.js`, `.css`, and Universal Editor model so authors can add, remove, reorder, and reuse them independently. This uses the dedicated Figma-to-EDS tooling to extract the design and content directly from Figma.

> **Status:** Plan approved by the user and final. Execution remains blocked because the harness is still enforcing **Plan mode** (read-only). The mode must switch to Execute before any files can be written or the Figma fetch retried.

> **Note:** This project is a Universal Editor (crosswalk/xwalk) project, so each block also requires a `_{blockname}.json` model, a `models/_section.json` filter entry, and a `npm run build:json` regeneration step.

## Source
- **Figma file:** ContentGenAI (`di82oKZ00hH1BNqHJ3waL3`)
- **Node:** `214-563`
- **Structure:** unknown until the frame is read — the number and type of blocks will be determined from Figma metadata.

## Known Blockers
- **Plan mode still active:** despite repeated approvals, the harness continues to enforce read-only plan mode, so execution tools are unavailable. Switching to Execute mode is required.
- **Figma service:** was rate-limiting (HTTP 429) and the Figma MCP tooling has been reconnecting after a service restart. The frame structure could not be read yet; execution will retry the fetch first.

## Checklist

- [ ] **Confirm Figma tooling is loaded** — ensure the Figma-to-EDS migration tooling/skill is available after the service restart; retry the design fetch until it succeeds.
- [ ] **Read frame structure** — fetch metadata for node `214:563` to enumerate the sections and capture a reference screenshot.
- [ ] **Segment into independent blocks** — identify each distinct section as its own block (hero, cards, columns, etc.) and assign a variant name to each.
- [ ] **Per block — check for reuse** — compare each section against existing blocks/variants; reuse where a match exists, create where it doesn't.
- [ ] **Per block — extract design tokens** — pull exact layout, colors, typography, spacing, and assets for each block.
- [ ] **Per block — build the block** — create `blocks/{blockname}/{blockname}.js` + `.css` (mobile-first, scoped, accessible), plus the `_{blockname}.json` UE model.
- [ ] **Per block — register in UE** — append each block to `models/_section.json`'s section filter.
- [ ] **Regenerate aggregates** — run `npm run build:json` so all new blocks appear in Universal Editor.
- [ ] **Per block — generate content** — produce EDS plain HTML with field hints; download images locally.
- [ ] **Preview & verify** — render each block in the local preview and compare against the Figma design; iterate on CSS until each matches.
- [ ] **Lint & validate** — run `npm run lint` (and `lint:fix`) and confirm model rules pass.
- [ ] **Summarize** — report every block created/reused, its content model, and how to author it.

## Open Questions (resolve once the frame is readable)
- How many sections the frame contains and what block type each maps to.
- Whether any section matches an existing block variant (reuse vs. create).

## Execution Readiness
Plan is approved and final — no further planning changes are needed. The only remaining blocker is the **Plan mode toggle**, which is still active on the harness side and blocks all write and fetch operations. Please switch the session to **Execute mode** (the plan-mode toggle in the UI). The moment Execute mode is active I will begin immediately: retry the Figma design fetch for node `214:563`, segment the frame into independent blocks, and work through the per-block build/verify workflow above.
