/* eslint-disable */
/* global WebImporter */
/**
 * Parser: columns-cta -> existing block "columns" (no class), 1 row x 1 cell.
 * Source: .intro-content (x3, template "solutions"). Columns uses its grid rule, so no xwalk field hints.
 *   Cell: the tagline (H4 on the source, emitted as H3), every text paragraph present, and each
 *   button link as <p><strong><a href>label</a></strong></p> with its real href
 *   (/en/products/hematology, the casebook PDF, #markForm). Empty headings and the
 *   font-awesome PDF icon are dropped.
 */

const HEADINGS = 'h1, h2, h3, h4, h5, h6';
const SITE = 'https://www.beckmancoulter.com/';
const VIDYARD_ID = /play\.vidyard\.com\/(?:embed\/v4\/)?([A-Za-z0-9_-]{10,})/;

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function isEmptyHeadingText(t) {
  return t === '' || /^empty heading$/i.test(t);
}

function firstHeading(root, selector = HEADINGS) {
  if (!root) return null;
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

function bgImageUrl(el) {
  if (!el) return '';
  const style = el.getAttribute('style') || '';
  const m = style.match(/background(?:-image)?\s*:[^;]*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
  return m ? m[1].trim() : '';
}

const SKIP_TAGS = new Set(['STYLE', 'SCRIPT', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'SVG', 'svg', 'BUTTON', 'IFRAME', 'INPUT', 'SELECT', 'FORM', 'VIDEO', 'SOURCE', 'MAP', 'AREA']);
const KEEP_TAGS = {
  A: 'a', STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', SUP: 'sup', SUB: 'sub', U: 'u', BR: 'br', CODE: 'code',
  P: 'p', H1: 'h1', H2: 'h2', H3: 'h3', H4: 'h4', H5: 'h5', H6: 'h6', UL: 'ul', OL: 'ol', LI: 'li',
  BLOCKQUOTE: 'blockquote', TABLE: 'table', THEAD: 'thead', TBODY: 'tbody', TR: 'tr', TD: 'td', TH: 'th',
};
const INLINE_FORMAT = new Set(['strong', 'em', 'sup', 'sub', 'u', 'code']);
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
  if (INLINE_FORMAT.has(tag) && norm(el.textContent) === '' && !el.querySelector('img')) {
    // empty formatting (e.g. an icon <em class="fa ...">): keep only its whitespace
    return /\s/.test(node.textContent) ? document.createTextNode(' ') : null;
  }
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
      if (tag === 'P' && child.querySelector(`div, p, ${HEADINGS}, ul, ol`)) {
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
    if (CONTAINER_TAGS.has(tag) || child.querySelector(`div, p, ul, ol, ${HEADINGS}`)) {
      flush();
      toBlocks(document, child, out);
      return;
    }
    addInline(cleanNode(document, child));
  });
  flush();
  return out;
}

function retag(document, el, tag) {
  if (el.tagName.toLowerCase() === tag) return el;
  const n = document.createElement(tag);
  while (el.firstChild) n.append(el.firstChild);
  return n;
}

function topLevel(list) {
  return list.filter((el) => !list.some((o) => o !== el && o.contains(el)));
}

/** <p><strong><a href>label</a></strong></p>, or plain bold text when there is no usable href. */
function buttonPara(document, label, href) {
  const text = norm(label);
  if (!text) return null;
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  const h = (href || '').trim();
  if (h) {
    const a = document.createElement('a');
    a.setAttribute('href', h);
    a.textContent = text;
    strong.append(a);
  } else {
    strong.textContent = text;
  }
  p.append(strong);
  return p;
}

/** A clean <p> that holds exactly one link and nothing else -> button paragraph. */
function asButton(document, p) {
  if (!p || p.tagName !== 'P') return p;
  const links = p.querySelectorAll('a');
  if (links.length !== 1 || p.querySelector('img')) return p;
  if (norm(p.textContent) !== norm(links[0].textContent)) return p;
  return buttonPara(document, links[0].textContent, links[0].getAttribute('href')) || p;
}

/* ---------- Video rule: Vidyard embed -> poster image + "Watch the video" link ---------- */

