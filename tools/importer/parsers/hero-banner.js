/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-banner (xwalk model: hero-banner).
 * Fields: image (reference), mobileImage (reference, optional), text (richtext).
 * Source: div.hero > img + div (h1, h2 / p, buttons; buttons already authorable via
 * the mybeckman-service-sections transformer).
 */
export default function parse(element, { document }) {
  const imageCell = document.createDocumentFragment();
  const srcImg = element.querySelector(':scope > img, :scope > picture img');
  if (srcImg && srcImg.getAttribute('src')) {
    const img = document.createElement('img');
    img.src = srcImg.getAttribute('src');
    img.alt = srcImg.getAttribute('alt') || '';
    imageCell.appendChild(document.createComment(' field:image '));
    imageCell.appendChild(img);
  }
  const mobileCell = document.createDocumentFragment();

  const textCell = document.createDocumentFragment();
  const body = element.querySelector(':scope > div') || element;
  const nodes = [...body.children].filter((n) => n.tagName !== 'IMG');
  if (nodes.length) {
    textCell.appendChild(document.createComment(' field:text '));
    nodes.forEach((n) => textCell.appendChild(n));
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'hero-banner',
    cells: [[imageCell], [mobileCell], [textCell]],
  });
  element.replaceWith(block);
}
