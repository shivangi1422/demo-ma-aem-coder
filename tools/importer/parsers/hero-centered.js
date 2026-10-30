/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-centered. Base: hero.
 * Source: https://www.mybeckman.in/service
 * Selectors: .bc-rich-text > .hero, div.hero
 * Model (hero-centered): image (reference, imageAlt collapsed), text (richtext).
 * Row 1: background image. Row 2: H1 + paragraph + CTA link.
 */
export default function parse(element, { document }) {
  const img = element.querySelector(':scope > img, :scope > picture img, img');
  const content = element.querySelector(':scope > div') || element;

  const cells = [];

  // Row 1: image
  const imageFrag = document.createDocumentFragment();
  if (img) {
    imageFrag.appendChild(document.createComment(' field:image '));
    imageFrag.appendChild(img);
  }
  cells.push([imageFrag]);

  // Row 2: text (heading, description, CTA)
  const textFrag = document.createDocumentFragment();
  const heading = content.querySelector('h1, h2, h3');
  const paragraphs = Array.from(content.querySelectorAll(':scope > p'));
  const ctas = Array.from(content.querySelectorAll(':scope > a[href], :scope > p > a.btn[href]'));

  if (heading || paragraphs.length || ctas.length) {
    textFrag.appendChild(document.createComment(' field:text '));
  }
  if (heading) textFrag.appendChild(heading);
  paragraphs.forEach((p) => {
    if (!ctas.some((a) => p.contains(a))) textFrag.appendChild(p);
  });
  ctas.forEach((a) => {
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href'));
    link.textContent = a.textContent.trim();
    const p = document.createElement('p');
    p.appendChild(link);
    textFrag.appendChild(p);
  });
  cells.push([textFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-centered', cells });
  element.replaceWith(block);
}
