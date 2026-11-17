/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-media-wide (Columns block, media-wide option).
 * Source: https://www.mybeckman.in/resources/industries/synthetic-biology
 *   ("Customer Testimonial": .row > .col-md-8 inline Wistia player
 *    <wistia-player media-id="fdbmwymdzr"> | .col-md-1 empty spacer |
 *    .col-md-3 linked Customer Spotlight cover + red "Download ↓" button)
 * Selector: .row:has(> .col-md-8 wistia-player):has(> .col-md-3)
 * Model: columns (no field hints for Columns blocks); option class "media-wide".
 * Library convention: one row, one cell per column - [video, spotlight].
 * The empty spacer column is dropped (the option reproduces the 8/1/3 grid);
 * the player becomes a lone https://fast.wistia.net/embed/iframe/<id> link, which the
 * columns block embeds as a 16:9 iframe. The plain columns parser does the rest
 * (the <a><button> becomes <p><strong><a></a></strong></p>).
 */
import parseColumns from './columns.js';

export default function parse(element, { document, url, params }) {
  // inline Wistia web component -> lone embed link
  element.querySelectorAll('wistia-player[media-id], [class*="wistia_async_"]').forEach((player) => {
    const id = player.getAttribute('media-id')
      || ((player.getAttribute('class') || '').match(/wistia_async_([a-z0-9]+)/i) || [])[1];
    if (!id) return;
    const src = `https://fast.wistia.net/embed/iframe/${id}`;
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', src);
    a.textContent = src;
    p.appendChild(a);
    player.replaceWith(p);
  });
  element.querySelectorAll('style').forEach((s) => s.remove());
  // empty spacer columns (col-md-1)
  Array.from(element.children).forEach((col) => {
    if (!col.textContent.trim() && !col.querySelector('img, picture, a[href], iframe')) col.remove();
  });

  const marker = document.createComment('columns-media-wide');
  element.before(marker);
  parseColumns(element, { document, url, params });
  const block = marker.nextElementSibling;
  marker.remove();
  if (!block) return;
  const header = block.querySelector('tr:first-child > th, tr:first-child > td');
  if (header && header.textContent.trim() === 'Columns') header.textContent = 'Columns (media-wide)';
}
