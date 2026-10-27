/* eslint-disable */
/* global WebImporter */

/**
 * Parser for quote-testimonial-purple (block: quote, Style option: testimonial-purple).
 * Source: div.testimonial-slim (beckmancoulter.com product pages, purple band):
 *   .quote > .quoteBefore / .quoteText / .quoteAfter (glyph divs are empty)
 *   .author / .title1 / .title2 (attribution lines)
 *
 * xwalk model `quote`: quote (richtext), attribution (text), classes.
 * Row 1: <p>quote text</p> (glyph elements and wrapping quote characters removed)
 * Row 2: attribution with LINE BREAKS between name / title / organization,
 *        written as literal "\n" sequences (plain text field, see below) -
 *        the testimonial-purple option splits on line breaks only, because
 *        organizations contain commas ("... LLP, Airedale NHS Foundation Trust").
 * Text is kept as authored in the source (no case changes).
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

const GLYPH_SELECTOR = [
  '.quoteBefore',
  '.quoteAfter',
  '.quote-mark',
  '.quote-icon',
  '[class*="quote-open"]',
  '[class*="quote-close"]',
  '[class*="open-quote"]',
  '[class*="close-quote"]',
  'svg',
  'img',
  'i',
].join(', ');

const OPEN_RE = /^[“”"„«‘’']+\s*/;
const CLOSE_RE = /\s*[“”"„»‘’']+$/;

export default function parse(element, { document }) {
  const cells = [];

  // ---- row 1: quote -----------------------------------------------------
  const quoteEl = element.querySelector('.quoteText')
    || element.querySelector('.quote, blockquote, .testimonial-quote');
  const quoteNodes = [];
  if (quoteEl) {
    const clone = quoteEl.cloneNode(true);
    clone.querySelectorAll(GLYPH_SELECTOR).forEach((g) => g.remove());
    const paras = [...clone.querySelectorAll('p')].filter((p) => clean(p.textContent));
    const texts = paras.length ? paras.map((p) => clean(p.textContent)) : [clean(clone.textContent)];
    texts.forEach((text, i) => {
      let t = text;
      if (i === 0) t = t.replace(OPEN_RE, '');
      if (i === texts.length - 1) t = t.replace(CLOSE_RE, '');
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

  // ---- row 2: attribution, one line per part ----------------------------
  let parts = ['.author', '.title1', '.title2', '.title3']
    .map((sel) => clean((element.querySelector(sel) || {}).textContent))
    .filter(Boolean);
  if (!parts.length) {
    const cite = element.querySelector('cite, .attribution, figcaption');
    if (cite) parts = [clean(cite.textContent)].filter(Boolean);
  }
  if (parts.length) {
    // `attribution` is a plain text field: md2jcr rejects <br> (several nodes)
    // there, so the line breaks are authored as "\n" sequences, which the
    // testimonial-purple option splits on (quote.js splitAttribution newlines)
    cells.push([[
      document.createComment(' field:attribution '),
      document.createTextNode(parts.join('\\n')),
    ]]);
  } else {
    cells.push(['']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'quote (testimonial-purple)', cells });
  element.replaceWith(block);
}
