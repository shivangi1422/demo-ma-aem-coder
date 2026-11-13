import { readConfigRows, configText } from '../../scripts/block-config.js';
import { search } from '../../scripts/coveo/coveo-client.js';
import buildSearchParams from '../../scripts/coveo/coveo-query-builder.js';
import { FacetState, parseFacetDefinitions } from '../../scripts/coveo/coveo-facets.js';
import {
  normalizeProduct, pagination, rawValue, uniqueById,
} from '../../scripts/coveo/coveo-results.js';
import { loadSavedData, searchSaved } from '../../scripts/coveo/coveo-saved.js';
import {
  el, htmlToText, renderPager, renderStatus,
} from '../../scripts/search-ui.js';

/**
 * Site search (source: www.mybeckman.in/search, Coveo for Sitecore JSUI): tabs,
 * facets with counts, selected-filter chips, result summary with "did you mean",
 * results in the source's four layouts (technical document, product, product
 * category / series / subcategory page, other content) and a pager.
 *
 * Key/value configuration authored in the block: endpoint, Sitecore item URI,
 * site name, search hub, pipeline, advanced query (shared by every tab), constant
 * query, locale, results per page, tabs ("tabId | Label | tab query | constant
 * query", separated by ";"), facets ("@field | Label | allowed values",
 * separated by ";"), store URL and country code (product links), labels,
 * fallback data (folder of saved per-tab responses).
 *
 * State lives in the URL hash like the source (#q=…&t=…&f:@field=[a,b]&first=…),
 * so the header search box (which submits to /search#q=term) and back/forward work.
 * When the live search can't be reached (it only answers on the source's own
 * domain) the block switches to the saved responses and says so.
 */

let instance = 0;

const TYPE_LABELS = {
  'product category': 'Product Category',
  'product spotlight': 'Product Series',
  'product series selector': 'Product Subcategory',
};
const TECHDOC_SOURCE = 'techdocs-upgrade';
const TEXT_LIMIT = 200;

/**
 * @param {string} text
 * @param {number} limit
 * @returns {string} text cut at a word boundary with an ellipsis
 */
