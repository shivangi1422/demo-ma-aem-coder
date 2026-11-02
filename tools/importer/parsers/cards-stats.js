/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-stats. Base: cards (no images).
 * Source: https://www.mybeckman.in/service
 * Selectors: .Section--blue .Section__intro, .Section__intro
 * Model (cards-stats-item): text (richtext). One row per stat, one text cell:
 *   <p><strong>value</strong></p><p>label</p>
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll(':scope > div'));
  const cells = [];

  items.forEach((item) => {
    const paragraphs = Array.from(item.querySelectorAll(':scope > p'));
    if (!paragraphs.length && !item.textContent.trim()) return;

    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));

    if (paragraphs.length) {
      paragraphs.forEach((p, i) => {
        const strong = p.querySelector('strong, b');
        const out = document.createElement('p');
        if (i === 0 && strong) {
          const s = document.createElement('strong');
          s.textContent = strong.textContent.trim();
          out.appendChild(s);
        } else {
          out.textContent = p.textContent.trim();
        }
        textFrag.appendChild(out);
      });
    } else {
      const out = document.createElement('p');
      out.textContent = item.textContent.trim();
      textFrag.appendChild(out);
    }

    cells.push([textFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-stats', cells });
  element.replaceWith(block);
}
