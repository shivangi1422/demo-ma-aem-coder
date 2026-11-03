import { readConfigRows, configText } from '../../scripts/block-config.js';
import { search } from '../../scripts/coveo/coveo-client.js';
import buildSearchParams from '../../scripts/coveo/coveo-query-builder.js';
import { FacetState, parseFacetDefinitions } from '../../scripts/coveo/coveo-facets.js';
import { normalizeProduct, pagination, uniqueById } from '../../scripts/coveo/coveo-results.js';
import {
  el, renderPager, renderStatus,
} from '../../scripts/search-ui.js';

/**
 * Coveo product table (source: "Explore ... Licenses" on product pages):
 * facets on the left, product cards and a pager on the right, all driven by the
 * Coveo for Sitecore search proxy. Key/value configuration authored in the block:
 *   endpoint, sitecore item uri, site name, search hub, pipeline, advanced query,
 *   constant query, facets ("@field | Label" per line), results per page,
 *   store url, country code and optional labels.
 * Facet selections and the page are kept in localStorage per page, like the
 * source interface (data-use-local-storage-for-history).
 */

let instance = 0;

/**
 * Card markup for one product, following the source result template.
 * @param {object} p normalized product
 * @param {object} cfg block settings
 * @returns {HTMLElement}
 */
function productCard(p, cfg) {
  const card = el('li', { className: 'coveo-products-card' });
  const media = el('div', { className: 'coveo-products-card-image' });
  if (p.image) {
    const img = el('img', {
      src: p.image, alt: p.imageAlt, loading: 'lazy', width: '234', height: '79',
    });
    img.addEventListener('error', () => {
      media.classList.add('is-missing');
      img.remove();
    }, { once: true });
    media.append(img);
  } else {
    media.classList.add('is-missing');
  }
  card.append(media);

  const title = el('h3', { className: 'coveo-products-card-title' });
  title.append(p.url ? el('a', { href: p.url }, p.title) : p.title);
  card.append(title);
  if (p.productNumber) {
    card.append(el('p', { className: 'coveo-products-card-number' }, `${cfg.numberLabel} ${p.productNumber}`));
  }

  if (p.showPriceSection && (p.listPrice || p.productPrice)) {
    const prices = el('div', { className: 'coveo-products-card-prices' });
    if (p.listPrice && (p.listPrice === p.productPrice || !p.productPrice)) {
      prices.append(el('p', { className: 'coveo-products-card-price' }, p.listPrice));
    } else {
      prices.append(el('p', { className: 'coveo-products-card-price' }, p.productPrice));
      if (p.listPrice) prices.append(el('p', { className: 'coveo-products-card-original-price' }, p.listPrice));
    }
    card.append(prices);
  }

  if (p.showBuyingOptions) {
    const footer = el('div', { className: 'coveo-products-card-actions' });
    const storeProduct = `${cfg.storeUrl}/p/${encodeURIComponent(p.productNumber)}?countryCode=${encodeURIComponent(cfg.countryCode)}`;
    if (p.showLoginForPrice) {
      footer.append(el('a', { className: 'button secondary', href: `/sign-in?returnUrl=${encodeURIComponent(storeProduct)}` }, cfg.loginLabel));
    } else if (p.showAddToCartDirect) {
      footer.append(el('a', {
        className: 'button secondary',
        href: `${cfg.storeUrl}/cart?add=${encodeURIComponent(p.productNumber)}&countryCode=${encodeURIComponent(cfg.countryCode)}`,
      }, cfg.cartLabel));
    }
    const quote = p.productRfq
      ? { href: p.productRfqLink, label: cfg.rfqLabel }
      : { href: p.requestQuoteLink, label: cfg.quoteLabel };
    if (quote.href) {
      footer.append(el('a', {
        className: 'coveo-products-quote', href: quote.href, 'data-productnumber': p.productNumber,
      }, quote.label));
    }
    if (footer.children.length) card.append(footer);
  }
  return card;
}

