import { moveInstrumentation } from '../../scripts/scripts.js';

const PAGE_SIZE = 5;
const COLUMNS = ['Title', 'Document Type', 'Doc Id', 'Lot Number(s)'];
const GROUPS = [
  { key: 'type', name: 'Document Type' },
  { key: 'languages', name: 'Language' },
  { key: 'lots', name: 'Lot Number' },
];
const isDesktop = window.matchMedia('(width >= 992px)');

let instance = 0;

const splitList = (text) => text.split(',').map((v) => v.trim()).filter(Boolean);

/**
 * "Name: Value" lines (list items or paragraphs) -> { lots: [...], languages: [...] }.
 * @param {Element} cell
 */
function readDetails(cell) {
  const details = { lots: [], languages: [] };
  if (!cell) return details;
  const lines = [...cell.querySelectorAll('li')];
  (lines.length ? lines : [...cell.querySelectorAll('p')]).forEach((el) => {
    const line = el.textContent.trim();
    const i = line.indexOf(':');
    if (i < 1) return;
    const name = line.slice(0, i).trim();
    const values = splitList(line.slice(i + 1));
    if (/^lot/i.test(name)) details.lots.push(...values);
    else if (/^lang/i.test(name)) details.languages.push(...values);
  });
  return details;
}

/**
 * Reads one authored row: title link | document type | doc id | details.
 * @param {Element} row
 */
function readRow(row) {
  const cells = [...row.children];
  const linkCell = cells.find((cell) => cell.querySelector('a')) || cells[0];
  const rest = cells.filter((cell) => cell !== linkCell);
  const [typeCell, idCell, detailsCell] = rest;
  const link = linkCell?.querySelector('a');
  const { lots, languages } = readDetails(detailsCell);
  const type = typeCell?.textContent.trim() || '';
  return {
    title: (link || linkCell)?.textContent.trim() || '',
    href: link?.getAttribute('href') || null,
    type,
    docId: idCell?.textContent.trim() || '',
    lots,
    languages,
    values: { type: type ? [type] : [], languages, lots },
  };
}

/** One table row; the title opens the document in a new tab, as on the live site. */
function buildRow(row, data) {
  const tr = document.createElement('tr');
  moveInstrumentation(row, tr);
  const title = document.createElement('td');
  if (data.href) {
    const a = document.createElement('a');
    a.href = data.href;
    a.textContent = data.title;
    a.target = '_blank';
    a.rel = 'noopener';
    title.append(a);
  } else {
    title.textContent = data.title;
  }
  const cells = [data.type, data.docId, data.lots.join(', ')].map((text) => {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
  });
  tr.append(title, ...cells);
  return tr;
}

/** Filter groups: values in order of first appearance. */
function collectGroups(items) {
  return GROUPS.map((group) => ({
    ...group,
    values: [...new Set(items.flatMap((item) => item.values[group.key]))],
  }));
}

/**
 * Builds the filter boxes: a title that drops a list of checkbox values (desktop),
 * a clear button while the group has a selection, and a decorative settings icon.
 */
function buildFilters(groups, onToggle, onClear) {
  const panel = document.createElement('div');
  panel.className = 'technical-documents-filters';
  panel.id = `technical-documents-${instance}-filters`;
  groups.forEach((group, g) => {
    const box = document.createElement('div');
    box.className = 'technical-documents-filter';
    box.classList.toggle('is-empty', !group.values.length);
    const listId = `technical-documents-${instance}-filter-${g}`;

    const header = document.createElement('div');
    header.className = 'technical-documents-filter-header';
    const title = document.createElement('button');
    title.type = 'button';
    title.className = 'technical-documents-filter-title';
    title.textContent = group.name;
    title.setAttribute('aria-expanded', 'false');
    title.setAttribute('aria-controls', listId);
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'technical-documents-filter-clear';
    clear.setAttribute('aria-label', `Clear ${group.name}`);
    clear.hidden = true;
    clear.addEventListener('click', () => onClear(group));
    const settings = document.createElement('span');
    settings.className = 'technical-documents-filter-settings';
    settings.setAttribute('aria-hidden', 'true');
    header.append(title, clear, settings);

    const list = document.createElement('ul');
    list.className = 'technical-documents-filter-values';
    list.id = listId;
    list.setAttribute('aria-label', group.name);
    group.inputs = new Map();
    group.values.forEach((value) => {
      const li = document.createElement('li');
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = value;
      input.addEventListener('change', () => onToggle(group, value, input.checked));
      const caption = document.createElement('span');
      caption.className = 'technical-documents-filter-caption';
      caption.textContent = value;
      const count = document.createElement('span');
      count.className = 'technical-documents-filter-count';
      label.append(input, caption, count);
      li.append(label);
      list.append(li);
      group.inputs.set(value, { li, input, count });
    });

    const footer = document.createElement('div');
    footer.className = 'technical-documents-filter-footer';
    box.append(header, list, footer);
    Object.assign(group, { box, title, clear });
    panel.append(box);
  });
  return panel;
}

/**
 * Decorates the technical-documents block: a sortable table of documents (title link,
 * document type, doc id, lot numbers) with Document Type / Language / Lot Number filters,
 * five rows a page. Filters combine with OR inside a group and AND across groups.
 * @param {Element} block
 */
