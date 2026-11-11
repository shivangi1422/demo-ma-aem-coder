/* eslint-disable */
/* global WebImporter */

/**
 * Parser for coveo-search (Coveo Search block, key/value settings).
 * Source: https://www.mybeckman.in/search
 * Selector: #coveo-search-interface (.CoveoSearchInterface)
 * Model: coveo-search (key-value block; one row per setting).
 *
 * Read from the page markup: Sitecore item URI and site name (CoveoForSitecoreContext),
 * pipeline and page size (CoveoSearchInterface), tab ids and captions (CoveoTab), facet
 * fields and titles (CoveoFacet).
 * Read from data-excat-search-config on the interface (added to the saved page by
 * migration-work/search-tools/annotate-search-snapshot.mjs from the live requests):
 * search hub, shared advanced query, constant query, each tab's query and constant query,
 * facet allowed values. JSUI builds these at runtime; they are not in the HTML.
 */

const norm = (s) => (s || '').replace(/[\s ]+/g, ' ').trim();

function readConfig(element) {
  const value = element.getAttribute('data-excat-search-config');
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (e) {
    return null;
  }
}

export default function parse(element, { document }) {
  const config = readConfig(element) || {};
  const ctx = document.querySelector('.CoveoForSitecoreContext[data-sc-item-uri]');
  const itemUri = ctx ? ctx.getAttribute('data-sc-item-uri') : '';
  const siteName = (ctx && ctx.getAttribute('data-sc-site-name')) || 'website';
  const pipeline = element.getAttribute('data-pipeline') || config.pipeline || '';
  const perPage = element.getAttribute('data-results-per-page') || config.numberOfResults || '10';

  const tabMeta = new Map((config.tabs || []).map((t) => [t.id, t]));
  const tabs = Array.from(element.querySelectorAll('.CoveoTab[data-id]')).map((tab) => {
    const id = tab.getAttribute('data-id');
    const label = norm(tab.getAttribute('data-caption') || tab.textContent);
    const meta = tabMeta.get(id) || {};
    return [id, label, meta.aq || '', meta.cq || ''].map(norm).join(' | ').replace(/( \| )+$/, '');
  });

  const allowed = new Map((config.facets || []).map((f) => [f.field, f.allowed || []]));
  const seen = new Set();
  const facets = Array.from(element.querySelectorAll('.CoveoFacet[data-field]'))
    .map((f) => ({ field: f.getAttribute('data-field'), title: norm(f.getAttribute('data-title') || f.getAttribute('data-id')) }))
    .filter((f) => !seen.has(f.field) && seen.add(f.field))
    .map((f) => {
      const values = allowed.get(f.field) || [];
      return values.length ? `${f.field} | ${f.title} | ${values.join(', ')}` : `${f.field} | ${f.title}`;
    });

  const cells = [
    ['endpoint', ''],
    ['sitecoreItemUri', itemUri],
    ['siteName', siteName],
    ['searchHub', config.searchHub || pipeline],
    ['pipeline', pipeline],
    ['advancedQuery', norm(config.advancedQuery)],
    ['constantQuery', norm(config.constantQuery)],
    ['locale', config.locale || 'en'],
    ['resultsPerPage', String(perPage)],
    ['tabs', tabs.join('; ')],
    ['facets', facets.join('; ')],
    ['storeUrl', 'https://store.beckman.com/hi'],
    ['countryCode', 'IN'],
    ['filtersLabel', 'Filters'],
    ['noResultsMessage', 'No results found. Try other search terms or clear your filters.'],
    ['errorMessage', 'Search results could not be loaded.'],
    ['fallbackData', '/fallback-data/search'],
  ];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Coveo Search', cells });
  element.replaceWith(block);
}
