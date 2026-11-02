/* eslint-disable */
/* global WebImporter */

/**
 * Parser for category-cards.
 * Source: https://www.mybeckman.in/software
 * Selector: .product-series-selector-wrapper .softwareContainer
 * Item: .softwareContainer > .softwareItem (h2, p, a.btn "Learn more").
 *
 * XWalk model (blocks/category-cards/_category-cards.json), item category-card:
 *   title (text) | description (richtext) | link (aem-content) + linkText (collapsed into link)
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll(':scope > .softwareItem'));

  const cells = items.map((item) => {
    const heading = item.querySelector(':scope > h2, :scope > h3');
    const descriptions = Array.from(item.querySelectorAll(':scope > p'));
    const link = item.querySelector(':scope > a');

    const titleCell = document.createDocumentFragment();
    titleCell.appendChild(document.createComment(' field:title '));
    if (heading) titleCell.appendChild(document.createTextNode(heading.textContent.trim()));

    const descCell = document.createDocumentFragment();
    descCell.appendChild(document.createComment(' field:description '));
    descriptions.forEach((d) => {
      const p = document.createElement('p');
      p.textContent = d.textContent.trim();
      descCell.appendChild(p);
    });

    const linkCell = document.createDocumentFragment();
    linkCell.appendChild(document.createComment(' field:link '));
    if (link) {
      const a = document.createElement('a');
      a.setAttribute('href', link.getAttribute('href'));
      a.textContent = link.textContent.trim() || 'Learn more';
      linkCell.appendChild(a);
    }

    return [titleCell, descCell, linkCell];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'category-cards', cells });
  element.replaceWith(block);
}
