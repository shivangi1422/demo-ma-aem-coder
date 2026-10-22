/* eslint-disable */
/* global WebImporter */

/**
 * Parser for quote-banner (block: quote, Style option: banner).
 * Source: div.testimonial-slim (beckmancoulter.com dxs-service-and-supports pages).
 *
 * xwalk model `quote`: quote (richtext), attribution (text), classes.
 * Row 1: <p>quote text</p> (.quoteText)
 * Row 2: attribution (.author / .title1 / .title2) - empty on the source page
 */

const clean = (str) => (str || '').replace(/\s+/g, ' ').trim();

export default function parse(element, { document }) {
  const cells = [];

  const quoteEl = element.querySelector('.quoteText') || element.querySelector('.quote');
  const quoteText = clean(quoteEl ? quoteEl.textContent : '');
  if (quoteText) {
    const p = document.createElement('p');
    p.textContent = quoteText;
    cells.push([[document.createComment(' field:quote '), p]]);
  } else {
    cells.push(['']);
  }

  const attribution = ['.author', '.title1', '.title2']
    .map((sel) => clean((element.querySelector(sel) || {}).textContent))
    .filter(Boolean)
    .join(', ');
  if (attribution) {
    cells.push([[document.createComment(' field:attribution '), document.createTextNode(attribution)]]);
  } else {
    cells.push(['']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'quote (banner)', cells });
  element.replaceWith(block);
}
