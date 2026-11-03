import { moveInstrumentation } from '../../scripts/scripts.js';

const PAGE_SIZE = 8;
const FACET_LIMIT = 5;

let instance = 0;

/**
 * A cell that holds nothing but a single link.
 * @param {Element} cell
 * @returns {HTMLAnchorElement|null}
 */
function linkOnly(cell) {
  const links = cell.querySelectorAll('a');
  if (links.length !== 1) return null;
  return cell.textContent.trim() === links[0].textContent.trim() ? links[0] : null;
}

/**
 * "Name: Value" lines (list items or paragraphs) -> [[name, value], …].
 * @param {Element} cell
 */
function readFilters(cell) {
  const lines = [...cell.querySelectorAll('li')];
  const source = lines.length ? lines : [...cell.querySelectorAll('p')];
  return source
    .map((el) => el.textContent.trim())
    .map((line) => {
      const i = line.indexOf(':');
      return i > 0 ? [line.slice(0, i).trim(), line.slice(i + 1).trim()] : null;
    })
    .filter((pair) => pair && pair[0] && pair[1]);
}

/**
 * Reads one authored row: image | name (linked heading) + product number | filters | quote link.
 * @param {Element} row
 */
function readRow(row) {
  const cells = [...row.children];
  const imageCell = cells.find((cell) => cell.querySelector('picture, img'));
  const textCell = cells.find((cell) => cell !== imageCell && cell.querySelector('h1, h2, h3, h4, h5, h6'));
  const quoteCell = [...cells].reverse()
    .find((cell) => ![imageCell, textCell].includes(cell) && linkOnly(cell));
  const filtersCell = cells.find((cell) => ![imageCell, textCell, quoteCell].includes(cell)
    && cell.textContent.includes(':'));
  const heading = textCell?.querySelector('h1, h2, h3, h4, h5, h6');
  const titleLink = heading?.querySelector('a');
  return {
    picture: imageCell?.querySelector('picture') || imageCell?.querySelector('img'),
    title: heading?.textContent.trim() || '',
    href: titleLink?.getAttribute('href') || null,
    details: [...(textCell?.children || [])]
      .filter((el) => el !== heading && el.textContent.trim()),
    filters: filtersCell ? readFilters(filtersCell) : [],
    quote: quoteCell ? linkOnly(quoteCell) : null,
  };
}

/** A link to the product page, or a plain wrapper when no link was authored. */
function linkTo(href, className, ...content) {
  const el = document.createElement(href ? 'a' : 'span');
  el.className = className;
  if (href) el.href = href;
  el.append(...content);
  return el;
}

/** Builds one result card. */
function buildCard(row, data) {
  const li = document.createElement('li');
  li.className = 'product-table-card';
  moveInstrumentation(row, li);

  if (data.picture) {
    // the image repeats the product name, so it is skipped by keyboard and screen readers
    const image = linkTo(data.href, 'product-table-card-image', data.picture);
    image.tabIndex = -1;
    image.setAttribute('aria-hidden', 'true');
    const img = data.picture.tagName === 'IMG' ? data.picture : data.picture.querySelector('img');
    if (img) {
      img.loading = 'lazy';
      // some source product images no longer exist; keep the space without the broken icon
      const broken = () => image.classList.add('is-broken');
      img.addEventListener('error', broken);
      if (img.complete && !img.naturalWidth && img.currentSrc) broken();
    }
    li.append(image);
  }

  const content = document.createElement('div');
  content.className = 'product-table-card-content';
  if (data.title) {
    const h = document.createElement('h4');
    h.className = 'product-table-card-title';
    h.append(linkTo(data.href, '', data.title));
    content.append(h);
  }
  data.details.forEach((el) => {
    const p = document.createElement('p');
    p.className = 'product-table-card-number';
    p.textContent = el.textContent.trim();
    content.append(p);
  });
  li.append(content);

  const footer = document.createElement('div');
  footer.className = 'product-table-card-footer';
  if (data.quote) {
    data.quote.className = 'product-table-card-quote';
    data.quote.textContent = data.quote.textContent.trim();
    footer.append(data.quote);
  }
  li.append(footer);
  return li;
}

/**
 * Filter groups in order of first appearance; values sorted by how many products
 * carry them, then alphabetically (as on the live site).
 */
function collectFacets(items) {
  const facets = new Map();
  items.forEach((item) => item.filters.forEach((values, name) => {
    if (!facets.has(name)) facets.set(name, new Map());
    values.forEach((value) => {
      const counts = facets.get(name);
      counts.set(value, (counts.get(value) || 0) + 1);
    });
  }));
  return [...facets].map(([name, counts]) => ({
    name,
    values: [...counts]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], undefined, { numeric: true }))
      .map(([value]) => value),
  }));
}