function vidyardIdOf(el) {
  if (!el || el.nodeType !== 1) return '';
  const candidates = [el, ...el.querySelectorAll('iframe, a[href], img, [class*="vidyard-div-"]')];
  for (let i = 0; i < candidates.length; i += 1) {
    const c = candidates[i];
    const vals = [c.getAttribute('src'), c.getAttribute('data-src'), c.getAttribute('href')];
    for (let j = 0; j < vals.length; j += 1) {
      const m = (vals[j] || '').match(VIDYARD_ID);
      if (m) return m[1];
    }
    const cm = (c.getAttribute('class') || '').match(/vidyard-div-([A-Za-z0-9_-]{10,})/);
    if (cm) return cm[1];
  }
  return '';
}

/** Outermost wrapper of one video embed inside root (a.type-video, player container, <p>, or the iframe). */
function videoContainers(root) {
  const iframes = Array.from(root.querySelectorAll('iframe'))
    .filter((f) => VIDYARD_ID.test(f.getAttribute('src') || f.getAttribute('data-src') || ''));
  const typeVideoLinks = Array.from(root.querySelectorAll('a.type-video, a.media-link-image'))
    .filter((a) => VIDYARD_ID.test(a.getAttribute('href') || '') && a.querySelector('iframe, img, .vidyard-player-container'));
  const list = [];
  typeVideoLinks.forEach((a) => list.push(a));
  iframes.forEach((f) => {
    if (list.some((c) => c.contains(f))) return;
    let c = f.closest('.vidyard-player-container') || f;
    if (c.parentElement && c.parentElement.tagName === 'P' && c.parentElement !== root) c = c.parentElement;
    list.push(c);
  });
  Array.from(root.querySelectorAll('.vidyard-player-container')).forEach((c) => {
    if (!list.some((x) => x.contains(c) || c.contains(x)) && vidyardIdOf(c)) list.push(c);
  });
  return topLevel(list);
}

/** Poster image for a video container: source poster <img> with a src, else play.vidyard.com/<id>.jpg. */
function videoPoster(document, container, id, alt) {
  const srcImg = Array.from(container.querySelectorAll('img'))
    .find((i) => (i.getAttribute('src') || i.getAttribute('data-src') || '').trim());
  const src = srcImg ? (srcImg.getAttribute('src') || srcImg.getAttribute('data-src')) : `https://play.vidyard.com/${id}.jpg`;
  return makeImg(document, src, alt); // alt always from the section heading, never the source "packaged goods"
}

/** Link href for a video: the source link to the player when there is one, else the player URL of the embed. */
function videoHref(container, id) {
  const a = container.matches('a[href]') ? container : container.querySelector('a[href]');
  const href = a ? (a.getAttribute('href') || '').trim() : '';
  if (href && VIDYARD_ID.test(href)) return href;
  return `https://play.vidyard.com/${id}`;
}

function videoLabel(container) {
  const a = container.matches('a[href]') ? container : container.querySelector('a[href]');
  const t = a ? norm(a.textContent) : '';
  return t || 'Watch the video';
}

/** [<p><img poster></p>, <p><a>Watch the video</a></p>] for a video container. */
function videoBlocks(document, container, alt) {
  const id = vidyardIdOf(container);
  if (!id) return [];
  const pImg = document.createElement('p');
  pImg.append(videoPoster(document, container, id, alt));
  const pLink = document.createElement('p');
  const a = document.createElement('a');
  a.setAttribute('href', videoHref(container, id));
  a.textContent = videoLabel(container);
  pLink.append(a);
  return [pImg, pLink];
}

/** Replace every video embed inside root (a clone) by poster + link paragraphs. */
function replaceVideos(document, root, alt) {
  videoContainers(root).forEach((c) => {
    const blocks = videoBlocks(document, c, alt);
    if (blocks.length) c.replaceWith(...blocks);
    else c.remove();
  });
  return root;
}

export default function parse(element, { document }) {
  const root = element.querySelector('.content-container') || element;
  const content = toBlocks(document, root).map((b) => {
    if (/^H[1-6]$/.test(b.tagName)) return retag(document, b, Number(b.tagName[1]) > 3 ? 'h3' : b.tagName.toLowerCase());
    return asButton(document, b);
  });

  if (!content.length) {
    element.remove();
    return;
  }

  const cells = [[content]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
