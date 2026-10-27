/* eslint-disable */
/* global WebImporter */
/**
 * Parser: columns-media -> existing block "columns" (no class), 1 row x 2 cells.
 * Columns uses its grid rule (rows/columns), so no xwalk field hints.
 *
 * Shapes:
 *   (a) .sublayout-two-column-dynamic: each column (.column-1 / .column-2) -> one cell:
 *       image (absolute src; alt from source, else the column heading), heading as H3, paragraph(s).
 *   (b) .adjustable-two-column-display: cell 1 = text (heading as H3 + paragraphs split at <br><br>,
 *       links kept), cell 2 = image (alt from source).
 * Both shapes appear on when-efficiency-meets-clinical-excellence only.
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

/** Split a clean <p> at double <br> into several <p>. */
function splitAtDoubleBr(document, p) {
  const groups = [[]];
  const nodes = Array.from(p.childNodes);
  for (let i = 0; i < nodes.length; i += 1) {
    const n = nodes[i];
    if (n.nodeType === 1 && n.tagName === 'BR') {
      let j = i + 1;
      while (j < nodes.length && nodes[j].nodeType === 3 && norm(nodes[j].nodeValue) === '') j += 1;
      if (j < nodes.length && nodes[j].nodeType === 1 && nodes[j].tagName === 'BR') {
        groups.push([]);
        i = j;
        continue;
      }
    }
    groups[groups.length - 1].push(n);
  }
  return groups.map((g) => {
    const np = document.createElement('p');
    g.forEach((n) => np.append(n));
    return trimBlock(np);
  }).filter(hasContent);
}

function retag(document, el, tag) {
  const n = document.createElement(tag);
  while (el.firstChild) n.append(el.firstChild);
  return n;
}

/** Build a column cell: images first-class, headings as H3, paragraphs split at <br><br>. */
function columnCell(document, root, { imageOnly = false } = {}) {
  const blocks = toBlocks(document, root);
  const heading = blocks.find((b) => /^H[1-6]$/.test(b.tagName));
  const headingText = heading ? norm(heading.textContent) : '';
  const out = [];
  blocks.forEach((b) => {
    if (/^H[1-6]$/.test(b.tagName)) {
      if (!imageOnly) out.push(retag(document, b, 'h3'));
      return;
    }
    const imgs = Array.from(b.querySelectorAll('img'));
    const textLeft = norm(b.textContent);
    if (b.tagName === 'P' && imgs.length && textLeft === '') {
      imgs.forEach((img) => {
        if (!img.getAttribute('alt')) img.setAttribute('alt', headingText);
        out.push(img);
      });
      return;
    }
    if (imageOnly) return;
    if (b.tagName === 'P') out.push(...splitAtDoubleBr(document, b));
    else out.push(b);
  });
  return out;
}

export default function parse(element, { document }) {
  const cells = [];

  if (element.classList.contains('adjustable-two-column-display')) {
    // (b) text | image
    const textRoot = element.querySelector('.adjustable-two-column-display-content') || element;
    const imgRoot = element.querySelector('.adjustable-two-column-display-image');
    const textCell = columnCell(document, textRoot);
    let imageCell = [];
    if (imgRoot) {
      const heading = textCell.find((b) => /^H[1-6]$/.test(b.tagName));
      imageCell = Array.from(imgRoot.querySelectorAll('img'))
        .filter((i) => (i.getAttribute('src') || i.getAttribute('data-src') || '').trim())
        .map((i) => makeImg(document, i.getAttribute('src') || i.getAttribute('data-src'),
          i.getAttribute('alt') || (heading ? heading.textContent : '')));
    }
    cells.push([textCell.length ? textCell : '', imageCell.length ? imageCell : '']);
  } else {
    // (a) two dynamic columns
    let cols = Array.from(element.querySelectorAll('[class*="column-"]'))
      .filter((c) => /(^|\s)column-\d+(\s|$)/.test(c.className));
    if (!cols.length) {
      const content = element.querySelector('.sublayout-content') || element;
      cols = Array.from(content.children);
    }
    const row = cols.map((c) => {
      const cell = columnCell(document, c);
      return cell.length ? cell : '';
    });
    while (row.length < 2) row.push('');
    cells.push(row);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
