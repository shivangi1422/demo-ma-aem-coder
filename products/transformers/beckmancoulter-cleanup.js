/* eslint-disable */
/* global WebImporter */

/**
 * Beckman Coulter cleanup transformer (products template).
 *
 * Removes non-authorable chrome (global nav / country-language menu,
 * breadcrumb, Share bar, footer, OneTrust / UserWay / Kampyle widgets,
 * tracking pixels, iframes, inline styles/scripts), decorative <hr>
 * dividers inside product cards and the empty .disclaimer-text spacer.
 * Strips UserWay attributes and normalizes typographic ligatures.
 *
 * POSITIONAL SELECTORS: the template's section/block selectors use
 * `#main-container > div...:nth-of-type(N)`. Removing any direct child of
 * #main-container in beforeTransform would shift every index, so in
 * beforeTransform the breadcrumb/Share wrapper (first child) is only
 * EMPTIED; empty direct children of #main-container are deleted in
 * afterTransform, after the parsers ran.
 *
 * Elements tagged by the sections transformer ([data-excat-section]),
 * protected section breaks (hr[data-excat-section-break]), section
 * end markers, #main-container and its direct children are never removed in
 * beforeTransform, so the result is the same whichever transformer runs first.
 *
 * Comments are removed only in beforeTransform: in afterTransform they are
 * XWalk field hints written by the parsers.
 */

const PROTECTED_SELECTOR = [
  '[data-excat-section]',
  'hr[data-excat-section-break]',
  'hr[data-excat-section-end]',
  '#main-container',
  '#main-container > *',
].join(', ');

// Direct child of #main-container holding breadcrumb + Share bar.
const HEADER_WRAPPER_SELECTOR = '#main-container > div.photo-header-container';

const CHROME_SELECTORS = [
  // global navigation, mega menu, country / language picker
  '.nav-container',
  '#universal-navigation',
  '.universal-navigation',
  '.primary-navigation',
  '#movetop',
  '.country-language-selector',
  '.country-language-modal',
  '.ui.dimmer.modals',
  // breadcrumb
  '.breadcrumb-container',
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
  // non-content elements
  'style',
  'script',
  'noscript',
  'link',
  'template',
  'iframe',
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
const LIGATURE_TEST = /[ﬀ-ﬆ]/;
const LIGATURE_ALL = /[ﬀ-ﬆ]/g;

// Content that keeps an otherwise text-empty element alive.
const MEDIA_SELECTOR = 'img, picture, video, iframe, form, svg, table';
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

function isContentEmpty(el) {
  if (el.matches(MEDIA_SELECTOR) || el.querySelector(MEDIA_SELECTOR)) return false;
  const clone = el.cloneNode(true);
  clone.querySelectorAll('style, script, noscript, template, link').forEach((n) => n.remove());
  return normText(clone.textContent) === '';
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

/**
 * Everything outside #main-container is chrome (nav, footer, widgets).
 * title/meta that the parser hoisted into <body> are kept for metadata.
 */
function removeOutsideMain(document) {
  const main = document.querySelector('#main-container');
  if (!main || !document.body) return;
  let node = main;
  while (node && node !== document.body) {
    const parent = node.parentElement;
    if (!parent) break;
    [...parent.children].forEach((sib) => {
      if (sib !== node && !sib.matches('title, meta')) safeRemove(sib);
    });
    node = parent;
  }
}

/** Breadcrumb / Share wrapper: empty it but keep the element (positional selectors). */
function emptyHeaderWrapper(document) {
  document.querySelectorAll(HEADER_WRAPPER_SELECTOR).forEach((wrapper) => {
    if (wrapper.querySelector('[data-excat-section], hr[data-excat-section-break]')) return;
    while (wrapper.firstChild) wrapper.firstChild.remove();
  });
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

/** Strip inline <style> (e.g. DxH 560 card title); drop wrappers holding only styles. */
function removeStyles(document) {
  document.querySelectorAll('body style').forEach((style) => {
    const parent = style.parentElement;
    if (
      parent
      && parent !== document.body
      && !isProtected(parent)
      && parent.querySelector('*:not(style)') === null
      && normText([...parent.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join('')) === ''
    ) {
      parent.remove();
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

/** Decorative dividers (e.g. 8 inside product cards); keep protected section breaks. */
function removeDecorativeHrs(document) {
  document
    .querySelectorAll('body hr:not([data-excat-section-break]):not([data-excat-section-end])')
    .forEach((hr) => hr.remove());
}

/** Empty .disclaimer-text spacer (the references one has text and stays). */
function removeEmptyDisclaimers(document) {
  document.querySelectorAll('#main-container .disclaimer-text').forEach((el) => {
    if (isContentEmpty(el)) safeRemove(el);
  });
}

function removeEmptyParagraphs(document) {
  // only paragraphs made purely of whitespace text (never touch comments/field hints)
  document.querySelectorAll('body p').forEach((p) => {
    const onlyText = [...p.childNodes].every((n) => n.nodeType === 3);
    if (onlyText && normText(p.textContent) === '') safeRemove(p);
  });
}

/** afterTransform: drop now-empty direct children of #main-container (header wrapper, spacers). */
function removeEmptyMainChildren(document) {
  const main = document.querySelector('#main-container');
  if (!main) return;
  [...main.children].forEach((child) => {
    if (child.matches('hr') || child.querySelector('hr')) return;
    if (child.querySelector('[data-excat-section]')) return;
    if (child.childNodes.length && [...child.childNodes].some((n) => n.nodeType === 8)) return;
    if (isContentEmpty(child)) child.remove();
  });
}

export default function transform(hookName, element, payload) {
  const document = (element && element.ownerDocument) || (payload && payload.document);
  if (!document) return;

  if (hookName === 'beforeTransform') {
    removeComments(document);
    cleanUserWayAttributes(document);
    emptyHeaderWrapper(document);
    removeStyles(document);
    removeOutsideMain(document);
    removeAll(document, CHROME_SELECTORS.join(', '));
    removeTrackingPixels(document);
    removeDecorativeHrs(document);
    removeEmptyDisclaimers(document);
    normalizeLigatures(document);
  }

  if (hookName === 'afterTransform') {
    // Never touch comments here: XWalk field hints are comments written by parsers.
    cleanUserWayAttributes(document);
    removeAll(document, 'body style, body script, body noscript, body link, body iframe');
    removeTrackingPixels(document);
    removeEmptyParagraphs(document);
    removeEmptyMainChildren(document);
    normalizeLigatures(document);
  }
}
