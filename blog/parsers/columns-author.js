/* eslint-disable */
/* global WebImporter */
/**
 * Parser: columns-author -> existing block "columns" (no class), 1 row x 2 cells.
 * Source: .contributor-detail.summary.
 *   Cell 1: headshot (absolute src; alt = person name when empty). Placeholder images kept as on the site.
 *   Cell 2: <p><strong>Name</strong></p>, bio paragraph(s), "See all by <Name>" link with its real href.
 * Columns uses its grid rule (rows/columns), so no xwalk field hints.
 * Hrefs are read from the DOM at import time (live values).
 */

const HEADINGS = 'h1, h2, h3, h4, h5, h6';
const SITE = 'https://www.beckmancoulter.com/';

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function isEmptyHeadingText(t) {
  return t === '' || /^empty heading$/i.test(t);
}

function absUrl(src) {
  const s = (src || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  try {
    return new URL(s, SITE).href;
  } catch (e) {
    return s;
  }
}

function makeImg(document, src, alt) {
  const img = document.createElement('img');
  img.setAttribute('src', absUrl(src));
  img.setAttribute('alt', norm(alt));
  return img;
}

const SKIP_TAGS = new Set(['STYLE', 'SCRIPT', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'SVG', 'svg', 'BUTTON', 'IFRAME', 'INPUT', 'SELECT', 'FORM']);
const KEEP_TAGS = {
  A: 'a', STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', SUP: 'sup', SUB: 'sub', U: 'u', BR: 'br', CODE: 'code',
  P: 'p', H1: 'h1', H2: 'h2', H3: 'h3', H4: 'h4', H5: 'h5', H6: 'h6', UL: 'ul', OL: 'ol', LI: 'li',
  BLOCKQUOTE: 'blockquote', TABLE: 'table', THEAD: 'thead', TBODY: 'tbody', TR: 'tr', TD: 'td', TH: 'th',
};
const BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'BLOCKQUOTE', 'TABLE', 'PRE']);
const CONTAINER_TAGS = new Set(['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'ASIDE', 'HEADER', 'FOOTER', 'FIGURE']);

/** Clean copy of a node: only semantic tags, href/src/alt attributes; empty/whitespace links unwrapped. */
function cleanNode(document, node) {
  if (node.nodeType === 3) return document.createTextNode(node.nodeValue);
  if (node.nodeType !== 1) return null;
  if (SKIP_TAGS.has(node.tagName)) return null;
  if (node.classList && (node.classList.contains('lnr') || node.classList.contains('share-container'))) return null;
  if (node.tagName === 'IMG') {
    const src = node.getAttribute('src') || node.getAttribute('data-src');
    return src ? makeImg(document, src, node.getAttribute('alt')) : null;
  }
  const frag = document.createDocumentFragment();
  node.childNodes.forEach((c) => {
    const cc = cleanNode(document, c);
    if (cc) frag.append(cc);
  });
  const tag = KEEP_TAGS[node.tagName];
  if (!tag) return frag;
  if (tag === 'a') {
    const href = (node.getAttribute('href') || '').trim();
    if (!href || norm(node.textContent) === '') return frag;
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.append(frag);
    return a;
  }
  const el = document.createElement(tag);
  el.append(frag);
  if (/^h[1-6]$/.test(tag)) {
    // md2jcr drops <br> inside headings (words would run together): use a space instead
    el.querySelectorAll('br').forEach((br) => br.replaceWith(document.createTextNode(' ')));
  }
  if (tag === 'strong' || tag === 'em') {
    // move a trailing <br> outside the emphasis so markdown stays valid
    let last = el.lastChild;
    while (last && last.nodeType === 3 && norm(last.nodeValue) === '') last = last.previousSibling;
    if (last && last.nodeType === 1 && last.tagName === 'BR') {
      const out = document.createDocumentFragment();
      out.append(el, last);
      return out;
    }
  }
  return el;
}

function hasContent(el) {
  return norm(el.textContent) !== '' || !!el.querySelector('img');
}

/** Trim leading/trailing whitespace text and <br> of a block element (and its list items). */
function trimBlock(el) {
  const isWs = (n) => (n.nodeType === 3 && norm(n.nodeValue) === '') || (n.nodeType === 1 && n.tagName === 'BR');
  while (el.firstChild && isWs(el.firstChild)) el.firstChild.remove();
  while (el.lastChild && isWs(el.lastChild)) el.lastChild.remove();
  if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.nodeValue = el.firstChild.nodeValue.replace(/^\s+/, '');
  if (el.lastChild && el.lastChild.nodeType === 3) el.lastChild.nodeValue = el.lastChild.nodeValue.replace(/\s+$/, '');
  if (el.tagName === 'UL' || el.tagName === 'OL') {
    el.querySelectorAll('li').forEach((li) => {
      trimBlock(li);
      if (!hasContent(li)) li.remove();
    });
  }
  return el;
}

/**
 * Flatten a container into a list of clean block elements. Wrapper divs are descended into,
 * bare text / inline runs are wrapped in <p>, empty paragraphs and empty headings are dropped.
 */
function toBlocks(document, container, out = []) {
  let pending = null;
  const flush = () => {
    if (pending) {
      trimBlock(pending);
      if (hasContent(pending)) out.push(pending);
      pending = null;
    }
  };
  const addInline = (n) => {
    if (!n) return;
    if (!pending) pending = document.createElement('p');
    pending.append(n);
  };
  container.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      if (norm(child.nodeValue) !== '' || pending) addInline(document.createTextNode(child.nodeValue));
      return;
    }
    if (child.nodeType !== 1 || SKIP_TAGS.has(child.tagName)) return;
    if (child.classList && (child.classList.contains('share-container') || child.classList.contains('lnr'))) return;
    const tag = child.tagName;
    if (/^H[1-6]$/.test(tag)) {
      flush();
      if (isEmptyHeadingText(norm(child.textContent)) && !child.querySelector('img')) return;
      const h = cleanNode(document, child);
      if (h && h.nodeType === 1) {
        trimBlock(h);
        out.push(h);
      }
      return;
    }
    if (BLOCK_TAGS.has(tag)) {
      flush();
      if (tag === 'P' && child.querySelector('div, p, ' + HEADINGS + ', ul, ol')) {
        // invalid nesting from the source: treat as a container
        toBlocks(document, child, out);
        return;
      }
      const b = cleanNode(document, child);
      if (b && b.nodeType === 1) {
        trimBlock(b);
        if (hasContent(b)) out.push(b);
      }
      return;
    }
    if (CONTAINER_TAGS.has(tag) || child.querySelector('div, p, ul, ol, ' + HEADINGS)) {
      flush();
      toBlocks(document, child, out);
      return;
    }
    addInline(cleanNode(document, child));
  });
  flush();
  return out;
}

