/* eslint-disable */
/* global WebImporter */
/**
 * Parser: hero-home -> existing block "hero" with class "home".
 * Source: .video-hero-carousel (template "products-legacy": DxS, immunoassay, urinalysis).
 *
 * Model hero (blocks/hero/_hero.json): image (+imageAlt collapsed), text, classes.
 *   Row 1: field:image -> poster from the #video-tag-thumbnail CSS background (original
 *                         absolute URL), alt from the approved image list, else the title
 *   Row 2: field:text  -> the .banner-details headings at their source level, paragraphs, and
 *                         every banner link as <p><strong><a href>label</a></strong></p>
 *                         (in-page anchors such as #ServiceSol / #ProductsJump kept as is)
 * Urinalysis (user decision 3): the page has no H1, so the first hero heading becomes H1.
 * The mp4 <video>, the scroll chevron and empty &nbsp; paragraphs are not emitted.
 */

/* ---------- shared helpers (products-legacy) ---------- */
const HEADINGS = 'h1, h2, h3, h4, h5, h6';
const SITE = 'https://www.beckmancoulter.com/';
const M = 'https://media.beckmancoulter.com/-/media/diagnostics/';

// Approved alt text per original image (origin + path, lower case): /tmp/legacy-images.json
const ALTS = {
  [`${M}products/dxs-services/service-static-banner.jpg`]: 'DxS Service and Support',
  [`${M}products/dxs-services/icons/mazimize_uptime-1.png`]: 'Maximize Uptime',
  [`${M}products/dxs-services/icons/confidence-1.png`]: 'Increase Confidence',
  [`${M}products/dxs-services/icons/peace_of_mind-1.png`]: 'Gain Peace-of-Mind',
  'https://play.vidyard.com/wnvj5wdmusn7whnrcd2e4x.jpg': 'DxS Service Solutions video',
  [`${M}products/dxs-services/service-agreement-563x480.jpg`]: 'Service-Agreement',
  [`${M}products/dxs-services/professional-services-563-x-480.png`]: 'Professional Services',
  [`${M}products/dxs-services/remote-connectivity-563x480.png`]: 'DxS Remote Connectivity',
  [`${M}products/dxs-services/educationtraining563x480.jpg`]: 'Education Training',
  [`${M}products/dxs-services/every-second-counts--cards-563x480.jpg`]: 'Every-Second-Counts',
  [`${M}products/dxs-services/terms-and-conditions-563x480.jpg`]: 'Terms-and-Conditions',
  [`${M}products/dxs-services/every-second-counts-563x480.png`]: 'DxS Every second counts',
  [`${M}products/dxs-services/get-support-563x480.png`]: 'DxS Get support',
  [`${M}products/immunoassay/images/ia-dp-2023/immunoassa-banner.jpg`]: 'Immunoassay Analyzers and Assays',
  [`${M}products/images/icons/reliability.svg`]: 'Reliability',
  [`${M}products/images/icons/simplify-complex.svg`]: 'Simplify-Complex',
  [`${M}products/images/icons/scale-with-consistency.svg`]: 'Scale-with-consistency',
  [`${M}products/immunoassay/access-2/images/immun-access2-web.jpg`]: 'Access 2 Immunoassay Analyzer',
  [`${M}products/chemistry/dxc-500i/dxc-500i-media-gallery.png`]: 'DxC 500i media gallery',
  [`${M}products/immunoassay/unicel-dxi-600/images/immun-unicel-dx-600access-web.jpg`]: 'UniCel DxI 600 Immunoassay Analyzer',
  [`${M}products/immunoassay/images/dxi9000-330x280.jpg`]: 'DxI 9000',
  [`${M}products/immunoassay/images/automation-spotlight.jpg`]: 'Automation',
  [`${M}products/immunoassay/new-immunoassay-dp/social-proof-clinical-chemistry2-350x200.jpg`]: 'Chemistry Clinical Solutions',
  [`${M}education-cards/blog-450x206.jpg`]: 'Blogs',
  [`${M}education-cards/press_release_450x206-1.jpg`]: 'News',
  [`${M}education-cards/journal_article_450x206-1.jpg`]: 'Articles',
  [`${M}education-cards/clinical_studies_450x206-1.jpg`]: 'Scientific Evidence',
  [`${M}education-cards/webinar_450x206-2.jpg`]: 'Webinars',
  [`${M}products/urinalysis/new-urinalysis-dp/ua-static-bk.jpg`]: 'Urinalysis Analyzers',
  [`${M}products/images/icons/popular-ordered-test.svg`]: 'Popular-Ordered-Test',
  [`${M}products/images/icons/urinalysis.svg`]: 'Urinalysis',
  [`${M}products/images/icons/reduce-manual-work.svg`]: 'Reduce-Manual-Work',
  [`${M}products/urinalysis/dxu-1800c/dxu-1800-product-card.png`]: 'DxU 1800 Product Card',
  [`${M}products/urinalysis/dxu-microscopy-series/dxu-850m-iris--urine-microscopy-instrument-568-480.jpg`]: 'Urine microscopy instrument DxU 850 m Iris',
  [`${M}products/urinalysis/new-urinalysis-dp/new-ua-template-images/case-study-multi-center-300x201.jpg`]: 'Peer-reviewed article',
  [`${M}products/urinalysis/new-urinalysis-dp/new-ua-template-images/case-study-automation-300x201.jpg`]: 'Urinalysis case study',
  [`${M}products/hematology/dxh-800/images/hem-dxh-connected-workcell-solutions-web.jpg`]: 'DxH Connected Workcell Solution',
  [`${M}products/urinalysis/new-urinalysis-dp/new-ua-images/dxservice-563x480.jpg`]: 'DxS Service and supports',
  [`${M}products/urinalysis/new-urinalysis-dp/new-ua-template-images/clinical-informatics-v2-563x480.jpg`]: 'Clinical Informatic Solutions',
};

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function isEmptyHeadingText(t) {
  return t === '' || /^empty heading$/i.test(t);
}

