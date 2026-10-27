import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Cards (service icon): icon + h3 title + description, a decorative arrow,
 * lift-on-hover; the whole card is the link. Below 768px only the icon and
 * title show, centred.
 *
 * Authored structure: one row per card, 1 cell of rich text:
 *   :heroicons-user-plus:          (icon token, own paragraph)
 *   ### [Service plans](/service/plans)
 *   Description paragraph.
 * EDS renders the token as <span class="icon icon-heroicons-user-plus"> with
 * an <img> from /icons. The SVG is applied as a CSS mask so its colour can be
 * set (and changed on hover) from CSS. An optional image cell is also
 * accepted as the icon.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const cells = [...row.children].filter((cell) => cell.textContent.trim() !== '' || cell.querySelector('picture, img, .icon'));
    if (!cells.length) return;

    const li = document.createElement('li');
    li.className = 'cards-service-icon-item';
    moveInstrumentation(row, li);

    const link = row.querySelector('a[href]');
    const card = document.createElement(link ? 'a' : 'div');
    card.className = 'cards-service-icon-card';
    if (link) {
      card.href = link.getAttribute('href');
      if (link.target) card.target = link.target;
      if (link.target === '_blank') card.rel = 'noopener';
    }

    const content = document.createElement('div');
    content.className = 'cards-service-icon-content';

    cells.forEach((cell) => {
      // image cell used as the icon
      if (!cell.textContent.trim() && cell.querySelector('picture, img')) {
        cell.className = 'cards-service-icon-icon';
        content.append(cell);
        return;
      }
      cell.classList.add('cards-service-icon-body');

      // A paragraph holding only an icon token (:name:) that the delivery pipeline did not
      // convert (e.g. rich text from AEM) becomes the same icon span the pipeline produces.
      cell.querySelectorAll(':scope > p').forEach((p) => {
        const token = p.textContent.trim().match(/^:([a-z0-9-]+):$/);
        if (!token || p.querySelector('span.icon')) return;
        const span = document.createElement('span');
        span.className = `icon icon-${token[1]}`;
        p.replaceChildren(span);
      });

      // icon token(s): paragraph that holds only icons
      cell.querySelectorAll('span.icon').forEach((span) => {
        const holder = span.closest('p');
        if (holder && holder.textContent.trim() === '' && holder.parentElement === cell) {
          holder.className = 'cards-service-icon-icon';
        }
        const img = span.querySelector('img');
        const iconName = [...span.classList].find((c) => c.startsWith('icon-'))?.substring(5);
        const src = img?.getAttribute('src') || (iconName && `${window.hlx?.codeBasePath || ''}/icons/${iconName}.svg`);
        if (src) span.style.setProperty('--cards-service-icon-mask', `url("${src}")`);
        span.setAttribute('aria-hidden', 'true');
      });

      // nested links are invalid inside the card link: keep their text only
      cell.querySelectorAll('a[href]').forEach((a) => {
        const span = document.createElement('span');
        moveInstrumentation(a, span);
        span.append(...a.childNodes);
        a.replaceWith(span);
      });
      cell.querySelectorAll('p.button-wrapper').forEach((p) => p.classList.remove('button-wrapper'));

      const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) heading.classList.add('cards-service-icon-title');
      cell.querySelectorAll(':scope > p:not(.cards-service-icon-icon)').forEach((p) => p.classList.add('cards-service-icon-text'));
      content.append(cell);
    });

    const arrow = document.createElement('span');
    arrow.className = 'cards-service-icon-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '->';

    card.append(content, arrow);
    li.append(card);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