/** Builds the filter panel: one collapsible group of checkboxes per facet. */
function buildFacetPanel(facets, onToggle, onView) {
  instance += 1;
  const panel = document.createElement('div');
  panel.className = 'product-table-facets';
  facets.forEach((facet, f) => {
    const group = document.createElement('div');
    group.className = 'product-table-facet';
    const listId = `product-table-${instance}-facet-${f}`;

    const header = document.createElement('div');
    header.className = 'product-table-facet-header';
    const title = document.createElement('h4');
    title.className = 'product-table-facet-title';
    title.id = `${listId}-title`;
    title.textContent = facet.name;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'product-table-facet-toggle';
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-controls', listId);
    toggle.setAttribute('aria-label', `Collapse ${facet.name}`);
    header.append(title, toggle);

    const list = document.createElement('ul');
    list.className = 'product-table-facet-values';
    list.id = listId;
    list.setAttribute('aria-labelledby', title.id);
    facet.inputs = new Map();
    facet.values.forEach((value) => {
      const li = document.createElement('li');
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = value;
      input.addEventListener('change', () => onToggle(facet.name, value, input.checked));
      const caption = document.createElement('span');
      caption.className = 'product-table-facet-caption';
      caption.textContent = value;
      const count = document.createElement('span');
      count.className = 'product-table-facet-count';
      label.append(input, caption, count);
      li.append(label);
      list.append(li);
      facet.inputs.set(value, { li, input, count });
    });

    group.append(header, list);

    // long groups show the first values, a "Search" row and a show-more bar (as on live)
    let more;
    if (facet.values.length > FACET_LIMIT) {
      facet.limit = FACET_LIMIT;
      facet.expanded = false;
      facet.query = '';
      group.classList.add('has-more');
      const searchLi = document.createElement('li');
      searchLi.className = 'product-table-facet-search';
      const searchButton = document.createElement('button');
      searchButton.type = 'button';
      searchButton.textContent = 'Search';
      const search = document.createElement('input');
      search.type = 'search';
      search.placeholder = 'Search';
      search.setAttribute('aria-label', `Search ${facet.name}`);
      search.hidden = true;
      searchButton.addEventListener('click', () => {
        searchButton.hidden = true;
        search.hidden = false;
        search.focus();
      });
      search.addEventListener('input', () => {
        facet.query = search.value.trim();
        onView();
      });
      search.addEventListener('blur', () => {
        if (search.value.trim()) return;
        search.hidden = true;
        searchButton.hidden = false;
      });
      searchLi.append(searchButton, search);
      list.append(searchLi);

      more = document.createElement('button');
      more.type = 'button';
      more.className = 'product-table-facet-more';
      more.setAttribute('aria-expanded', 'false');
      more.setAttribute('aria-label', `Show more ${facet.name}`);
      more.addEventListener('click', () => {
        facet.expanded = !facet.expanded;
        more.setAttribute('aria-expanded', facet.expanded);
        more.setAttribute('aria-label', `Show ${facet.expanded ? 'fewer' : 'more'} ${facet.name}`);
        onView();
      });
      group.append(more);
    }

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', `${open ? 'Collapse' : 'Expand'} ${facet.name}`);
      list.hidden = !open;
      if (more) more.hidden = !open;
      group.classList.toggle('is-collapsed', !open);
    });

    panel.append(group);
  });
  return panel;
}

/**
 * Below 992px the filter panel folds into a "Filters" dropdown (as on live): the button
 * opens it over the results, behind a white wash; the wash, Escape or the button close it.
 * @returns {Element[]} the button and the wash, to place at the top of the block
 */
function buildFiltersToggle(block, panel) {
  panel.id = `product-table-${instance}-filters`;
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'product-table-filters-toggle';
  toggle.textContent = 'Filters';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', panel.id);
  const wash = document.createElement('div');
  wash.className = 'product-table-filters-wash';

  const setOpen = (open) => {
    block.classList.toggle('is-filters-open', open);
    toggle.setAttribute('aria-expanded', open);
  };
  toggle.addEventListener('click', () => setOpen(!block.classList.contains('is-filters-open')));
  wash.addEventListener('click', () => setOpen(false));
  block.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !block.classList.contains('is-filters-open')) return;
    setOpen(false);
    toggle.focus();
  });
  window.matchMedia('(width >= 992px)').addEventListener('change', () => setOpen(false));
  return [toggle, wash];
}

/** Applies a long group's search text or show-more state to its (count-filtered) values. */
function limitValues(facet) {
  const query = facet.query.toLowerCase();
  let shown = 0;
  facet.inputs.forEach(({ li, input }, value) => {
    if (li.hidden) return;
    if (query) {
      li.hidden = !value.toLowerCase().includes(query);
    } else if (!facet.expanded && shown >= facet.limit && !input.checked) {
      li.hidden = true;
    } else {
      shown += 1;
    }
  });
}

