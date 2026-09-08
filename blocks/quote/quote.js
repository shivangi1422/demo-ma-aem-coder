/**
 * Decorates the quote block: a testimonial with quote text and attribution.
 * Authored as a simple block with two rows: a quote row (richtext) and an
 * attribution row (text) — one row per model field.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];

  const quote = document.createElement('blockquote');
  quote.className = 'quote-text';
  const quoteCell = rows[0] && rows[0].firstElementChild;
  if (quoteCell) while (quoteCell.firstChild) quote.append(quoteCell.firstChild);

  const cite = document.createElement('p');
  cite.className = 'quote-attribution';
  const citeCell = rows[1] && rows[1].firstElementChild;
  if (citeCell) {
    // Unwrap a single <p> so we don't nest paragraphs inside the attribution.
    const inner = citeCell.children.length === 1 && citeCell.firstElementChild.tagName === 'P'
      ? citeCell.firstElementChild : citeCell;
    while (inner.firstChild) cite.append(inner.firstChild);
  }

  block.replaceChildren(quote);
  if (cite.textContent.trim() !== '') block.append(cite);
}
