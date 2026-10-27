/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-grid-solutions -> existing block "cards-grid" with class "solutions".
 * Source: div.quad-showcase-feature ("Advanced Hematology Parameters").
 *
 * Model cards-grid (container): text (classes -> variant)
 *   Row 0: field:text -> H2 section heading (.intro-content h2, sub-header span ignored)
 * Model cards-grid-item: image (+imageAlt collapsed), text
 *   Rows 1..N (one per non-empty .showcase-feature, document order):
 *     image -> empty (the parallax background is decorative and dropped)
 *     field:text -> H3 title (source H2) + paragraph(s) + "Learn more" link
 */

const HEADINGS = 'h1, h2, h3, h4, h5, h6';
const INLINE_TAGS = {
  STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', SUP: 'sup', SUB: 'sub', U: 'u', BR: 'br', A: 'a',
};
const SKIP_TAGS = new Set(['STYLE', 'SCRIPT', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'SVG', 'IFRAME', 'BUTTON']);

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanText(node) {
  if (!node) return '';
  const clone = node.cloneNode(true);
  clone.querySelectorAll('style, script, noscript, template, .sub-header').forEach((n) => n.remove());
  return norm(clone.textContent);
}

function inlineCopy(document, node, target) {
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      target.append(document.createTextNode(child.nodeValue.replace(/ /g, ' ').replace(/\s+/g, ' ')));
      return;
    }
    if (child.nodeType !== 1 || SKIP_TAGS.has(child.tagName.toUpperCase())) return;
    const tag = INLINE_TAGS[child.tagName.toUpperCase()];
    if (!tag) {
      inlineCopy(document, child, target);
      return;
    }
    if (tag === 'a') {
      const href = (child.getAttribute('href') || '').trim();
      if (!href || norm(child.textContent) === '') {
        inlineCopy(document, child, target);
        return;
      }
      const a = document.createElement('a');
      a.setAttribute('href', href);
      inlineCopy(document, child, a);
      target.append(a);
      return;
    }
    const el = document.createElement(tag);
    if (tag !== 'br') inlineCopy(document, child, el);
    target.append(el);
  });
  return target;
}

function trimEdges(el) {
  while (el.firstChild && el.firstChild.nodeType === 3 && norm(el.firstChild.nodeValue) === '') el.firstChild.remove();
  while (el.lastChild && el.lastChild.nodeType === 3 && norm(el.lastChild.nodeValue) === '') el.lastChild.remove();
  if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.nodeValue = el.firstChild.nodeValue.replace(/^\s+/, '');
  if (el.lastChild && el.lastChild.nodeType === 3) el.lastChild.nodeValue = el.lastChild.nodeValue.replace(/\s+$/, '');
  return el;
}

function textBlock(document, tag, src) {
  const el = trimEdges(inlineCopy(document, src, document.createElement(tag)));
  return norm(el.textContent) ? el : null;
}

function plainEl(document, tag, text) {
  const t = norm(text);
  if (!t) return null;
  const el = document.createElement(tag);
  el.textContent = t;
  return el;
}

export default function parse(element, { document }) {
  const cells = [];

  // Row 0: section heading
  const headingSrc = [...element.querySelectorAll('.intro-content h1, .intro-content h2, .intro-content h3')]
    .find((h) => cleanText(h) !== '')
    || [...element.querySelectorAll(HEADINGS)].find((h) => !h.closest('.showcase-feature') && cleanText(h) !== '');
  const heading = headingSrc ? plainEl(document, 'h2', cleanText(headingSrc)) : null;
  cells.push([heading ? [hint(document, 'text'), heading] : '']);

  // Rows 1..N: one per non-empty feature (empty .feature-content slots are skipped)
  element.querySelectorAll('.showcase-feature').forEach((feature) => {
    const text = [];

    const titleSrc = [...feature.querySelectorAll(HEADINGS)].find((h) => cleanText(h) !== '');
    const h3 = titleSrc ? plainEl(document, 'h3', cleanText(titleSrc)) : null;
    if (h3) text.push(h3);

    feature.querySelectorAll('p').forEach((p) => {
      if (p.closest(HEADINGS)) return;
      const out = textBlock(document, 'p', p);
      if (out) text.push(out);
    });

    const link = [...feature.querySelectorAll('a')].find((a) => norm(a.textContent) !== '' && !a.closest('p'));
    if (link) {
      const label = norm(link.textContent);
      const href = (link.getAttribute('href') || '').trim();
      const p = document.createElement('p');
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = label;
        p.append(a);
      } else {
        p.textContent = label;
      }
      text.push(p);
    }

    if (!text.length) return;
    cells.push(['', [hint(document, 'text'), ...text]]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid', variants: ['solutions'], cells });
  element.replaceWith(block);
}
