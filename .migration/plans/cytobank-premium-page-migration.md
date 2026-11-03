# Cytobank Premium Page Analysis & Migration Plan

## Status
This is a plan only. Carrying it out needs Execute mode, and nothing has been changed yet.

## Objective
- **Analyse the live page:** https://www.mybeckman.in/flow-cytometry/software/cytobank-premium in full, covering structure, components and content.
- **Migrate it** into the project, reusing the product-detail setup built for Cytobank Enterprise. That setup includes:
  - the template: `software-product-detail`
  - the blocks: product-hero, page-tabs, feature-columns, product-table, spec-table, resource-list and related-products
  - the design tokens
- **Match the live design system:** wherever Premium differs from Enterprise, extend the blocks or the import so the result still matches the live page.

## Context
- **Site:** mybeckman.in, protected by bot protection. Capture and import go through the protected-site browser.
- **Hierarchy:** Premium is a child of Flow Cytometry Software. The migrated parent is `/content/sai/flow-cytometry/software`, so the new page goes to `/content/sai/flow-cytometry/software/cytobank-premium`. Its nav, footer and breadcrumbs come from the `sai` site root.
- **Earlier probe of the live page:**
  - **Same as Enterprise:** the product spotlight layout, the tab bar (Features · Licenses · Content and Resources · Technical Documents · Related Products), feature columns, specifications, the resource list, related products, and the Resources + Tools grid.
  - **Different:** the hero has no `.twobuttons` button pair, so its calls to action are built differently and need checking. The licence table holds Premium licences, which have their own filter values and counts.
- **What's already in place:**
  - **Licence table:** it is filled at runtime by the site's search service. The importer reads licence data captured per page from `tools/importer/data/product-tables.js`, so Premium needs its own capture.
  - **Image fixes:** `www.mybeckman.in/pimassets` images are rewritten to `plytix-files.com`. `media.beckman.com` images keep only their `?rev=` setting.
- **Constraints:**
  - Don't change existing global styles in ways that alter the Software pages or Cytobank Enterprise. Regression-check those pages after any shared change.

## Approach

### Phase 1: Live capture
1. Capture the page at desktop (1440) and mobile (390):
   - full screenshots
   - the rendered `#main` markup
   - computed styles
   - page metadata and breadcrumb labels
   - images, links and interactive elements (lightbox, sticky tabs, carousel, resource filter)
2. Capture the licence table's live search results:
   - every results page, the filter groups with their counts, and the card markup
   - the filter behaviour: which values combine and how counts change
   - the Add to Quote target

   If the search service blocks the capture browser, retry the same way that worked for Enterprise: wait longer, then check results on desktop.
3. Measure the layout at the breakpoints found earlier (1440, 1200, 1024, 992, 768, 600, 390) so the comparison has live reference values.

### Phase 2: Full page analysis
4. Run the formal page analysis on Premium: sections, sequences, default content vs blocks, section styles, and the dynamic, commerce and gated elements. Archive the outputs to `migration-work/analysis/cytobank-premium/` and save the snapshot under `tools/importer/bd-snapshots/`.
5. Diff Premium against Enterprise, section by section, in the source markup and in the computed styles. Then sort every difference into one of three groups:
   - **Covered:** the existing blocks and parsers already handle it.
   - **Content or parser difference:** for example the hero calls to action, different spec rows, different facet values, or extra or missing sections.
   - **New design pattern:** something the current blocks or CSS can't produce. It needs a block variant or a CSS extension.
6. Write the analysis report: structure, component inventory, content inventory (headings, copy, CTAs, links, images and alt text, licences, resources, related products), dynamic elements, and accessibility notes.

### Phase 3: Template and design system
7. Confirm Premium uses the `software-product-detail` template, and add its URL to the template in `tools/importer/page-templates.json`.
8. Extend `styles/brand.css`, `styles/styles.css` or the block CSS only for genuinely new patterns. Keep each change scoped to the template or block, then regression-check the four Software pages and Cytobank Enterprise.

