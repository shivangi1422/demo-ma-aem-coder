# Cytobank Enterprise Page Analysis & Migration Plan

## Status
This is a plan only; carrying it out requires Execute mode. Nothing has been changed yet.

## Objective
Analyse https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise in full (structure, components, content), then migrate it into the XWalk EDS project:
- **New blocks only:** build every block this page needs from scratch. Don't reuse the project's existing blocks (category-cards, product-tiles, link-list, marketo-form, the homepage blocks and so on) as components.
- **Design system:** keep it matching the live site, extending it only where this page introduces new patterns.
- **Same standard as the Software pages:** desktop (1440px) and mobile (390px) checked against live, element by element.

## Context
- **Site:** Beckman Coulter Life Sciences India (mybeckman.in), behind Cloudflare bot protection. Live capture and import go through the protected-site fallback browser, with the page scripts given time to initialise.
- **Hierarchy:** child of Flow Cytometry Software (`/flow-cytometry/software`), which is already migrated. On that page it is the "Cytobank Enterprise" tile.
- **Already in place:** the global header, mega menu, footer and breadcrumbs are migrated, and breadcrumbs take their labels from page metadata. The design tokens in `styles/brand.css` and `styles/styles.css` and the Montserrat stand-in for licensed Gotham are also done, and reusing them is expected.
- **Existing templates:** software, software-category and software-product. This page will most likely get its own template, for example `software-product-detail`, confirmed by analysis.
- **Global styles:** existing global styles must not change in ways that alter the four Software pages already migrated. Any global change gets regression-checked on them.

## Approach

### Phase 1: Live capture
1. Capture the page at desktop (1440) and mobile (390): full screenshots, rendered markup of `#main`, computed styles of every visible element, and page metadata (title, description, canonical, OG).
2. Record any interactive states: tabs, accordions, carousels, video players, modals, hover and focus states, and any forms. Force them open where scripts don't initialise in the capture browser.
3. Record the breadcrumb trail labels, the images (sources, sizes, alt text), embedded media, downloads and links.

### Phase 2: Full page analysis
4. Run the formal page analysis: sections, content sequences, default content vs blocks, section styles, dynamic, commerce or login-gated elements.
5. Write it up: section-by-section structure, component inventory, content inventory (headings, copy, CTAs, links, images and alt text, media, documents), and accessibility observations.
6. Decide the template: confirm whether this page needs a new template, and check sibling Flow Cytometry software detail pages (Cytobank Premium, Kaluza and others) for structural reuse.

### Phase 3: Design system
7. Compare the page's computed styles with the existing tokens. Add only what's new (colours, type sizes, spacing, button or tab styles) to `styles/brand.css` and `styles/styles.css`, scoped where needed.
8. Regression-check that the four Software pages still match live after any global change.

### Phase 4: New blocks (from scratch)
9. For each non-default-content component found, build a new block: JS, CSS and Universal Editor model. Keep each to four cells or fewer and lint-clean, using mobile-first breakpoints taken from the live site's own (768, 992, 1024, 1120 and so on).
10. Implement interactive behaviour (for example tabs or accordion) accessibly: keyboard support and ARIA.
11. Register the new blocks in the section filter (`models/_section.json`) and rebuild the component JSON.

### Phase 5: Import tooling
12. Add the template, block selectors and section mappings to `tools/importer/page-templates.json`.
13. Write a parser per new block and extend the shared cleanup transformer if the page has new chrome or quirks. Breadcrumb labels are already captured as metadata.
14. Generate and bundle the template's import script.

### Phase 6: Import and validation
15. Import the page from its snapshot (`content/flow-cytometry/software/cytobank-enterprise.plain.html`).
16. Check main-content text coverage against the live markup (target: no missing words), and run the XWalk conversion check.

### Phase 7: Visual comparison
17. Compare element positions with the live capture at desktop and mobile, plus screenshots and interaction states. Fix differences until everything is within 2px, except documented font-metric differences.
18. Check the parent Flow Cytometry Software page: its Cytobank Enterprise tile links to the new page.

### Phase 8: Wrap-up
19. Full lint and component JSON rebuild.
20. Optionally update the planning catalog (add the page, block lines and template) if you want it kept in sync.
21. Summary: blocks created, design-system additions, template, remaining differences, and which surfaces changed (local only).

## Scope Notes
- **In scope:** the main content of the Cytobank Enterprise page, its new blocks, models, styles, import tooling and imported content.
- **Out of scope:**
  - Header, footer and navigation, which are already migrated. Changes only if this page uses a variant of them.
  - Other child pages, unless you ask.
  - Live commerce or login features.
- **Local only:** nothing is uploaded to Document Authoring or AEM, published, or committed unless you ask.

## Deliverables
- Analysis report: sections, components, content inventory, template decision, dynamic elements, accessibility notes
- Live capture artifacts (screenshots, computed styles, rendered markup) in `migration-work/`
- New blocks (JS, CSS, models) and design-system additions
- Template mapping, parsers, transformer updates and import script
- Imported page content, validated, with a desktop and mobile comparison summary

## Checklist
- [ ] Switch to Execute mode
- [ ] Capture the live page at desktop and mobile (screenshots, markup, computed styles, metadata, interaction states)
- [ ] Run the full page analysis (sections, sequences, default content vs blocks, section styles)
- [ ] Write up the structure, component inventory and content inventory
- [ ] Flag dynamic, commerce, login-gated and embedded-media elements
- [ ] Decide the template (new `software-product-detail` or other) and check sibling pages for reuse
- [ ] Extend the design system with any new tokens or patterns, scoped to avoid regressions
- [ ] Regression-check the four migrated Software pages after any global style change
- [ ] Build new blocks from scratch (JS, CSS, Universal Editor models) for each component
- [ ] Implement interactive behaviour accessibly (keyboard and ARIA)
- [ ] Register blocks in the section filter and rebuild the component JSON
- [ ] Add the template, block and section mappings to `page-templates.json`
- [ ] Write parsers for the new blocks and update the cleanup transformer if needed
- [ ] Generate and bundle the import script
- [ ] Import the page and verify main-content coverage and XWalk conversion
- [ ] Compare preview vs live (positions, screenshots, interactions) at desktop and mobile, and fix differences
- [ ] Verify the parent page's Cytobank Enterprise tile links to the new page
- [ ] Run full lint and component JSON rebuild
- [ ] Optionally update the planning catalog for this page
- [ ] Present the migration summary (blocks, design-system additions, template, gaps, surfaces changed)
