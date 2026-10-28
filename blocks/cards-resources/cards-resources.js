import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const ARROW_PATHS = {
  prev: 'M15 18l-6-6 6-6',
  next: 'M9 18l6-6-6-6',
};

function arrowButton(direction, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `cards-resources-${direction}`;
  button.setAttribute('aria-label', label);
  button.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="${ARROW_PATHS[direction]}"/></svg>`;
  return button;
}

/**
 * When the section header (default content) sits right before the block, the
 * arrows line up with it on wide screens: the distance from the header's top
 * to the block's top is exposed as --cards-resources-header-offset.
 * @param {Element} block
 */
function alignNavWithHeader(block) {
  const header = block.parentElement?.previousElementSibling;
  if (!header?.classList.contains('default-content-wrapper')) return;
  block.classList.add('cards-resources-has-header');
  const sync = () => {
    const offset = block.getBoundingClientRect().top - header.getBoundingClientRect().top;
    block.style.setProperty('--cards-resources-header-offset', `${Math.round(offset)}px`);
  };
  sync();
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(sync);
    observer.observe(header);
    observer.observe(block);
  }
}

/**
 * Tags the card body parts: the type badge (a short leading paragraph without
 * a link), the excerpt and the trailing "Read More" link.
 * @param {Element} body
 */
function decorateBody(body) {
  const first = body.firstElementChild;
  if (first && first.tagName === 'P' && !first.querySelector('a') && first.textContent.trim().length <= 40
    && first.nextElementSibling && /^H[1-6]$/.test(first.nextElementSibling.tagName)) {
    first.classList.add('cards-resources-badge');
  }
  const link = [...body.querySelectorAll('a[href]')].pop();
  const linkP = link?.closest('p');
  if (linkP && linkP.textContent.trim() === link.textContent.trim()) linkP.classList.add('cards-resources-link');
  body.querySelectorAll(':scope > p:not(.cards-resources-badge, .cards-resources-link)')
    .forEach((p) => p.classList.add('cards-resources-excerpt'));
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-resources-track';
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((cell) => {
      if (cell.querySelector('picture')) cell.className = 'cards-resources-card-image';
      else if (cell.textContent.trim()) cell.className = 'cards-resources-card-body';
      else cell.className = 'cards-resources-card-empty';
    });
    const body = li.querySelector('.cards-resources-card-body');
    if (body) decorateBody(body);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    const picture = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, picture.querySelector('img'));
    img.closest('picture').replaceWith(picture);
  });

  const prev = arrowButton('prev', 'Previous resources');
  const next = arrowButton('next', 'Next resources');
  const nav = document.createElement('div');
  nav.className = 'cards-resources-nav';
  nav.append(prev, next);

  const step = () => {
    const card = ul.firstElementChild;
    if (!card) return ul.clientWidth;
    const gap = parseFloat(getComputedStyle(ul).columnGap) || 0;
    return card.getBoundingClientRect().width + gap;
  };
  const update = () => {
    const max = ul.scrollWidth - ul.clientWidth - 1;
    prev.disabled = ul.scrollLeft <= 0;
    next.disabled = ul.scrollLeft >= max;
    nav.hidden = max <= 0;
  };
  prev.addEventListener('click', () => ul.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => ul.scrollBy({ left: step(), behavior: 'smooth' }));
  ul.addEventListener('scroll', update, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(update).observe(ul);

  block.replaceChildren(nav, ul);
  update();
  alignNavWithHeader(block);
}
