/* eslint-disable */
/* global WebImporter */
/**
 * Parser: hero-gradient -> existing block "hero" with class "gradient".
 * Source: .blog-post-header (one per blog page; bg-* colour classes differ).
 *
 * Model hero (blocks/hero/_hero.json): image (+imageAlt collapsed), text, classes.
 *   classes -> block name variant "Hero (gradient)"
 *   Row 1: field:image  -> .card-image img (fallback .card-bg background-image), or empty
 *   Row 2: field:text   -> "<N> min read", H1 title, "BY <author> | <date>", summary (if any)
 * Share UI and icons are not emitted.
 */

const HEADINGS = 'h1, h2, h3, h4, h5, h6';
const SITE = 'https://www.beckmancoulter.com/';

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function isEmptyHeadingText(t) {
  return t === '' || /^empty heading$/i.test(t);
}

function firstHeading(root, selector = HEADINGS) {
  return Array.from(root.querySelectorAll(selector)).find((h) => !isEmptyHeadingText(norm(h.textContent)));
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

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

const SKIP_TAGS = new Set(['STYLE', 'SCRIPT', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'SVG', 'svg', 'BUTTON', 'IFRAME', 'INPUT', 'SELECT', 'FORM']);
const KEEP_TAGS = {
  A: 'a', STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', SUP: 'sup', SUB: 'sub', U: 'u', BR: 'br', CODE: 'code',
  P: 'p', H1: 'h1', H2: 'h2', H3: 'h3', H4: 'h4', H5: 'h5', H6: 'h6', UL: 'ul', OL: 'ol', LI: 'li',
  BLOCKQUOTE: 'blockquote', TABLE: 'table', THEAD: 'thead', TBODY: 'tbody', TR: 'tr', TD: 'td', TH: 'th',
};

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

/** Trim leading/trailing whitespace text and <br> of a block element. */
function trimBlock(el) {
  const isWs = (n) => (n.nodeType === 3 && norm(n.nodeValue) === '') || (n.nodeType === 1 && n.tagName === 'BR');
  while (el.firstChild && isWs(el.firstChild)) el.firstChild.remove();
  while (el.lastChild && isWs(el.lastChild)) el.lastChild.remove();
  if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.nodeValue = el.firstChild.nodeValue.replace(/^\s+/, '');
  if (el.lastChild && el.lastChild.nodeType === 3) el.lastChild.nodeValue = el.lastChild.nodeValue.replace(/\s+$/, '');
  return el;
}

/** Element of the given tag holding the cleaned inline content of source. */
function inlineEl(document, source, tag = 'p') {
  const el = document.createElement(tag);
  const c = cleanNode(document, source);
  if (c) {
    if (c.nodeType === 1 && c.tagName.toLowerCase() === tag) {
      while (c.firstChild) el.append(c.firstChild);
    } else {
      el.append(c);
    }
  }
  // flatten nested block tags (e.g. a <p> inside the summary) into inline content
  el.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6').forEach((n) => n.replaceWith(...n.childNodes));
  trimBlock(el);
  return hasContent(el) ? el : null;
}

function textEl(document, text, tag = 'p') {
  const t = norm(text);
  if (!t) return null;
  const el = document.createElement(tag);
  el.textContent = t;
  return el;
}

function bylineText(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('.card-readtime, .share-container, .enhanced-share, svg, .lnr').forEach((n) => n.remove());
  return norm(clone.textContent).replace(/\s*\|\s*/g, ' | ').replace(/^\|\s*|\s*\|$/g, '').trim();
}

function bgImageUrl(el) {
  if (!el) return '';
  const style = el.getAttribute('style') || '';
  const m = style.match(/background(?:-image)?\s*:[^;]*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
  return m ? m[1].trim() : '';
}

export default function parse(element, { document }) {
  const body = element.querySelector('.card-body') || element;

  // Title
  const titleSrc = firstHeading(body, '.card-title') || firstHeading(body) || firstHeading(element);
  const titleText = titleSrc ? norm(titleSrc.textContent) : '';

  // Row 1: image
  let imageCell = '';
  const img = Array.from(element.querySelectorAll('.card-image img'))
    .find((i) => (i.getAttribute('src') || i.getAttribute('data-src') || '').trim());
  if (img) {
    imageCell = [
      hint(document, 'image'),
      makeImg(document, img.getAttribute('src') || img.getAttribute('data-src'), img.getAttribute('alt') || titleText),
    ];
  } else {
    const bg = bgImageUrl(element.querySelector('.card-bg'));
    if (bg) imageCell = [hint(document, 'image'), makeImg(document, bg, titleText)];
  }

  // Row 2: text
  const text = [];
  const readtime = body.querySelector('.card-readtime');
  const rt = readtime ? textEl(document, readtime.textContent) : null;
  if (rt) text.push(rt);

  if (titleSrc) {
    const h1 = inlineEl(document, titleSrc, 'h1');
    if (h1) text.push(h1);
  }

  const byline = Array.from(body.querySelectorAll('.card-byline')).find((b) => b.querySelector('.card-author'));
  if (byline) {
    const bp = textEl(document, bylineText(byline));
    if (bp) text.push(bp);
  }

  const summary = body.querySelector('.card-summary');
  if (summary) {
    const sp = inlineEl(document, summary);
    if (sp) text.push(sp);
  }

  const cells = [
    [imageCell],
    [text.length ? [hint(document, 'text'), ...text] : ''],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', variants: ['gradient'], cells });
  element.replaceWith(block);
}
