/* eslint-disable */
/* global WebImporter */
/**
 * Parser: hero-intro (mybeckman.in /support/technical-documents)
 * Source: #main .generic-content-heading (#content-holder)
 *   > h1 + div.bcls-aeo-published (empty) + h2 + hr + p + ul (6 document types)
 *
 * Emits, replacing the element:
 *   1. hero (variant "plain"), model hero (blocks/hero/_hero.json):
 *        row 1: image cell -> EMPTY (plain hero has no image; hero.js drops it)
 *        row 2: field:text -> H1 title + H2 subheading
 *   2. <hr data-excat-section-break> - protected section break; the cleanup
 *      transformer never removes it and the sections transformer strips the
 *      attribute in afterTransform, so html2md turns it into a real section break.
 *   3. columns 1x1 -> the intro paragraph(s) + the list(s) (everything after the
 *      first H1/H2 pair, in source order).
 */

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

/** Clean inline copy: text, a[href], strong/b, em/i, sup/sub, br only. */
function cleanInline(document, node) {
  if (node.nodeType === 3) return document.createTextNode(node.nodeValue.replace(/ /g, ' '));
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
  if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.nodeValue = el.firstChild.nodeValue.replace(/^\s+/, '');
  if (el.lastChild && el.lastChild.nodeType === 3) el.lastChild.nodeValue = el.lastChild.nodeValue.replace(/\s+$/, '');
  return norm(el.textContent) ? el : null;
}

function cleanList(document, src) {
  const list = document.createElement(src.tagName.toLowerCase());
  src.querySelectorAll(':scope > li').forEach((li) => {
    const out = cleanBlock(document, li, 'li');
    if (out) list.append(out);
  });
  return list.children.length ? list : null;
}

export default function parse(element, { document }) {
  const headings = [];
  const intro = [];

  [...element.children].forEach((node) => {
    const tag = node.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      if (!norm(node.textContent)) return;
      // First heading = H1 title, second heading = H2 subheading (both in the hero).
      if (headings.length < 2 && !intro.length) {
        const out = cleanBlock(document, node, headings.length === 0 ? 'h1' : 'h2');
        if (out) headings.push(out);
        return;
      }
      const out = cleanBlock(document, node, tag);
      if (out) intro.push(out);
      return;
    }
    if (tag === 'p') {
      const out = cleanBlock(document, node, 'p');
      if (out) intro.push(out);
      return;
    }
    if (tag === 'ul' || tag === 'ol') {
      const out = cleanList(document, node);
      if (out) intro.push(out);
    }
    // div.bcls-aeo-published (empty), hr and anything else: dropped.
  });

  const hero = WebImporter.Blocks.createBlock(document, {
    name: 'hero',
    variants: ['plain'],
    cells: [
      [''],
      [headings.length ? [hint(document, 'text'), ...headings] : ''],
    ],
  });

  const out = [hero];
  if (intro.length) {
    const brk = document.createElement('hr');
    brk.setAttribute('data-excat-section-break', '');
    const cell = document.createElement('div');
    intro.forEach((n) => cell.append(n));
    out.push(brk, WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [[cell]] }));
  }
  element.replaceWith(...out);
}
