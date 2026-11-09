/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the FAQ article body: block Columns (article), one row with two cells.
 * It is a columns variant, not its own block: the AEM content converter maps columns tables to
 * the core Columns component, whose cells hold text, image and title components, so answers with
 * inline images convert (a block richtext field cannot hold images).
 * Source: #content-holder > div.row with .col-md-4 (category image) and .col-md-8 (answer).
 * Output (one row): [category image (empty cell when none)] [children of .col-md-8]
 * Text normalisation (wrapping, Wistia links, style stripping) is done by
 * the mybeckman-cleanup transformer; this parser only moves the content.
 */
export default function parse(element, { document }) {
  // cell 1: category image
  const imageCell = document.createDocumentFragment();
  const srcImg = element.querySelector('.col-md-4 img');
  if (srcImg && srcImg.getAttribute('src')) {
    const img = document.createElement('img');
    img.src = srcImg.getAttribute('src');
    img.alt = srcImg.getAttribute('alt') || '';
    imageCell.appendChild(img);
  }

  // cell 2: answer
  const textCell = document.createDocumentFragment();
  const textCol = element.querySelector('.col-md-8');
  if (textCol) {
    const nodes = [...textCol.childNodes].filter((n) => (n.nodeType === 1)
      || (n.nodeType === 3 && n.textContent.trim()));
    if (nodes.length) {
      nodes.forEach((n) => textCell.appendChild(n));
    }
  }

  const cells = [[imageCell, textCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (article)', cells });
  element.replaceWith(block);
}