### Phase 4: Blocks and import tooling
9. **Hero:** adapt the product-hero parser and block to Premium's call-to-action markup, whatever replaces `.twobuttons`. Keep the authoring model unchanged and backwards compatible.
10. **Licence table:** add Premium's captured licence data to `tools/importer/data/product-tables.js`, keyed by `/flow-cytometry/software/cytobank-premium`. Cross-check the filter counts against the live panel.
11. **Other differences:**
    - Update the cleanup transformer and parsers for any other differences in quirks, hidden duplicates or missing sections.
    - Make sure the page-tabs anchors resolve to Premium's headings.
    - Keep the image address fixes (plytix and `?rev`) applying.
12. Rebundle the `software-product-detail` import script.

### Phase 5: Import and validation
13. Import Premium into `content/sai/flow-cytometry/software/cytobank-premium.plain.html`, with links pointing at migrated pages under `/sai`.
14. Run three checks:
    - main-content text coverage against the live markup, aiming for no missing words apart from dynamic or excluded text
    - the XWalk/JCR conversion check
    - a check that every image address downloads without a browser, so the AEM package build can fetch it into AEM Assets
15. Re-import Cytobank Enterprise with the updated tooling, and confirm it hasn't changed apart from intended fixes.

### Phase 6: Visual and behaviour comparison
16. **Layout:** compare preview and live at desktop and mobile, element by element. Fix differences until they're within 2px, except documented font-metric differences from the Montserrat stand-in for Gotham.
17. **Interactions:**
    - sticky tabs and their section anchors
    - the hero lightbox
    - licence filters (OR within a group, AND across groups, "+N" counts, paging)
    - the resource filter
    - carousel paging
    - Add to Quote and store links
18. **Parent link:** check that the Cytobank Premium tile on Flow Cytometry Software links to the new page. If it doesn't, update the cleanup's list of migrated pages so links are rewritten to `/sai`.

### Phase 7: Wrap-up
19. Run the full lint and rebuild the component JSON.
20. Write the summary:
    - what was reused and what changed
    - design-system additions
    - remaining differences
    - which surfaces changed: local only
    - the steps you need to take: rebuild the package, install it on AEM, then preview again

## Scope Notes
- **In scope:**
  - the main content of the Cytobank Premium page
  - any block, parser or transformer extensions it needs
  - captured licence data, the imported content and its validation
- **Out of scope:**
  - the header, footer and nav, which are already migrated
  - other sibling pages such as Kaluza or Kaluza C, unless you ask
  - live commerce and search integrations
- **Local only:** nothing is uploaded to Document Authoring or AEM, previewed remotely, published or committed unless you ask. Content files are never deleted.

## Deliverables
- Live capture artifacts and the analysis report in `migration-work/`, including the Premium vs Enterprise diff
- The updated template mapping, parsers, cleanup transformer, licence data module and import script
- Imported page content at `sai/flow-cytometry/software/cytobank-premium`, validated
- A desktop and mobile comparison summary, plus the interaction checks

## Checklist
- [ ] Switch to Execute mode
- [ ] Capture the live Premium page at desktop and mobile (screenshots, markup, styles, metadata, breakpoints)
- [ ] Capture the live licence table (all pages, filters, counts, card markup, quote link)
- [ ] Run the full page analysis and archive outputs to `migration-work/analysis/cytobank-premium/`
- [ ] Diff Premium against Enterprise section by section and classify every difference
- [ ] Write the analysis report (structure, components, content inventory, dynamic elements, accessibility)
- [ ] Add the Premium URL to the `software-product-detail` template in `page-templates.json`
- [ ] Extend the design system only for new patterns, scoped, and regression-check the Software pages and Cytobank Enterprise
- [ ] Adapt the product-hero parser and block to Premium's call-to-action markup
- [ ] Add Premium licence data to `tools/importer/data/product-tables.js` and cross-check the counts
- [ ] Update the cleanup transformer and parsers for any other Premium differences
- [ ] Rebundle the import script and import the page to `sai/flow-cytometry/software/cytobank-premium`
- [ ] Verify text coverage, XWalk/JCR conversion and image downloadability
- [ ] Re-import Cytobank Enterprise and confirm no unintended changes
- [ ] Compare preview vs live at desktop and mobile and fix differences (within 2px, apart from documented font metrics)
- [ ] Test interactions: tabs, lightbox, licence filters and paging, resource filter, carousel, links
- [ ] Verify the parent page's Cytobank Premium tile links to the new page
- [ ] Run the full lint and component JSON rebuild
- [ ] Present the summary, including the package rebuild and re-preview steps for AEM
