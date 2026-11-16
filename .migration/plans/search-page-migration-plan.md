# Migration plan: Search page (https://www.mybeckman.in/search)

Prepared 2026-11-11 from the live page (loaded through Bright Data; analysis files in this folder).
Target: AEM Sites author `/content/demo-ma-aem-coder/vishal/search` (xwalk / Universal Editor), Edge Delivery Services.

## 1. What the page is

A full-site search results page built with **Coveo for Sitecore (JSUI 2.10116)**. Almost nothing on it is authored content:
everything below the header is rendered in the browser from search API responses.

- The site header search box already submits to `/search#q=<term>` (source and migrated header), so this page is the
  landing page for every header search. Today the link has no page behind it in the migrated site.
- The source page has **no H1, no breadcrumb, no intro text**.
- Page metadata: title "Search Beckman Coulter Life Sciences"; description "Find products by name and part number and
  browse content, technical documentation and more."; canonical `https://www.beckman.com/search`.

## 2. Page structure (desktop 1440px)

| Area | Source | Position |
|---|---|---|
| Header / footer | global, already migrated | – |
| Facet column | 23 `CoveoFacet` filters (checkbox lists with counts, collapse toggle, "Show all") | left, 320px |
| Tabs | All Results · Products · Technical Documents · Other Content | top of results, 1005px |
| Selected filters | `CoveoBreadcrumb` (chips for chosen facet values, clear all) | above summary |
| Query summary | "Results 1-10 of 153,190 in 2.24 seconds" + "Did you mean" | above list |
| Result list | 10 results per page, 3 result layouts (see 4) | 1005px |
| Pager | 1 … 10, next arrow | below list |
| Mobile | facets collapse into a "Filters" panel (`CoveoFacetsMobileMode`) | 390px |

Screenshots: `source-search-1440.png`, `-products-`, `-techdocs-`, `-othercontent-1440.png`, `source-search-390.png`.

## 3. Search behaviour (captured requests)

Same API as the product pages (already implemented in `scripts/coveo/coveo-client.js`):
`GET /coveo/rest/token` then `POST /coveo/rest/search/v2?sitecoreItemUri=sitecore://web/{4DE5F67B-69FE-4DA3-8863-6323FA372D54}?lang=hi&ver=1&siteName=website`

| Parameter | Value |
|---|---|
| searchHub / pipeline | `Main Search Page` |
| numberOfResults | 10, `sortCriteria=relevancy`, `excerptLength=200`, `enableDidYouMean=true` |
| cq | `((@forlanguages==hi) (@z95xlatestversion==1) (@source=="Coveo_web_index - LSWEB-DW-Production")) OR (@source=="Techdocs-Upgrade")` |
| aq (all tabs) | Hindi boost (`$qre(@language==Hindi, 10)`), exclude-from-search flag, 3 excluded Sitecore paths, 2 excluded templates, `@displayincountries=IN` |
| aq per tab | **Products**: `@itemtypetaz120xonomyfacetselected==products` AND Oracle status in (active / non-continued / non-inventory / BOM / pre-obsolete) · **Technical Documents**: `@syssource=="Techdocs-Upgrade"` · **Other Content**: NOT products AND NOT TechDocs · **All**: union of the three |
| URL state | hash: `#t=<tab>&q=<term>&f:@field=[values]&first=<n>` (history enabled) |

Result counts on 2026-11-11: All 153,190 · Products 3,694 · Technical Documents 145,807 · Other Content 3,142.

Facets (field → label) and the tabs they show on:
- **Products tab**: Product Market (`@productz32xmarket`, fixed allowed values), Product Category, Applications, Intended Use,
  Language, Package Quantity, K Factor, Channels and Standard Sizes, Maximum RPM, Optics and Laser Power,
  Power Requirements, Refrigeration, Regulatory Status, Rotor Type
- **Technical Documents tab**: Document Type (`@category`), TechDocs Language (`@documentlanguage`),
  Product Series (`@productline`), Item Number (`@itemnumber`)