/** Visible text of a node (style/script content ignored). */
function textOf(node) {
  if (!node) return '';
  const clone = node.cloneNode(true);
  if (clone.querySelectorAll) clone.querySelectorAll('style, script, noscript, template').forEach((n) => n.remove());
  return norm(clone.textContent);
}

/** First heading with real text (UserWay "Empty heading" and empty headings skipped). */
function firstHeading(root, selector = HEADINGS) {
  if (!root) return null;
  return Array.from(root.querySelectorAll(selector)).find((h) => !isEmptyHeadingText(textOf(h))) || null;
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

function imageKey(src) {
  try {
    const u = new URL(absUrl(src));
    return (u.origin + u.pathname).toLowerCase();
  } catch (e) {
    return '';
  }
}

function altFor(src, fallback) {
  return ALTS[imageKey(src)] || norm(fallback);
}

/** <img> with the ORIGINAL absolute URL and the approved alt. */
function makeImg(document, src, fallbackAlt) {
  const img = document.createElement('img');
  img.setAttribute('src', absUrl(src));
  img.setAttribute('alt', altFor(src, fallbackAlt));
  return img;
}

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

/** First non-empty url(...) of an inline style (gradients and url('') skipped). */
function bgImageUrl(el) {
  if (!el || !el.getAttribute) return '';
  const style = el.getAttribute('style') || '';
  const re = /url\(\s*(['"]?)([^'")]*)\1\s*\)/gi;
  let m = re.exec(style);
  while (m) {
    const u = m[2].trim();
    if (u) return u;
    m = re.exec(style);
  }
  return '';
}

/** Source page slug (dxs-service-and-supports | immunoassay | urinalysis), '' when unknown. */
function pageSlug(document, params) {
  const urls = [];
  if (params && params.originalURL) urls.push(params.originalURL);
  try {
    const og = document.querySelector('meta[property="og:url"]');
    if (og) urls.push(og.getAttribute('content'));
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) urls.push(canonical.getAttribute('href'));
  } catch (e) { /* ignore */ }
  try {
    if (document.location && document.location.href) urls.push(document.location.href);
  } catch (e) { /* ignore */ }
  if (document.URL) urls.push(document.URL);
  for (let i = 0; i < urls.length; i += 1) {
    const m = (urls[i] || '').match(/\/products\/([a-z0-9-]+)/i);
    if (m) return m[1].toLowerCase();
  }
  return '';
}

const SKIP_TAGS = new Set(['STYLE', 'SCRIPT', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'SVG', 'svg', 'BUTTON', 'IFRAME', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL', 'FORM', 'VIDEO', 'SOURCE', 'MAP', 'AREA', 'NAV']);
const KEEP_TAGS = {
  A: 'a', STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', SUP: 'sup', SUB: 'sub', U: 'u', BR: 'br', CODE: 'code',
  P: 'p', H1: 'h1', H2: 'h2', H3: 'h3', H4: 'h4', H5: 'h5', H6: 'h6', UL: 'ul', OL: 'ol', LI: 'li',
  BLOCKQUOTE: 'blockquote',
};
const INLINE_FORMAT = new Set(['strong', 'em', 'sup', 'sub', 'u', 'code']);
const BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'BLOCKQUOTE', 'PRE']);
const CONTAINER_TAGS = new Set(['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'ASIDE', 'HEADER', 'FOOTER', 'FIGURE', 'NAV']);

function usableHref(a) {
  const href = (a.getAttribute('href') || '').trim();
  if (!href || /^javascript:/i.test(href)) return '';
  return href;
}

/** Clean copy of a node: semantic tags only, href/src/alt attributes; link-less anchors unwrapped. */
function cleanNode(document, node) {
  if (node.nodeType === 3) return document.createTextNode(node.nodeValue.replace(/ /g, ' '));
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
    const href = usableHref(node);
    if (!href || norm(node.textContent) === '') return frag;
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.append(frag);
    return a;
  }
  const el = document.createElement(tag);
  el.append(frag);
  if (INLINE_FORMAT.has(tag) && norm(el.textContent) === '' && !el.querySelector('img')) {
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
 * Flatten a container into clean block elements: wrapper divs descended into, bare text /
 * inline runs wrapped in <p>, empty paragraphs and empty / "Empty heading" headings dropped.
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
      if (norm(child.nodeValue) !== '' || pending) addInline(document.createTextNode(child.nodeValue.replace(/ /g, ' ')));
      return;
    }
    if (child.nodeType !== 1 || SKIP_TAGS.has(child.tagName)) return;
    if (child.classList && (child.classList.contains('share-container') || child.classList.contains('lnr'))) return;
    const tag = child.tagName;
    if (/^H[1-6]$/.test(tag)) {
      flush();
      if (isEmptyHeadingText(textOf(child)) && !child.querySelector('img')) return;
      const h = cleanNode(document, child);
      if (h && h.nodeType === 1) {
        trimBlock(h);
        if (hasContent(h)) out.push(h);
      }
      return;
    }
    if (BLOCK_TAGS.has(tag)) {
      flush();
      if (tag === 'P' && child.querySelector(`div, p, ${HEADINGS}, ul, ol`)) {
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

/** <p><strong><a href>label</a></strong></p>, or plain bold text when there is no usable href. */
function buttonPara(document, label, href) {
  const text = norm(label);
  if (!text) return null;
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  const h = (href || '').trim();
  if (h && !/^javascript:/i.test(h)) {
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
/* ---------- end shared helpers ---------- */

export default function parse(element, { document }) {
  const opts = arguments[1] || {};
  const slug = pageSlug(document, opts.params);
  const details = element.querySelector('.banner-details') || element.querySelector('.content-max-width') || element;
  const titleEl = firstHeading(details, 'h1') || firstHeading(details);
  const titleText = titleEl ? textOf(titleEl) : '';

  // decision 3: urinalysis has no H1 -> promote the first hero heading (also when the page is
  // unknown and the document has no H1 at all)
  const promote = slug ? slug === 'urinalysis' : !document.querySelector('h1');

  // Row 1: poster (an <img> when the source has one, else the CSS background of #video-tag-thumbnail)
  let imageCell = '';
  const imgSrc = Array.from(element.querySelectorAll('#video-tag-thumbnail img, .item-container img'))
    .find((i) => (i.getAttribute('src') || i.getAttribute('data-src') || '').trim());
  if (imgSrc) {
    imageCell = [hint(document, 'image'), makeImg(document, imgSrc.getAttribute('src') || imgSrc.getAttribute('data-src'), imgSrc.getAttribute('alt') || titleText)];
  } else {
    const bgEl = [element.querySelector('#video-tag-thumbnail'), element, ...element.querySelectorAll('[style*="url("]')]
      .find((e) => bgImageUrl(e));
    if (bgEl) imageCell = [hint(document, 'image'), makeImg(document, bgImageUrl(bgEl), titleText)];
  }

  // Row 2: text
  const text = toBlocks(document, details).map((b) => asButton(document, b));
  if (promote) {
    const i = text.findIndex((b) => /^H[1-6]$/.test(b.tagName));
    if (i >= 0) text[i] = retag(document, text[i], 'h1');
  }

  const cells = [
    [imageCell],
    [text.length ? [hint(document, 'text'), ...text] : ''],
  ];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', variants: ['home'], cells });
  element.replaceWith(block);
}
