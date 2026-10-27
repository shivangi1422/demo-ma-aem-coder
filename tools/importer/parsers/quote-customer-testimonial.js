/* eslint-disable */
/* global WebImporter */

/**
 * Parser for quote-customer-testimonial (block: quote, Style option: testimonial-purple).
 * Source: div.customer-testimonial (beckmancoulter.com /en/solutions/hematology-solution,
 * full-width purple or blue band). The .author/.title1/.title2 divs are empty -
 * the attribution sits inside .quoteText:
 *   .quoteText > p(&nbsp;) + span(quote text + closing ”) + p(&nbsp;)
 *              + p > strong(name) + span(title <br> organization)
 *
 * xwalk model `quote`: quote (richtext), attribution (text), classes.
 * Row 1: <p>quote text</p> (wrapping quote characters removed)
 * Row 2: attribution "name\ntitle\norganization" - plain text field, so the
 *        line breaks are literal "\n" sequences, which the testimonial-purple
 *        option splits on (same convention as quote-testimonial-purple.js).
 * Every band maps to testimonial-purple (no blue option exists).
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

const OPEN_RE = /^[“”"„«‘’']+\s*/;
const CLOSE_RE = /\s*[“”"„»‘’']+$/;

/** text lines of an element, split on <br> */
function lines(el) {
  const out = [''];
  const walk = (node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeName === 'BR') out.push('');
      else if (child.nodeType === 3) out[out.length - 1] += child.textContent;
      else walk(child);
    });
  };
  walk(el);
  return out.map(clean).filter(Boolean);
}

export default function parse(element, { document }) {
  const quoteText = element.querySelector('.quoteText') || element.querySelector('.quote') || element;

  // the attribution paragraph is the one holding the bold name
  const attributionEl = [...quoteText.querySelectorAll('p')].find((p) => p.querySelector('strong') && clean(p.textContent));

  // ---- row 1: quote ------------------------------------------------------
  const clone = quoteText.cloneNode(true);
  const cloneAttribution = [...clone.querySelectorAll('p')].find((p) => p.querySelector('strong') && clean(p.textContent));
  if (cloneAttribution) cloneAttribution.remove();
  clone.querySelectorAll('.quoteBefore, .quoteAfter, svg, img').forEach((g) => g.remove());
  const blocks = [...clone.querySelectorAll('p, span')].filter((el) => !el.parentElement.closest('p, span') || el.parentElement === clone);
  let texts = blocks.map((el) => clean(el.textContent)).filter(Boolean);
  if (!texts.length) texts = [clean(clone.textContent)].filter(Boolean);
  const quoteNodes = texts.map((text, i) => {
    let t = text;
    if (i === 0) t = t.replace(OPEN_RE, '');
    if (i === texts.length - 1) t = t.replace(CLOSE_RE, '');
    const p = document.createElement('p');
    p.textContent = t;
    return p;
  }).filter((p) => p.textContent);

  const cells = [];
  cells.push(quoteNodes.length ? [[document.createComment(' field:quote '), ...quoteNodes]] : ['']);

  // ---- row 2: attribution --------------------------------------------------
  const parts = attributionEl ? lines(attributionEl) : [];
  if (parts.length) {
    cells.push([[document.createComment(' field:attribution '), document.createTextNode(parts.join('\\n'))]]);
  } else {
    cells.push(['']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'quote (testimonial-purple)', cells });
  element.replaceWith(block);
}
