/* eslint-disable */
/* global WebImporter */

/**
 * Beckman Coulter cleanup transformer (blog template).
 *
 * Removes non-authorable chrome (global nav / mega menu / country picker,
 * breadcrumb, footer, share bars, consent / accessibility / feedback widgets,
 * tracking pixels, inline styles/scripts) and UserWay artifacts, normalizes
 * typographic ligatures, and drops empty markup.
 *
 * Elements tagged by the sections transformer ([data-excat-section]),
 * protected section breaks (hr[data-excat-section-break]) and the blog
 * header / body / related wrappers are never removed, regardless of the
 * order in which transformers run.
 */

const PROTECTED_SELECTOR = [
  '[data-excat-section]',
  'hr[data-excat-section-break]',
  '#main-container',
  '#main-container > .sublayout',
  '.blog-post-header',
  '.blog-post-list',
].join(', ');

const BODY_WRAPPER_SELECTOR = '#main-container > .sublayout.ui.one.column.stackable.grid.container';

const CHROME_SELECTORS = [
  // global navigation, mega menu, country picker
  '.nav-container',
  '#universal-navigation',
  '.universal-navigation',
  '.primary-navigation',
  '#movetop',
  '.country-language-selector',
  '.country-language-modal',
  '.ui.dimmer.modals',
  // breadcrumb
  '.breadcrumb',
  '.breadcrumbs',
  '[class*="breadcrumb"]',
  'nav[aria-label*="readcrumb"]',
  // footer
  '.footer-container',
  '.universal-footer',
  '.universal-footer-text',
  'header',
  'footer',
  'nav',
  // share bars (blog header + tag row)
  '.share-container',
  '.enhanced-share',
  '.share-menu',
  // clock icons
  '.lnr-clock',
  // OneTrust
  '#onetrust-consent-sdk',
  '#onetrust-banner-sdk',
  '#onetrust-pc-sdk',
  '[id^="onetrust"]',
  '[class*="onetrust"]',
  '[class*="optanon"]',
  '#ot-sdk-btn',
  // UserWay
  '.userway',
  '[class*="userway"]',
  '[id*="userway"]',
  '.uwy',
  '.uai',
  '[id^="uw-"]',
  // Kampyle / Medallia
  '[id*="kampyle"]',
  '[class*="kampyle"]',
  '#nebula_div_btn',
  '[id^="MDigital"]',
  // non-content elements
  'style',
  'script',
  'noscript',
  'link',
  'iframe',
  'template',
];

const TRACKING_SRC = /(doubleclick\.net|facebook\.com\/tr|bat\.bing\.com|google-analytics\.com|googletagmanager\.com|px\.ads\.linkedin\.com|linkedin\.com\/px|demdex\.net|everesttech\.net|adsrvr\.org|analytics\.twitter\.com|t\.co\/i\/adsct|omtrdc\.net|2o7\.net|pixel\.)/i;

const LIGATURES = {
  'ﬀ': 'ff',
  'ﬁ': 'fi',
  'ﬂ': 'fl',
  'ﬃ': 'ffi',
  'ﬄ': 'ffl',
  'ﬅ': 'st',
  'ﬆ': 'st',
};
const LIGATURE_RE = /[ﬀ-ﬆ]/g;

const MEDIA_SELECTOR = 'img, picture, video';
const SHOW_TEXT = 4;
const SHOW_COMMENT = 128;

function isProtected(el) {
  if (!el || el.nodeType !== 1) return false;
  return el.matches(PROTECTED_SELECTOR) || !!el.querySelector(PROTECTED_SELECTOR);
}

function safeRemove(el) {
  if (el && el.parentNode && !isProtected(el)) el.remove();
}

function removeAll(root, selector) {
  let nodes = [];
  try {
    nodes = [...root.querySelectorAll(selector)];
  } catch (e) {
    return;
  }
  nodes.forEach((el) => {
    if (el.isConnected) safeRemove(el);
  });
}

function normText(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function isEmptyHeadingText(t) {
  return t === '' || /^empty heading$/i.test(t);
}

/** Text of an element ignoring style/script and empty/"Empty heading" headings. */
function meaningfulText(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('style, script, noscript, template, link').forEach((n) => n.remove());
  clone.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    if (!h.querySelector(MEDIA_SELECTOR) && isEmptyHeadingText(normText(h.textContent))) h.remove();
  });
  return normText(clone.textContent);
}

function isContentEmpty(el) {
  return !el.querySelector(MEDIA_SELECTOR) && meaningfulText(el) === '';
}

function fixLigatures(s) {
  return s.replace(LIGATURE_RE, (c) => LIGATURES[c]);
}

