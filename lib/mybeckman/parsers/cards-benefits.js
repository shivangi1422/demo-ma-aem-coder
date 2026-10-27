/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-benefits -> TWO existing blocks in the same section:
 *   Block A: "columns" 1x1 = H2 "Why Preventive Maintenance Pays Off" + intro paragraph(s)
 *   Block B: "cards" (no variant), one row per benefit tile: empty image | text
 * Source (mybeckman.in /service/instrument-optimization/preventive-maintenance):
 *   #main .bc-rich-text:has(.BenefitCards)
 *   .Section > h2 + p + .BenefitCards > .BenefitCards__top    > .BenefitCard x4
 *                                     + .BenefitCards__bottom > .BenefitCard x4
 *   Each .BenefitCard = span.fa (icon, dropped) + <p>label</p>.
 *
 * Visual order: at >=768px .BenefitCards is flex-direction:row and __top / __bottom are
 * flex columns, so __top is the LEFT column and __bottom the RIGHT column. The cards are
 * emitted in 2-column reading order: L1, R1, L2, R2, ... (leftover tiles appended).
 *
 * Model card (blocks/cards/_cards.json): image (reference) + text (richtext). The Cards
 * container has no block-level fields, so there is NO heading row. Every row has exactly
 * 2 cells: '' for the unused image, [field:text hint, <p>label</p>] for the text.
 * Heading-ish labels (h1-h6) become <p><strong>label</strong></p>.
 * Model columns: cells are default content, so no field hints.
 */

const HEADING = /^H[1-6]$/;

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

/** Clean inline copy: text, a[href], strong/b, em/i, sup/sub, br only. */
function cleanInline(document, node) {
  if (node.nodeType === 3) return document.createTextNode(node.nodeValue.replace(/ /g, ' '));
  if (node.nodeType !== 1) return null;
  if (['STYLE', 'SCRIPT', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'IFRAME'].includes(node.tagName.toUpperCase())) return null;
  if (node.matches('span.fa, span.far, span.fas, i.fa, i.far, i.fas')) return null;
  const frag = document.createDocumentFragment();
  node.childNodes.forEach((c) => {
    const cc = cleanInline(document, c);
    if (cc) frag.append(cc);
  });
  const tag = {
    A: 'a', STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', SUP: 'sup', SUB: 'sub', BR: 'br',
  }[node.tagName.toUpperCase()];
  if (!tag) return frag;
  if (tag === 'br') return document.createElement('br');
  if (!norm(frag.textContent)) return frag;
  const el = document.createElement(tag);
  if (tag === 'a') {
    const href = (node.getAttribute('href') || '').trim();
    if (!href) return frag;
    el.setAttribute('href', href);
  }
  el.append(frag);
  return el;
}

function cleanBlock(document, src, tag) {
  const el = document.createElement(tag);
  src.childNodes.forEach((c) => {
    const cc = cleanInline(document, c);
    if (cc) el.append(cc);
  });
  while (el.firstChild && el.firstChild.nodeType === 3 && !norm(el.firstChild.nodeValue)) el.firstChild.remove();
  while (el.lastChild && el.lastChild.nodeType === 3 && !norm(el.lastChild.nodeValue)) el.lastChild.remove();
  if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.nodeValue = el.firstChild.nodeValue.replace(/^\s+/, '');
  if (el.lastChild && el.lastChild.nodeType === 3) el.lastChild.nodeValue = el.lastChild.nodeValue.replace(/\s+$/, '');
  return norm(el.textContent) ? el : null;
}

/** One tile -> ['', [hint, <p>label</p>]] ; label taken from its p / heading / bare text. */
function tileRow(document, tile) {
  const parts = Array.from(tile.querySelectorAll('h1, h2, h3, h4, h5, h6, p'))
    .filter((n) => !n.parentElement.closest('h1, h2, h3, h4, h5, h6, p'));
  const text = [];
  parts.forEach((n) => {
    if (HEADING.test(n.tagName)) {
      const strong = cleanBlock(document, n, 'strong');
      if (strong) {
        const p = document.createElement('p');
        p.append(strong);
        text.push(p);
      }
      return;
    }
    const p = cleanBlock(document, n, 'p');
    if (p) text.push(p);
  });
  if (!text.length) {
    const p = cleanBlock(document, tile, 'p');
    if (p) text.push(p);
  }
  return ['', text.length ? [hint(document, 'text'), ...text] : ''];
}

/** Interleave column lists into row-major reading order: L1, R1, L2, R2, ... */
function interleave(columns) {
  const out = [];
  const max = Math.max(0, ...columns.map((c) => c.length));
  for (let i = 0; i < max; i += 1) {
    columns.forEach((c) => { if (c[i]) out.push(c[i]); });
  }
  return out;
}

export default function parse(element, { document }) {
  const section = element.querySelector('.Section') || element;
  const grid = section.querySelector('.BenefitCards');

  // Block A: heading + intro (everything outside .BenefitCards)
  const intro = [];
  Array.from(section.querySelectorAll('h1, h2, h3, h4, h5, h6, p'))
    .filter((n) => !(grid && grid.contains(n)) && !n.parentElement.closest('h1, h2, h3, h4, h5, h6, p'))
    .forEach((n) => {
      const out = cleanBlock(document, n, HEADING.test(n.tagName) ? 'h2' : 'p');
      if (out) intro.push(out);
    });

  // Block B: tiles in visual reading order
  let tiles = [];
  if (grid) {
    const columns = Array.from(grid.children)
      .map((col) => Array.from(col.querySelectorAll('.BenefitCard')))
      .filter((c) => c.length);
    tiles = columns.length > 1 ? interleave(columns) : Array.from(grid.querySelectorAll('.BenefitCard'));
  }
  const cells = tiles.map((t) => tileRow(document, t)).filter((row) => row[1] !== '');

  const blocks = [];
  if (intro.length) {
    blocks.push(WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [[intro]] }));
  }
  if (cells.length) {
    blocks.push(WebImporter.Blocks.createBlock(document, { name: 'cards', cells }));
  }
  if (!blocks.length) {
    blocks.push(WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [['']] }));
  }
  element.replaceWith(...blocks);
}
