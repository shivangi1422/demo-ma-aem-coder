import { moveInstrumentation } from '../../scripts/scripts.js';

const SELECT_LABEL = 'Jump to:';
const SELECT_PLACEHOLDER = 'Jump to section:';
const NAV_LABEL = 'Jump to section';

let instanceCount = 0;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Reads an authored target into { href, hash }.
 * Accepts "#latest", "latest", or a URL with a hash ("/page#latest").
 * @param {string} value
 * @returns {{href: string, hash: string}|null}
 */
function toTarget(value) {
  const raw = (value || '').trim();
  if (!raw || raw === '#') return null;
  if (raw.startsWith('#')) return { href: raw, hash: raw };
  // plain id typed by the author
  if (/^[A-Za-z][\w:.-]*$/.test(raw) && !raw.includes('.')) return { href: `#${raw}`, hash: `#${raw}` };
  try {
    const url = new URL(raw, window.location.href);
    const samePage = url.origin === window.location.origin
      && url.pathname.replace(/\.html$/, '') === window.location.pathname.replace(/\.html$/, '');
    if (url.hash) return { href: samePage ? url.hash : raw, hash: url.hash };
  } catch { /* not a URL */ }
  return null;
}

function scrollToHash(hash) {
  if (!hash) return false;
  let id = hash.slice(1);
  try { id = decodeURIComponent(id); } catch { /* keep raw */ }
  const target = document.getElementById(id);
  if (!target) return false;
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  // move focus for keyboard / screen-reader users without a second scroll
  if (!target.hasAttribute('tabindex')) {
    target.setAttribute('tabindex', '-1');
    // focus target only: no visible ring on a whole section
    target.style.outline = 'none';
  }
  target.focus({ preventScroll: true });
  if (window.location.hash !== hash) window.history.pushState(null, '', hash);
  return true;
}

function arrowIcon() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '3');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('d', 'M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75');
  svg.append(path);
  return svg;
}

/**
 * Reads one authored row into { label, href }.
 * Supported row shapes:
 *   - one cell with a link: <a href="#latest">Fresh insights</a>
 *   - two cells: label | anchor id ("latest" or "#latest")
 * @param {Element} row
 */
function readRow(row) {
  const a = row.querySelector('a[href]');
  if (a) {
    const target = toTarget(a.getAttribute('href'));
    const label = a.textContent.trim();
    return target && label ? { label, ...target } : null;
  }
  const cells = [...row.children];
  if (cells.length >= 2) {
    const label = cells[0].textContent.trim();
    const target = toTarget(cells[1].textContent);
    return target && label ? { label, ...target } : null;
  }
  return null;
}

/**
 * Jump navigation: sticky pill of in-page links on desktop, a native
 * <select> below 768px. Smooth-scrolls to the element whose id matches.
 * Authored structure: one row per link (label + #anchor).
 * @param {Element} block
 */
export default function decorate(block) {
  instanceCount += 1;
  const selectId = `jump-nav-select-${instanceCount}`;

  const nav = document.createElement('nav');
  nav.className = 'jump-nav-nav';
  nav.setAttribute('aria-label', NAV_LABEL);
  const ul = document.createElement('ul');
  ul.className = 'jump-nav-list';
  nav.append(ul);

  const selectWrap = document.createElement('div');
  selectWrap.className = 'jump-nav-select-wrap';
  const selectLabel = document.createElement('label');
  selectLabel.className = 'jump-nav-sr-only';
  selectLabel.htmlFor = selectId;
  selectLabel.textContent = SELECT_LABEL;
  const select = document.createElement('select');
  select.id = selectId;
  select.className = 'jump-nav-select';
  select.append(new Option(SELECT_PLACEHOLDER, '', true, true));
  selectWrap.append(selectLabel, select);

  [...block.children].forEach((row) => {
    const item = readRow(row);
    if (!item) return;

    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const a = document.createElement('a');
    a.className = 'jump-nav-link';
    a.href = item.href;
    const icon = document.createElement('span');
    icon.className = 'jump-nav-icon';
    icon.append(arrowIcon());
    const label = document.createElement('span');
    label.className = 'jump-nav-label';
    label.textContent = item.label;
    a.append(icon, label);
    a.addEventListener('click', (e) => {
      if (scrollToHash(item.hash)) e.preventDefault();
    });
    li.append(a);
    ul.append(li);

    select.append(new Option(item.label, item.href));
  });

  select.addEventListener('change', () => {
    const { value } = select;
    if (!value) return;
    const hash = value.startsWith('#') ? value : toTarget(value)?.hash;
    if (!scrollToHash(hash)) window.location.href = value;
  });

  block.replaceChildren(selectWrap, nav);
  if (!ul.children.length) block.classList.add('is-empty');
}
