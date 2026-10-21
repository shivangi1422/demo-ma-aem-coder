/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-video (block: cards-grid, Style option: video).
 * Source: div.col-3-default-padding / div.three.column.grid.container holding
 * Vidyard players (beckmancoulter.com solutions pages).
 *
 * xwalk container model `cards-grid`: text (richtext), image (reference), classes.
 * Item model `cards-grid-item`: image (reference, imageAlt collapsed), text (richtext).
 *
 * Row 1: (empty) heading / intro
 * Rows 3..N: one per Vidyard player -> poster image (alt = video title)
 *            | <p><a href="https://play.vidyard.com/{uuid}">{video title}</a></p>
 *
 * The Vidyard player resolves video titles at runtime (the DOM only carries a
 * generic "hospital" thumbnail alt and "Vidyard video player" iframe title),
 * so known titles are mapped by uuid; otherwise a non-generic alt/title/
 * aria-label from the player is used, falling back to "Watch video".
 */

const clean = (str) => (str || '').replace(/\s+/g, ' ').trim();

const KNOWN_TITLES = {
  '7Ayn48jPCoFoVZ9wtWDX5K': 'Decoding the Host Response to Infection with Melissa Naiman',
  W9dMhSdnNBBa28pwZLHtcL: 'Diagnostic Directionality with Jean B. Patel',
  '1sXqyegsbnK1n4hD22tEbh': 'Precision Medicine with Ephraim Tsalik',
};

const GENERIC_TITLE = /^(hospital|vidyard( video| media)? player|video|play video|thumbnail|image)$/i;

function uuidOf(container) {
  const direct = container.getAttribute('uuid') || container.getAttribute('data-uuid');
  if (direct) return direct;
  const withData = container.querySelector('[data-uuid]');
  if (withData) return withData.getAttribute('data-uuid');
  const src = [...container.querySelectorAll('iframe[src], img[src]')]
    .map((el) => el.getAttribute('src'))
    .find((s) => /vidyard\.com\//i.test(s || ''));
  const m = src && src.match(/vidyard\.com\/(?:watch\/)?([A-Za-z0-9_-]+)/i);
  return m ? m[1] : '';
}

function titleOf(container, uuid) {
  if (KNOWN_TITLES[uuid]) return KNOWN_TITLES[uuid];
  const candidates = [];
  container.querySelectorAll('img').forEach((img) => candidates.push(img.getAttribute('alt'), img.getAttribute('title')));
  container.querySelectorAll('iframe').forEach((f) => candidates.push(f.getAttribute('title')));
  const found = candidates.map(clean).find((t) => t && !GENERIC_TITLE.test(t));
  return found || 'Watch video';
}

export default function parse(element, { document }) {
  const cells = [];

  // ---- row 1: empty container heading field ---------------------------
  cells.push(['']);

  // ---- items: one per player, document order ---------------------------
  const seen = new Set();
  element.querySelectorAll('.vidyard-player-container, [class*="vidyard-player-container"]').forEach((container) => {
    const uuid = uuidOf(container);
    if (!uuid || seen.has(uuid)) return;
    seen.add(uuid);

    const title = titleOf(container, uuid);
    const poster = container.querySelector('img.vidyard-player-embed, img[data-uuid], img');
    const posterSrc = (poster && poster.getAttribute('src')) || `https://play.vidyard.com/${uuid}.jpg`;

    const img = document.createElement('img');
    img.src = posterSrc;
    img.alt = title;

    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = `https://play.vidyard.com/${uuid}`;
    a.textContent = title;
    p.append(a);

    cells.push([
      [document.createComment(' field:image '), img],
      [document.createComment(' field:text '), p],
    ]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid (video)', cells });
  element.replaceWith(block);
}
