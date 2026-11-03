/**
 * Keyword search and category filters for the FAQ list(s) in the same section
 * (source: DataTables search box, "Showing x of y" counter and category checkboxes).
 * One row, one cell: categories (comma separated filter labels; empty = no checkboxes).
 * Filters match the categories of each faq-list item (data-categories).
 * @param {Element} block The block element
 */

function whenLoaded(list) {
  if (list.dataset.blockStatus === 'loaded') return Promise.resolve();
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (list.dataset.blockStatus === 'loaded') {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(list, { attributes: true, attributeFilter: ['data-block-status'] });
  });
}

export default function decorate(block) {
  const categories = block.textContent.split(',').map((c) => c.trim()).filter(Boolean);
  const id = `faq-search-${[...document.querySelectorAll('.faq-search')].indexOf(block)}`;

  const bar = document.createElement('div');
  bar.className = 'faq-search-bar';
  const input = document.createElement('input');
  input.type = 'search';
  input.id = `${id}-keyword`;
  input.setAttribute('aria-label', 'Search the questions');
  const search = document.createElement('button');
  search.type = 'button';
  search.textContent = 'Search';
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.textContent = 'Clear';
  const count = document.createElement('span');
  count.className = 'faq-search-count';
  count.setAttribute('aria-live', 'polite');
  bar.append(input, search, clear, count);

  const filters = document.createElement('div');
  filters.className = 'faq-search-filters';
  const boxes = categories.map((category, i) => {
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.id = `${id}-category-${i}`;
    box.value = category;
    const label = document.createElement('label');
    label.htmlFor = box.id;
    label.textContent = category;
    filters.append(box, label);
    return box;
  });

  block.replaceChildren(bar);
  if (boxes.length) block.append(filters);

  const scope = block.closest('.section') || block.closest('main') || document;
  const items = () => [...scope.querySelectorAll('.faq-list li')];

  const apply = () => {
    const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    const checked = boxes.filter((b) => b.checked).map((b) => b.value.toLowerCase());
    const all = items();
    let shown = 0;
    all.forEach((li) => {
      const text = li.textContent.toLowerCase();
      const cats = (li.dataset.categories || '').toLowerCase().split('|');
      const match = words.every((w) => text.includes(w))
        && (!checked.length || checked.some((c) => cats.includes(c)));
      li.hidden = !match;
      if (match) shown += 1;
    });
    count.textContent = `Showing ${shown} of ${all.length}`;
  };

  search.addEventListener('click', apply);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') apply(); });
  clear.addEventListener('click', () => {
    input.value = '';
    boxes.forEach((b) => { b.checked = false; });
    apply();
  });
  boxes.forEach((b) => b.addEventListener('change', apply));

  // the list blocks usually come after this block and are decorated after it
  const lists = [...scope.querySelectorAll('.faq-list')];
  Promise.all(lists.map(whenLoaded)).then(apply);
}
