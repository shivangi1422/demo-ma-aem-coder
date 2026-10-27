import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const BUTTON_CLASSES = ['button', 'primary', 'secondary', 'accent'];
const ICON_TOKEN = /^:([a-z0-9-]+):$/;

/**
 * Makes sure an icon span has an <img> (its natural SVG aspect ratio sizes the
 * glyph) and passes the SVG to CSS as a mask so it can be coloured.
 * @param {HTMLElement} span span.icon.icon-<name>
 */
function decorateIconSpan(span) {
  const iconName = [...span.classList].find((c) => c.startsWith('icon-'))?.substring(5);
  let img = span.querySelector('img');
  if (!img && iconName) {
    img = document.createElement('img');
    img.dataset.iconName = iconName;
    img.src = `${window.hlx?.codeBasePath || ''}/icons/${iconName}.svg`;
    img.alt = '';
    img.loading = 'lazy';
    span.append(img);
  }
  if (!img) return;
  // 16x16 attributes (as decorateIcons sets) reserve a square box until the
  // lazy SVG loads; CSS height + width:auto then use the viewBox aspect ratio
  img.width = 16;
  img.height = 16;
  span.style.setProperty('--cards-icon-border-mask', `url("${img.getAttribute('src')}")`);
  span.setAttribute('aria-hidden', 'true');
}

/**
 * Cards (icon border): 330px bordered cards, 3 per row on desktop, with a
 * 48px #007acb Font Awesome icon, an h4 title link and a description link to
 * the same page; the card background turns #f0f3f5 on hover.
 *
 * Authored structure: one row per card, one rich-text cell (an image cell is
 * accepted as the icon):
 *   :fa-user-plus:                      (icon token, own paragraph)
 *   #### [Service Plans](/service/plans)
 *   [Description text](/service/plans)
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const cells = [...row.children].filter((cell) => cell.textContent.trim() !== '' || cell.querySelector('picture, img, .icon'));
    if (!cells.length) return;

    const li = document.createElement('li');
    li.className = 'cards-icon-border-item';
    moveInstrumentation(row, li);

    cells.forEach((cell) => {
      // image cell used as the icon
      if (!cell.textContent.trim() && cell.querySelector('picture, img') && !cell.querySelector('.icon')) {
        const img = cell.querySelector('img');
        const picture = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '120' }]);
        moveInstrumentation(img, picture.querySelector('img'));
        const holder = document.createElement('p');
        holder.className = 'cards-icon-border-icon cards-icon-border-icon-image';
        holder.append(picture);
        li.append(holder);
        return;
      }

      // bare text (no paragraphs) gets a paragraph
      [...cell.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          const p = document.createElement('p');
          node.replaceWith(p);
          p.append(node);
        }
      });

      // raw :icon-name: token paragraph -> span.icon (as the delivery pipeline would)
      cell.querySelectorAll(':scope > p').forEach((p) => {
        const token = p.textContent.trim().match(ICON_TOKEN);
        if (!token || p.querySelector('span.icon')) return;
        const span = document.createElement('span');
        span.className = `icon icon-${token[1]}`;
        p.replaceChildren(span);
      });

      cell.querySelectorAll('span.icon').forEach((span) => {
        decorateIconSpan(span);
        const holder = span.closest('p');
        if (holder && holder.parentElement === cell && holder.textContent.trim() === '') {
          holder.className = 'cards-icon-border-icon';
        }
      });

      // links stay plain text links (no button decoration)
      cell.querySelectorAll('a.button').forEach((a) => a.classList.remove(...BUTTON_CLASSES));
      cell.querySelectorAll('p.button-wrapper, p.button-container').forEach((p) => p.classList.remove('button-wrapper', 'button-container'));

      const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) heading.classList.add('cards-icon-border-title');
      cell.querySelectorAll(':scope > p:not(.cards-icon-border-icon)').forEach((p) => p.classList.add('cards-icon-border-text'));

      li.append(...cell.childNodes);
    });

    ul.append(li);
  });

  block.replaceChildren(ul);
}
