/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-article (xwalk model: columns-article).
 * Fields: image (reference, imageAlt collapsed onto img alt), text (richtext).
 * Source: #content-holder > div.row with .col-md-4 (category image) and .col-md-8 (answer).
 * Output rows:
 *   1. <!-- field:image --><img>        (empty cell when no image)
 *   2. <!-- field:text --> ...children of .col-md-8
 * Text normalisation (wrapping, Wistia links, style stripping) is done by
 * the mybeckman-cleanup transformer; this parser only moves the content.
 */
export default function parse(element, { document }) {
  // Row 1: category image
  const imageCell = document.createDocumentFragment();
  const srcImg = element.querySelector('.col-md-4 img');
  if (srcImg && srcImg.getAttribute('src')) {
    const img = document.createElement('img');
    img.src = srcImg.getAttribute('src');
    img.alt = srcImg.getAttribute('alt') || '';
    imageCell.appendChild(document.createComment(' field:image '));
    imageCell.appendChild(img);
  }

  // Row 2: answer rich text
  const textCell = document.createDocumentFragment();
  const textCol = element.querySelector('.col-md-8');
  if (textCol) {
    const nodes = [...textCol.childNodes].filter((n) => (n.nodeType === 1)
      || (n.nodeType === 3 && n.textContent.trim()));
    if (nodes.length) {
      textCell.appendChild(document.createComment(' field:text '));
      nodes.forEach((n) => textCell.appendChild(n));
    }
  }

  const cells = [[imageCell], [textCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-article', cells });
  element.replaceWith(block);
}
