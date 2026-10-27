/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-advantages -> THREE existing blocks in the same section:
 *   Block A: "columns" 1x1 = H2 "Advantages of Preventive Maintenance with a Plan"
 *   Block B: "cards" (no variant), one row per .ServiceCard: empty image | <h3>title</h3><p>text</p>
 *   Block C: "columns" 1x1 = footnote "*BeckmanConnect is not available ..." as plain <p>
 * Source (mybeckman.in /service/instrument-optimization/preventive-maintenance):
 *   #main .bc-rich-text:has(.ServiceCards)
 *   .Section > h2 + .ServiceCards > .ServiceCard x8 (h3 + p) + <p><small>*footnote</small></p>
 *
 * Model card (blocks/cards/_cards.json): image (reference) + text (richtext). The Cards
 * container has no block-level fields, so there is NO heading row. Every row has exactly
 * 2 cells: '' for the unused image, [field:text hint, h3, p...] for the text.
 * Footnote markers ("*") are kept as text. <small> is unwrapped (plain paragraph).
 * Model columns: cells are default content, so no field hints.
 */

const HEADINGS = 'h1, h2, h3, h4, h5, h6';
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

/** Top-level headings / paragraphs / lists of a container (no nested duplicates). */
function textParts(container, exclude) {
  return Array.from(container.querySelectorAll(`${HEADINGS}, p, ul, ol`))
    .filter((n) => !(exclude && exclude.contains(n)) && !n.parentElement.closest(`${HEADINGS}, p, ul, ol`));
}

function convert(document, n, headingTag) {
  if (HEADING.test(n.tagName)) return cleanBlock(document, n, headingTag);
  if (n.tagName === 'UL' || n.tagName === 'OL') {
    const list = document.createElement(n.tagName.toLowerCase());
    n.querySelectorAll(':scope > li').forEach((li) => {
      const item = cleanBlock(document, li, 'li');
      if (item) list.append(item);
    });
    return list.children.length ? list : null;
  }
  return cleanBlock(document, n, 'p');
}

/** One card -> ['', [hint, <h3>title</h3>, <p>text</p>...]] */
function cardRow(document, card) {
  const text = textParts(card).map((n) => convert(document, n, 'h3')).filter(Boolean);
  return ['', text.length ? [hint(document, 'text'), ...text] : ''];
}

export default function parse(element, { document }) {
  const section = element.querySelector('.Section') || element;
  const grid = section.querySelector('.ServiceCards');

  // Content before / after the card grid, in document order.
  const before = [];
  const after = [];
  textParts(section, grid).forEach((n) => {
    const out = convert(document, n, 'h2');
    if (!out) return;
    // eslint-disable-next-line no-bitwise
    const isAfter = grid && (grid.compareDocumentPosition(n) & 4);
    (isAfter ? after : before).push(out);
  });

  const cards = grid ? Array.from(grid.querySelectorAll('.ServiceCard')) : [];
  const cells = cards.map((c) => cardRow(document, c)).filter((row) => row[1] !== '');

  const blocks = [];
  if (before.length) {
    blocks.push(WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [[before]] }));
  }
  if (cells.length) {
    blocks.push(WebImporter.Blocks.createBlock(document, { name: 'cards', cells }));
  }
  if (after.length) {
    blocks.push(WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [[after]] }));
  }
  if (!blocks.length) {
    blocks.push(WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [['']] }));
  }
  element.replaceWith(...blocks);
}
