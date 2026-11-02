/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-centered. Base: hero.
 * Source: https://www.mybeckman.in/service
 * Selectors: .bc-rich-text > .hero, div.hero
 * Model (hero-centered): image (reference, imageAlt collapsed), text (richtext).
 * Source: https://www.mybeckman.in/service/plans/<product-line> (h1 + h2 + 2 CTAs)
 * Row 1: background image. Row 2: H1 (+ H2 subheading) + paragraph + CTA link(s).
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
  // optional subheading: a heading directly following the main heading (e.g. h1 + h2)
  const next = heading ? heading.nextElementSibling : null;
  const subheading = next && /^H[2-6]$/.test(next.tagName) ? next : null;
  const paragraphs = Array.from(content.querySelectorAll(':scope > p'));
  const ctas = Array.from(content.querySelectorAll(':scope > a[href], :scope > p > a.btn[href]'));

  if (heading || paragraphs.length || ctas.length) {
    textFrag.appendChild(document.createComment(' field:text '));
  }
  if (heading) textFrag.appendChild(heading);
  if (subheading) textFrag.appendChild(subheading);
  paragraphs.forEach((p) => {
    if (!ctas.some((a) => p.contains(a))) textFrag.appendChild(p);
  });
  // Several CTAs: bold = primary button, italic = secondary (decorateButtons).
  // A single CTA stays a plain link (keeps the /service output unchanged).
  const multi = ctas.length > 1;
  ctas.forEach((a) => {
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href'));
    link.textContent = a.textContent.trim();
    const p = document.createElement('p');
    let wrapper = null;
    if (multi && a.classList.contains('btn-primary')) wrapper = document.createElement('strong');
    else if (multi && a.classList.contains('btn-secondary')) wrapper = document.createElement('em');
    if (wrapper) {
      wrapper.appendChild(link);
      p.appendChild(wrapper);
    } else {
      p.appendChild(link);
    }
    textFrag.appendChild(p);
  });
  cells.push([textFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-centered', cells });
  element.replaceWith(block);
}
