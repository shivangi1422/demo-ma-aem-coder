/* eslint-disable */
/* global WebImporter */

/**
 * Parser for coveo-products (Coveo Products block, key/value settings).
 * Source: https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise
 * Selector: .CoveoSearchInterface[data-pipeline="Product Table"]
 * Model: coveo-products (key-value block; one row per setting).
 *
 * Settings are read from the Coveo for Sitecore markup of the page:
 *  - sitecoreItemUri: endpointConfiguration.itemUri / data-sc-item-uri (kept verbatim)
 *  - searchHub / pipeline / results per page: CoveoAnalytics data-search-hub,
 *    CoveoSearchInterface data-pipeline / data-results-per-page
 *  - facets: CoveoFacet data-field / data-title
 *  - advanced query: PRODUCT_TABLE_FILTER + " (" + #JSFilterExpression data-sc-advanced-filter + ")"
 *  - constant query: (@forlanguages==<lang>) (@z95xlatestversion==1) (@source=="<index source>")
 * PRODUCT_TABLE_FILTER and the composition were taken from the request the source
 * page sends (captured 2026-11-03, migration-work/cytobank/captured-api-calls.json);
 * the filter is the Product Table interface's template/status rule and is the
 * same on every product page.
 */

const PRODUCT_TABLE_FILTER = '((((@alltemplates==3E1B00AD02A545A992D75AE6C1F7505E @itemtypetaz120xonomyfacetselected==products) '
  + '((((@oraclez32xstatus==ACTCONTROL OR @oraclez32xstatus==ACTNONCONT) OR @oraclez32xstatus==ACTNONINV) '
  + 'OR @oraclez32xstatus==BOMNONINV) OR @oraclez32xstatus==PREOBSOLET)) '
  + 'NOT @z95xtemplate==(ADB6CA4F03EF4F47B9AC9CE2BA53FF97,FE5DD82648C6436DB87A7C4210C7413B)))';

const norm = (s) => (s || '').replace(/[\s ]+/g, ' ').trim();

function itemUri(document) {
  const scripts = Array.from(document.querySelectorAll('script')).map((s) => s.textContent).join('\n');
  const m = scripts.match(/itemUri:\s*"([^"]+)"/);
  if (m) return m[1];
  const ctx = document.querySelector('[data-sc-item-uri]');
  return ctx ? ctx.getAttribute('data-sc-item-uri') : '';
}

export default function parse(element, { document }) {
  const hub = (element.querySelector('.CoveoAnalytics[data-search-hub]') || {}).getAttribute
    ? element.querySelector('.CoveoAnalytics[data-search-hub]').getAttribute('data-search-hub')
    : element.getAttribute('data-pipeline');
  const pipeline = element.getAttribute('data-pipeline') || hub;
  const perPage = element.getAttribute('data-results-per-page') || '8';
  const ctx = document.querySelector('.CoveoForSitecoreContext[data-sc-index-source-name]');
  const language = ctx ? ctx.getAttribute('data-sc-current-language') : 'en';
  const indexSource = ctx ? ctx.getAttribute('data-sc-index-source-name') : '';
  const jsFilter = element.querySelector('#JSFilterExpression') || document.querySelector('#JSFilterExpression');
  const pageFilter = jsFilter ? norm(jsFilter.getAttribute('data-sc-advanced-filter')) : '';
  const aq = pageFilter ? `${PRODUCT_TABLE_FILTER} (${pageFilter})` : PRODUCT_TABLE_FILTER;
  const cq = `(@forlanguages==${language}) (@z95xlatestversion==1) (@source=="${indexSource}")`;
  const facets = Array.from(element.querySelectorAll('.CoveoFacet[data-field]'))
    .map((f) => `${f.getAttribute('data-field')} | ${f.getAttribute('data-title') || f.getAttribute('data-id')}`)
    .join('; ');

  const cells = [
    ['endpoint', ''],
    ['sitecoreItemUri', itemUri(document)],
    ['siteName', 'website'],
    ['searchHub', hub],
    ['pipeline', pipeline],
    ['advancedQuery', aq],
    ['constantQuery', cq],
    ['locale', 'en'],
    ['facets', facets],
    ['resultsPerPage', perPage],
    ['storeUrl', 'https://store.beckman.com/hi'],
    ['countryCode', 'IN'],
    ['filterHeading', 'Filter by:'],
    ['quoteLabel', 'Add to Quote'],
  ];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Coveo Products', cells });
  element.replaceWith(block);
}
