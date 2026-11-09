/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-callout (xwalk model: hero-callout: image, imageAlt, text) — hero convention:
 * one image row and one text row.
 * Source: div.Header > img (logo), h1, h2, div.Header__callout (p label + buttons; buttons already
 * authorable via the mybeckman-service-sections transformer).
 * Output: [<!-- field:image --><img>] [<!-- field:text -->h1 h2 p label + button paragraphs]
 * (the block shows everything after the headings in the callout box)
 */
export default function parse(element, { document }) {
  const imageCell = document.createDocumentFragment();
  const srcImg = element.querySelector(':scope > img, :scope > p > img, :scope > picture img');
  if (srcImg && srcImg.getAttribute('src')) {
    const img = document.createElement('img');
    img.src = srcImg.getAttribute('src');
    img.alt = srcImg.getAttribute('alt') || '';
    imageCell.appendChild(document.createComment(' field:image '));
    imageCell.appendChild(img);
    (srcImg.closest('p') || srcImg).remove();
  }

  const callout = element.querySelector(':scope > .Header__callout');
  if (callout) {
    const parts = [...callout.querySelectorAll('p, h3, h4')].filter((n) => !n.parentElement.closest('p'));
    callout.replaceWith(...parts);
  }

  const textCell = document.createDocumentFragment();
  const nodes = [...element.children];
  if (nodes.length) {
    textCell.appendChild(document.createComment(' field:text '));
    nodes.forEach((n) => textCell.appendChild(n));
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'hero-callout',
    cells: [[imageCell], [textCell]],
  });
  element.replaceWith(block);
}
