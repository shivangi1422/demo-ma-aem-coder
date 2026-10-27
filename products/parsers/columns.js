/* eslint-disable */
/* global WebImporter */
/**
 * Parser: columns -> existing block "columns" (no class), 1 row x 1 cell.
 * Handles two source shapes on the products template:
 *   (a) div.intro-content  - "Workflows Designed ..." intro: heading in a styled div
 *       (source H1, demoted to H2) + bare-text div -> paragraph
 *   (b) div.disclaimer-text - citation + Scopio disclaimer paragraphs; empty
 *       &nbsp; spacer paragraphs are skipped
 * Columns cells carry no XWalk field hints (default-content children).
 */

const HEADINGS = 'h1, h2, h3, h4, h5, h6';
const INLINE_TAGS = {
  STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', SUP: 'sup', SUB: 'sub', U: 'u', BR: 'br', A: 'a',
};
const SKIP_TAGS = new Set(['STYLE', 'SCRIPT', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'SVG', 'IFRAME', 'BUTTON']);
const BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL']);

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
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

function listCopy(document, list) {
  const out = document.createElement(list.tagName.toLowerCase() === 'ol' ? 'ol' : 'ul');
  list.querySelectorAll(':scope > li').forEach((li) => {
    const item = textBlock(document, 'li', li);
    if (item) out.append(item);
  });
  return out.children.length ? out : null;
}

/**
 * Flatten a container into clean block elements: semantic blocks are copied,
 * wrapper divs are descended into, bare text runs become paragraphs.
 */
function toBlocks(document, container, out = []) {
  let inline = null;
  const flush = () => {
    if (inline) {
      trimEdges(inline);
      if (norm(inline.textContent)) out.push(inline);
    }
    inline = null;
  };
  container.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      if (!norm(child.nodeValue) && !inline) return;
      inline = inline || document.createElement('p');
      inline.append(document.createTextNode(child.nodeValue.replace(/ /g, ' ').replace(/\s+/g, ' ')));
      return;
    }
    if (child.nodeType !== 1 || SKIP_TAGS.has(child.tagName.toUpperCase())) return;
    const tag = child.tagName.toUpperCase();
    if (BLOCK_TAGS.has(tag)) {
      flush();
      const b = (tag === 'UL' || tag === 'OL') ? listCopy(document, child) : textBlock(document, tag.toLowerCase(), child);
      if (b) out.push(b);
      return;
    }
    if (INLINE_TAGS[tag] && !child.querySelector(`div, p, ul, ol, ${HEADINGS}`)) {
      inline = inline || document.createElement('p');
      inlineCopy(document, { childNodes: [child] }, inline);
      return;
    }
    flush();
    toBlocks(document, child, out);
  });
  flush();
  return out;
}

/** Demote headings so the shallowest becomes H2, keeping relative depth. */
function relevel(document, blocks) {
  const levels = blocks.filter((b) => /^H[1-6]$/.test(b.tagName)).map((b) => Number(b.tagName[1]));
  if (!levels.length) return blocks;
  const shift = Math.min(...levels) - 2;
  if (shift >= 0) return blocks;
  return blocks.map((b) => {
    if (!/^H[1-6]$/.test(b.tagName)) return b;
    const h = document.createElement(`h${Math.min(6, Number(b.tagName[1]) - shift)}`);
    while (b.firstChild) h.append(b.firstChild);
    return h;
  });
}

export default function parse(element, { document }) {
  const containers = [...element.querySelectorAll('.content-container')]
    .filter((c, i, all) => !all.some((o) => o !== c && o.contains(c)));
  let content = [];
  (containers.length ? containers : [element]).forEach((c) => toBlocks(document, c, content));
  content = relevel(document, content);

  if (!content.length) {
    element.remove();
    return;
  }

  const cells = [[content]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
