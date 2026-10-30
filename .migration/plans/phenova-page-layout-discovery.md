# Phenova.com Page & Layout Discovery Plan

## Goal
Find every page on https://www.phenova.com and group the pages into layouts (page templates). Each layout gets a list of the blocks it uses. The run uses a representative sample of the product-search filter pages, since all of them are variations of one dynamic page.

## Starting point
- A catalog from earlier today already exists: 67 sample pages in 8 layouts (homepage, study-detail, product-overview, content-page, request-form, text-page, product-search, document-library).
- The XML sitemap lists about 1,381 URLs. About 1,368 of them are `/Product/Search2/filters~…` variations.
- The sitemap leaves out many real pages, such as About, Contact Us, Certifications, Calendar, request forms, policy and terms pages, Document, and the HTML sitemap. They only show up by crawling the nav and footer.
- Layouts are told apart by whether the page has a sidebar, not by whether it has a form.
- The shared import config also holds a myBeckman template (`mybeckman-tech-support`). Rebuilding the catalog overwrites it, so it must be merged back in afterwards.

## Approach
1. **Back up** the current catalog before re-running, so today's refined 8-layout result can be restored or compared.
2. **Discover URLs** from the XML sitemap, then add pages found by crawling the homepage nav, the footer and the HTML sitemap page (`/home/sitemap`), including `/Home/*` paths.
3. **Sample the product-search pages**: keep every non-search content page, plus a spread of about 30 filter URLs across the different filter types. Save the full list of search URLs so it can be used later for bulk import.
4. **Analyze each sampled page**: page structure, sections and the blocks it contains.
5. **Group pages into layouts**, using sidebar and no-sidebar width as the main signal, and catalog the blocks for each layout.
6. **Name the blocks** against the project's block library, keeping the decisions already confirmed (promo-sidebar, form block, custom search widgets).
7. **Compare with the previous catalog**: report pages and layouts that were added, removed or changed.
8. **Restore the myBeckman template** in the import config if the catalog step overwrote it.
9. **Report back** with a list of layouts, page counts, example URLs, blocks per layout, and anything worth reviewing.

## Checklist
- [ ] Back up the current catalog and import templates to a dated backup folder
- [ ] Discover URLs from the phenova.com XML sitemap
- [ ] Crawl the nav, footer and HTML sitemap to find pages missing from the XML sitemap (including `/Home/*`)
- [ ] Remove duplicates and normalize URLs (case, trailing slashes, `#` fragments)
- [ ] Split URLs into content pages and product-search filter variations
- [ ] Pick a representative sample of about 30 search-filter URLs; save the full search URL list
- [ ] Run page analysis on every sampled URL
- [ ] Group the analyzed pages into layouts (sidebar vs. no-sidebar, forms, search, documents)
- [ ] Build the block catalog per layout and name blocks against the block library
- [ ] Check that the confirmed block decisions still apply (promo-sidebar, form, search widgets)
- [ ] Compare the new catalog with the previous 8-layout catalog and note the differences
- [ ] Merge the myBeckman template back into the import templates
- [ ] Present the summary: layouts, page counts, example pages, blocks, open questions

## Expected output
- A refreshed site catalog: URL list, layout groups, block catalog and summary
- The full list of product-search URLs, kept for a later bulk import
- A short report of the layouts found and how they differ from today's earlier catalog

## Notes
- Only the analysis files on this computer change. Nothing is uploaded, previewed or published.
- Execute mode is needed to run this plan.