/**
 * Decorates the product-table block: a filterable, paged grid of products.
 * Filters combine with OR inside a group and AND across groups; each value shows how
 * many products it matches given the other groups ("+N" when it would add to a
 * group that already has a selection), like the live site's search-driven table.
 * @param {Element} block
 */
export default function decorate(block) {
  const items = [...block.children].map((row) => {
    const data = readRow(row);
    const filters = new Map();
    data.filters.forEach(([name, value]) => {
      if (!filters.has(name)) filters.set(name, new Set());
      filters.get(name).add(value);
    });
    return { card: buildCard(row, data), filters };
  });

  const facets = collectFacets(items);
  const selected = new Map(facets.map((facet) => [facet.name, new Set()]));
  let page = 0;

  const matches = (item, except) => [...selected].every(([name, values]) => name === except
    || !values.size || [...(item.filters.get(name) || [])].some((v) => values.has(v)));

  const summary = document.createElement('p');
  summary.className = 'product-table-summary';
  summary.setAttribute('aria-live', 'polite');

  const grid = document.createElement('ul');
  grid.className = 'product-table-grid';
  grid.append(...items.map((item) => item.card));

  const pager = document.createElement('nav');
  pager.className = 'product-table-pager';
  pager.setAttribute('aria-label', 'Pagination');

  const results = document.createElement('div');
  results.className = 'product-table-results';
  results.append(grid, pager);

  let render;
  const goTo = (n) => {
    page = n;
    render();
    grid.querySelector('li:not([hidden]) a')?.focus({ preventScroll: true });
    block.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const pagerButton = (label, n, className) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = className;
    b.setAttribute('aria-label', label);
    b.addEventListener('click', () => goTo(n));
    return b;
  };

  render = () => {
    const visible = items.filter((item) => matches(item));
    const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    page = Math.min(page, pages - 1);
    const start = page * PAGE_SIZE;
    const shown = visible.slice(start, start + PAGE_SIZE);
    // first row / first column carry the outer borders (cell borders collapse)
    const cols = Number(getComputedStyle(block).getPropertyValue('--product-table-cols')) || 1;
    items.forEach((item) => {
      const i = shown.indexOf(item);
      item.card.hidden = i < 0;
      item.card.classList.toggle('is-first-row', i >= 0 && i < cols);
      item.card.classList.toggle('is-row-start', i >= 0 && i % cols === 0);
    });

    if (visible.length) {
      summary.innerHTML = `Results <strong>${start + 1}</strong>-<strong>${start + shown.length}</strong> of <strong>${visible.length}</strong>`;
    } else {
      summary.textContent = 'There are no items to display';
    }

    facets.forEach((facet) => {
      const chosen = selected.get(facet.name);
      facet.inputs.forEach(({ li, input, count }, value) => {
        const n = items.filter((item) => matches(item, facet.name)
          && item.filters.get(facet.name)?.has(value)).length;
        const isChosen = chosen.has(value);
        input.checked = isChosen;
        count.textContent = chosen.size && !isChosen ? `+${n}` : n;
        li.hidden = !n && !isChosen;
        li.classList.toggle('is-selected', isChosen);
      });
      if (facet.limit) limitValues(facet);
    });

    pager.replaceChildren();
    if (pages < 2) return;
    const list = document.createElement('ul');
    const add = (el) => { const li = document.createElement('li'); li.append(el); list.append(li); };
    if (page > 0) add(pagerButton('Previous', page - 1, 'product-table-pager-prev'));
    for (let i = 0; i < pages; i += 1) {
      const b = pagerButton(`Page ${i + 1}`, i, 'product-table-pager-page');
      b.textContent = i + 1;
      if (i === page) b.setAttribute('aria-current', 'page');
      add(b);
    }
    if (page < pages - 1) add(pagerButton('Next', page + 1, 'product-table-pager-next'));
    pager.append(list);
  };

  const panel = buildFacetPanel(facets, (name, value, on) => {
    if (on) selected.get(name).add(value);
    else selected.get(name).delete(value);
    page = 0;
    render();
  }, () => render());

  const main = document.createElement('div');
  main.className = 'product-table-main';
  const head = [];
  if (facets.length) {
    main.append(panel);
    head.push(...buildFiltersToggle(block, panel));
  }
  main.append(results);
  block.replaceChildren(...head, summary, main);
  render();
  window.matchMedia('(width >= 768px)').addEventListener('change', render);
  window.matchMedia('(width >= 1024px)').addEventListener('change', render);
}
