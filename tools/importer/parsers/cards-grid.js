/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: cards-grid
 * Base block: cards-grid (container)
 * Source: https://www.beckmancoulter.com/en/products/immunoassay
 * Model (blocks/cards-grid/_cards-grid.json):
 *   container cards-grid: text (richtext heading/intro), classes (skipped)
 *   item cards-grid-item: image (reference), imageAlt (collapsed), text (richtext)
 * Handles two source shapes:
 *   1) Value-prop icon features: `.column` cards with icon <img> + <strong> title + description.
 *   2) Analyzer product cards: `.product-card` with thumbnail <img> + label + <h3> + <p> + CTA.
 * Library structure: row 0 = block name; optional heading/intro row (container text);
 *   one row per card with [image cell, text cell].
 */
export default function parse(element, { document }) {
  const isPlaceholder = (t) => !t || /^\s*(empty heading)?\s*$/i.test(t);

  // Container heading / intro (field:text) — skip auto-generated "Empty heading" placeholders.
  const headingEl = Array.from(
    element.querySelectorAll(':scope > .content-container > .heading h1, :scope > .content-container > .heading h2, :scope .heading > h1, :scope .heading > h2'),
  ).find((h) => !isPlaceholder(h.textContent));

  const cells = [];

  if (headingEl) {
    const headFrag = document.createDocumentFragment();
    headFrag.appendChild(document.createComment(' field:text '));
    headFrag.appendChild(headingEl);
    cells.push([headFrag]);
  }

  // Determine card set: product cards first, else icon-feature columns.
  let cards = Array.from(element.querySelectorAll(':scope .product-card'));
  let mode = 'product';
  if (cards.length === 0) {
    cards = Array.from(element.querySelectorAll(':scope > .column'));
    mode = 'feature';
  }

  cards.forEach((card) => {
    // Image cell (field:image). Skip inline data: SVG icons used for UI chrome.
    const img = Array.from(card.querySelectorAll('img')).find(
      (i) => !(i.getAttribute('src') || '').startsWith('data:'),
    ) || null;

    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img);
    }

    // Text cell (field:text): title (as heading) + description + CTA.
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));

    if (mode === 'product') {
      const label = card.querySelector('.label');
      const title = card.querySelector('h2, h3, h4');
      const paras = Array.from(card.querySelectorAll('.product-description > p, p')).filter(
        (p) => p.textContent.trim().length > 0,
      );
      const cta = card.querySelector('a.button, a.btn-cta, .product-description a');
      if (label && label.textContent.trim()) {
        const p = document.createElement('p');
        p.append(...label.childNodes);
        textFrag.appendChild(p);
      }
      if (title && !isPlaceholder(title.textContent)) textFrag.appendChild(title);
      paras.forEach((p) => textFrag.appendChild(p));
      if (cta) textFrag.appendChild(cta);
    } else {
      // Feature/icon column: content lives in a richtext <p> mixing <strong> title + text.
      const source = card.querySelector('.richText-mobile, .content-container') || card;
      // Promote the <strong> to a heading.
      const strong = source.querySelector('strong, b');
      if (strong && strong.textContent.trim()) {
        const h = document.createElement('h3');
        h.textContent = strong.textContent.trim();
        textFrag.appendChild(h);
        strong.remove();
      }
      // Remaining textual lines become a paragraph (drop the icon <img> and empty headings).
      source.querySelectorAll('img').forEach((i) => i.remove());
      source.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
        if (isPlaceholder(h.textContent)) h.remove();
      });
      const remainder = source.textContent.replace(/\s+/g, ' ').trim();
      if (remainder) {
        const p = document.createElement('p');
        p.innerHTML = (source.querySelector('p') ? source.querySelector('p').innerHTML : remainder).trim();
        // Clean leading <br>s.
        while (p.firstChild && (p.firstChild.nodeName === 'BR' || (p.firstChild.nodeType === 3 && !p.firstChild.textContent.trim()))) {
          p.removeChild(p.firstChild);
        }
        if (p.textContent.trim()) textFrag.appendChild(p);
      }
    }

    cells.push([imageFrag, textFrag]);
  });

  // Empty-block guard.
  if (cards.length === 0 && !headingEl) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Emit the styled variant per instance:
  //   feature icons (value props) -> solutions; analyzer product cards -> productlines.
  const variant = mode === 'feature' ? 'solutions' : 'productlines';
  const block = WebImporter.Blocks.createBlock(document, { name: `cards-grid (${variant})`, cells });
  element.replaceWith(block);
}
