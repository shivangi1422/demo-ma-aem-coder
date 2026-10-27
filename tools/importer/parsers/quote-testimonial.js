/* eslint-disable */
/* global WebImporter */

/**
 * Parser for quote-testimonial (block: quote, Style option: testimonial).
 * Source: div.testimonial:not(.testimonial-slim) (beckmancoulter.com product pages):
 *   .quote (quote text; the curly quotation marks are CSS pseudo-elements)
 *   .author / .title1 / .title2 (attribution lines)
 *
 * xwalk model `quote`: quote (richtext), attribution (text), classes.
 * Row 1: <p>quote text</p> (one <p> per source paragraph; quotation-mark
 *        glyph elements and wrapping curly quote characters removed)
 * Row 2: attribution as plain text "Name, Title, Organization" - the
 *        testimonial option splits it into lines on the commas.
 * Text is kept as authored in the source (no case changes).
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

const GLYPH_SELECTOR = [
  '.quote-mark',
  '.quote-icon',
  '.quotes',
  '[class*="quote-open"]',
  '[class*="quote-close"]',
  '[class*="open-quote"]',
  '[class*="close-quote"]',
  '[class*="quotation"]',
  'svg',
  'img',
  'i',
].join(', ');

/** strip curly / straight quote characters wrapping the whole text */
const unquote = (text) => text
  .replace(/^[“”"„«‘’']+\s*/, '')
  .replace(/\s*[“”"„»‘’']+$/, '');

export default function parse(element, { document }) {
  const cells = [];

  // ---- row 1: quote -----------------------------------------------------
  const quoteEl = element.querySelector('.quote, .quoteText, blockquote, .testimonial-quote');
  const quoteNodes = [];
  if (quoteEl) {
    const clone = quoteEl.cloneNode(true);
    clone.querySelectorAll(GLYPH_SELECTOR).forEach((g) => g.remove());
    const paras = [...clone.querySelectorAll('p')].filter((p) => clean(p.textContent));
    const texts = paras.length ? paras.map((p) => clean(p.textContent)) : [clean(clone.textContent)];
    texts.forEach((text, i) => {
      let t = text;
      if (i === 0) t = t.replace(/^[“”"„«‘’']+\s*/, '');
      if (i === texts.length - 1) t = t.replace(/\s*[“”"„»‘’']+$/, '');
      if (texts.length === 1) t = unquote(text);
      if (!t) return;
      const p = document.createElement('p');
      p.textContent = t;
      quoteNodes.push(p);
    });
  }
  if (quoteNodes.length) {
    cells.push([[document.createComment(' field:quote '), ...quoteNodes]]);
  } else {
    cells.push(['']);
  }

  // ---- row 2: attribution -------------------------------------------------
  let parts = ['.author', '.title1', '.title2', '.title3']
    .map((sel) => clean((element.querySelector(sel) || {}).textContent))
    .filter(Boolean);
  if (!parts.length) {
    const cite = element.querySelector('cite, .attribution, figcaption');
    if (cite) parts = [clean(cite.textContent)].filter(Boolean);
  }
  const attribution = parts.join(', ');
  if (attribution) {
    cells.push([[document.createComment(' field:attribution '), document.createTextNode(attribution)]]);
  } else {
    cells.push(['']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'quote (testimonial)', cells });
  element.replaceWith(block);
}
