/* eslint-disable */
/* global WebImporter */
/**
 * Parser: hero-plain -> existing block "hero" with class "plain".
 * Source: #main-container > div.sublayout...:nth-of-type(2) > div.intro-content
 *
 * Model hero: image (+imageAlt collapsed), text (classes -> variant)
 *   Row 1: image -> empty (plain hero has no image)
 *   Row 2: field:text -> H1 + H2 + paragraph(s) (keeps <sup>) + bold-lead list
 */

const INLINE_TAGS = {
  STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', SUP: 'sup', SUB: 'sub', U: 'u', BR: 'br', A: 'a',
};
const SKIP_TAGS = new Set(['STYLE', 'SCRIPT', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'SVG', 'IFRAME', 'BUTTON']);

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

/** Copy only inline semantic content (text, strong/em/sup/sub/a/br) of a node. */
function inlineCopy(document, node, target) {
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      target.append(document.createTextNode(child.nodeValue.replace(/ /g, ' ').replace(/\s+/g, ' ')));
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

function listCopy(document, list) {
  const out = document.createElement(list.tagName.toLowerCase() === 'ol' ? 'ol' : 'ul');
  list.querySelectorAll(':scope > li').forEach((li) => {
    const item = textBlock(document, 'li', li);
    if (item) out.append(item);
  });
  return out.children.length ? out : null;
}

export default function parse(element, { document }) {
  const root = element.querySelector('.content-container') || element;
  const text = [];

  root.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol').forEach((node) => {
    // top-level content only (skip list items' inner paragraphs, nested lists)
    if (node.parentElement && node.parentElement.closest('p, ul, ol, h1, h2, h3, h4, h5, h6')) return;
    const tag = node.tagName.toLowerCase();
    const out = (tag === 'ul' || tag === 'ol') ? listCopy(document, node) : textBlock(document, tag, node);
    if (out) text.push(out);
  });

  const cells = [
    [''],
    [text.length ? [hint(document, 'text'), ...text] : ''],
  ];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', variants: ['plain'], cells });
  element.replaceWith(block);
}
