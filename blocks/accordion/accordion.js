import { decorateIcons } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Option "two-column" (Featured Resources): items are laid out in two columns,
 * the first half (rounded up) on the left, the rest on the right; on phones the
 * columns stack, left column first. Only one item is open at a time across both
 * columns; each item's header gets a hover colour by its position (1-4, repeating).
 * @param {Element} block
 */
function decorateTwoColumn(block) {
  // a leading ":icon-name:" token (not yet turned into an icon) becomes the icon
  block.querySelectorAll('.accordion-item-body > p').forEach((p) => {
    const first = p.firstChild;
    const match = first && first.nodeType === Node.TEXT_NODE && first.textContent.match(/^\s*:([a-z0-9-]+):\s*/);
    if (!match) return;
    first.textContent = first.textContent.slice(match[0].length);
    const span = document.createElement('span');
    span.className = `icon icon-${match[1]}`;
    p.prepend(span, ' ');
  });
  decorateIcons(block);

  const items = [...block.querySelectorAll(':scope > .accordion-item')];
  items.forEach((item, i) => item.classList.add(`accordion-item-color-${(i % 4) + 1}`));
  const split = Math.ceil(items.length / 2);
  const columns = [items.slice(0, split), items.slice(split)].map((group) => {
    const col = document.createElement('div');
    col.className = 'accordion-column';
    col.append(...group);
    return col;
  });
  block.replaceChildren(...columns);

  block.addEventListener('toggle', (e) => {
    const opened = e.target;
    if (!(opened instanceof HTMLDetailsElement) || !opened.open) return;
    items.forEach((item) => {
      if (item !== opened && item.open) item.open = false;
    });
  }, true);
}

/**
 * Decorates the accordion block: each authored row (title cell, content cell)
 * becomes a native <details>/<summary> disclosure, so it opens with the keyboard
 * and is announced as expandable without extra ARIA.
 * A lone link in its own paragraph inside a panel is the panel's call-to-action
 * button (outlined), also when it was authored without bold/italic formatting.
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [titleCell, bodyCell] = row.children;
    if (!titleCell) return;

    const details = document.createElement('details');
    details.className = 'accordion-item';
    moveInstrumentation(row, details);

    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    moveInstrumentation(titleCell, summary);
    // the title is plain text; a lone wrapping paragraph is unwrapped
    const titlePara = titleCell.children.length === 1 && titleCell.querySelector(':scope > p');
    summary.append(...(titlePara || titleCell).childNodes);

    const body = document.createElement('div');
    body.className = 'accordion-item-body';
    if (bodyCell) {
      moveInstrumentation(bodyCell, body);
      body.append(...bodyCell.childNodes);
    }

    body.querySelectorAll(':scope > p').forEach((p) => {
      const links = p.querySelectorAll('a[href]');
      // icon + link rows (two-column resources) stay plain links
      if (p.querySelector('picture, img, span.icon') || /^\s*:[a-z0-9-]+:/.test(p.textContent)) return;
      if (links.length !== 1 || p.textContent.trim() !== links[0].textContent.trim()) return;
      const a = links[0];
      p.replaceChildren(a);
      a.className = 'button secondary';
      p.className = 'button-wrapper';
    });

    details.append(summary, body);
    row.replaceWith(details);
  });

  if (block.classList.contains('two-column')) decorateTwoColumn(block);
}
