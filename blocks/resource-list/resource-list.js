import { readConfigRows, configText } from '../../scripts/block-config.js';
import fetchResources from '../../scripts/sitecore/resource-client.js';
import { loadSavedData, resourcesSaved } from '../../scripts/coveo/coveo-saved.js';
import {
  el, htmlToText, renderPager, renderStatus,
} from '../../scripts/search-ui.js';

/**
 * Content and Resources list (source: product pages). A "Resource Type"
 * multi-select dropdown, a server-paged list (5 per page) and a pager, all
 * fetched from the Sitecore resource controller. Key/value configuration:
 *   endpoint, data source id, filter options ("Label = GUID|GUID", separated by ";"),
 *   and optional labels (filter by text, dropdown text, done, no matching text).
 * Optional "fallback data": URL of a saved copy of the controller's complete list,
 * used (and announced) when the live controller can't be reached.
 */

let instance = 0;

/**
 * Parses "Label = GUID|GUID" options, separated by ";" or new lines.
 * @param {string} text
 * @returns {{label: string, value: string}[]}
 */
function parseOptions(text) {
  return (text || '').split(/\n|;/)
    .map((line) => line.trim().match(/^(.*?)\s*=\s*(\{.*)$/))
    .filter(Boolean)
    .map((match) => ({ label: match[1].trim(), value: match[2].replace(/\s+/g, '') }));
}

/**
 * Icon for the source's Font Awesome class (video for pages, PDF for documents).
 * @param {string} faClass
 * @returns {string}
 */
function iconType(faClass) {
  if (/pdf/i.test(faClass || '')) return 'pdf';
  if (/video|play/i.test(faClass || '')) return 'video';
  return 'document';
}

/**
 * @param {object} item API item
 * @returns {HTMLElement}
 */
function resourceItem(item) {
  const li = el('li', { className: 'resource-list-item' });
  li.append(el('span', { className: `resource-list-icon resource-list-icon-${iconType(item.contentIcon)}`, 'aria-hidden': 'true' }));
  const body = el('div', { className: 'resource-list-body' });
  const title = htmlToText(item.contentTitle);
  body.append(item.contentUrl
    ? el('a', {
      className: 'resource-list-title', href: item.contentUrl, target: '_blank', rel: 'noopener',
    }, title)
    : el('span', { className: 'resource-list-title' }, title));
  const description = htmlToText(item.contentDescription);
  if (description) body.append(el('p', { className: 'resource-list-text' }, description));
  li.append(body);
  return li;
}

export default function decorate(block) {
  instance += 1;
  const id = `resource-list-${instance}`;
  const config = readConfigRows(block);
  const cfg = {
    base: configText(config, 'endpoint'),
    dataSourceId: configText(config, 'dataSourceId'),
    filterBy: configText(config, 'filterByLabel', 'Filter by:'),
    dropdownText: configText(config, 'dropdownLabel', 'Resource Type'),
    doneLabel: configText(config, 'doneLabel', 'Done'),
    noMatching: configText(config, 'noMatchingMessage', 'No matching records found'),
    errorText: configText(config, 'errorMessage', 'Resources could not be loaded.'),
    fallbackData: configText(config, 'fallbackData'),
  };
  const options = parseOptions(configText(config, 'filterOptions'));
  const allOption = options.find((o) => /^all$/i.test(o.label));
  const typeOptions = options.filter((o) => o !== allOption);
  const allValue = allOption ? allOption.value : typeOptions.map((o) => o.value).join('|');

  // ---- filter dropdown ----
  const panelId = `${id}-panel`;
  const trigger = el('button', {
    type: 'button', className: 'resource-list-trigger', 'aria-expanded': 'false', 'aria-controls': panelId, 'aria-haspopup': 'true',
  }, el('span', {}, cfg.dropdownText));
  const panel = el('div', {
    className: 'resource-list-panel', id: panelId, hidden: true, role: 'group', 'aria-label': cfg.dropdownText,
  });
  const boxes = [];
  const addBox = (option, isAll) => {
    const inputId = `${id}-opt-${boxes.length}`;
    const input = el('input', { type: 'checkbox', id: inputId, value: option.value });
    boxes.push({ input, option, isAll });
    panel.append(el('div', { className: `resource-list-option${isAll ? ' is-all' : ''}` }, input, el('label', { for: inputId }, option.label)));
  };
  if (allOption || typeOptions.length) addBox(allOption || { label: 'All', value: allValue }, true);
  typeOptions.forEach((o) => addBox(o, false));
  const done = el('button', { type: 'button', className: 'resource-list-done' }, cfg.doneLabel);
  panel.append(el('div', { className: 'resource-list-done-row' }, done));

  // "All" checks or clears every type; any type unchecked clears "All"
  panel.addEventListener('change', (e) => {
    const box = boxes.find((b) => b.input === e.target);
    if (!box) return;
    if (box.isAll) boxes.forEach((b) => { b.input.checked = box.input.checked; });
    else {
      const all = boxes.find((b) => b.isAll);
      if (all) all.input.checked = boxes.filter((b) => !b.isAll).every((b) => b.input.checked);
    }
  });

  const filter = el(
    'div',
    { className: 'resource-list-filter' },
    el('span', { className: 'resource-list-filter-heading' }, cfg.filterBy),
    el('div', { className: 'resource-list-dropdown' }, trigger, panel),
  );
  const status = el('div', { className: 'resource-list-status search-status', role: 'status' });
  const savedNote = el('p', { className: 'resource-list-saved-note', hidden: true });
  const list = el('ul', { className: 'resource-list-items' });
  const pagerSlot = el('div', { className: 'resource-list-pager-slot' });
  block.replaceChildren(filter, savedNote, status, list, pagerSlot);

  // ---- state ----
  let filterValue = allValue;
  let page = 1;
  let controller = null;
  let requestId = 0;
  // 'live' until the live controller fails and saved data is configured
  let source = 'live';

  const openPanel = (open) => {
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    block.classList.toggle('is-open', open);
    if (open) boxes[0]?.input.focus();
  };

  let load;
  const applyFilter = () => {
    const chosen = boxes.filter((b) => !b.isAll && b.input.checked).map((b) => b.option.value);
    const allChecked = boxes.find((b) => b.isAll)?.input.checked;
    const next = allChecked || !chosen.length ? allValue : chosen.join('|');
    openPanel(false);
    trigger.focus();
    if (next === filterValue) return;
    filterValue = next;
    page = 1;
    load();
  };

  trigger.addEventListener('click', () => openPanel(panel.hidden));
  done.addEventListener('click', applyFilter);
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      openPanel(false);
      trigger.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!panel.hidden && !filter.contains(e.target)) openPanel(false);
  });

  load = async () => {
    if (!cfg.dataSourceId || !filterValue) {
      renderStatus(status, { type: 'error', message: 'Resources are not configured (data source id and filter options are required).' });
      return;
    }
    if (controller) controller.abort();
    controller = new AbortController();
    requestId += 1;
    const current = requestId;
    block.setAttribute('aria-busy', 'true');
    renderStatus(status, { type: 'loading', message: 'Loading…' });
    const fromSaved = async () => {
      const saved = await loadSavedData(cfg.fallbackData);
      if (source !== 'saved') {
        source = 'saved';
        savedNote.textContent = `Showing saved resources${saved.capturedAt ? ` from ${saved.capturedAt}` : ''}: the live list is not available on this site.`;
        savedNote.hidden = false;
      }
      return resourcesSaved(saved, filterValue, page);
    };
    try {
      let data;
      if (source === 'saved') {
        data = await fromSaved();
      } else {
        try {
          data = await fetchResources({
            base: cfg.base,
            dataSourceId: cfg.dataSourceId,
            filterValue,
            pageNumber: page,
            signal: controller.signal,
          });
        } catch (e) {
          if (e.aborted || !cfg.fallbackData) throw e;
          data = await fromSaved();
        }
      }
      if (current !== requestId) return;
      const seen = new Set();
      const items = data.items.filter((item) => {
        const key = `${item.contentUrl}|${item.contentTitle}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      list.replaceChildren(...items.map(resourceItem));
      renderStatus(status, items.length ? { type: 'none' } : { type: 'empty', message: cfg.noMatching });
      const pager = renderPager({
        page: page - 1,
        pages: data.totalPages,
        className: 'resource-list-pager',
        labels: { previous: 'Prev', next: 'Next' },
        onSelect: (target) => {
          page = target + 1;
          load();
        },
      });
      pagerSlot.replaceChildren(...(pager ? [pager] : []));
    } catch (e) {
      if (current !== requestId || e.aborted) return;
      list.replaceChildren();
      pagerSlot.replaceChildren();
      renderStatus(status, { type: 'error', message: cfg.errorText, onRetry: () => load() });
    } finally {
      if (current === requestId) block.removeAttribute('aria-busy');
    }
  };

  load();
}