function truncate(text, limit = TEXT_LIMIT) {
  if (!text || text.length <= limit) return text || '';
  const cut = text.slice(0, limit);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), limit - 20)).trim()} …`;
}

/**
 * Plain text of an indexed HTML field; inline <style> / <script> blocks (some page
 * bodies carry their own CSS) are dropped, not shown as text.
 * @param {string} html
 * @returns {string}
 */
function bodyText(html) {
  if (!html) return '';
  // plain text (saved results, most index fields): no parsing needed
  if (!/[<&]/.test(html)) return html.replace(/\s+/g, ' ').trim();
  if (!/<(style|script|noscript)\b/i.test(html)) return htmlToText(html);
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  doc.body.querySelectorAll('style, script, noscript').forEach((node) => node.remove());
  return htmlToText(doc.body.innerHTML);
}

/**
 * All values of a raw field as strings (multi-value fields are arrays).
 * @param {object} raw
 * @param {string} name
 * @returns {string[]}
 */
function rawList(raw, name) {
  const value = raw ? raw[name] : undefined;
  if (value === undefined || value === null || value === '') return [];
  return (Array.isArray(value) ? value : String(value).split(',')).map((v) => String(v).trim()).filter(Boolean);
}

/**
 * Parses tab definitions "tabId | Label | tab query | constant query" (";"-separated).
 * @param {string} text
 * @returns {{id: string, label: string, aq: string, cq: string}[]}
 */
function parseTabs(text) {
  return (text || '').split(/\n|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, label = '', aq = '', cq = ''] = line.split('|').map((part) => part.trim());
      return {
        id, label: label || id, aq, cq,
      };
    })
    .filter((tab) => tab.id);
}

/**
 * Hash state in the source's JSUI format.
 * @returns {{q: string, t: string, first: number, f: Map<string, string[]>}}
 */
function readHash() {
  const state = {
    q: '', t: '', first: 0, f: new Map(),
  };
  window.location.hash.replace(/^#/, '').split('&').forEach((part) => {
    const index = part.indexOf('=');
    if (index < 0) return;
    const key = decodeURIComponent(part.slice(0, index));
    let value;
    try {
      value = decodeURIComponent(part.slice(index + 1).replace(/\+/g, ' '));
    } catch {
      return;
    }
    if (key === 'q') state.q = value.trim();
    else if (key === 't') state.t = value;
    else if (key === 'first') state.first = Math.max(0, Number.parseInt(value, 10) || 0);
    else if (key.startsWith('f:')) {
      const values = value.replace(/^\[|\]$/g, '').split(',').map((v) => v.trim()).filter(Boolean);
      if (values.length) state.f.set(key.slice(2), values);
    }
  });
  return state;
}

/**
 * @param {{q: string, t: string, first: number, f: Map<string, string[]>}} state
 * @returns {string} hash without "#"
 */
function hashFrom(state) {
  const parts = [];
  if (state.q) parts.push(`q=${encodeURIComponent(state.q)}`);
  if (state.t) parts.push(`t=${encodeURIComponent(state.t)}`);
  state.f.forEach((values, field) => {
    if (values.length) parts.push(`f:${field}=[${values.map(encodeURIComponent).join(',')}]`);
  });
  if (state.first) parts.push(`first=${state.first}`);
  return parts.join('&');
}

/**
 * Normalizes a search result into the data one of the four layouts renders.
 * @param {object} result Coveo result
 * @param {object} cfg block settings
 * @returns {object}
 */
function normalizeResult(result, cfg) {
  const raw = result.raw || {};
  const id = result.uniqueId || result.clickUri;
  if (rawValue(raw, 'syssource').toLowerCase() === TECHDOC_SOURCE) {
    const name = rawValue(raw, 'documentname');
    const docId = rawValue(raw, 'documentid');
    const number = rawValue(raw, 'documentnumber');
    const revision = rawValue(raw, 'documentrevision');
    const title = rawValue(raw, 'documenttitle') || result.title || '';
    const description = bodyText(rawValue(raw, 'documentdescription'));
    const released = Number(rawValue(raw, 'releasedate'));
    return {
      kind: 'techdoc',
      id,
      title,
      url: result.showTechDoc !== false && name && docId
        ? `/techdocs/${encodeURIComponent(name)}/${encodeURIComponent(docId)}` : '',
      fields: [
        ['Document Type', rawValue(raw, 'category')],
        ['Document Number', number && revision ? `${number}.${revision}` : number],
        ['Lot Number', rawValue(raw, 'lotnumber')],
        ['Language', rawList(raw, 'documentlanguage').join(', ')],
      ],
      description: description && description !== title ? description : '',
      details: [
        ['Released', released ? new Date(released).toLocaleDateString('en-US') : ''],
        ['Item Number(s)', rawList(raw, 'itemnumber').join(', ')],
        ['Product Line', rawValue(raw, 'productline')],
        ['Product', rawList(raw, 'product').join(', ')],
      ],
      disclaimer: rawValue(raw, 'disclaimer'),
    };
  }
  const title = rawValue(raw, 'itemtitlewithbranding') || result.title || '';
  const type = (result.templateType || '').toLowerCase();
  if (type === 'product') {
    const product = normalizeProduct(result, cfg.base);
    const number = rawValue(raw, 'partz32xnumber') || product.productNumber;
    const name = rawValue(raw, 'z95xname') || number;
    return {
      kind: 'product',
      id,
      title,
      url: name
        ? `${cfg.storeUrl}/p/${encodeURIComponent(name)}?countryCode=${encodeURIComponent(cfg.countryCode)}`
        : result.clickUri,
      image: product.image,
      number,
    };
  }
  if (TYPE_LABELS[type]) {
    const rawImage = rawValue(raw, 'imageurl');
    return {
      kind: 'page',
      id,
      title,
      url: result.clickUri,
      image: /^https?:\/\//i.test(rawImage) ? rawImage : (result.imageUrl || ''),
      label: TYPE_LABELS[type],
      text: truncate(bodyText(rawValue(raw, 'fbody72451')) || bodyText(result.excerpt)),
    };
  }
  return {
    kind: 'other',
    id,
    title,
    url: result.clickUri,
    text: truncate(bodyText(rawValue(raw, 'itemdescription')) || bodyText(result.excerpt)),
  };
}

/**
 * @param {string} src
 * @param {HTMLElement} holder element that gets .is-missing when the image fails
 * @param {boolean} eager load now (results in the first viewport)
 * @returns {HTMLImageElement}
 */
function thumbnail(src, holder, eager) {
  // decorative: the title link next to it names the result
  const img = el('img', {
    src, alt: '', loading: eager ? 'eager' : 'lazy', decoding: 'async', width: '70', height: '70',
  });
  img.addEventListener('error', () => {
    holder.classList.add('is-missing');
    img.remove();
  }, { once: true });
  return img;
}

/**
 * Result item markup for one normalized result.
 * @param {object} r
 * @param {number} index position in the list
 * @returns {HTMLElement}
 */
function resultItem(r, index) {
  const item = el('li', { className: `coveo-search-result is-${r.kind}` });
  if (r.image) {
    const media = el('div', { className: 'coveo-search-result-image' });
    media.append(thumbnail(r.image, media, index < 2));
    item.append(media);
  }
  const body = el('div', { className: 'coveo-search-result-body' });
  const heading = el('h3', { className: 'coveo-search-result-title' });
  if (r.url) {
    const link = el('a', { href: r.url }, r.title);
    if (r.kind === 'techdoc') {
      link.target = '_blank';
      link.rel = 'noopener';
    }
    heading.append(link);
  } else {
    heading.append(el('span', { className: 'coveo-search-result-restricted' }, r.title));
  }
  body.append(heading);

  if (r.kind === 'product' && r.number) {
    body.append(el('p', { className: 'coveo-search-result-number' }, `Product No: ${r.number}`));
  }
  if (r.label) body.append(el('p', { className: 'coveo-search-result-label' }, r.label));
  if (r.text) body.append(el('p', { className: 'coveo-search-result-text' }, r.text));

  if (r.kind === 'techdoc') {
    const fields = el('dl', { className: 'coveo-search-techdoc-fields' });
    r.fields.forEach(([label, value]) => {
      fields.append(el('div', {}, el('dt', {}, label), el('dd', {}, value || '–')));
    });
    body.append(fields);
    if (r.description) body.append(el('p', { className: 'coveo-search-result-text' }, r.description));
    const details = el('dl', { className: 'coveo-search-techdoc-details' });
    r.details.filter(([, value]) => value).forEach(([label, value]) => {
      details.append(el('div', {}, el('dt', {}, `${label}:`), el('dd', {}, value)));
    });
    if (details.children.length) body.append(details);
    if (r.disclaimer) body.append(el('p', { className: 'coveo-search-techdoc-disclaimer' }, `Disclaimer: ${r.disclaimer}`));
    body.append(el('p', { className: 'coveo-search-result-label' }, 'Documentation'));
  }
  item.append(body);
  return item;
}

/**
 * Saved-data search: free-text terms must all appear in the result's text fields,
 * then the shared facet rules run on the matching results.
 * @param {object} data saved tab file
 * @param {object} options
 * @returns {object} Coveo-shaped response
 */
function searchSavedTab(data, {
  q, facets, firstResult, numberOfResults,
}) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const results = !terms.length ? data.results || [] : (data.results || []).filter((r) => {
    const raw = r.raw || {};
    const haystack = [r.title, r.excerpt, raw.itemtitlewithbranding, raw.itemdescription,
      raw.fbody72451, raw.documenttitle, raw.documentname, raw.documentnumber, raw.category,
      raw.product, raw.productline, raw.partz32xnumber, raw.z95xname]
      .flat().filter(Boolean).join(' ')
      .toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
  return searchSaved({ results }, { facets, firstResult, numberOfResults });
}

export default function decorate(block) {
  instance += 1;
  const id = `coveo-search-${instance}`;
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
    perPage: Number.parseInt(configText(config, 'resultsPerPage', '10'), 10) || 10,
    tabs: parseTabs(configText(config, 'tabs')),
    storeUrl: configText(config, 'storeUrl', 'https://store.beckman.com/hi').replace(/\/+$/, ''),
    countryCode: configText(config, 'countryCode', 'IN'),
    filtersLabel: configText(config, 'filtersLabel', 'Filters'),
    noResults: configText(config, 'noResultsMessage', 'No results found. Try other search terms or clear your filters.'),
    errorText: configText(config, 'errorMessage', 'Search results could not be loaded.'),
    fallbackData: configText(config, 'fallbackData').replace(/\/+$/, ''),
  };
  if (!cfg.tabs.length) {
    cfg.tabs = [{
      id: 'all', label: 'All Results', aq: '', cq: '',
    }];
  }
  const facets = new FacetState(parseFacetDefinitions(configText(config, 'facets')));
  const DISPLAY_VALUES = facets.maximumNumberOfValues - 1;

  // ---- layout ----
  const tablist = el('div', { className: 'coveo-search-tabs', role: 'tablist', 'aria-label': 'Result types' });
  const panelId = `${id}-panel`;
  const tabButtons = cfg.tabs.map((tab, i) => {
    const button = el('button', {
      type: 'button',
      role: 'tab',
      id: `${id}-tab-${i}`,
      className: 'coveo-search-tab',
      'aria-controls': panelId,
      'aria-selected': 'false',
      tabindex: '-1',
      'data-tab': tab.id,
    }, tab.label);
    tablist.append(button);
    return button;
  });

  const filtersToggle = el('button', {
    type: 'button', className: 'coveo-search-filters-toggle', 'aria-expanded': 'false', 'aria-controls': `${id}-facets`,
  }, cfg.filtersLabel);
  const facetColumn = el('div', { className: 'coveo-search-facets', id: `${id}-facets` });
  const aside = el(
    'aside',
    { className: 'coveo-search-filters', 'aria-labelledby': `${id}-filters-title` },
    el('h2', { className: 'coveo-search-filters-title', id: `${id}-filters-title` }, cfg.filtersLabel),
    facetColumn,
  );

  const savedNote = el('p', { className: 'coveo-search-saved-note', hidden: true });
  const chips = el('div', { className: 'coveo-search-chips' });
  const summary = el('p', { className: 'coveo-search-summary', role: 'status', 'aria-live': 'polite' });
  const didYouMean = el('p', { className: 'coveo-search-did-you-mean', hidden: true });
  const status = el('div', { className: 'coveo-search-status search-status', role: 'status' });
  const list = el('ul', { className: 'coveo-search-results', 'aria-labelledby': `${id}-results-title` });
  const pagerSlot = el('div', { className: 'coveo-search-pager-slot' });
  const panel = el(
    'div',
    { className: 'coveo-search-panel', id: panelId, role: 'tabpanel' },
    el('h2', { className: 'coveo-search-results-title', id: `${id}-results-title` }, 'Search results'),
    savedNote,
    chips,
    summary,
    didYouMean,
    status,
    list,
    pagerSlot,
  );
  // grid areas: tabs / filters button / filters / results on mobile, filters beside
  // tabs and results from 992px
  const layout = el('div', { className: 'coveo-search-layout' }, tablist, filtersToggle, aside, panel);
  block.replaceChildren(layout);
  // keep the page tall until the first results arrive, so the footer doesn't jump
  block.classList.add('is-initial');
  // the source page has no H1; give the page one for headings and screen readers
  if (!document.querySelector('main h1')) {
    block.prepend(el('h1', { className: 'coveo-search-page-title' }, configText(config, 'pageHeading', 'Search')));
  }

  if (!cfg.searchHub || !cfg.itemUri) {
    renderStatus(status, { type: 'error', message: 'Search is not configured (search hub and Sitecore item URI are required).' });
    return;
  }

  // ---- state ----
  let state = readHash();
  let controller = null;
  let requestId = 0;
  let lastFacets = facets.facetsFrom([]);
  let source = 'live';
  const collapsed = new Set();
  let runSearch;

  const currentTab = () => cfg.tabs.find((t) => t.id === state.t) || cfg.tabs[0];

  const applyStateToFacets = () => {
    facets.clearAll();
    state.f.forEach((values, field) => {
      if (facets.selected.has(field)) facets.selected.set(field, [...values]);
    });
  };

  const syncHeaderSearch = () => {
    document.querySelectorAll('header input[type="search"]').forEach((input) => {
      if (document.activeElement !== input) input.value = state.q;
    });
  };

  /** Writes the state to the hash (a new history entry) and searches. */
  const navigate = (changes) => {
    state = { ...state, ...changes };
    state.f = new Map([...facets.selected]
      .filter(([, v]) => v.length)
      .map(([k, v]) => [k, [...v]]));
    const hash = hashFrom({ ...state, t: state.t === cfg.tabs[0].id ? '' : state.t });
    if (window.location.hash.replace(/^#/, '') !== hash) {
      window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${hash ? `#${hash}` : ''}`);
    }
    runSearch();
  };

  const renderTabs = () => {
    const active = currentTab();
    tabButtons.forEach((button, i) => {
      const selected = cfg.tabs[i].id === active.id;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      button.classList.toggle('is-selected', selected);
      if (selected) panel.setAttribute('aria-labelledby', button.id);
    });
  };

  tabButtons.forEach((button, i) => {
    button.addEventListener('click', () => {
      if (cfg.tabs[i].id === currentTab().id) return;
      navigate({ t: cfg.tabs[i].id, first: 0 });
    });
    button.addEventListener('keydown', (e) => {
      const keys = {
        ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabButtons.length - 1,
      };
      if (!(e.key in keys)) return;
      e.preventDefault();
      const target = tabButtons[(keys[e.key] + tabButtons.length) % tabButtons.length];
      target.focus();
      target.click();
    });
  });

  filtersToggle.addEventListener('click', () => {
    const open = filtersToggle.getAttribute('aria-expanded') !== 'true';
    filtersToggle.setAttribute('aria-expanded', String(open));
    layout.classList.toggle('is-filters-open', open);
  });

  const facetGroup = (facet) => {
    const listId = `${id}-${facet.field.replace(/[^a-z0-9]/gi, '')}`;
    const isCollapsed = collapsed.has(facet.field);
    const expanded = facets.limits.has(facet.field);
    const group = el('div', { className: `coveo-search-facet${isCollapsed ? ' is-collapsed' : ''}`, role: 'group', 'aria-labelledby': `${listId}-title` });
    const header = el('div', { className: 'coveo-search-facet-header' });
    header.append(el('h3', { className: 'coveo-search-facet-title', id: `${listId}-title` }, facet.label));
    const toggle = el('button', {
      type: 'button', className: 'coveo-search-facet-toggle', 'aria-expanded': String(!isCollapsed), 'aria-controls': listId, 'aria-label': `${facet.label}: ${isCollapsed ? 'expand' : 'collapse'}`,
    });
    toggle.addEventListener('click', () => {
      if (collapsed.has(facet.field)) collapsed.delete(facet.field);
      else collapsed.add(facet.field);
      // eslint-disable-next-line no-use-before-define -- mutual recursion with renderFacets
      renderFacets(lastFacets);
      document.getElementById(`${listId}-title`)?.parentElement.querySelector('.coveo-search-facet-toggle')?.focus();
    });
    header.append(toggle);
    group.append(header);

    const content = el('div', { className: 'coveo-search-facet-content', id: listId, hidden: isCollapsed });
    const values = el('ul', { className: 'coveo-search-facet-values' });
    const shown = expanded ? facet.values : facet.values.slice(0, DISPLAY_VALUES);
    shown.forEach((v, i) => {
      const inputId = `${listId}-${i}`;
      const input = el('input', {
        type: 'checkbox', id: inputId, value: v.value, checked: v.selected,
      });
      input.addEventListener('change', () => {
        facets.toggle(facet.field, v.value);
        navigate({ first: 0 });
      });
      values.append(el(
        'li',
        { className: v.selected ? 'is-selected' : '' },
        input,
        el(
          'label',
          { for: inputId },
          el('span', { className: 'coveo-search-facet-caption' }, v.value),
          el('span', { className: 'coveo-search-facet-count' }, v.count.toLocaleString('en-US')),
        ),
      ));
    });
    content.append(values);
    if (expanded || facet.values.length > DISPLAY_VALUES) {
      const more = el('button', { type: 'button', className: 'coveo-search-facet-more', 'aria-expanded': String(expanded) }, expanded ? 'Show less' : 'Show all');
      more.addEventListener('click', () => {
        facets.setLimit(facet.field, expanded ? 0 : 100);
        runSearch({ keepResults: true, focusField: facet.field });
      });
      content.append(more);
    }
    group.append(content);
    return group;
  };

  const renderFacets = (models) => {
    lastFacets = models;
    facetColumn.replaceChildren(...models.filter((m) => m.values.length).map(facetGroup));
  };

  const renderChips = () => {
    const selected = [];
    facets.definitions.forEach((d) => {
      (facets.selected.get(d.field) || []).forEach((value) => selected.push({ d, value }));
    });
    if (!selected.length) {
      chips.replaceChildren();
      return;
    }
    const items = selected.map(({ d, value }) => {
      const remove = el('button', { type: 'button', className: 'coveo-search-chip', 'aria-label': `Remove filter ${d.label}: ${value}` }, el('span', { className: 'coveo-search-chip-field' }, `${d.label}:`), ` ${value}`);
      remove.addEventListener('click', () => {
        facets.toggle(d.field, value);
        navigate({ first: 0 });
      });
      return el('li', {}, remove);
    });
    const clearAll = el('button', { type: 'button', className: 'coveo-search-clear-all' }, 'Clear all filters');
    clearAll.addEventListener('click', () => {
      facets.clearAll();
      navigate({ first: 0 });
    });
    chips.replaceChildren(el('ul', { 'aria-label': 'Selected filters' }, ...items), clearAll);
  };

  runSearch = async ({ keepResults = false, focusField = '' } = {}) => {
    if (controller) controller.abort();
    controller = new AbortController();
    requestId += 1;
    const current = requestId;
    const tab = currentTab();
    applyStateToFacets();
    renderTabs();
    renderChips();
    syncHeaderSearch();
    block.setAttribute('aria-busy', 'true');
    block.classList.add('is-loading');
    if (!keepResults) renderStatus(status, { type: 'loading', message: 'Loading results…' });

    const fromSaved = async () => {
      const data = await loadSavedData(`${cfg.fallbackData}/${tab.id}.json`);
      if (source !== 'saved') source = 'saved';
      savedNote.textContent = `Showing ${(data.results || []).length} saved results for this tab${data.capturedAt ? ` (captured ${data.capturedAt})` : ''}: live search is not available on this site.`;
      savedNote.hidden = false;
      return searchSavedTab(data, {
        q: state.q, facets, firstResult: state.first, numberOfResults: cfg.perPage,
      });
    };

    try {
      let response;
      if (source === 'saved') {
        response = await fromSaved();
      } else {
        try {
          const params = buildSearchParams({
            searchHub: cfg.searchHub,
            pipeline: cfg.pipeline,
            aq: [cfg.aq, tab.aq].filter(Boolean).join(' '),
            cq: tab.cq || cfg.cq,
            q: state.q,
            locale: cfg.locale,
            firstResult: state.first,
            numberOfResults: cfg.perPage,
            facets,
          });
          params.tab = tab.id;
          params.enableDidYouMean = 'true';
          response = await search({
            base: cfg.base,
            itemUri: cfg.itemUri,
            siteName: cfg.siteName,
            signal: controller.signal,
            params,
          });
        } catch (e) {
          if (e.aborted || e.name === 'AbortError' || !cfg.fallbackData) throw e;
          response = await fromSaved();
        }
      }
      if (current !== requestId) return;
      const info = pagination(response, state.first, cfg.perPage);
      if (!response.results.length && state.first > 0 && info.total > 0) {
        navigate({ first: 0 });
        return;
      }
      const results = uniqueById(response.results.map((r) => normalizeResult(r, cfg)));
      list.replaceChildren(...results.map(resultItem));

      summary.replaceChildren();
      if (info.total) {
        summary.append(
          'Results ',
          el('strong', {}, `${info.first}-${info.last}`),
          ' of ',
          el('strong', {}, info.total.toLocaleString('en-US')),
        );
        if (state.q) summary.append(' for ', el('strong', {}, state.q));
        if (source === 'live' && response.duration) summary.append(` in ${(response.duration / 1000).toFixed(2)} seconds`);
      }
      const correction = (response.queryCorrections || [])[0];
      if (correction && correction.correctedQuery) {
        const link = el('a', { href: `#q=${encodeURIComponent(correction.correctedQuery)}` }, correction.correctedQuery);
        link.addEventListener('click', (e) => {
          e.preventDefault();
          navigate({ q: correction.correctedQuery, first: 0 });
        });
        didYouMean.replaceChildren('Did you mean: ', link, '?');
        didYouMean.hidden = false;
      } else {
        didYouMean.hidden = true;
      }
      renderStatus(status, info.total ? { type: 'none' } : { type: 'empty', message: cfg.noResults });
      const pager = renderPager({
        page: info.page,
        pages: info.pages,
        className: 'coveo-search-pager',
        labels: { previous: '', next: '', nav: 'Search results pages' },
        hideDisabled: true,
        window: 10,
        onSelect: (page) => {
          navigate({ first: page * cfg.perPage });
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
      });
      pagerSlot.replaceChildren(...(pager ? [pager] : []));

      // facets in a separate task, so results show first and no single task runs long
      await new Promise((resolve) => { setTimeout(resolve, 0); });
      if (current !== requestId) return;
      renderFacets(facets.facetsFrom(response.groupByResults));
      if (focusField) {
        const field = `${id}-${focusField.replace(/[^a-z0-9]/gi, '')}`;
        document.getElementById(field)?.querySelector('.coveo-search-facet-more')?.focus();
      }
    } catch (e) {
      if (current !== requestId || e.aborted || e.name === 'AbortError') return;
      list.replaceChildren();
      pagerSlot.replaceChildren();
      summary.textContent = '';
      didYouMean.hidden = true;
      renderFacets(lastFacets);
      renderStatus(status, {
        type: 'error', message: cfg.errorText, onRetry: () => runSearch(), retryLabel: 'Retry',
      });
    } finally {
      if (current === requestId) {
        block.removeAttribute('aria-busy');
        block.classList.remove('is-initial');
        block.classList.remove('is-loading');
      }
    }
  };

  // back/forward and the header search box (same page, new #q=); pushState itself
  // fires no event, so this only runs for history traversal and external hash changes
  window.addEventListener('hashchange', () => {
    state = readHash();
    runSearch();
  });

  renderFacets(lastFacets);
  runSearch();
}
