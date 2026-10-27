/**
 * Splits the attribution into one span per line: on <br> when the author
 * entered line breaks, otherwise on commas (plain-text attribution field).
 * @param {Element} cite
 * @param {{commaFallback?: boolean, newlines?: boolean}} [options]
 *   commaFallback: split on commas when there are no line breaks;
 *   newlines: also treat newline characters in the text as line breaks
 */
function splitAttribution(cite, { commaFallback = true, newlines = false } = {}) {
  const lines = [[]];
  [...cite.childNodes].forEach((node) => {
    if (node.nodeName === 'BR') lines.push([]);
    else if (newlines && node.nodeType === Node.TEXT_NODE) {
      node.textContent.split(/\r?\n|\\n/).forEach((part, i) => {
        if (i > 0) lines.push([]);
        lines[lines.length - 1].push(part);
      });
    } else lines[lines.length - 1].push(node.textContent);
  });
  let parts = lines.map((line) => line.join('').trim());
  if (parts.length < 2 && commaFallback) parts = cite.textContent.split(',').map((part) => part.trim());
  parts = parts.filter(Boolean);
  if (parts.length < 2) return;
  cite.replaceChildren(...parts.map((part) => {
    const span = document.createElement('span');
    span.className = 'quote-attribution-line';
    span.textContent = part;
    return span;
  }));
}

/**
 * Decorates the quote block: a testimonial with quote text and attribution.
 * Authored as a simple block with two rows: a quote row (richtext) and an
 * attribution row (text) — one row per model field.
 * Style option (block class): .quote.banner — full-width dark band with upright
 * white text; decoration is identical, only CSS differs.
 * Style option (block class): .quote.testimonial — centred upright quote framed
 * by large quotation marks; the attribution is split into one line per part
 * (name / title / organization), on line breaks or, failing that, on commas.
 * Style option (block class): .quote.testimonial-purple — full-width purple
 * band, upright white quote between quotation marks; the attribution is split
 * on line breaks only (organizations often contain commas).
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

  if (block.classList.contains('testimonial')) splitAttribution(cite);
  else if (block.classList.contains('testimonial-purple')) {
    splitAttribution(cite, { commaFallback: false, newlines: true });
  }

  block.replaceChildren(quote);
  if (cite.textContent.trim() !== '') block.append(cite);
}
