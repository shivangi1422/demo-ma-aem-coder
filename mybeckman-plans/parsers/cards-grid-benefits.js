/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-grid-benefits -> existing block "cards-grid" with class "insights".
 * Source (mybeckman.in /service/plans): #main .bc-rich-text:has(.Intro)
 *   .Intro > .Intro__title (h2 + p) + .Intro__body > .Intro__body-item (x2) > div (x3 each)
 *   benefit div = div > p > (span.fa check-circle icon) + strong title, then p description
 *
 * Library convention (Cards): one card per row, cells = image | text; an empty image
 * cell is still included.
 * Project model cards-grid (blocks/cards-grid/_cards-grid.json) adds a container field:
 *   container: text (Heading / Intro), classes (-> variant "insights")
 *   item cards-grid-item: image (+imageAlt collapsed), text
 *   Row 0: field:text -> H2 "Why choose..." + intro paragraph(s). cards-grid.js (insights)
 *          treats the picture-less first row as the intro panel, so it stays first.
 *   Rows 1..6 (document order): [ '' (no image) | field:text ->
 *          <p><strong>Benefit title</strong></p><p>description</p> ]
 * Check-circle icons are dropped.
 */

const HEADINGS = 'h1, h2, h3, h4, h5, h6';

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

/** Clean inline copy: text, a[href], strong/b, em/i, sup/sub, br only (icons dropped). */
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

function strongP(document, text) {
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = norm(text);
  p.append(strong);
  return p;
}

/** One benefit -> [ '', [hint, <p><strong>title</strong></p>, <p>description</p>...] ] */
function parseBenefit(document, item) {
  const paras = Array.from(item.querySelectorAll('p')).filter((p) => norm(p.textContent));
  const text = [];
  // Title: the first paragraph carrying a bold run (the check-circle line).
  const titleP = paras.find((p) => p.querySelector('strong, b')) || null;
  const titleSrc = titleP ? (titleP.querySelector('strong, b') || titleP) : item.querySelector(HEADINGS);
  if (titleSrc && norm(titleSrc.textContent)) text.push(strongP(document, titleSrc.textContent));
  paras.filter((p) => p !== titleP).forEach((p) => {
    const out = cleanBlock(document, p, 'p');
    if (out) text.push(out);
  });
  return ['', text.length ? [hint(document, 'text'), ...text] : ''];
}

export default function parse(element, { document }) {
  const intro = element.querySelector('.Intro') || element;
  const title = intro.querySelector('.Intro__title');
  const body = intro.querySelector('.Intro__body');

  // Row 0: heading + intro paragraph(s)
  const head = [];
  const headSrc = title || intro;
  Array.from(headSrc.querySelectorAll(`${HEADINGS}, p`))
    .filter((el) => !(body && body.contains(el)) && !el.parentElement.closest(`${HEADINGS}, p`))
    .forEach((el) => {
      const out = cleanBlock(document, el, /^H[1-6]$/.test(el.tagName) ? 'h2' : 'p');
      if (out) head.push(out);
    });

  const cells = [];
  cells.push([head.length ? [hint(document, 'text'), ...head] : '']);

  // Rows 1..N: one per benefit (direct children of each .Intro__body-item, document order)
  const items = body
    ? Array.from(body.querySelectorAll(':scope > .Intro__body-item > div')).filter((d) => norm(d.textContent))
    : [];
  items.forEach((item) => cells.push(parseBenefit(document, item)));

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid', variants: ['insights'], cells });
  element.replaceWith(block);
}
