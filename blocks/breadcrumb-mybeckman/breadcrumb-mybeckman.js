import { getMetadata } from '../../scripts/aem.js';

const SITE_ROOT = 'en-in';

/** "instrument-optimization" -> "Instrument Optimization" */
function label(segment) {
  return segment.split('-').filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Breadcrumb (mybeckman.in inner pages): Home / parent pages / current page, built from
 * the page location (/content[/<site>]/en-in/<a>/<b>[.html]). Links use the site's
 * published paths (/en-in/…), as content links do. The current page's label is its
 * `breadcrumb-title` metadata, else its last path segment in title case.
 * @param {Element} block
 */
export default function decorate(block) {
  const parts = window.location.pathname.replace(/\.html$/, '').split('/').filter(Boolean);
  const rootIndex = parts.indexOf(SITE_ROOT);
  const segments = rootIndex >= 0 ? parts.slice(rootIndex + 1) : [];
  if (!segments.length) {
    block.closest('.section')?.remove();
    return;
  }

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ul = document.createElement('ul');
  const items = [{ text: 'Home', href: `/${SITE_ROOT}/` }];
  segments.forEach((segment, i) => {
    const last = i === segments.length - 1;
    items.push({
      text: last ? (getMetadata('breadcrumb-title') || label(segment)) : label(segment),
      href: last ? null : `/${SITE_ROOT}/${segments.slice(0, i + 1).join('/')}`,
    });
  });
  items.forEach(({ text, href }) => {
    const li = document.createElement('li');
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = text;
      li.append(a);
    } else {
      li.textContent = text;
      li.setAttribute('aria-current', 'page');
    }
    ul.append(li);
  });
  nav.append(ul);
  block.replaceChildren(nav);
}