export default function decorate(block) {
  instance += 1;
  const items = [...block.children].map((row) => {
    const data = readRow(row);
    return { ...data, row: buildRow(row, data) };
  });
  const groups = collectGroups(items);
  const selected = new Map(groups.map((group) => [group.key, new Set()]));
  let order = [...items];
  let page = 0;

  const matches = (item, except) => [...selected].every(([key, values]) => key === except
    || !values.size || item.values[key].some((v) => values.has(v)));

  // ---- table
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const sortKeys = [(i) => i.title, (i) => i.type, (i) => i.docId, (i) => i.lots.join(', ')];
  let sort = { col: -1, dir: 1 };
  const headers = COLUMNS.map((name, col) => {
    const th = document.createElement('th');
    th.scope = 'col';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'technical-documents-sort';
    button.textContent = name;
    button.addEventListener('click', () => {
      sort = { col, dir: sort.col === col ? -sort.dir : 1 };
      const key = sortKeys[col];
      const compare = (a, b) => key(a).localeCompare(key(b), undefined, { numeric: true });
      order = [...items].sort((a, b) => sort.dir * compare(a, b));
      page = 0;
      // eslint-disable-next-line no-use-before-define
      render();
    });
    th.append(button);
    headRow.append(th);
    return th;
  });
  thead.append(headRow);
  const tbody = document.createElement('tbody');
  table.append(thead, tbody);
  const scroll = document.createElement('div');
  scroll.className = 'technical-documents-scroll';
  scroll.append(table);

  const summary = document.createElement('p');
  summary.className = 'technical-documents-summary';
  summary.setAttribute('aria-live', 'polite');

  const pager = document.createElement('nav');
  pager.className = 'technical-documents-pager';
  pager.setAttribute('aria-label', 'Pagination');

  const render = () => {
    const visible = order.filter((item) => matches(item));
    const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    page = Math.min(page, pages - 1);
    const start = page * PAGE_SIZE;
    const shown = visible.slice(start, start + PAGE_SIZE);
    tbody.replaceChildren(...shown.map((item) => item.row));
    summary.textContent = visible.length
      ? `Results ${start + 1}-${start + shown.length} of ${visible.length}`
      : 'There are no documents to display';
    headers.forEach((th, col) => {
      if (col === sort.col) th.setAttribute('aria-sort', sort.dir > 0 ? 'ascending' : 'descending');
      else th.removeAttribute('aria-sort');
    });

    groups.forEach((group) => {
      const chosen = selected.get(group.key);
      group.inputs.forEach(({ input, count }, value) => {
        input.checked = chosen.has(value);
        count.textContent = items.filter((item) => matches(item, group.key)
          && item.values[group.key].includes(value)).length;
      });
      group.box.classList.toggle('is-active', chosen.size > 0);
      group.clear.hidden = !chosen.size;
    });

    pager.replaceChildren();
    if (pages < 2) return;
    const list = document.createElement('ul');
    const add = (label, n, text) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', label);
      if (text) b.textContent = text;
      else b.className = `technical-documents-pager-${label === 'Previous' ? 'prev' : 'next'}`;
      if (n === page && text) b.setAttribute('aria-current', 'page');
      b.addEventListener('click', () => { page = n; render(); });
      const li = document.createElement('li');
      li.append(b);
      list.append(li);
    };
    if (page > 0) add('Previous', page - 1);
    for (let i = 0; i < pages; i += 1) add(`Page ${i + 1}`, i, String(i + 1));
    if (page < pages - 1) add('Next', page + 1);
    pager.append(list);
  };

  // ---- filters
  const filters = buildFilters(groups, (group, value, on) => {
    const set = selected.get(group.key);
    if (on) set.add(value);
    else set.delete(value);
    page = 0;
    render();
  }, (group) => {
    selected.get(group.key).clear();
    page = 0;
    render();
  });

  // desktop: one value list open at a time, closed by its title, Escape or a click elsewhere
  const closeLists = (except) => groups.forEach((group) => {
    if (group === except) return;
    group.box.classList.remove('is-open');
    group.title.setAttribute('aria-expanded', 'false');
  });
  groups.forEach((group) => {
    group.title.addEventListener('click', () => {
      if (!isDesktop.matches || !group.values.length) return;
      const open = !group.box.classList.contains('is-open');
      closeLists(group);
      group.box.classList.toggle('is-open', open);
      group.title.setAttribute('aria-expanded', String(open));
    });
  });

  // phones and tablets: the groups fold into a "Filters" dropdown, as in the product table
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'technical-documents-filters-toggle';
  toggle.textContent = 'Filters';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', filters.id);
  const wash = document.createElement('div');
  wash.className = 'technical-documents-filters-wash';
  const setOpen = (open) => {
    block.classList.toggle('is-filters-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(!block.classList.contains('is-filters-open')));
  wash.addEventListener('click', () => setOpen(false));
  isDesktop.addEventListener('change', () => { setOpen(false); closeLists(); });

  block.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = groups.find((group) => group.box.classList.contains('is-open'));
    if (open) {
      closeLists();
      open.title.focus();
    } else if (block.classList.contains('is-filters-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!filters.contains(e.target)) closeLists();
  });

  block.replaceChildren(toggle, wash, filters, summary, scroll, pager);
  render();
}