- **Other Content tab**: Product Category, Applications, Content Type, Intended Use, Language
- Hidden unless data: Event Location, Booth Number, Event Type, Maximum Speed
Full field list: `search-info.json` → `info.facets`.

## 4. Result layouts (`result-template.html`, 20 KB underscore template)

1. **Product / page result**: 70px image (`imageUrl`/`imageAlt`), title link, grey item-type pill
   ("Product Series", "Product Category", "Product Subcategory"…), excerpt with highlighted terms, "Details" toggle;
   salable products add price, tax note, quote / add-to-cart buttons (`product-card__prices`, `product-card-add-cart`).
   Variants by `templateType`: product category, product series selector, product spotlight.
2. **Technical document** (`raw.syssource == "TechDocs-Upgrade"`): table row with document title (PDF link), document type,
   document number, revision, language, item number, product, product line, release date, lot number, disclaimer,
   restricted-access warning.
3. **Other content**: title link, pill, excerpt.

## 5. Template, blocks and documents

### Template `search` (1 page)
| Section | Content | Decision |
|---|---|---|
| 1 | Page heading | **Default content**: H1 "Search", visually hidden (source has none; needed for heading order and screen readers) |
| 2 | Search interface | **Block `coveo-search`** (new) |
| – | Page metadata | title, description, `template: search`, `breadcrumbs: false`, `robots: noindex` (recommended for a results page) |

### Block `coveo-search` (new, custom)
One block, because tabs, facets, results and pager share one query state. Reuses the existing shared code:

| Reused | For |
|---|---|
| `scripts/coveo/coveo-client.js` | token + search/v2 calls, error handling |
| `scripts/coveo/coveo-query-builder.js` | form parameters (hub, pipeline, aq, cq, groupBy) |
| `scripts/coveo/coveo-facets.js` | facet selection logic (OR within, AND across, counts excluding own selection) |
| `scripts/coveo/coveo-results.js` | `normalizeProduct`, `normalizeTechDoc`, pagination |
| `scripts/coveo/coveo-saved.js` | saved-data fallback when the live API can't be reached |
| `blocks/coveo-products` / `coveo-techdocs` | product card and tech-doc row markup and CSS, to keep results consistent |

New code: tab bar, URL-hash state (read `#q=` from the header search, keep tab/facets/page in the hash, back/forward),
selected-filter chips, query summary + "did you mean", 3 result renderers, mobile filter panel, accessible live-region
announcement of result counts.

**Universal Editor model** (xwalk, ≤4 cells per row, field names avoiding Text/Type/Alt/Title suffixes):
- Block `coveo-search`: `endpoint`, `sitecoreItemUri`, `siteName`, `searchHub`, `pipeline`, `constantQuery`,
  `advancedQuery`, `locale`, `resultsPerPage`, `noResultsMessage`, `errorMessage`, `fallbackData`
- Item `coveo-search-tab` (one per tab): `tabId`, `label`, `tabQuery` (aq added for the tab), `facets` (`@field | Label` per line)

**Authored document (what the author sees)**
```
| Coveo Search |                                                   |
| endpoint     | (empty = same origin)                             |
| search hub   | Main Search Page                                  |
| pipeline     | Main Search Page                                  |
| ...          | ...                                               |
| Tab          | coveo-tab-products | Products | <aq> | <facets>  |
| Tab          | coveo-tab-techdocs | Technical Documents | ...   |
```

### Files to produce
| File | Purpose |
|---|---|
| `blocks/coveo-search/coveo-search.{js,css}`, `_coveo-search.json`, README | block code, styles, UE model |
| `component-*.json` | regenerated with `npm run build:json` |
| `tools/importer/page-templates.json` (+ backup first) | add template `search` only |
| `tools/importer/parsers/coveo-search.js` | reads `.CoveoSearchInterface` / `.CoveoForSitecoreContext` data attributes, tabs, facets and per-tab filter expressions from the page into the block table |
| `tools/importer/import-search.js` | import script (cleanup + sections transformers reused) |
| `content/search.plain.html` | imported page |
| `fallback-data/search/*.json` | recorded responses per tab (built with `tools/fallback-data/build-fallback-data.mjs`) |
| `migration-work/packages/demo-ma-aem-coder-search.zip` | AEM package for `/search` only, for manual install |

