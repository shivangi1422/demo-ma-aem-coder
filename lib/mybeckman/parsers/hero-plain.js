/* eslint-disable */
/* global WebImporter */
/**
 * Parser: hero-plain -> existing block "hero" with class "plain".
 * Source (mybeckman.in /service/plans): #main .bc-rich-text:has(> .Section__header)
 *   .Section__header > h1 + h2 + .callout > p + a.btn (tel:)
 *
 * Library convention: 1 column; row 1 = background image (optional), row 2 = title,
 * subheading, call-to-action. Never more than these 2 content rows.
 * Model hero (blocks/hero/_hero.json): image, imageAlt (collapsed), text, classes (-> variant).
 *   Row 1: image -> EMPTY (plain hero has no image; hero.js drops the empty row)
 *   Row 2: field:text -> H1, H2 subheading (kept as H2), callout paragraph(s),
 *          CTA as <p><strong><a href>label</a></strong></p>
 * Hrefs are kept as on the source; the shared link step rewrites them later.
 */

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

export default function parse(element, { document }) {
  const root = element.querySelector('.Section__header') || element;
  const text = [];

  // Document order: headings, paragraphs, stand-alone buttons.
  root.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a[href]').forEach((node) => {
    const tag = node.tagName.toLowerCase();
    if (tag === 'a') {
      if (node.closest('p, h1, h2, h3, h4, h5, h6') || !norm(node.textContent)) return;
      text.push(buttonPara(document, norm(node.textContent), node.getAttribute('href').trim()));
      return;
    }
    if (node.parentElement && node.parentElement.closest('p, h1, h2, h3, h4, h5, h6')) return;
    if (tag === 'p') {
      const links = node.querySelectorAll('a[href]');
      if (links.length === 1 && norm(links[0].textContent) === norm(node.textContent)) {
        text.push(buttonPara(document, norm(links[0].textContent), links[0].getAttribute('href').trim()));
        return;
      }
    }
    // The first heading is the page title (H1); later headings keep their level.
    const outTag = /^h[1-6]$/.test(tag) && !text.some((t) => /^H[1-6]$/.test(t.tagName)) ? 'h1' : tag;
    const out = cleanBlock(document, node, outTag);
    if (out) text.push(out);
  });

  const cells = [
    [''],
    [text.length ? [hint(document, 'text'), ...text] : ''],
  ];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', variants: ['plain'], cells });
  element.replaceWith(block);
}
