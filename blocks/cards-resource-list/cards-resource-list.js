import { decorateIcons } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const PAGE_SIZE = 5;
const KNOWN_TYPES = ['video', 'pdf', 'document'];

/**
 * Maps an authored resource type (e.g. "video", "fa-file-pdf", "PDF") to an icon name.
 * @param {string} value
 * @returns {string|null}
 */
function toIconName(value) {
  const v = (value || '').toLowerCase();
  if (!v) return null;
  if (v.includes('video')) return 'video';
  if (v.includes('pdf')) return 'pdf';
  return KNOWN_TYPES.includes(v) ? v : 'document';
}

/**
 * Adds a simple client-side pager when the list exceeds the page size.
 * Skipped inside Universal Editor so authors can see every item.
 * @param {Element} block
 * @param {Element} list
 */
function paginate(block, list) {
  const items = [...list.children];
  const pages = Math.ceil(items.length / PAGE_SIZE);
  if (pages <= 1 || block.closest('[data-aue-resource]')) return;

  const nav = document.createElement('nav');
  nav.className = 'cards-resource-list-pager';
  nav.setAttribute('aria-label', 'Resource pages');
  const buttons = [];

  const show = (page) => {
    items.forEach((li, i) => {
      li.hidden = Math.floor(i / PAGE_SIZE) !== page;
    });
    buttons.forEach((b, i) => {
      if (i === page) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  };

  for (let p = 0; p < pages; p += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${p + 1}`;
    button.setAttribute('aria-label', `Page ${p + 1}`);
    button.addEventListener('click', () => show(p));
    buttons.push(button);
    nav.append(button);
  }
  block.append(nav);
  show(0);
}

/**
 * Decorates the cards-resource-list block: a stacked list of resources, each a
 * small type icon followed by a linked title.
 * Authored structure: one row per resource: type cell (video | pdf | document,
 * or an icon image) | link cell.
 * @param {Element} block
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'cards-resource-list-items';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const linkCell = cells.find((c) => c.querySelector('a[href]'))
      || cells.find((c, i) => i > 0 && c.textContent.trim() !== '');
    if (!linkCell) return;
    const typeCell = cells.find((c) => c !== linkCell);

    const li = document.createElement('li');
    moveInstrumentation(row, li);

    const icon = document.createElement('div');
    icon.className = 'cards-resource-list-icon';
    const picture = typeCell && typeCell.querySelector('picture');
    if (picture) {
      icon.append(picture);
    } else {
      const name = toIconName(typeCell && typeCell.textContent.trim());
      if (name) {
        const span = document.createElement('span');
        span.className = `icon icon-${name}`;
        icon.append(span);
        li.dataset.type = name;
      }
    }
    if (icon.firstChild) li.append(icon);

    const body = document.createElement('div');
    body.className = 'cards-resource-list-body';
    while (linkCell.firstChild) body.append(linkCell.firstChild);
    // Titles are plain links, never buttons.
    body.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary', 'accent'));
    body.querySelectorAll('.button-wrapper').forEach((p) => p.classList.remove('button-wrapper'));
    li.append(body);
    list.append(li);
  });

  decorateIcons(list);
  block.replaceChildren(list);
  paginate(block, list);
}