## 6. Key constraint: where the search runs

The Sitecore Coveo proxy (`/coveo/rest/*`) only answers **same-origin** on www.mybeckman.in (no CORS, Cloudflare).
On `*.aem.page` / `*.aem.live`, in Universal Editor and in local preview the live search cannot be called.

| Option | Live results on EDS | Effort | Notes |
|---|---|---|---|
| A. Saved-data fallback (current pattern) | No: a recorded sample (e.g. first pages per tab, unfiltered + a few queries) | Low | Good for review and design; free-text search would not really work |
| B. Same-origin proxy on the production CDN (`/coveo/rest/*` → Sitecore origin) | Yes, once the site is live on www.mybeckman.in | Medium (CDN rule by site admin) | Keeps Sitecore index; depends on Sitecore staying up |
| C. Coveo Cloud direct (search API key / token from Coveo admin) | Yes, everywhere | Medium–high | Long-term choice when Sitecore is retired; needs Coveo org access and a public search key with query restrictions |

Recommendation: build the block against the shared client with a configurable `endpoint` (A for now, B or C for go-live),
so switching is a configuration change, not a rebuild.

## 7. Steps

1. Back up `page-templates.json`; add template `search` (no re-clustering of other templates).
2. Record saved data per tab (Bright Data, same-origin calls) for the fallback.
3. Build block `coveo-search` + model; `npm run build:json`, `npm run lint`.
4. Parser + import script; import `/search`; check xwalk JCR conversion.
5. Design: measure source (facet column, tabs, result cards, pager, mobile filters); match at 1440 and 390.
6. Accessibility/performance: tabs as real tabs (`role=tablist`), facet checkboxes with labels, result count in a live
   region, visible focus, Lighthouse on mobile/desktop.
7. Build `/search`-only AEM package (absolute media.beckman.com images), install on author, preview.
8. Test header search → `/search#q=…` end to end.

## 8. Risks and open points
- Commerce in results (prices, add to cart, quote) depends on the eStore/cart API (`/api/becapi/ecommerce/*`), also same-origin.
- Search analytics (`/coveo/rest/ua`) is not migrated unless requested.
- Facet value lists and counts come from the index; they will change over time (no authoring needed).
- Block code must be on the GitHub branch the author uses (`main` currently lacks cards-grid/marketo-form/coveo blocks).
- Pushing code needs Git access (currently off); installing on author needs someone with AEM access.

## 9. Status (2026-11-11)

Done locally (not committed, not pushed, not installed on author):
- Template `search` added to page-templates.json (backup: migration-work/page-templates.pre-search.json); other templates untouched.
- Block `coveo-search` (blocks/coveo-search) + UE model; shared code extended (facet allowed values, per-facet "Show all").
- Defaults chosen (no answer given): configurable endpoint with saved-data fallback (fallback-data/search/<tab>.json, 50 results per tab, 2026-11-11);
  no prices / cart buttons in product results; no Coveo analytics.
- Importer: parser coveo-search.js reads settings from data-excat-search-config on the saved page
  (migration-work/search-tools/record-search.mjs + annotate-search-snapshot.mjs); import-search.js; content/search.plain.html.
- Page metadata: template=search, robots noindex,follow (page model got a cq:robotsTags field and the missing template options).
- Tests: 15/15 interaction checks; Lighthouse desktop perf 100 / a11y 100; mobile a11y 100, perf 92–95 without dev live-reload noise.
- Package: migration-work/packages/demo-ma-aem-coder-search.zip (only /search, filter excludes children).
