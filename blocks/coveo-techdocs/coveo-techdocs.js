import { readConfigRows, configText, configKey } from '../../scripts/block-config.js';
import { search } from '../../scripts/coveo/coveo-client.js';
import buildSearchParams from '../../scripts/coveo/coveo-query-builder.js';
import { normalizeTechDoc, pagination, uniqueById } from '../../scripts/coveo/coveo-results.js';
import { el, renderPager, renderStatus } from '../../scripts/search-ui.js';

/**
 * Technical documents for a product (source: "Technical Documents" on product
 * pages), from the Coveo "Technical Documents" hub filtered on the product's
 * part numbers. Shows a document table with a pager; when the search finds
 * nothing (or fails) it shows the authored fallback text, like the source.
 * Key/value configuration: endpoint, sitecore item uri, site name, search hub,
 * pipeline, advanced query, constant query, results per page, fallback
 * (rich text), more results (rich text, shown under results).
 */

const COLUMNS = [
  ['title', 'Document'],
  ['category', 'Document Type'],
  ['documentId', 'Document Number'],
  ['lotNumber', 'Lot Number'],
];

/**
 * Children of a rich-text config cell, moved out so the block can reuse them.
 * @param {Map} config
 * @param {string} key
 * @returns {Node[]}
 */
function richValue(config, key) {
  const entry = config.get(configKey(key));
  return entry ? [...entry.cell.childNodes] : [];
}

export default function decorate(block) {
  const config = readConfigRows(block);
  const cfg = {
    base: configText(config, 'endpoint'),
    itemUri: configText(config, 'sitecoreItemUri'),
    siteName: configText(config, 'siteName', 'website'),
    searchHub: configText(config, 'searchHub'),
    pipeline: configText(config, 'pipeline', configText(config, 'searchHub')),
    aq: configText(config, 'advancedQuery'),
    cq: configText(config, 'constantQuery'),
    locale: configText(config, 'locale', 'en'),
    perPage: Number.parseInt(configText(config, 'resultsPerPage', '5'), 10) || 5,
  };
  const fallback = el('div', { className: 'coveo-techdocs-fallback' }, ...richValue(config, 'fallback'));
  const more = el('div', { className: 'coveo-techdocs-more' }, ...richValue(config, 'moreResults'));
  fallback.hidden = true;
  more.hidden = true;

  const status = el('div', { className: 'coveo-techdocs-status search-status', role: 'status' });
  const table = el('table', { className: 'coveo-techdocs-table' });
  table.append(el('thead', {}, el('tr', {}, ...COLUMNS.map(([, label]) => el('th', { scope: 'col' }, label)))));
  const tbody = el('tbody');
  table.append(tbody);
  table.hidden = true;
  const pagerSlot = el('div', { className: 'coveo-techdocs-pager-slot' });
  block.replaceChildren(more, status, table, pagerSlot, fallback);

  const showFallback = () => {
    table.hidden = true;
    more.hidden = true;
    pagerSlot.replaceChildren();
    renderStatus(status, { type: 'none' });
    fallback.hidden = false;
  };
  if (!cfg.searchHub || !cfg.itemUri) {
    showFallback();
    return;
  }

  let firstResult = 0;
  let controller = null;
  let requestId = 0;

  const load = async () => {
    if (controller) controller.abort();
    controller = new AbortController();
    requestId += 1;
    const current = requestId;
    block.setAttribute('aria-busy', 'true');
    renderStatus(status, { type: 'loading', message: 'Loading…' });
    try {
      const response = await search({
        base: cfg.base,
        itemUri: cfg.itemUri,
        siteName: cfg.siteName,
        signal: controller.signal,
        params: buildSearchParams({
          searchHub: cfg.searchHub,
          pipeline: cfg.pipeline,
          aq: cfg.aq,
          cq: cfg.cq,
          locale: cfg.locale,
          firstResult,
          numberOfResults: cfg.perPage,
        }),
      });
      if (current !== requestId) return;
      const docs = uniqueById(response.results.map(normalizeTechDoc));
      if (!docs.length) {
        showFallback();
        return;
      }
      tbody.replaceChildren(...docs.map((doc) => el(
        'tr',
        {},
        ...COLUMNS.map(([key, label]) => {
          const value = doc[key] || '';
          const content = key === 'title' && doc.url
            ? el('a', { href: doc.url, target: '_blank', rel: 'noopener' }, value)
            : value;
          return el('td', { 'data-label': label }, content);
        }),
      )));
      table.hidden = false;
      fallback.hidden = true;
      more.hidden = !more.childNodes.length;
      renderStatus(status, { type: 'none' });
      const info = pagination(response, firstResult, cfg.perPage);
      const pager = renderPager({
        page: info.page,
        pages: info.pages,
        className: 'coveo-techdocs-pager',
        labels: { previous: '', next: '' },
        hideDisabled: true,
        onSelect: (page) => {
          firstResult = page * cfg.perPage;
          load();
        },
      });
      pagerSlot.replaceChildren(...(pager ? [pager] : []));
    } catch (e) {
      if (current !== requestId || e.aborted) return;
      // the source shows the same fallback text when the search fails
      showFallback();
    } finally {
      if (current === requestId) block.removeAttribute('aria-busy');
    }
  };

  load();
}
