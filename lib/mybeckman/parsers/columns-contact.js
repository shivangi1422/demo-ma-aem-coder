/* eslint-disable */
/* global WebImporter */
/**
 * Parser: columns-contact -> TWO existing "columns" blocks (no variant), same section.
 * Source (mybeckman.in /service): #main .bc-rich-text:has(> #getInTouch)
 *   .Contact > h2 + p + .Contact__body > div (x3) = <a class="btn" href/> + <p>caption</p>
 *
 * Library convention: row 2 has one cell per column; extra rows keep the same column count;
 * blocks are never nested (two sibling blocks instead).
 * Model columns (blocks/columns/_columns.json): columns/rows numbers only; cells are
 * default content (text) children, so no XWalk field hints are emitted.
 *   Block A: columns 1x1 -> H2 "Get in Touch" + intro paragraph(s)
 *   Block B: columns 1xN -> one cell per .Contact__body > div (3 on the source):
 *            <p><strong><a href>label</a></strong></p> + caption paragraph
 * Both blocks replace the element in place. Hrefs (tel:, mailto:, relative) are kept as on
 * the source; the shared link step rewrites/normalises them later.
 */

const HEADINGS = 'h1, h2, h3, h4, h5, h6';

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

function cleanBlock(document, src, tag) {
  const el = document.createElement(tag);
  src.childNodes.forEach((c) => {
    const cc = cleanInline(document, c);
    if (cc) el.append(cc);
  });
  if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.nodeValue = el.firstChild.nodeValue.replace(/^\s+/, '');
  if (el.lastChild && el.lastChild.nodeType === 3) el.lastChild.nodeValue = el.lastChild.nodeValue.replace(/\s+$/, '');
  return el;
}

function buttonPara(document, label, href) {
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  const a = document.createElement('a');
  a.setAttribute('href', href);
  a.textContent = label;
  strong.append(a);
  p.append(strong);
  return p;
}

/** One contact option -> [button paragraph, caption paragraph(s)] in document order. */
function optionCell(document, item) {
  const out = [];
  Array.from(item.querySelectorAll('a[href], p')).forEach((el) => {
    if (el.tagName === 'A') {
      if (el.closest('p') || !norm(el.textContent)) return;
      out.push(buttonPara(document, norm(el.textContent), el.getAttribute('href').trim()));
      return;
    }
    if (norm(el.textContent)) out.push(cleanBlock(document, el, 'p'));
  });
  return out.length ? out : '';
}

export default function parse(element, { document }) {
  const contact = element.querySelector('.Contact') || element;
  const body = contact.querySelector('.Contact__body');

  // Block A: heading + intro (everything in .Contact before .Contact__body)
  const intro = [];
  Array.from(contact.querySelectorAll(`${HEADINGS}, p`))
    .filter((el) => !(body && body.contains(el)) && norm(el.textContent) && !el.parentElement.closest(`${HEADINGS}, p`))
    .forEach((el) => {
      if (/^H[1-6]$/.test(el.tagName)) intro.push(cleanBlock(document, el, 'h2'));
      else intro.push(cleanBlock(document, el, 'p'));
    });

  // Block B: one cell per contact option
  const items = body ? Array.from(body.children).filter((c) => norm(c.textContent)) : [];
  const options = items.map((item) => optionCell(document, item));

  const blocks = [];
  if (intro.length) {
    blocks.push(WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [[intro]] }));
  }
  if (options.length) {
    blocks.push(WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [options] }));
  }
  if (!blocks.length) {
    blocks.push(WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [['']] }));
  }
  element.replaceWith(...blocks);
}
