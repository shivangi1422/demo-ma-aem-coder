/* eslint-disable */
/* global WebImporter */
/**
 * Parser: columns-two-column -> existing block "columns" (no variant), 1 row x N cells.
 * Source (mybeckman.in /service/plans): #main .bc-rich-text with
 *   .Section > [intro: h2 + p]? + .Section__two-column > .Section__two-column-left
 *                                                   + .Section__two-column-right
 * Three shapes, detected per instance (source column order kept):
 *   (a) intro + left <img> | right <ul>  ("Count on our team of experts")
 *       -> Block 1: columns 1x1 = H2 + intro paragraph(s)
 *          Block 2: columns 1x2 = photo | <ul>
 *   (b) left text (h2, h3, p, a.btn) | right Wistia embed  (BeckmanConnect)
 *       -> columns 1x2 = text cell | video cell: poster <img> +
 *          <p><a href="https://fast.wistia.net/embed/iframe/<id>">Watch the video</a></p>
 *          (<id> read from the wistia_async_<id> class)
 *   (c) left <img> | right h3 + p + a.btn  (Training)
 *       -> columns 1x2 = photo | text cell
 *
 * Library convention: row 2 has one cell per column; every row keeps the same column
 * count; blocks are never nested (sibling blocks instead).
 * Model columns (blocks/columns/_columns.json): columns/rows numbers only; cells are
 * default content, so no XWalk field hints are emitted.
 * Images: original absolute URL, origin + path (query string dropped); alts from the
 * approved mapping. "Learn More" buttons become <p><a href>Learn More</a></p>.
 * Hrefs are kept as on the source; the shared link step rewrites them later.
 */

const SITE = 'https://www.mybeckman.in/';
const BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'IMG', 'A']);
const SKIP_TAGS = new Set(['STYLE', 'SCRIPT', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'IFRAME', 'BUTTON', 'LINK']);

const WISTIA_POSTER = 'https://embed-ssl.wistia.com/deliveries/e36ec1516ebebefe5879fca5307cea4c18fa6cf8.webp';

const IMAGE_ALTS = {
  'https://media.beckman.com/-/media/service/media/service_images_call_center.jpg':
    'Beckman Coulter support specialist working at a multi-monitor service desk',
  'https://media.beckman.com/-/media/service/media/page2_service_training.jpg':
    'Beckman Coulter trainer leading a classroom training session',
  [WISTIA_POSTER]: 'BeckmanConnect remote service introductory video',
};

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanSrc(src) {
  const s = (src || '').trim();
  if (!s || s.startsWith('data:')) return '';
  try {
    const u = new URL(s, SITE);
    return `${u.origin}${u.pathname}`;
  } catch (e) {
    return s.split('?')[0];
  }
}

function makeImg(document, src, fallbackAlt) {
  const img = document.createElement('img');
  img.setAttribute('src', src);
  img.setAttribute('alt', IMAGE_ALTS[src] || norm(fallbackAlt));
  return img;
}

/** Clean inline copy: text, a[href], strong/b, em/i, sup/sub, br only. */
function cleanInline(document, node) {
  if (node.nodeType === 3) return document.createTextNode(node.nodeValue.replace(/ /g, ' '));
  if (node.nodeType !== 1 || SKIP_TAGS.has(node.tagName.toUpperCase())) return null;
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

function listCopy(document, list) {
  const out = document.createElement(list.tagName.toLowerCase() === 'ol' ? 'ol' : 'ul');
  list.querySelectorAll(':scope > li').forEach((li) => {
    const item = cleanBlock(document, li, 'li');
    if (item) out.append(item);
  });
  return out.children.length ? out : null;
}

function linkPara(document, a) {
  const p = document.createElement('p');
  const link = document.createElement('a');
  link.setAttribute('href', a.getAttribute('href').trim());
  link.textContent = norm(a.textContent);
  p.append(link);
  return p;
}

/** Convert one source element into clean block element(s); wrapper divs are descended. */
function convert(document, child, out) {
  const tag = child.tagName.toUpperCase();
  if (SKIP_TAGS.has(tag)) return;
  if (!BLOCK_TAGS.has(tag)) {
    Array.from(child.children).forEach((c) => convert(document, c, out));
    return;
  }
  if (tag === 'IMG') {
    const src = cleanSrc(child.getAttribute('src') || child.getAttribute('data-src'));
    if (src) out.push(makeImg(document, src, child.getAttribute('alt')));
    return;
  }
  if (tag === 'A') {
    if ((child.getAttribute('href') || '').trim() && norm(child.textContent)) out.push(linkPara(document, child));
    return;
  }
  if (tag === 'UL' || tag === 'OL') {
    const list = listCopy(document, child);
    if (list) out.push(list);
    return;
  }
  const el = cleanBlock(document, child, tag.toLowerCase());
  if (el) out.push(el);
}

function toBlocks(document, container) {
  const out = [];
  Array.from(container.children).forEach((c) => convert(document, c, out));
  return out;
}

/** Wistia embed -> poster image + "Watch the video" link. */
function videoCell(document, col) {
  const embed = col.querySelector('[class*="wistia_async_"]');
  const match = embed && embed.className.match(/wistia_async_([a-z0-9]+)/i);
  const id = match ? match[1] : '';
  const out = [];
  const posterSrc = Array.from(col.querySelectorAll('img'))
    .map((i) => cleanSrc(i.getAttribute('src')))
    .find((s) => /wistia\.com\/deliveries\//.test(s));
  const poster = posterSrc || (id === 'y1y3erap6p' ? WISTIA_POSTER : '');
  if (poster) out.push(makeImg(document, poster, ''));
  if (id) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', `https://fast.wistia.net/embed/iframe/${id}`);
    a.textContent = 'Watch the video';
    p.append(a);
    out.push(p);
  }
  return out;
}

function columnCell(document, col) {
  if (col.querySelector('.wistia_responsive_padding, [class*="wistia_async_"]')) return videoCell(document, col);
  return toBlocks(document, col);
}

export default function parse(element, { document }) {
  const section = element.querySelector('.Section') || element;
  const grid = section.querySelector('.Section__two-column');

  // Intro content outside the two-column grid -> its own 1x1 columns block.
  const intro = [];
  Array.from(section.children)
    .filter((c) => c !== grid && !(grid && c.contains(grid)))
    .forEach((c) => convert(document, c, intro));

  // Two-column row: one cell per column, source order.
  const cols = grid ? Array.from(grid.children).filter((c) => !SKIP_TAGS.has(c.tagName.toUpperCase())) : [];
  const row = cols.map((c) => columnCell(document, c)).filter((cell) => cell.length);

  const blocks = [];
  if (intro.length) {
    blocks.push(WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [[intro]] }));
  }
  if (row.length) {
    blocks.push(WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [row] }));
  }
  if (!blocks.length) {
    blocks.push(WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [['']] }));
  }
  element.replaceWith(...blocks);
}