/**
 * One facet: header (title, clear, collapse) and checkbox values with counts.
 * @param {object} facet facet model from FacetState.facetsFrom()
 * @param {{onToggle: Function, onClear: Function, collapsed: Set, id: string}} ctx
 * @returns {HTMLElement}
 */
function facetGroup(facet, ctx) {
  const listId = `${ctx.id}-${facet.field.replace(/[^a-z0-9]/gi, '')}`;
  const collapsed = ctx.collapsed.has(facet.field);
  const group = el('div', { className: `coveo-products-facet${collapsed ? ' is-collapsed' : ''}`, role: 'group', 'aria-labelledby': `${listId}-title` });
  const header = el('div', { className: 'coveo-products-facet-header' });
  header.append(el('h3', { className: 'coveo-products-facet-title', id: `${listId}-title` }, facet.label));
  if (facet.values.some((v) => v.selected)) {
    const clear = el('button', { type: 'button', className: 'coveo-products-facet-clear', 'aria-label': `Clear ${facet.label}` });
    clear.addEventListener('click', () => ctx.onClear(facet.field));
    header.append(clear);
  }
  const toggle = el('button', {
    type: 'button', className: 'coveo-products-facet-toggle', 'aria-expanded': String(!collapsed), 'aria-controls': listId, 'aria-label': `${collapsed ? 'Expand' : 'Collapse'} ${facet.label}`,
  });
  toggle.addEventListener('click', () => ctx.onCollapse(facet.field));
  header.append(toggle);
  group.append(header);

  const list = el('ul', { className: 'coveo-products-facet-values', id: listId, hidden: collapsed });
  facet.values.forEach((v, i) => {
    const inputId = `${listId}-${i}`;
    const input = el('input', {
      type: 'checkbox', id: inputId, value: v.value, checked: v.selected,
    });
    input.addEventListener('change', () => ctx.onToggle(facet.field, v.value));
    list.append(el(
      'li',
      { className: v.selected ? 'is-selected' : '' },
      input,
      el('label', { for: inputId }, el('span', { className: 'coveo-products-facet-caption' }, v.value), el('span', { className: 'coveo-products-facet-count' }, String(v.count))),
    ));
  });
  group.append(list);
  return group;
}

