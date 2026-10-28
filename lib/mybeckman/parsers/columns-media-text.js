/* eslint-disable */
/* global WebImporter */
/**
 * Parser: columns-media-text -> block "Columns (media)" (mybeckman.in /service/plans,
 * exact-match design). xwalk keeps columns variants only as classes (model field
 * `classes` on blocks/columns), so this is the columns block with class "media" (one word:
 * html2md turns a hyphenated class into two words).
 * Source: #main .Section__two-column > .Section__two-column-left + .Section__two-column-right
 *   (the h2/p intro above the grid stays default content of the section).
 * Shapes (source column order kept, one row, one cell per column):
 *   photo | <ul>                       ("Count on our team of experts")
 *   text (h2, h3, p, a.btn) | Wistia   (BeckmanConnect): video cell = poster <img> +
 *        <p><a href="https://fast.wistia.net/embed/iframe/<id>">BeckmanConnect Introductory Video</a></p>
 *        (<id> from the wistia_async_<id> class; the block turns it into a click-to-play player)
 *   photo | text (h3, p, a.btn)        (Training)
 * Library convention (Columns): row 2 has one cell per column.
 * Model columns-media-text (columns/rows numbers only): cells are default content, so no
 * XWalk field hints. Images are their own element (never inside links). Source .btn links
 * are blue buttons: <p><strong><a href>label</a></strong></p>.
 * Images: original absolute URL, origin + path (query dropped); alts from the approved mapping.
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
  'https://media.beckman.com/-/media/service/media/page10_preventative_maintenance.jpg':
    'Field service engineer performing preventive maintenance on a laboratory instrument',
  'https://media.beckman.com/-/media/service/media/page14_services_2.jpg':
    'Service engineer calibrating a handheld particle counter',
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

/**
 * Stand-alone button -> <p><a href>label</a></p>. Call buttons (tel:, e.g. "Get Help Now")
 * are primary CTAs and become <p><strong><a href>label</a></strong></p>, as in hero/contact.
 */
function linkPara(document, a) {
  const href = a.getAttribute('href').trim();
  const p = document.createElement('p');
  const link = document.createElement('a');
  link.setAttribute('href', href);
  link.textContent = norm(a.textContent);
  const strong = document.createElement('strong');
  strong.append(link);
  p.append(strong);
  return p;
}

function imgFrom(document, img) {
  const src = cleanSrc(img.getAttribute('src') || img.getAttribute('data-src'));
  return src ? makeImg(document, src, img.getAttribute('alt')) : null;
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
    const img = imgFrom(document, child);
    if (img) out.push(img);
    return;
  }
  // Images inside a text block (e.g. <p><img></p>): cleanBlock keeps inline copy only and
  // would drop them, so emit the text (if any) and then each image as its own element.
  if (child.querySelector('img') && tag !== 'UL' && tag !== 'OL') {
    const text = cleanBlock(document, child, tag.toLowerCase());
    if (text) out.push(text);
    child.querySelectorAll('img').forEach((i) => {
      const img = imgFrom(document, i);
      if (img) out.push(img);
    });
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
    a.textContent = 'BeckmanConnect Introductory Video';
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
  // element = .Section__two-column; intro content above it stays default content
  const cols = Array.from(element.children).filter((c) => !SKIP_TAGS.has(c.tagName.toUpperCase()));
  const row = cols.map((c) => columnCell(document, c)).filter((cell) => cell.length);
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', variants: ['media'], cells: [row.length ? row : ['']] });
  element.replaceWith(block);
}
