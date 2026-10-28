/* eslint-disable */
/* global WebImporter */

/**
 * Parser for `columns-anchor-nav` (GSPANN sticky secondary service nav).
 * Source: nav.secondary-nav div.secondary-nav-content
 *   h2.secondary-nav-title + ul.anchor-menu > li > a.anchor-link
 * Output: 1 row x 2 cells — [title text | ul of anchor links]. Columns blocks get no field hints.
 */
export default function parse(element, { document }) {
  const titleEl = element.querySelector('.secondary-nav-title, h2, h3');
  // the live page appends a mobile toggle caret (▾) to the title
  const title = titleEl ? titleEl.textContent.replace(/[▾▼]/g, '').trim() : '';

  const ul = document.createElement('ul');
  element.querySelectorAll('ul a').forEach((a) => {
    if (ul.querySelector(`a[href="${a.getAttribute('href')}"]`)) return;
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = a.getAttribute('href') || '';
    link.textContent = a.textContent.trim();
    li.append(link);
    ul.append(li);
  });

  const cells = [[title, ul.children.length ? ul : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-anchor-nav', cells });
  element.replaceWith(block);
}
