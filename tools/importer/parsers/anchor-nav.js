/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-anchor-nav (xwalk model: columns-anchor-nav, field "text" richtext).
 * Source (www.beckman.com product page): #intrenal-page-link-wrapper > div > a[href="#…"]
 * (hrefs already rewritten to heading slugs by mybeckman-links; links without a target are
 * removed by beckman-product-prepare).
 * Output (one row, one cell): <!-- field:text --><ul><li><a href="#…">Label</a></li>…</ul>
 */
export default function parse(element, { document }) {
  const ul = document.createElement('ul');
  element.querySelectorAll('a[href]').forEach((src) => {
    const label = src.textContent.replace(/\s+/g, ' ').trim();
    if (!label) return;
    const a = document.createElement('a');
    a.href = src.getAttribute('href');
    a.textContent = label;
    const li = document.createElement('li');
    li.append(a);
    ul.append(li);
  });

  const cell = document.createDocumentFragment();
  if (ul.children.length) {
    cell.appendChild(document.createComment(' field:text '));
    cell.appendChild(ul);
  }

  const cells = [[cell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-anchor-nav', cells });
  element.replaceWith(block);
}