function normalizeLigatures(document) {
  const roots = [document.head, document.body].filter(Boolean);
  roots.forEach((root) => {
    const walker = document.createTreeWalker(root, SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (LIGATURE_RE.test(node.nodeValue)) node.nodeValue = fixLigatures(node.nodeValue);
      LIGATURE_RE.lastIndex = 0;
      node = walker.nextNode();
    }
  });
  document.querySelectorAll('[alt], [title], meta[content]').forEach((el) => {
    ['alt', 'title', 'content'].forEach((attr) => {
      const v = el.getAttribute(attr);
      if (v && /[ﬀ-ﬆ]/.test(v)) el.setAttribute(attr, fixLigatures(v));
    });
  });
  if (document.title && /[ﬀ-ﬆ]/.test(document.title)) {
    document.title = fixLigatures(document.title);
  }
}

/** Restore source alt text overwritten by UserWay, then drop data-uw-* attributes. */
function cleanUserWayAttributes(document) {
  document.querySelectorAll('[data-uw-rm-alt-original]').forEach((el) => {
    el.setAttribute('alt', el.getAttribute('data-uw-rm-alt-original') || '');
  });
  document.querySelectorAll('*').forEach((el) => {
    [...el.attributes]
      .filter((a) => a.name.startsWith('data-uw'))
      .forEach((a) => el.removeAttribute(a.name));
  });
}

function removeTrackingPixels(document) {
  document.querySelectorAll('img').forEach((img) => {
    const w = img.getAttribute('width');
    const h = img.getAttribute('height');
    const src = img.getAttribute('src') || '';
    if ((w === '0' || w === '1') && (h === '0' || h === '1')) safeRemove(img);
    else if (TRACKING_SRC.test(src)) safeRemove(img);
  });
}

/** Remove style elements; drop their wrapper when it holds nothing but styles. */
function removeStyleWrappers(document) {
  document.querySelectorAll('body style').forEach((style) => {
    const parent = style.parentElement;
    if (
      parent
      && parent !== document.body
      && !parent.matches(PROTECTED_SELECTOR)
      && parent.querySelector('*:not(style)') === null
      && normText([...parent.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join('')) === ''
    ) {
      safeRemove(parent);
    } else {
      style.remove();
    }
  });
}

function removeComments(document) {
  const walker = document.createTreeWalker(document.body || document, SHOW_COMMENT);
  const comments = [];
  let node = walker.nextNode();
  while (node) {
    comments.push(node);
    node = walker.nextNode();
  }
  comments.forEach((c) => c.remove());
}

function removeEmptyHeadings(document) {
  document.querySelectorAll('body h1, body h2, body h3, body h4, body h5, body h6').forEach((h) => {
    if (!h.querySelector(MEDIA_SELECTOR) && isEmptyHeadingText(normText(h.textContent))) safeRemove(h);
  });
}

function removeEmptyParagraphs(document, strict) {
  document.querySelectorAll('body p').forEach((p) => {
    if (strict) {
      // only paragraphs made purely of whitespace text (never touch comments/field hints)
      const onlyText = [...p.childNodes].every((n) => n.nodeType === 3);
      if (onlyText && normText(p.textContent) === '') safeRemove(p);
      return;
    }
    if (p.querySelector('img, picture, video, iframe, svg, input, a[href]')) return;
    if (normText(p.textContent) === '') safeRemove(p);
  });
}

function removeWhitespaceLinks(document) {
  document.querySelectorAll('body a').forEach((a) => {
    if (a.querySelector('img, picture, video, svg')) return;
    if (normText(a.textContent) === '') safeRemove(a);
  });
}

function removeDecorativeHrs(document) {
  document.querySelectorAll('body hr:not([data-excat-section-break])').forEach((hr) => hr.remove());
}

function removeEmptyBodyChildren(document) {
  const body = document.querySelector(BODY_WRAPPER_SELECTOR);
  if (!body) return;
  [...body.children].forEach((child) => {
    if (child.matches('hr[data-excat-section-break]')) return;
    if (child.matches('style, script, noscript, link, template')) {
      child.remove();
      return;
    }
    if (isContentEmpty(child)) safeRemove(child);
  });
}

export default function transform(hookName, element, payload) {
  const document = (element && element.ownerDocument) || (payload && payload.document);
  if (!document) return;

  if (hookName === 'beforeTransform') {
    removeComments(document);
    cleanUserWayAttributes(document);
    removeStyleWrappers(document);
    removeAll(document, CHROME_SELECTORS.join(', '));
    removeTrackingPixels(document);
    removeEmptyHeadings(document);
    removeWhitespaceLinks(document);
    removeEmptyParagraphs(document, false);
    removeDecorativeHrs(document);
    removeEmptyBodyChildren(document);
    normalizeLigatures(document);
  }

  if (hookName === 'afterTransform') {
    // Never touch comments here: XWalk field hints are comments written by parsers.
    cleanUserWayAttributes(document);
    removeAll(document, 'body style, body script, body noscript, body link, body iframe');
    removeTrackingPixels(document);
    removeEmptyParagraphs(document, true);
    normalizeLigatures(document);
  }
}
