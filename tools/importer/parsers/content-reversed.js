/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: content-reversed
 * Base block: content-reversed (simple block)
 * Source: https://www.beckmancoulter.com/en/products/immunoassay
 * Model (blocks/content-reversed/_content-reversed.json):
 *   image (reference), imageAlt (collapsed), text (richtext)
 * Library structure: simple block — one image row (field:image) + one text row (field:text).
 * Source shape: a `.social-proof-section` with an <h2 class="title"> heading and N
 *   `.social-proof-card` items (alternating image/text rows). Since the block model is a
 *   SIMPLE block (single image + single text), each card becomes its own content-reversed
 *   block; the section heading is emitted as default content before the blocks.
 */
export default function parse(element, { document }) {
  const isPlaceholder = (t) => !t || /^\s*(empty heading)?\s*$/i.test(t);
  const replacements = [];

  // Section heading -> default content (not part of the content-reversed model).
  const sectionHeading = element.querySelector(':scope > h1, :scope > h2, :scope > .title, :scope > h2.title');
  if (sectionHeading && !isPlaceholder(sectionHeading.textContent)) {
    replacements.push(sectionHeading);
  }

  const cards = Array.from(element.querySelectorAll(':scope .social-proof-card'));

  cards.forEach((card) => {
    const img = card.querySelector('.image img, img');

    // Image cell (field:image); imageAlt is collapsed into the img alt attribute.
    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img);
    }

    // Text cell (field:text): eyebrow label + title + body + CTA.
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));

    const title = card.querySelector('.content h1, .content h2, .content h3, h2');
    if (title && !isPlaceholder(title.textContent)) {
      // The eyebrow lives in <span class="label"> inside the title; keep the title as-is
      // (heading text includes the descriptive title after the label span).
      textFrag.appendChild(title);
    }
    card.querySelectorAll('.content p, p.body').forEach((p) => {
      if (p.textContent.trim()) textFrag.appendChild(p);
    });
    const cta = card.querySelector('.content a.button, .content a.btn-cta, a.ui.button');
    if (cta) textFrag.appendChild(cta);

    const cells = [];
    if (img) cells.push([imageFrag]);
    cells.push([textFrag]);

    const block = WebImporter.Blocks.createBlock(document, { name: 'content-reversed', cells });
    replacements.push(block);
  });

  // Empty-block guard.
  if (replacements.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  element.replaceWith(...replacements);
}
