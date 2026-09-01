# Figma-to-Block Migration Plan

Migrate the Figma design at node `214-563` of the **ContentGenAI** file into AEM Edge Delivery block(s), matching layout, styling, and content, then verify in preview.

> **Status: Ready for execution.** You approved enabling the **excat-figma** plugin and asked to proceed. Execution requires **Execute mode** — the very first step (writing `.agents/settings.json`) is a file write and cannot run in Plan mode. Once Execute mode is active, I will: write the settings file to enable the plugin, briefly confirm, and stop for that turn (the plugin reinitializes on your next message); then on the following turn invoke the excat-figma migration skill and work through the checklist automatically.

## Source
- **Figma file:** `di82oKZ00hH1BNqHJ3waL3` (ContentGenAI)
- **Node:** `214-563`
- **URL:** https://www.figma.com/design/di82oKZ00hH1BNqHJ3waL3/ContentGenAI?node-id=214-563
- **Note:** In the earlier Beckman Coulter migration this node was the full page frame (11 blocks). Step 1 re-inspects it to confirm whether this request targets a single component or the frame, and scopes the work to what's actually needed.

## Prerequisite (agreed)
- You approved enabling the **excat-figma** plugin. The migration uses its Figma extraction + block-generation tooling rather than manual extraction.
- The plugin activates only after `.agents/settings.json` is written and your next message triggers reinit; its skills/tools are unavailable until then.

## Approach
1. Enable the plugin, let it reinitialize, then invoke the Figma migration skill on node `214-563`.
2. Extract the design: layout, content (text/images), and exact styles (colors, typography, spacing, sizing) via the plugin's design-context tools.
3. Survey the existing block palette (hero, cards, columns, carousel-instruments, navigation, site-footer, form) to decide reuse vs. new block/variant.
4. For each in-scope component: decide the content model, author-editable fields, and initial content structure before writing code.
5. Build the block(s) — `blockname.js`, `blockname.css`, `_blockname.json` — following the boilerplate conventions.
6. Regenerate aggregated JSON and validate against xwalk lint rules.
7. Create static test content and verify rendering in preview, iterating on CSS/JS until it matches the design.

## Checklist
- [ ] Write `.agents/settings.json` with `{"enabledPlugins": {"excat-figma@excat-extended": true}}` to enable the plugin, then stop for the turn (reinit fires on next message)
- [ ] After reinit, invoke the excat-figma migration skill on node `214-563`
- [ ] Inspect the node: confirm single component vs. full frame; scope the work accordingly
- [ ] Extract layout, content, and exact styles from Figma (handle image-asset extraction / rate limits)
- [ ] Survey existing blocks to decide reuse, new variant, or new block
- [ ] Define the content model and initial content structure (author-editable fields)
- [ ] Determine block name(s) from the design's purpose
- [ ] Create/modify block files: `blockname.js`, `blockname.css`, `_blockname.json`
- [ ] Register the block as an allowed section child (add to `models/_section.json` filter) if new
- [ ] Run `npm run build:json` to regenerate aggregated definitions/models/filters
- [ ] Create static test content to exercise the block
- [ ] Render in local preview and visually verify against the Figma design
- [ ] Confirm responsive behavior (mobile / tablet / desktop)
- [ ] Run `npm run lint` and fix any issues
- [ ] Swap in real Figma image assets (pending from earlier migration; API was rate-limited)

## Open Questions / Notes
- Final block name(s) and content model are confirmed after inspecting the actual design content.
- If node `214-563` resolves to the already-migrated full page, I'll confirm with you whether to re-migrate, target a specific sub-node, or refine the existing blocks before proceeding.
