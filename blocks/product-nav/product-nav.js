import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * In-page product navigation (source: Features / Licenses / ... bar on product
 * pages). Authored as links to section anchors. Once the bar scrolls out of view
 * it is fixed to the top of the viewport; the link of the section in view is
 * marked active. A placeholder keeps the page from jumping when it detaches.
 * Both are evaluated on scroll (rAF-throttled).
 * @param {Element} block
 */
export default function decorate(block) {
  const links = [...block.querySelectorAll('a[href]')];
  const nav = document.createElement('nav');
  nav.className = 'product-nav-bar';
  nav.setAttribute('aria-label', 'On this page');
  const list = document.createElement('ul');
  links.forEach((a) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = a.textContent.trim();
    moveInstrumentation(a, link);
    li.append(link);
    list.append(li);
  });
  nav.append(list);
  const placeholder = document.createElement('div');
  placeholder.className = 'product-nav-placeholder';
  block.replaceChildren(placeholder, nav);

  // stick once the block's own position has scrolled past the top
  const stick = () => {
    const stuck = placeholder.getBoundingClientRect().top < 0;
    if (stuck === block.classList.contains('is-stuck')) return;
    block.classList.toggle('is-stuck', stuck);
    placeholder.style.height = stuck ? `${nav.offsetHeight}px` : '';
  };

  // active link: the last target section whose top has passed the bar
  const targets = [...list.querySelectorAll('a')].map((link) => {
    const hash = decodeURIComponent(new URL(link.href, window.location.href).hash.slice(1));
    return { link, id: hash };
  }).filter((t) => t.id);
  const update = () => {
    const offset = nav.offsetHeight + 10;
    let active = null;
    targets.forEach((t) => {
      const target = document.getElementById(t.id);
      if (!target || !target.offsetHeight) return; // not rendered yet
      if (target.getBoundingClientRect().top - offset <= 0) active = t;
    });
    targets.forEach((t) => {
      const on = t === active;
      t.link.classList.toggle('active', on);
      if (on) t.link.setAttribute('aria-current', 'location');
      else t.link.removeAttribute('aria-current');
    });
  };
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      stick();
      update();
    });
  }, { passive: true });

  // in-page jumps to the bar's sections (its own links and others on the page,
  // e.g. the intro's "Explore Licenses") land below the fixed bar
  const ids = new Set(targets.map((t) => t.id));
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    const id = link && decodeURIComponent(link.getAttribute('href').slice(1));
    const target = id && ids.has(id) && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight;
    window.scrollTo({ top, behavior: 'smooth' });
    window.history.replaceState(null, '', `#${id}`);
  });
  // sections below render lazily: evaluate once the page has loaded
  window.addEventListener('load', () => {
    stick();
    update();
  }, { once: true });
}
