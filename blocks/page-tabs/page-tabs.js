import { toClassName } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Finds the element an in-page link points to. Headings without an id get one
 * from their text (as the aem.live pipeline does), so "#features" style links resolve.
 * @param {string} hash e.g. "#cytobank-enterprise-features"
 * @returns {Element|null}
 */
function findTarget(hash) {
  const id = decodeURIComponent(hash.slice(1));
  if (!id) return null;
  const existing = document.getElementById(id);
  if (existing) return existing;
  const heading = [...document.querySelectorAll('main h2, main h3')]
    .find((h) => !h.id && toClassName(h.textContent) === id);
  if (heading) heading.id = id;
  return heading || null;
}

/**
 * Decorates the page-tabs block: a bar of in-page links that sticks to the top
 * of the window once scrolled past and marks the section currently in view.
 * @param {Element} block
 */
export default function decorate(block) {
  const source = block.querySelector('ul, ol');
  const links = [...block.querySelectorAll('a[href]')];
  const nav = document.createElement('nav');
  nav.className = 'page-tabs-bar';
  nav.setAttribute('aria-label', 'Page sections');
  const list = document.createElement('ul');
  if (source) moveInstrumentation(source, list);
  links.forEach((a) => {
    const li = document.createElement('li');
    a.className = '';
    a.textContent = a.textContent.trim();
    li.append(a);
    list.append(li);
  });
  nav.append(list);
  block.replaceChildren(nav);

  const section = block.closest('.section') || block;
  const tabs = links
    .filter((a) => a.getAttribute('href').startsWith('#'))
    .map((a) => ({ a, hash: a.getAttribute('href') }));

  let ticking = false;
  const update = () => {
    ticking = false;
    nav.classList.toggle('is-stuck', section.getBoundingClientRect().top < 0);
    // the current tab is the last target that has scrolled up under the bar
    const offset = nav.offsetHeight + 20;
    let current = null;
    tabs.forEach((tab) => {
      tab.target = tab.target || findTarget(tab.hash);
      if (tab.target && tab.target.getBoundingClientRect().top <= offset) current = tab;
    });
    tabs.forEach((tab) => {
      if (tab === current) tab.a.setAttribute('aria-current', 'true');
      else tab.a.removeAttribute('aria-current');
    });
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  tabs.forEach((tab) => {
    tab.a.addEventListener('click', (e) => {
      const target = tab.target || findTarget(tab.hash);
      if (!target) return;
      e.preventDefault();
      tab.target = target;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      window.history.replaceState(null, '', tab.hash);
    });
  });
  update();
}
