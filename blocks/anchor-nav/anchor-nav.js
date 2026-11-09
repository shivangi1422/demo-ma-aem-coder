import { moveInstrumentation, unwrapRichtext } from '../../scripts/scripts.js';

/**
 * Returns the id an in-page link points to, or null for links to other pages.
 * @param {HTMLAnchorElement} a link
 * @returns {string|null}
 */
function targetId(a) {
  const href = a.getAttribute('href') || '';
  if (href.startsWith('#')) return decodeURIComponent(href.slice(1)) || null;
  try {
    const url = new URL(a.href);
    const { origin, pathname } = window.location;
    if (url.origin === origin && url.pathname === pathname && url.hash) {
      return decodeURIComponent(url.hash.slice(1));
    }
  } catch { /* not a URL */ }
  return null;
}

/**
 * Heading id as the publishing pipeline generates it (github-slugger): lower case,
 * punctuation dropped, spaces to hyphens.
 * @param {string} text heading text
 * @returns {string}
 */
function slug(text) {
  return text.replace(/\s+/g, ' ').trim().toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
    .replace(/ /g, '-');
}

/**
 * Finds the element a link points to. Published pages carry heading ids; the author
 * instance (Universal Editor) renders headings without them, so fall back to the heading
 * whose text gives that id, and set the id on it.
 * @param {string} id target id
 * @returns {Element|null}
 */
function findTarget(id) {
  const byId = document.getElementById(id);
  if (byId) return byId;
  const heading = [...document.querySelectorAll('main :is(h1, h2, h3, h4, h5, h6):not([id])')]
    .find((h) => slug(h.textContent) === id);
  if (heading) heading.id = id;
  return heading || null;
}

/**
 * Sticky in-page navigation: a bar of links to sections of the same page that sticks to
 * the top of the viewport once scrolled past and highlights the section in view.
 * Content: one cell with the links (a bulleted list or one link per paragraph).
 * Links whose target is not on the page are hidden.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'On this page');
  const cell = block.querySelector(':scope > div > div');
  if (cell) {
    unwrapRichtext(cell);
    moveInstrumentation(cell, nav);
  }

  const ul = document.createElement('ul');
  const entries = [];
  [...block.querySelectorAll('a[href]')].forEach((a) => {
    a.classList.remove('button', 'primary', 'secondary', 'accent');
    const li = document.createElement('li');
    const id = targetId(a);
    const target = id ? findTarget(id) : null;
    if (id && !target) li.hidden = true;
    if (target) entries.push({ a, target });
    li.append(a);
    ul.append(li);
  });
  nav.append(ul);
  block.replaceChildren(nav);

  const navHeight = () => nav.getBoundingClientRect().height;

  // smooth scroll to the target, below the stuck bar
  entries.forEach(({ a, target }) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight();
      window.scrollTo({ top, behavior: 'smooth' });
      window.history.replaceState(null, '', `#${target.id}`);
    });
  });

  let ticking = false;
  const update = () => {
    ticking = false;
    // stick to the top once the block's own position has scrolled above the viewport;
    // the block keeps the bar's height so the page does not jump
    const stuck = block.getBoundingClientRect().top < 0;
    block.style.minHeight = stuck ? `${navHeight()}px` : '';
    block.classList.toggle('anchor-nav-stuck', stuck);

    // highlight the last section whose top has passed the bar
    const offset = navHeight() + 1;
    let current = null;
    entries.forEach((item) => {
      // targets not rendered yet (page or section still hidden) have no box: skip them
      if (!item.target.getClientRects().length) return;
      if (item.target.getBoundingClientRect().top <= offset) current = item;
    });
    entries.forEach(({ a }) => {
      const active = current && a === current.a;
      a.classList.toggle('active', !!active);
      if (active) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  };
  const schedule = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  // re-evaluate when the layout changes (page appears, lazy sections and images load)
  new ResizeObserver(schedule).observe(document.body);
  update();
}