export default function decorate(block) {
  instance += 1;
  const id = `coveo-products-${instance}`;
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
    perPage: Number.parseInt(configText(config, 'resultsPerPage', '8'), 10) || 8,
    storeUrl: configText(config, 'storeUrl', 'https://store.beckman.com/hi').replace(/\/+$/, ''),
    countryCode: configText(config, 'countryCode', 'IN'),
    filterHeading: configText(config, 'filterHeading', 'Filter by:'),
    numberLabel: configText(config, 'numberLabel', 'Product No:'),
    quoteLabel: configText(config, 'quoteLabel', 'Add to Quote'),
    rfqLabel: configText(config, 'rfqLabel', 'Buy Now'),
    loginLabel: configText(config, 'loginLabel', 'Login for Price'),
    cartLabel: configText(config, 'cartLabel', 'Add to Cart'),
    noResults: configText(config, 'noResultsMessage', 'No results found. Try clearing your filters.'),
    errorText: configText(config, 'errorMessage', 'Licenses could not be loaded.'),
  };
  const facets = new FacetState(parseFacetDefinitions(configText(config, 'facets')));
  const storageKey = `coveo-products:${window.location.pathname}:${cfg.searchHub}`;

  // ---- layout ----
  const summary = el('p', { className: 'coveo-products-summary', 'aria-live': 'polite' });
  const facetColumn = el('div', { className: 'coveo-products-facets', id: `${id}-facets` });
  const aside = el('aside', { className: 'coveo-products-filters', 'aria-label': cfg.filterHeading.replace(/:$/, '') }, facetColumn);
  const status = el('div', { className: 'coveo-products-status search-status', role: 'status' });
  const list = el('ul', { className: 'coveo-products-list' });
  const pagerSlot = el('div', { className: 'coveo-products-pager-slot' });
  const results = el('div', { className: 'coveo-products-results' }, status, list, pagerSlot);
  const layout = el('div', { className: 'coveo-products-layout' }, aside, results);
  block.replaceChildren(summary, layout);

  if (!cfg.searchHub || !cfg.itemUri) {
    renderStatus(status, { type: 'error', message: 'Search is not configured (search hub and Sitecore item URI are required).' });
    return;
  }

  // ---- state ----
  let firstResult = 0;
  let controller = null;
  let requestId = 0;
  let lastFacets = facets.facetsFrom([]);
  const collapsed = new Set();
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
    if (saved && saved.selected) {
      Object.entries(saved.selected).forEach(([field, values]) => {
        if (facets.selected.has(field) && Array.isArray(values)) {
          facets.selected.set(field, values.map(String));
        }
      });
      firstResult = Number(saved.firstResult) || 0;
    }
  } catch { /* storage unavailable: start fresh */ }

  const persist = () => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({
        selected: Object.fromEntries(facets.selected), firstResult,
      }));
    } catch { /* storage unavailable */ }
  };

  let runSearch;
  const renderFacets = (models) => {
    lastFacets = models;
    const ctx = {
      id,
      collapsed,
      onToggle: (field, value) => {
        facets.toggle(field, value);
        firstResult = 0;
        runSearch();
      },
      onClear: (field) => {
        facets.clear(field);
        firstResult = 0;
        runSearch();
      },
      onCollapse: (field) => {
        if (collapsed.has(field)) collapsed.delete(field);
        else collapsed.add(field);
        renderFacets(lastFacets);
      },
    };
    const children = [el('p', { className: 'coveo-products-filter-heading' }, cfg.filterHeading)];
    if (facets.hasSelection()) {
      const clearAll = el('button', { type: 'button', className: 'coveo-products-clear-all' }, 'Clear all filters');
      clearAll.addEventListener('click', () => {
        facets.clearAll();
        firstResult = 0;
        runSearch();
      });
      children.push(clearAll);
    }
    models.filter((m) => m.values.length).forEach((m) => children.push(facetGroup(m, ctx)));
    facetColumn.replaceChildren(...children);
  };

  runSearch = async () => {
    if (controller) controller.abort();
    controller = new AbortController();
    requestId += 1;
    const current = requestId;
    block.setAttribute('aria-busy', 'true');
    block.classList.add('is-loading');
    renderStatus(status, { type: 'loading', message: 'Loading…' });
    persist();
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
          facets,
        }),
      });
      if (current !== requestId) return;
      const info = pagination(response, firstResult, cfg.perPage);
      // a stored page beyond the results (e.g. the catalog shrank): go back to page 1
      if (!response.results.length && firstResult > 0 && info.total > 0) {
        firstResult = 0;
        runSearch();
        return;
      }
      const products = uniqueById(response.results.map((r) => normalizeProduct(r, cfg.base)));
      list.replaceChildren(...products.map((p) => productCard(p, cfg)));
      renderFacets(facets.facetsFrom(response.groupByResults));
      summary.textContent = info.total ? `Results ${info.first}-${info.last} of ${info.total}` : '';
      renderStatus(status, info.total ? { type: 'none' } : { type: 'empty', message: cfg.noResults });
      const pager = renderPager({
        page: info.page,
        pages: info.pages,
        className: 'coveo-products-pager',
        labels: { previous: '', next: '' },
        hideDisabled: true,
        onSelect: (page) => {
          firstResult = page * cfg.perPage;
          runSearch();
          block.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
      });
      pagerSlot.replaceChildren(...(pager ? [pager] : []));
    } catch (e) {
      if (current !== requestId || e.aborted) return;
      list.replaceChildren();
      pagerSlot.replaceChildren();
      summary.textContent = '';
      renderFacets(lastFacets);
      renderStatus(status, {
        type: 'error', message: cfg.errorText, onRetry: () => runSearch(), retryLabel: 'Retry',
      });
    } finally {
      if (current === requestId) {
        block.removeAttribute('aria-busy');
        block.classList.remove('is-loading');
      }
    }
  };

  renderFacets(lastFacets);
  runSearch();
}
