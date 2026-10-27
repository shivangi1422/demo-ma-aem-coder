/* eslint-disable */
/* global WebImporter */
/**
 * Parser: columns-tips (mybeckman.in /support/technical-documents)
 * Source: #main .bc-test-layout:has(.col-sm-6.col-xs-12) > .block > .container > .row
 *   > .row (x2) > .col-sm-6.col-xs-12 (x2 per row, tip panel)
 *       > .col-sm-3 > a[href=""] > img (decorative icon)  -> dropped
 *       > .col-sm-9 > a[href=""] > h4 (title)              -> H3, link dropped (text kept)
 *                   > ol > li (numbered steps)             -> <ol>, as in the source
 *
 * Emits columns: 2 rows x 2 cells, one cell per tip panel in source order.
 */

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

/** Clean inline copy: text, a[href] (non-empty href only), strong/b, em/i, sup/sub, br. */
function cleanInline(document, node) {
  if (node.nodeType === 3) return document.createTextNode(node.nodeValue.replace(/ /g, ' '));
  if (node.nodeType !== 1) return null;
  if (['STYLE', 'SCRIPT', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'IFRAME', 'IMG', 'PICTURE'].includes(node.tagName.toUpperCase())) return null;
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
    if (!href || href === '#') return frag;
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
  return norm(el.textContent) ? el : null;
}

function buildCell(document, panel) {
  const cell = document.createElement('div');
  const body = panel.querySelector('.col-sm-9') || panel;
  let titled = false;
  body.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ol, ul').forEach((node) => {
    if (node.parentElement && node.parentElement.closest('h1, h2, h3, h4, h5, h6, p, ol, ul')) return;
    const tag = node.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      const out = cleanBlock(document, node, titled ? 'h4' : 'h3');
      if (out) { cell.append(out); titled = true; }
      return;
    }
    if (tag === 'ol' || tag === 'ul') {
      const list = document.createElement(tag);
      node.querySelectorAll(':scope > li').forEach((li) => {
        const out = cleanBlock(document, li, 'li');
        if (out) list.append(out);
      });
      if (list.children.length) cell.append(list);
      return;
    }
    const out = cleanBlock(document, node, 'p');
    if (out) cell.append(out);
  });
  return cell;
}

export default function parse(element, { document }) {
  const panels = [...element.querySelectorAll('.col-sm-6.col-xs-12')]
    .filter((p) => !p.parentElement.closest('.col-sm-6.col-xs-12'));

  // Group panels by their parent .row (source rows of 2); fall back to pairs.
  const groups = [];
  panels.forEach((p) => {
    const last = groups[groups.length - 1];
    if (last && last.parent === p.parentElement && last.items.length < 2) last.items.push(p);
    else groups.push({ parent: p.parentElement, items: [p] });
  });
  const width = Math.max(1, ...groups.map((g) => g.items.length));

  const cells = groups.map((g) => {
    const row = g.items.map((p) => buildCell(document, p));
    while (row.length < width) row.push('');
    return row;
  });

  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'columns', cells }));
}
