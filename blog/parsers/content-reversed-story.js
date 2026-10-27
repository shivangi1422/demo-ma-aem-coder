/* eslint-disable */
/* global WebImporter */
/**
 * Parser: content-reversed-story -> existing block "content-reversed" (no class).
 *
 * Model content-reversed (blocks/content-reversed/_content-reversed.json):
 *   image (+imageAlt collapsed), text  -> Row 1: field:image, Row 2: field:text
 *   (the model has no eyebrow/CTA fields; the text row holds title + body only)
 *
 * Shapes:
 *   (a) .social-proof-section (NHLS): ONE content-reversed block PER .social-proof-card,
 *       all replacing the section element (so they stay in one section).
 *       Text: H2 card title, then p.body split at <br><br>. Empty title elements skipped. No links.
 *   (b) .media-showcase-simple: image + content of .content (H3 kept, bare text wrapped in <p>);
 *       empty h2/label dropped; no CTA on the source, so none emitted.
 * The two shapes are told apart by the presence of .social-proof-card children.
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

function hint(document, name) {
  return document.createComment(` field:${name} `);
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

function textHeading(document, text, tag) {
  const t = norm(text);
  if (isEmptyHeadingText(t)) return null;
  const h = document.createElement(tag);
  h.textContent = t;
  return h;
}

/** Title + optional eyebrow label from a .gtm-media-showcase-simple-title style heading. */
function titleParts(document, heading, tag) {
  if (!heading) return [];
  const out = [];
  const label = heading.querySelector('.label');
  const labelText = label ? norm(label.textContent) : '';
  const clone = heading.cloneNode(true);
  clone.querySelectorAll('.label').forEach((n) => n.remove());
  if (labelText) out.push(textHeading(document, labelText, 'p'));
  const h = textHeading(document, clone.textContent, tag);
  if (h) out.push(h);
  return out.filter(Boolean);
}

function imageCellFrom(document, root, fallbackAlt) {
  const img = Array.from(root.querySelectorAll('img'))
    .find((i) => (i.getAttribute('src') || i.getAttribute('data-src') || '').trim());
  if (!img) return '';
  return [
    hint(document, 'image'),
    makeImg(document, img.getAttribute('src') || img.getAttribute('data-src'), img.getAttribute('alt') || fallbackAlt),
  ];
}

function buildBlock(document, imageCell, text) {
  const cells = [
    [imageCell || ''],
    [text.length ? [hint(document, 'text'), ...text] : ''],
  ];
  return WebImporter.Blocks.createBlock(document, { name: 'content-reversed', cells });
}

/** Strip links (social-proof cards carry no links). */
function unlink(el) {
  el.querySelectorAll('a').forEach((a) => a.replaceWith(...a.childNodes));
  return el;
}

export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('.social-proof-card'));

  if (cards.length) {
    // (a) one block per card
    const blocks = cards.map((card) => {
      const content = card.querySelector('.content') || card;
      const titleEl = Array.from(content.querySelectorAll(HEADINGS))
        .find((h) => !isEmptyHeadingText(norm(h.textContent)));
      const title = titleParts(document, titleEl, 'h2');
      const text = [...title];
      const bodies = Array.from(content.querySelectorAll('p'));
      bodies.forEach((p) => {
        const cp = cleanNode(document, p);
        if (!cp || cp.nodeType !== 1) return;
        trimBlock(cp);
        if (!hasContent(cp)) return;
        splitAtDoubleBr(document, unlink(cp)).forEach((x) => text.push(x));
      });
      const imageRoot = card.querySelector('.image') || card;
      return buildBlock(document, imageCellFrom(document, imageRoot, title.length ? title[title.length - 1].textContent : ''), text);
    });
    element.replaceWith(...blocks);
    return;
  }

  // (b) media-showcase-simple (or any single image + content story)
  const content = element.querySelector('.content') || element;
  const titleEl = content.querySelector('.gtm-media-showcase-simple-title');
  const text = [...titleParts(document, titleEl, 'h2')];
  const rest = content.cloneNode(true);
  rest.querySelectorAll('.gtm-media-showcase-simple-title, .card-tag').forEach((n) => n.remove());
  toBlocks(document, rest).forEach((b) => {
    if (b.tagName === 'P') splitAtDoubleBr(document, b).forEach((x) => text.push(x));
    else text.push(b);
  });
  const firstHeadingEl = text.find((b) => /^H[1-6]$/.test(b.tagName));
  const imageRoot = element.querySelector('.image') || element;
  const block = buildBlock(document, imageCellFrom(document, imageRoot, firstHeadingEl ? firstHeadingEl.textContent : ''), text);
  element.replaceWith(block);
}
