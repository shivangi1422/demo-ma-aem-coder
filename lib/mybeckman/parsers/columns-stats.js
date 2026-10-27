/* eslint-disable */
/* global WebImporter */
/**
 * Parser: columns-stats -> existing block "columns" (no variant).
 * Source (mybeckman.in /service): #main .bc-rich-text:has(.Section__intro)
 *   .Section__intro > div  (x4) = <p><strong>value</strong></p><p>label</p>
 *
 * Library convention: row 2 has one cell per column; extra rows keep the same column count.
 * Model columns (blocks/columns/_columns.json): columns/rows numbers only; cells are
 * default content (text) children, so no XWalk field hints are emitted.
 *   1 row x N cells (N = number of stat items, 4 on the source):
 *   each cell = bold value paragraph + label paragraph (NOT headings).
 * The source section has no intro heading/text, so no extra block is emitted.
 */

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

/** Clean inline copy: text, a[href], strong/b, em/i, br only. */
function cleanInline(document, node) {
  if (node.nodeType === 3) return document.createTextNode(node.nodeValue);
  if (node.nodeType !== 1) return null;
  const frag = document.createDocumentFragment();
  node.childNodes.forEach((c) => {
    const cc = cleanInline(document, c);
    if (cc) frag.append(cc);
  });
  const tag = { A: 'a', STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', BR: 'br' }[node.tagName];
  if (!tag) return frag;
  if (tag === 'br') return document.createElement('br');
  const el = document.createElement(tag);
  if (tag === 'a') {
    const href = (node.getAttribute('href') || '').trim();
    if (!href || !norm(node.textContent)) return frag;
    el.setAttribute('href', href);
  }
  el.append(frag);
  return el;
}

function cleanPara(document, src) {
  const p = document.createElement('p');
  src.childNodes.forEach((c) => {
    const cc = cleanInline(document, c);
    if (cc) p.append(cc);
  });
  if (p.firstChild && p.firstChild.nodeType === 3) p.firstChild.nodeValue = p.firstChild.nodeValue.replace(/^\s+/, '');
  if (p.lastChild && p.lastChild.nodeType === 3) p.lastChild.nodeValue = p.lastChild.nodeValue.replace(/\s+$/, '');
  return p;
}

function boldPara(document, text) {
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = text;
  p.append(strong);
  return p;
}

/** One stat item -> [value <p><strong>, label <p>, ...] */
function statCell(document, item) {
  const out = [];
  const parts = Array.from(item.querySelectorAll('p, h1, h2, h3, h4, h5, h6'))
    .filter((e) => norm(e.textContent) && !e.parentElement.closest('p, h1, h2, h3, h4, h5, h6'));
  parts.forEach((e, i) => {
    // first part is the value: always a bold paragraph (a heading-styled value is demoted)
    if (i === 0) out.push(boldPara(document, norm(e.textContent)));
    else out.push(cleanPara(document, e));
  });
  return out.length ? out : '';
}

export default function parse(element, { document }) {
  const intro = element.querySelector('.Section__intro') || element;
  const items = Array.from(intro.children).filter((c) => norm(c.textContent));

  const row = items.map((item) => statCell(document, item));
  const cells = [row.length ? row : ['']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
