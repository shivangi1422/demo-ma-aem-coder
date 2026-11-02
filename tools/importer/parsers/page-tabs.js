/* eslint-disable */
/* global WebImporter */

/**
 * Parser for page-tabs.
 * Source: https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise
 * Selector: #intrenal-page-link-wrapper (sticky bar of in-page links)
 * Each link targets a section wrapper id (#features-wrapper …); it is rewritten to the
 * id of that section's heading, which is what the migrated page has.
 *
 * XWalk model (blocks/page-tabs/_page-tabs.json): links (richtext list)
 */

const clean = (text) => text.replace(/\s+/g, ' ').trim();
const slug = (text) => clean(text).toLowerCase().replace(/[^0-9a-z]+/g, '-').replace(/^-+|-+$/g, '');

export default function parse(element, { document }) {
  const cell = document.createDocumentFragment();
  cell.appendChild(document.createComment(' field:links '));
  const ul = document.createElement('ul');
  element.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    const target = href.startsWith('#') && href.length > 1 && document.getElementById(href.slice(1));
    const heading = target && (target.matches('h1, h2, h3, h4') ? target : target.querySelector('h1, h2, h3, h4'));
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.setAttribute('href', heading ? `#${slug(heading.textContent)}` : href);
    a.textContent = clean(link.textContent);
    li.appendChild(a);
    ul.appendChild(li);
  });
  cell.appendChild(ul);
  const block = WebImporter.Blocks.createBlock(document, { name: 'page-tabs', cells: [[cell]] });
  element.replaceWith(block);
}
