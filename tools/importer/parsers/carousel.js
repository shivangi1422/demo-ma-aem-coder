/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: carousel
 * Base block: carousel (container)
 * Source: https://www.beckmancoulter.com/en/products/immunoassay
 * Model (blocks/carousel/_carousel.json):
 *   container carousel: text (richtext heading), classes (skipped)
 *   item carousel-item: image (reference), imageAlt (collapsed), text (richtext)
 * Library structure: row 0 = block name; optional heading row (container text);
 *   one row per slide with [image cell, text cell].
 * Source shape: `.education-filter-carousel` with a `.carousel-heading` and `.owl-carousel`
 *   holding `.owl-item > .item` slides (image + subheading + <h4> title + CTA). The
 *   interactive category filter (`.education-filter-actions`) is intentionally dropped —
 *   it is a UI control that carries no slide content.
 */
export default function parse(element, { document }) {
  const isPlaceholder = (t) => !t || /^\s*(empty heading)?\s*$/i.test(t);
  const cells = [];

  // Container heading (field:text). The heading may be the `.carousel-heading` element
  // itself (an <h2> carrying the class) or a heading nested inside it.
  let headingEl = element.querySelector(
    ':scope .carousel-heading h1, :scope .carousel-heading h2, :scope .carousel-heading h3',
  );
  if (!headingEl) {
    const ch = element.querySelector(':scope .carousel-heading, :scope > .carousel-heading');
    if (ch && /^H[1-6]$/.test(ch.tagName)) headingEl = ch;
  }
  if (headingEl && !isPlaceholder(headingEl.textContent)) {
    const headFrag = document.createDocumentFragment();
    headFrag.appendChild(document.createComment(' field:text '));
    headFrag.appendChild(headingEl);
    cells.push([headFrag]);
  }

  // Slides: prefer canonical slides (skip owl duplicate clones if present).
  let slides = Array.from(element.querySelectorAll(':scope .owl-item:not(.cloned) > .item'));
  if (slides.length === 0) slides = Array.from(element.querySelectorAll(':scope .item'));

  slides.forEach((slide) => {
    const img = Array.from(slide.querySelectorAll('img')).find(
      (i) => !(i.getAttribute('src') || '').startsWith('data:'),
    ) || null;

    // Image cell (field:image); imageAlt collapsed into img alt attribute.
    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img);
    }

    // Text cell (field:text): subheading eyebrow + title + CTA.
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));

    const eyebrow = slide.querySelector('.subheading');
    if (eyebrow && eyebrow.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = eyebrow.textContent.trim();
      textFrag.appendChild(p);
    }
    const title = slide.querySelector('h1, h2, h3, h4, h5');
    // Some source titles are the auto "Empty heading" placeholder; the real title is <h4>.
    const realTitle = Array.from(slide.querySelectorAll('h1, h2, h3, h4, h5')).find(
      (h) => !isPlaceholder(h.textContent),
    );
    if (realTitle) textFrag.appendChild(realTitle);
    else if (title && !isPlaceholder(title.textContent)) textFrag.appendChild(title);

    const cta = slide.querySelector('.item-action a, a.button, a[href]');
    if (cta) textFrag.appendChild(cta);

    cells.push([imageFrag, textFrag]);
  });

  // Empty-block guard.
  if (slides.length === 0 && !headingEl) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel (instruments)', cells });
  element.replaceWith(block);
}