/** Re-level headings so the shallowest becomes `top`, keeping relative depth. */
function relevel(document, blocks, top = 2) {
  const levels = blocks.filter((b) => /^H[1-6]$/.test(b.tagName)).map((b) => Number(b.tagName[1]));
  if (!levels.length) return blocks;
  const shift = Math.min(...levels) - top;
  if (shift === 0) return blocks;
  return blocks.map((b) => {
    if (!/^H[1-6]$/.test(b.tagName)) return b;
    const lvl = Math.max(1, Math.min(6, Number(b.tagName[1]) - shift));
    const h = document.createElement(`h${lvl}`);
    while (b.firstChild) h.append(b.firstChild);
    return h;
  });
}

function topLevel(list) {
  return list.filter((el) => !list.some((o) => o !== el && o.contains(el)));
}

export default function parse(element, { document }) {
  const nameEl = element.querySelector('.contributor-name');
  const name = nameEl ? norm(nameEl.textContent) : '';

  // Cell 1: headshot
  const imgSrcEl = Array.from(element.querySelectorAll('.headshot img, .column-left img, img'))
    .find((i) => (i.getAttribute('src') || i.getAttribute('data-src') || '').trim());
  const imageCell = imgSrcEl
    ? [makeImg(document, imgSrcEl.getAttribute('src') || imgSrcEl.getAttribute('data-src'), imgSrcEl.getAttribute('alt') || name)]
    : '';

  // Cell 2: name, bio, link
  const text = [];
  if (name) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = name;
    p.append(strong);
    text.push(p);
  }
  const bio = element.querySelector('.contributor-bio');
  if (bio) toBlocks(document, bio).forEach((b) => text.push(b));

  const linkWrap = element.querySelector('.contributor-link');
  const links = linkWrap ? Array.from(linkWrap.querySelectorAll('a')) : [];
  links.forEach((a) => {
    const label = norm(a.textContent);
    if (!label) return;
    const p = document.createElement('p');
    const href = (a.getAttribute('href') || '').trim();
    if (href) {
      const link = document.createElement('a');
      link.setAttribute('href', href);
      link.textContent = label;
      p.append(link);
    } else {
      p.textContent = label;
    }
    text.push(p);
  });

  const cells = [[imageCell, text.length ? text : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
