/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-topic-tiles (mybeckman.in home, "Popular topics").
 * Source: #topics > div.grid
 *   > a.gradient-primary-hover[href][title] (x5, whole tile is the link)
 *       > div (title text)
 *       > div ("->" decorative arrow)
 *
 * Library convention (Cards): one row per card, 2 columns (image | text);
 * an empty image cell is still included.
 * Block cards-topic-tiles (blocks/cards-topic-tiles/_cards-topic-tiles.json):
 * collection of cards-topic-tiles-item (fields: image, text).
 *   cell 1: empty (no image on the source tiles)
 *   cell 2: field:text -> <p><a href="(tile href)">Title</a></p>
 * The "->" arrow text is not authored (the block JS adds it).
 */

const ARROW = /^\s*(->|→|›|»)\s*$/;

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

/** Tile title: first non-arrow child text, else own text minus arrow, else title attribute. */
function titleOf(tile) {
  const parts = [...tile.children]
    .map((c) => norm(c.textContent))
    .filter((t) => t && !ARROW.test(t));
  if (parts.length) return parts[0];
  const own = norm(tile.textContent).replace(/\s*(->|→)\s*$/, '');
  return own || norm(tile.getAttribute('title'));
}

export default function parse(element, { document }) {
  const cells = [];
  let tiles = [...element.querySelectorAll(':scope > a[href]')];
  if (!tiles.length) tiles = [...element.querySelectorAll('a[href]')];

  tiles.forEach((tile) => {
    const title = titleOf(tile);
    if (!title) return;
    const href = (tile.getAttribute('href') || '').trim();
    const p = document.createElement('p');
    if (href) {
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = title;
      p.append(a);
    } else {
      p.textContent = title;
    }
    cells.push(['', [hint(document, 'text'), p]]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-topic-tiles', cells });
  element.replaceWith(block);
}
