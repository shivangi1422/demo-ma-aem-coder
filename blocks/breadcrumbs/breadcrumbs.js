import { getMetadata } from '../../scripts/aem.js';
import { getPagePath } from '../../scripts/scripts.js';

/**
 * Turns a URL segment into a readable label, e.g. "flow-cytometry" -> "Flow Cytometry".
 * @param {string} segment
 * @returns {string}
 */
function toLabel(segment) {
  return decodeURIComponent(segment)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Decorates the breadcrumbs auto block: Home > ...parents > current page.
 * Labels come from the "Breadcrumb Labels" page metadata ("Parent | Current",
 * one label per path level, matched from the end); otherwise parents use the
 * URL segment and the current page uses the h1 (or document title).
 * @param {Element} block
 */
export default function decorate(block) {
  const { root, segments } = getPagePath();
  const crumbs = [{ label: 'Home', href: `${root}/` }];
  segments.forEach((segment, i) => {
    crumbs.push({ label: toLabel(segment), href: `${root}/${segments.slice(0, i + 1).join('/')}` });
  });
  const current = crumbs[crumbs.length - 1];
  const title = document.querySelector('main h1')?.textContent.trim() || document.title;
  if (crumbs.length > 1 && title) current.label = title;

  const labels = (getMetadata('breadcrumb-labels') || getMetadata('Breadcrumb Labels')).split('|').map((l) => l.trim()).filter(Boolean);
  labels.slice(-(crumbs.length - 1)).reverse().forEach((label, i) => {
    crumbs[crumbs.length - 1 - i].label = label;
  });

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');
  crumbs.forEach((crumb) => {
    const li = document.createElement('li');
    if (crumb === current) {
      li.setAttribute('aria-current', 'page');
      li.textContent = crumb.label;
    } else {
      const a = document.createElement('a');
      a.href = crumb.href;
      a.textContent = crumb.label;
      li.append(a);
    }
    ol.append(li);
  });
  nav.append(ol);
  block.replaceChildren(nav);
}
