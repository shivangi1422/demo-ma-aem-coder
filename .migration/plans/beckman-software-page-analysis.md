# Software Page Migration Plan: mybeckman.in/software → AEM

## Status
**Planning is still on. Running the migration needs Execute mode.** Switch to Execute mode and the migration will start at the first checklist item. Nothing has been changed in the project yet.

## Objective
Move the content and layout of https://www.mybeckman.in/software into this AEM Edge Delivery (Universal Editor / XWalk) project. The result should be a page authors can edit, built from reusable blocks, that renders close to the original in the local preview.

## Context
- **Project type:** XWalk / Universal Editor (AEM Sites author, site path `/content/demo-ma-aem-coder`, assets in `/content/dam/demo-ma-aem-coder`)
- **Blocks already in the project:** `hero`, `cards-grid`, `quote`. These are reused where they fit, and new blocks are added only where needed.
- **Import setup:** there is no page template mapping or import script in the project yet. This page sets that up from scratch, as a new "software" template.
- **Earlier analysis plan:** the analysis planned for this page earlier was never run. Phase 1 below does it as part of the migration.
- **Possible risk:** `mybeckman.in` is a commerce storefront, so it may have bot protection, client-side rendering, prices, add-to-cart, or login-gated content. Dynamic commerce features can't be migrated as static content. They will be flagged, and simplified to static content or links where it makes sense.

## Approach

### Phase 1: Analyse the page
1. Scrape the page: metadata, images, full-page screenshot, cleaned HTML. If the plain scrape is blocked, use the protected-site fallback.
2. Split the page into sections and content sequences.
3. For each section, decide what is default content and what needs a block.
4. Compare those needs with the project's blocks and the block library, and assign variant names. Reuse a block when it is at least 80% similar.
5. Record section styles such as backgrounds and spacing.

### Phase 2: Block mapping
6. Add the "software" page template, the DOM selector mappings for each block, and the section mappings to the import configuration.

### Phase 3: Blocks
7. Write code for any new blocks or variants (JS, CSS, and Universal Editor component models). Extend `hero`, `cards-grid` and `quote` when that's enough.
8. Rebuild the combined component definitions, models and filters, and lint the models.

### Phase 4: Import infrastructure
9. Write the cleanup and section transformers: strip cookie banners, header/footer, and commerce widgets, and turn section breaks and styles into section markup.
10. Write a parser for each block variant.
11. Bundle the "software" template import script.

### Phase 5: Content import
12. Run the import for https://www.mybeckman.in/software to create the local page content.
13. Check the imported page in the preview: every block renders, nothing is missing, and images and links resolve.

### Phase 6: Design and visual check
14. Style the migrated blocks to match the source's computed styles.
15. Compare the source and the preview side by side and fix differences, at block level and for the whole page.

### Phase 7: Wrap-up
16. Run lint (JS, CSS, models) and fix any issues.
17. Summarise what was migrated, what was simplified or left out (commerce or dynamic features), and the next steps.

## Scope Notes
- **In scope:** the main content of the software page and the blocks, models, styles and import tooling it needs.
- **Not in scope unless you ask:** global header/navigation and footer, which have their own migrations; other pages or a site-wide catalogue; live commerce features such as pricing, cart and account.
- **Local only:** all changes stay in the local workspace and preview. Nothing is uploaded to Document Authoring or AEM, previewed remotely, published, or committed/pushed to git unless you ask.

## Deliverables
- Analysis artifacts: screenshot, cleaned HTML, section and block breakdown, authoring decisions
- Import configuration with the "software" template and its block and section mappings
- New or extended blocks with Universal Editor models, and rebuilt component JSON files
- Import transformers, parsers, and the bundled import script
- The imported software page in local content, checked in the preview
- Block styling that matches the source, with a visual comparison summary
- Final report with migrated items, gaps and risks, and next steps

## Checklist
- [ ] Switch to Execute mode
- [ ] Confirm the project type (XWalk) and the block library context
- [ ] Scrape https://www.mybeckman.in/software (use the protected-site fallback if blocked)
- [ ] Analyse the page: sections, content sequences, default content vs blocks
- [ ] Assign block variants (reuse `hero`, `cards-grid`, `quote` at ≥80% similarity)
- [ ] Flag commerce, dynamic and login-gated elements and decide how to handle each
- [ ] Add the "software" template with block and section mappings to the import configuration
- [ ] Write or extend block code and Universal Editor models for the variants that need it
- [ ] Rebuild the component definitions, models and filters, and lint the models
- [ ] Write the cleanup and section transformers
- [ ] Write a parser for each block variant
- [ ] Bundle the "software" template import script
- [ ] Run the import for the software page
- [ ] Check the imported page in the preview (blocks, images, links)
- [ ] Style the blocks to match the source design
- [ ] Compare source and preview visually and fix differences
- [ ] Run the full lint and fix issues
- [ ] Present the migration summary: what was migrated, gaps, next steps
