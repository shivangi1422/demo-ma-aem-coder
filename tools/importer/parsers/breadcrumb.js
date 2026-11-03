/* eslint-disable */
/* global WebImporter */

/**
 * Parser for breadcrumb (xwalk model: breadcrumb, field "text" richtext).
 * Source: nav.breadcrumbs > ul > li (links) + li.active (current page).
 * Output (one row, one cell): <!-- field:text --><ul><li><a/></li>...<li>Current</li></ul>
 */
function toSiteRelative(href) {
  if (!href) return '/';
  try {
    const url = new URL(href, 'https://www.mybeckman.in');
    if (/(^|\.)mybeckman\.in$/i.test(url.hostname) || href.startsWith('/')) {
      return `${url.pathname}${url.search}${url.hash}` || '/';
    }
    return href;
  } catch (e) {
    return href;
  }
}

export default function parse(element, { document }) {
  const ul = document.createElement('ul');
  const items = element.querySelectorAll(':scope li');

  items.forEach((li) => {
    const text = li.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;
    const item = document.createElement('li');
    const link = li.querySelector('a[href]');
    if (link && !li.classList.contains('active')) {
      const a = document.createElement('a');
      a.href = toSiteRelative(link.getAttribute('href'));
      a.textContent = link.textContent.replace(/\s+/g, ' ').trim() || text;
      item.append(a);
    } else {
      item.textContent = text;
    }
    ul.append(item);
  });

  const cell = document.createDocumentFragment();
  if (ul.children.length) {
    cell.appendChild(document.createComment(' field:text '));
    cell.appendChild(ul);
  }

  const cells = [[cell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'breadcrumb', cells });
  element.replaceWith(block);
}
