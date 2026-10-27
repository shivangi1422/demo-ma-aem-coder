/* eslint-disable */
/* global WebImporter */
/**
 * Parser: columns-diagnostics-bar -> existing block "columns" (mybeckman.in home).
 * Source: #main > div.main-holder > div.mx-auto.bg-brand-gray-50.p-2 > p
 *   "Learn how we're related to"
 *   <a href="/life-sciences-vs-diagnostics"><img bcls-logo-bean.svg> <span>Beckman Coulter Diagnostics</span></a>
 *
 * Library convention (Columns): rows x columns of cells; here 1 row x 1 column.
 * columns has no per-cell model fields (xwalk column -> text/image/button/title),
 * so no field hints. The cell holds one paragraph with the inline logo <img>
 * kept inside the link, as on the source (Tailwind classes and spans dropped).
 */

const SITE_ORIGIN = 'https://www.mybeckman.in/';

const IMAGE_ALTS = {
  'https://www.mybeckman.in/assets/images/revised/bcls-logo-bean.1631cab0.svg': 'Beckman Coulter logo',
};

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ');
}

function cleanSrc(src) {
  const s = (src || '').trim();
  // data: placeholders (and the blob: URLs the importer turns them into) are not real images
  if (!s || /^(data|blob):/i.test(s)) return '';
  try {
    const u = new URL(s, SITE_ORIGIN);
    return `${u.origin}${u.pathname}`;
  } catch (e) {
    return s.split(/[?#]/)[0];
  }
}

/** Inline copy: text, links, images, strong/em/br; everything else unwrapped. */
function cleanInline(document, node) {
  if (node.nodeType === 3) return document.createTextNode(norm(node.nodeValue));
  if (node.nodeType !== 1) return null;
  if (node.tagName === 'IMG') {
    const src = cleanSrc(node.getAttribute('src') || node.getAttribute('data-src'));
    if (!src) return null;
    const img = document.createElement('img');
    img.setAttribute('src', src);
    img.setAttribute('alt', IMAGE_ALTS[src] || norm(node.getAttribute('alt')).trim());
    return img;
  }
  if (node.tagName === 'BR') return document.createElement('br');
  const frag = document.createDocumentFragment();
  node.childNodes.forEach((c) => {
    const cc = cleanInline(document, c);
    if (cc) frag.append(cc);
  });
  const tag = { A: 'a', STRONG: 'strong', B: 'strong', EM: 'em', I: 'em' }[node.tagName];
  if (!tag) return frag;
  const el = document.createElement(tag);
  if (tag === 'a') {
    const href = (node.getAttribute('href') || '').trim();
    if (!href) return frag;
    el.setAttribute('href', href);
  }
  el.append(frag);
  return el;
}

/** Collapse whitespace runs across adjacent text nodes and trim element edges. */
function tidy(el) {
  el.normalize();
  [el, ...el.querySelectorAll('a, strong, em')].forEach((e) => e.normalize());
  const walker = el.ownerDocument.createTreeWalker(el, 4);
  const texts = [];
  let n = walker.nextNode();
  while (n) {
    texts.push(n);
    n = walker.nextNode();
  }
  texts.forEach((t) => { t.nodeValue = t.nodeValue.replace(/\s+/g, ' '); });
  [el, ...el.querySelectorAll('a, strong, em')].forEach((e) => {
    const first = e.firstChild;
    if (first && first.nodeType === 3) first.nodeValue = first.nodeValue.replace(/^\s+/, '');
    const last = e.lastChild;
    if (last && last.nodeType === 3) last.nodeValue = last.nodeValue.replace(/\s+$/, '');
  });
  el.querySelectorAll('a').forEach((a) => {
    // one space between the text before a link and the link
    const prev = a.previousSibling;
    if (prev && prev.nodeType === 3 && !/\s$/.test(prev.nodeValue)) prev.nodeValue += ' ';
    // one space between an inline image and the link text that follows it
    const img = a.querySelector(':scope > img');
    const next = img && img.nextSibling;
    if (next && next.nodeType === 3 && !/^\s/.test(next.nodeValue)) next.nodeValue = ` ${next.nodeValue}`;
  });
}

export default function parse(element, { document }) {
  const src = element.matches('p') ? element : (element.querySelector('p') || element);
  const p = document.createElement('p');
  src.childNodes.forEach((c) => {
    const cc = cleanInline(document, c);
    if (cc) p.append(cc);
  });
  tidy(p);

  const hasContent = p.textContent.trim() || p.querySelector('img');
  const cells = [[hasContent ? p : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
