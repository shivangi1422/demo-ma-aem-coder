import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * A cell that holds nothing but a single link (the card's target).
 * @param {Element} cell
 * @returns {HTMLAnchorElement|null}
 */
function linkOnly(cell) {
  const links = cell.querySelectorAll('a');
  if (links.length !== 1) return null;
  return cell.textContent.trim() === links[0].textContent.trim() ? links[0] : null;
}

/**
 * Reads one authored row: image | product name | description | link.
 * @param {Element} row
 */
function readRow(row) {
  const cells = [...row.children];
  const imageCell = cells.find((cell) => cell.querySelector('picture, img'));
  const linkCell = [...cells].reverse().find((cell) => cell !== imageCell && linkOnly(cell));
  const [titleCell, descriptionCell] = cells
    .filter((cell) => cell !== imageCell && cell !== linkCell && cell.textContent.trim());
  return {
    picture: imageCell?.querySelector('picture') || imageCell?.querySelector('img'),
    href: linkCell ? linkOnly(linkCell).getAttribute('href') : null,
    title: titleCell?.textContent.trim() || '',
    description: descriptionCell?.textContent.trim() || '',
  };
}

/** A link to the product, or plain wrapper when no link was authored. */
function wrap(href, className, ...content) {
  const el = document.createElement(href ? 'a' : 'span');
  if (className) el.className = className;
  if (href) el.href = href;
  el.append(...content);
  return el;
}

/**
 * Decorates the related-products block: a carousel of product cards (image, name,
 * description, all linking to the product) with previous/next buttons.
 * @param {Element} block
 */
export default function decorate(block) {
  const track = document.createElement('ul');
  track.className = 'related-products-track';
  [...block.children].forEach((row) => {
    const {
      picture, href, title, description,
    } = readRow(row);
    const li = document.createElement('li');
    li.className = 'related-products-card';
    moveInstrumentation(row, li);
    if (picture) {
      // the image repeats the product name, so it is skipped by keyboard and screen readers
      const image = wrap(href, 'related-products-image', picture);
      image.tabIndex = -1;
      image.setAttribute('aria-hidden', 'true');
      li.append(image);
    }
    if (title) {
      const h = document.createElement('h3');
      h.className = 'related-products-title';
      h.append(wrap(href, '', title));
      li.append(h);
    }
    if (description) {
      const p = document.createElement('p');
      p.className = 'related-products-description';
      p.append(wrap(href, '', description));
      li.append(p);
    }
    track.append(li);
  });

  const viewport = document.createElement('div');
  viewport.className = 'related-products-viewport';
  viewport.append(track);

  const button = (dir, label) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `related-products-${dir}`;
    b.setAttribute('aria-label', label);
    return b;
  };
  const prev = button('prev', 'Previous products');
  const next = button('next', 'Next products');

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'Related products');
  block.replaceChildren(prev, viewport, next);

  const cards = [...track.children];
  let index = 0;
  const perView = () => Number(getComputedStyle(block).getPropertyValue('--per-view')) || 1;
  const update = () => {
    const visible = perView();
    const max = Math.max(0, cards.length - visible);
    index = Math.min(Math.max(index, 0), max);
    track.style.transform = `translateX(${(-100 / visible) * index}%)`;
    cards.forEach((card, i) => {
      const shown = i >= index && i < index + visible;
      card.inert = !shown;
      card.setAttribute('aria-hidden', !shown);
    });
    prev.disabled = index === 0;
    next.disabled = index >= max;
  };
  prev.addEventListener('click', () => { index -= 1; update(); });
  next.addEventListener('click', () => { index += 1; update(); });

  // swipe on touch screens
  let startX = null;
  viewport.addEventListener('pointerdown', (e) => { startX = e.clientX; });
  viewport.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) < 40) return;
    index += dx < 0 ? 1 : -1;
    update();
  });

  window.addEventListener('resize', update, { passive: true });
  update();
}
