# Figma-to-Block Migration Plan

## Overview
Migrate the Figma design (ContentGenAI, node `214-1472`) into a reusable AEM Edge Delivery Services block using the dedicated Figma-to-EDS tooling to extract the design and content directly from Figma, then generate a properly modeled, styled, and authorable block.

> **Status:** Plan approved and final. The harness continues to report **Plan mode**, which blocks all fetch/write operations. I cannot switch modes from inside a response — it must be toggled in the UI.

> **Note:** This is a Universal Editor (crosswalk/xwalk) project, so the block also requires a `_{blockname}.json` model, a `models/_section.json` filter entry, and a `npm run build:json` regeneration step.

## Source
- **Figma file:** ContentGenAI (`di82oKZ00hH1BNqHJ3waL3`)
- **Node:** `214-1472` (new target — a different node than the earlier `214-563` work)
- **Structure:** unknown until the frame is read — block type and content model will be determined from Figma metadata.

## Known Risk
- The Figma design API has been persistently returning HTTP 429 ("rate limit exceeded") across this session. The migration cannot start until a design fetch succeeds. If it's still throttled, execution will retry with cooldowns; if it stays blocked, an exported image of the frame is a fallback input.

## Checklist

- [ ] **Confirm Figma tooling is loaded** — ensure the Figma-to-EDS migration tooling is available and the design fetch succeeds (retry through rate-limit if needed).
- [ ] **Read frame structure** — fetch metadata for node `214:1472`, capture a reference screenshot.
- [ ] **Identify block type** — determine the matching EDS block type (hero, cards, columns, etc.) and assign a variant name.
- [ ] **Check for reuse** — compare against existing blocks/variants; reuse a match or create a new variant.
- [ ] **Extract design tokens** — pull exact layout, colors, typography, spacing, and assets.
- [ ] **Build the block** — create `blocks/{blockname}/{blockname}.js` + `.css` (mobile-first, scoped, accessible) and the `_{blockname}.json` UE model.
- [ ] **Register in UE** — append the variant to `models/_section.json`'s section filter.
- [ ] **Regenerate aggregates** — run `npm run build:json` so the block appears in Universal Editor.
- [ ] **Generate content** — produce EDS plain HTML with field hints; download images locally.
- [ ] **Preview & verify** — render in the local preview and compare against the Figma design; iterate on CSS until it matches.
- [ ] **Lint & validate** — run `npm run lint` (and `lint:fix`) and confirm model rules pass.
- [ ] **Summarize** — report the block created/reused, its content model, and how to author it.

## Open Questions (resolve once the frame is readable)
- What block type node `214-1472` maps to.
- Whether it matches an existing block variant (reuse vs. create).

## Execution Readiness
Plan is approved and final — it will not change on further approval messages. Execution is gated solely on the session being in **Execute mode**; the harness still reports Plan mode, and each "switch to execute mode" message is arriving back to me still flagged as Plan mode. I cannot change the mode from within a response — it is a toggle in the UI (typically Shift+Tab to cycle modes, or the mode selector). Please flip that toggle to Execute. The moment the session is actually in Execute mode I'll begin immediately: fetch node `214:1472`, identify the block type, and work through the build/verify workflow above. If the Figma rate limit persists, I'll retry with cooldowns and, if still blocked, ask you for an exported image of the frame as a fallback.
