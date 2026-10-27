/* eslint-disable */
/* global WebImporter */

/**
 * Parser for content-reversed (template: reagent-product).
 * Source: https://www.mybeckman.in/reagents/particle/valita-titer-assays
 * Selector: .product-spotlight-wrapper .spotlight-content-wrapper .custom-container
 *
 * Model (blocks/content-reversed/_content-reversed.json):
 *   image (reference) [+ imageAlt collapsed], text (richtext)
 *
 * Output rows:
 *   row 1: image (.cell-left img)
 *   row 2: text  (.cell-right: heading, paragraph(s), Learn More CTA)
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

  const left = element.querySelector('.cell-left');
  const right = element.querySelector('.cell-right');

  // Row 1: image
  let imageCell = '';
  const srcImg = (left || element).querySelector('img');
  if (srcImg && srcImg.getAttribute('src')) {
    const img = document.createElement('img');
    img.setAttribute('src', srcImg.getAttribute('src'));
    img.setAttribute('alt', clean(srcImg.getAttribute('alt')));
    imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    imageCell.appendChild(img);
  }

  // Row 2: text
  const textNodes = [];
  if (right) {
    Array.from(right.children).forEach((child) => {
      const tag = child.tagName;
      if (/^H[1-6]$/.test(tag)) {
        if (!clean(child.textContent)) return;
        const h = document.createElement(tag.toLowerCase());
        h.textContent = clean(child.textContent);
        textNodes.push(h);
      } else if (tag === 'P' || tag === 'UL' || tag === 'OL') {
        if (!clean(child.textContent)) return;
        const clone = child.cloneNode(true);
        clone.removeAttribute('style');
        clone.querySelectorAll('[style]').forEach((n) => n.removeAttribute('style'));
        textNodes.push(clone);
      } else if (tag === 'A') {
        const text = clean(child.textContent);
        const href = child.getAttribute('href');
        if (!text || !href) return;
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = text;
        p.appendChild(a);
        textNodes.push(p);
      }
    });
  }

  let textCell = '';
  if (textNodes.length) {
    textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    textNodes.forEach((n) => textCell.appendChild(n));
  }

  const cells = [[imageCell], [textCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'content-reversed', cells });
  element.replaceWith(block);
}
