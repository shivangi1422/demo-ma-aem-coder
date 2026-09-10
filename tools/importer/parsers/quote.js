/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: quote
 * Base block: quote (simple block)
 * Source: https://www.beckmancoulter.com/en/products/dxs-service-and-supports
 *   Section: "testimonial-slim" band (blue background) with a single pull-quote.
 * Model (blocks/quote/_quote.json): quote (richtext), attribution (text).
 * Block JS reads two rows: row 0 = quote, row 1 = attribution.
 * Source shape: `.testimonial-slim .quoteText` holds the statement; the
 * `.author`/`.title1`/`.title2` divs carry attribution (empty on this page).
 */
export default function parse(element, { document }) {
  const isPlaceholder = (t) => !t || /^\s*(empty heading)?\s*$/i.test(t);

  const quoteEl = element.querySelector('.quoteText, blockquote, .quote-text')
    || element.querySelector('.quote');
  const quoteText = quoteEl ? quoteEl.textContent.replace(/\s+/g, ' ').trim() : '';

  if (!quoteText || isPlaceholder(quoteText)) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 0: quote (field:quote).
  const quoteFrag = document.createDocumentFragment();
  quoteFrag.appendChild(document.createComment(' field:quote '));
  const qp = document.createElement('p');
  qp.textContent = quoteText;
  quoteFrag.appendChild(qp);
  cells.push([quoteFrag]);

  // Row 1: attribution (field:attribution) — author + title lines, if present.
  const attribution = ['.author', '.title1', '.title2']
    .map((sel) => {
      const el = element.querySelector(sel);
      return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    })
    .filter((t) => t && !isPlaceholder(t))
    .join(', ');
  if (attribution) {
    const attrFrag = document.createDocumentFragment();
    attrFrag.appendChild(document.createComment(' field:attribution '));
    const ap = document.createElement('p');
    ap.textContent = attribution;
    attrFrag.appendChild(ap);
    cells.push([attrFrag]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'quote', cells });
  element.replaceWith(block);
}
