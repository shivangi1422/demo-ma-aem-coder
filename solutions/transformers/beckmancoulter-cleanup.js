/* eslint-disable */
/* global WebImporter */

/**
 * Beckman Coulter cleanup transformer (solutions template).
 *
 * Removes non-authorable chrome (global nav / mega menu, breadcrumb, footer,
 * share bars, OneTrust / UserWay / Kampyle widgets, hidden Marketo helper
 * markup, tracking pixels and iframes, inline styles/scripts) and UserWay
 * artifacts, normalizes typographic ligatures and drops empty markup.
 *
 * Kept on purpose:
 *   - Vidyard (and other video player) iframes: parsers turn them into
 *     poster + link.
 *   - The Marketo form inside the body wrapper with its fields, labels and
 *     consent text (.mktoHtmlText).
 *
 * Elements tagged by the sections transformer ([data-excat-section]),
 * protected section breaks (hr[data-excat-section-break]), #main-container
 * and its direct sublayout wrappers are never removed, so the result is the
 * same whichever transformer runs first.
 */

const PROTECTED_SELECTOR = [
  '[data-excat-section]',
  'hr[data-excat-section-break]',
  '#main-container',
  '#main-container > .sublayout',
].join(', ');

const BODY_WRAPPER_SELECTOR = '#main-container > .sublayout.stackable';

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
  // share bars
  '.share-container',
  '.enhanced-share',
  '.share-menu',
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
  '.uw-sl',
  '[class^="uw-s"]',
  '[id^="uw-"]',
  // Kampyle / Medallia
  '[id*="kampyle"]',
  '[class*="kampyle"]',
  '#nebula_div_btn',
  '[id^="MDigital"]',
  // Marketo helper markup (the real form lives inside the body wrapper)
  '#MktoForms2XDIframe',
  '#mktoStyleLoaded',
  'body > form.mktoForm',
  // page-specific non-content in the body wrapper
  `${BODY_WRAPPER_SELECTOR} > .line-break`,
  '#confirmform',
  // non-content elements
  'style',
  'script',
  'noscript',
  'link',
  'template',
];

const VIDEO_IFRAME_SRC = /(vidyard\.com|youtube\.com|youtube-nocookie\.com|youtu\.be|vimeo\.com|brightcove|wistia)/i;

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
const LIGATURE_TEST = /[ﬀ-ﬆ]/;
const LIGATURE_ALL = /[ﬀ-ﬆ]/g;

// Content that keeps an otherwise text-empty element alive.
const MEDIA_SELECTOR = 'img, picture, video, iframe, form';
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
  return !el.matches(MEDIA_SELECTOR) && !el.querySelector(MEDIA_SELECTOR) && meaningfulText(el) === '';
}

function fixLigatures(s) {
  return s.replace(LIGATURE_ALL, (c) => LIGATURES[c]);
}

function normalizeLigatures(document) {
  [document.head, document.body].filter(Boolean).forEach((root) => {
    const walker = document.createTreeWalker(root, SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (LIGATURE_TEST.test(node.nodeValue)) node.nodeValue = fixLigatures(node.nodeValue);
      node = walker.nextNode();
    }
  });
  document.querySelectorAll('[alt], [title], meta[content]').forEach((el) => {
    ['alt', 'title', 'content'].forEach((attr) => {
      const v = el.getAttribute(attr);
      if (v && LIGATURE_TEST.test(v)) el.setAttribute(attr, fixLigatures(v));
    });
  });
  if (document.title && LIGATURE_TEST.test(document.title)) {
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

/** Everything outside #main-container is chrome (nav, footer, widgets, hidden Marketo form). */
function removeOutsideMain(document) {
  const main = document.querySelector('#main-container');
  if (!main || !document.body) return;
  let node = main;
  while (node && node !== document.body) {
    const parent = node.parentElement;
    if (!parent) break;
    [...parent.children].forEach((sib) => {
      if (sib !== node) safeRemove(sib);
    });
    node = parent;
  }
}

function removeTrackingPixels(document) {
  document.querySelectorAll('body img').forEach((img) => {
    const w = img.getAttribute('width');
    const h = img.getAttribute('height');
    const src = img.getAttribute('src') || '';
    if ((w === '0' || w === '1') && (h === '0' || h === '1')) safeRemove(img);
    else if (TRACKING_SRC.test(src)) safeRemove(img);
  });
}

/** Keep video player iframes; drop tracking / helper / widget iframes. */
function removeNonVideoIframes(document) {
  document.querySelectorAll('body iframe').forEach((f) => {
    const src = f.getAttribute('src') || f.getAttribute('data-src') || '';
    if (!VIDEO_IFRAME_SRC.test(src)) safeRemove(f);
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
    if (p.querySelector('img, picture, video, iframe, svg, input, select, textarea, a[href]')) return;
    if (normText(p.textContent) === '') safeRemove(p);
  });
}

function removeWhitespaceLinks(document) {
  document.querySelectorAll('body a').forEach((a) => {
    if (a.querySelector('img, picture, video, svg, iframe')) return;
    if (normText(a.textContent) === '') safeRemove(a);
  });
}

function removeDecorativeHrs(document) {
  document.querySelectorAll('body hr:not([data-excat-section-break])').forEach((hr) => hr.remove());
}

/** Drop text-empty, image-less, iframe-less children of the body wrapper (spacers, empty page-content). */
function removeEmptyBodyChildren(document) {
  const wrapper = document.querySelector(BODY_WRAPPER_SELECTOR);
  if (!wrapper) return;
  [...wrapper.children].forEach((child) => {
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
    removeOutsideMain(document);
    removeAll(document, CHROME_SELECTORS.join(', '));
    removeNonVideoIframes(document);
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
    removeAll(document, 'body style, body script, body noscript, body link');
    removeNonVideoIframes(document);
    removeTrackingPixels(document);
    removeEmptyParagraphs(document, true);
    normalizeLigatures(document);
  }
}
