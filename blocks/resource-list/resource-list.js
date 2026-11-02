import { toClassName } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const PAGE_SIZE = 10;
const TYPE_LABELS = {
  video: 'Video',
  document: 'Document',
  'web-page': 'Web Page',
};

let instance = 0;

/**
 * Reads one authored row: type | link (title) | description.
 * @param {Element} row
 */
function readRow(row) {
  const cells = [...row.children];
  const linkCell = cells.find((cell) => cell.querySelector('a'));
  const link = linkCell?.querySelector('a');
  const rest = cells.filter((cell) => cell !== linkCell);
  const typeCell = rest.find((cell) => TYPE_LABELS[toClassName(cell.textContent)]);
  const descriptionCell = rest.find((cell) => cell !== typeCell && cell.textContent.trim());
  return {
    type: typeCell ? toClassName(typeCell.textContent) : 'video',
    link,
    description: descriptionCell?.textContent.trim() || '',
  };
}

/**
 * Builds the "Filter by: Resource Type" disclosure with one checkbox per type.
 * @param {string[]} types
 * @param {(selected: string[]) => void} onChange
 */
function buildFilter(types, onChange) {
  instance += 1;
  const panelId = `resource-list-filter-${instance}`;
  const filter = document.createElement('div');
  filter.className = 'resource-list-filter';
  filter.innerHTML = `
    <span class="resource-list-filter-label">Filter by:</span>
    <div class="resource-list-dropdown">
      <button type="button" class="resource-list-dropdown-toggle" aria-expanded="false" aria-controls="${panelId}">
        Resource Type<span class="resource-list-caret" aria-hidden="true"></span>
      </button>
      <div class="resource-list-dropdown-panel" id="${panelId}" hidden>
        <fieldset>
          <legend>Resource Type</legend>
        </fieldset>
        <button type="button" class="resource-list-dropdown-done">Done</button>
      </div>
    </div>`;
  const fieldset = filter.querySelector('fieldset');
  types.forEach((type) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = type;
    label.append(input, ` ${TYPE_LABELS[type] || type}`);
    fieldset.append(label);
  });

  const toggle = filter.querySelector('.resource-list-dropdown-toggle');
  const panel = filter.querySelector('.resource-list-dropdown-panel');
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', open);
    panel.hidden = !open;
  };
  toggle.addEventListener('click', () => setOpen(panel.hidden));
  filter.querySelector('.resource-list-dropdown-done').addEventListener('click', () => {
    setOpen(false);
    toggle.focus();
  });
  filter.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!filter.contains(e.target)) setOpen(false);
  });
  fieldset.addEventListener('change', () => {
    onChange([...fieldset.querySelectorAll('input:checked')].map((input) => input.value));
  });
  return filter;
}

/**
 * Decorates the resource-list block: an icon + title link + one-line description
 * per resource, with a resource-type filter and pagination beyond ten items.
 * @param {Element} block
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'resource-list-items';
  const items = [];
  [...block.children].forEach((row) => {
    const { type, link, description } = readRow(row);
    if (!link) return;
    const li = document.createElement('li');
    li.dataset.type = type;
    moveInstrumentation(row, li);

    const icon = document.createElement('span');
    icon.className = `resource-list-icon resource-list-icon-${type}`;
    icon.setAttribute('aria-hidden', 'true');

    const body = document.createElement('div');
    body.className = 'resource-list-body';
    link.className = 'resource-list-title';
    link.textContent = link.textContent.trim();
    body.append(link);
    if (description) {
      const text = document.createElement('p');
      text.className = 'resource-list-description';
      text.textContent = description;
      text.title = description;
      body.append(text);
    }
    li.append(icon, body);
    list.append(li);
    items.push(li);
  });

  const pagination = document.createElement('nav');
  pagination.className = 'resource-list-pagination';
  pagination.setAttribute('aria-label', 'Pagination');

  let selected = [];
  let page = 0;
  const render = () => {
    const visible = items.filter((li) => !selected.length || selected.includes(li.dataset.type));
    const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    page = Math.min(page, pages - 1);
    items.forEach((li) => { li.hidden = true; });
    visible.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).forEach((li) => { li.hidden = false; });
    pagination.replaceChildren();
    if (pages < 2) return;
    const current = page;
    pagination.append(...Array.from({ length: pages }, (_, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = i + 1;
      button.setAttribute('aria-label', `Page ${i + 1}`);
      if (i === current) button.setAttribute('aria-current', 'page');
      button.addEventListener('click', () => {
        page = i;
        render();
        list.querySelector('li:not([hidden]) a')?.focus();
      });
      return button;
    }));
  };

  const types = [...new Set(items.map((li) => li.dataset.type))];
  const filter = buildFilter(types, (values) => {
    selected = values;
    page = 0;
    render();
  });

  block.replaceChildren(filter, list, pagination);
  render();
}
