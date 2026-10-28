import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Pages of a site with its own footer carry footer metadata pointing at a
 * footer in a site folder ("/content/<folder>/footer" locally,
 * "/<folder>/footer" on DA/EDS).
 * @param {string} footerMeta The footer metadata value
 * @returns {string|null} The site-relative footer path ("/<folder>/footer") or null
 */
function getSiteFooterPath(footerMeta) {
  if (!footerMeta) return null;
  const { pathname } = new URL(footerMeta, window.location);
  const sitePath = pathname.replace(/^\/content(?=\/)/, '').replace(/(\.plain)?\.html$/, '');
  return /^\/[^/]+\/footer$/.test(sitePath) ? sitePath : null;
}

/**
 * Fetches a site-folder footer: the /content copy first (local aem up),
 * then the site root copy (DA/EDS production).
 * Relative media paths are resolved against the fragment, not the page.
 * @param {string} sitePath The site-relative footer path, e.g. "/<folder>/footer"
 * @returns {Promise<HTMLElement|null>} The fragment body
 */
async function fetchSiteFooter(sitePath) {
  const urls = [`/content${sitePath}.plain.html`, `${sitePath}.plain.html`];
  for (let i = 0; i < urls.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const resp = await fetch(urls[i]);
    if (resp.ok) {
      // eslint-disable-next-line no-await-in-loop
      const html = await resp.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const base = new URL(urls[i], window.location);
      doc.querySelectorAll('img[src]').forEach((img) => {
        img.setAttribute('src', new URL(img.getAttribute('src'), base).pathname);
      });
      return doc.body;
    }
  }
  return null;
}

/**
 * Tells what an authored footer section holds.
 * @param {Element} section A top-level section of the footer fragment
 * @returns {string} brand | links | social | legal | text
 */
function getSectionRole(section) {
  const links = [...section.querySelectorAll('a')];
  if (section.querySelector('h1, h2, h3, h4, h5, h6') && section.querySelector('ul')) return 'links';
  if (links.length && links.every((a) => a.querySelector('img') && !a.textContent.trim())) return 'social';
  if (links.length) return 'legal';
  if (section.querySelector('img')) return 'brand';
  return 'text';
}

/**
 * Builds a link column: heading + link list.
 * @param {Element} section The authored section
 * @returns {Element} The column
 */
function buildLinkColumn(section) {
  const column = document.createElement('div');
  column.className = 'footer-column';
  const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
  heading.className = 'footer-heading';
  const list = section.querySelector('ul');
  list.className = 'footer-links';
  column.append(heading, list);
  return column;
}

/**
 * Decorates a site-folder footer: brand + link columns grid, then a bar with
 * social icons, legal links and the copyright line. All copy and media come
 * from the fragment.
 * @param {Element} block The footer block element
 * @param {Element} fragment The fetched fragment body
 */
function decorateSiteFooter(block, fragment) {
  const main = document.createElement('div');
  main.className = 'footer-main';
  const grid = document.createElement('div');
  grid.className = 'footer-grid';
  const bar = document.createElement('div');
  bar.className = 'footer-bar';

  [...fragment.children].forEach((section) => {
    const role = getSectionRole(section);
    if (role === 'links') {
      grid.append(buildLinkColumn(section));
    } else if (role === 'brand') {
      section.className = 'footer-column footer-brand';
      section.querySelectorAll('img').forEach((img) => { img.loading = 'lazy'; });
      grid.append(section);
    } else if (role === 'social') {
      section.className = 'footer-social';
      section.querySelectorAll('a').forEach((a) => {
        const img = a.querySelector('img');
        if (img?.alt) a.setAttribute('aria-label', img.alt);
        if (img) {
          img.alt = '';
          img.loading = 'lazy';
        }
        if (new URL(a.href).origin !== window.location.origin) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        }
      });
      bar.append(section);
    } else if (role === 'legal') {
      section.className = 'footer-legal';
      bar.append(section);
    } else {
      const text = section.querySelector('p') || section;
      text.className = 'footer-copyright';
      bar.append(text);
    }
  });

  main.append(grid, bar);
  block.textContent = '';
  block.append(main);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');

  // site-folder footer (e.g. footer metadata "/content/<folder>/footer")
  const siteFooterPath = getSiteFooterPath(footerMeta);
  const siteFragment = siteFooterPath ? await fetchSiteFooter(siteFooterPath) : null;
  if (siteFragment) {
    decorateSiteFooter(block, siteFragment);
    return;
  }

  // load footer as fragment
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Explicitly tag structural pieces so styling does not depend on the exact
  // section-wrapper nesting, which differs between EDS preview and AEM author.
  // The columns row is the div whose direct children are the branding + link
  // columns (>= 3 child divs). Tagging it directly makes the grid layout apply
  // in both environments.
  const candidates = [...footer.querySelectorAll('div')];
  const columnsRow = candidates.find((el) => {
    const childDivs = [...el.children].filter((c) => c.tagName === 'DIV');
    return childDivs.length >= 3
      && childDivs.some((c) => c.querySelector('ul'));
  });
  if (columnsRow) {
    columnsRow.classList.add('footer-columns');
    [...columnsRow.children].forEach((col, i) => {
      col.classList.add('footer-col');
      if (i === 0) col.classList.add('footer-branding');
    });
  }

  // The copyright is a paragraph with no link list, in its own section.
  const copyright = [...footer.querySelectorAll('p')]
    .find((p) => /rights reserved/i.test(p.textContent));
  if (copyright) copyright.closest('div')?.classList.add('footer-bottom');

  block.append(footer);
}
