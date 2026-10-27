/* eslint-disable */
/* global WebImporter */

/**
 * Beckman Coulter cleanup transformer (products-legacy template:
 * DxS service and support, immunoassay, urinalysis).
 *
 * Removes non-authorable chrome: global nav (outside #main-container),
 * breadcrumbs, share bars, footer, OneTrust / UserWay / Kampyle widgets and
 * the "Feedback" button, the hidden Marketo form under body, tracking pixels,
 * script / style / noscript / link / template, style-only wrappers,
 * section#demos, #videoHeroBannerEnd, #confirmform, the empty
 * .sublayout.light-gray, the hero scroll chevron (.banner-arrow), the
 * education filter bar (.education-filter-actions) and the immunoassay /
 * urinalysis throughput filter (.card-volume-filter). The carousel, card and
 * hero content around those widgets is kept.
 *
 * Kept on purpose (parsers read them):
 *   - iframes inside #main-container (Vidyard etc.), except tracking iframes
 *   - <video> elements and posters
 *   - inline style attributes (CSS background images of heroes, icons and
 *     education cards) and onclick attributes (photo-card links)
 *   - #main-container > form.mktoForm (the real Marketo form)
 *
 * UserWay artifacts: data-uw-* attributes are stripped (original alt text is
 * restored first) and "Empty heading" / empty headings are removed.
 * Typographic ligatures are normalized.
 *
 * Order independence: elements tagged by the sections transformer
 * ([data-excat-section]), protected section breaks
 * (hr[data-excat-section-break]), end markers (hr[data-excat-section-end]),
 * #main-container, its direct .sublayout / form children are never removed,
 * and nothing that the sections transformer would tag is removed either
 * (only text-empty elements and pure widgets are dropped).
 *
 * Comments are removed only in beforeTransform: in afterTransform they are
 * XWalk field hints written by the parsers.
 */

const PROTECTED_SELECTOR = [
  '[data-excat-section]',
  'hr[data-excat-section-break]',
  'hr[data-excat-section-end]',
  '#main-container',
  '#main-container > .sublayout',
  '#main-container > form',
].join(', ');

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
  // breadcrumbs
  '.breadcrumbs',
  '.breadcrumb',
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
  // Kampyle / Medallia (the "Feedback" button)
  '[id*="kampyle"]',
  '[class*="kampyle"]',
  '#nebula_div_btn',
  '[id^="MDigital"]',
  // Marketo helper markup (the real form is #main-container > form.mktoForm)
  '#MktoForms2XDIframe',
  '#mktoStyleLoaded',
  'body > form.mktoForm',
  // page widgets / helpers (their surrounding content is kept)
  'section#demos',
  '#videoHeroBannerEnd',
  '#confirmform',
  '.video-hero-carousel .banner-arrow',
  '.education-filter-actions',
  '.owl-filter-bar',
  '.card-volume-filter',
  // non-content elements
  'style',
  'script',
  'noscript',
  'link',
  'template',
];

const TRACKING_SRC = /(doubleclick\.net|facebook\.com\/tr|bat\.bing\.com|google-analytics\.com|googletagmanager\.com|px\.ads\.linkedin\.com|linkedin\.com\/px|demdex\.net|everesttech\.net|adsrvr\.org|analytics\.twitter\.com|t\.co\/i\/adsct|omtrdc\.net|2o7\.net|pixel\.|MktoForms2XDIframe|munchkin)/i;

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
const MEDIA_SELECTOR = 'img, picture, video, iframe, svg, table, input, select, textarea, button';
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

/** Text of an element ignoring style/script and empty / "Empty heading" headings. */
function meaningfulText(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('style, script, noscript, template, link').forEach((n) => n.remove());
  clone.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    if (!h.querySelector(MEDIA_SELECTOR) && isEmptyHeadingText(normText(h.textContent))) h.remove();
  });
  return normText(clone.textContent);
}

function isContentEmpty(el) {
  if (el.matches(MEDIA_SELECTOR) || el.querySelector(MEDIA_SELECTOR)) return false;
  // a background-image style carries an image the parsers read
  if (/url\(/i.test(el.getAttribute('style') || '') || el.querySelector('[style*="url("]')) return false;
  return meaningfulText(el) === '';
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
 * Everything outside #main-container is chrome (global nav, footer, widgets,
 * hidden Marketo form). title/meta hoisted into <body> are kept for metadata.
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

function removeTrackingPixels(document) {
  document.querySelectorAll('body img').forEach((img) => {
    const w = img.getAttribute('width');
    const h = img.getAttribute('height');
    const src = img.getAttribute('src') || '';
    if ((w === '0' || w === '1') && (h === '0' || h === '1')) safeRemove(img);
    else if (TRACKING_SRC.test(src)) safeRemove(img);
  });
}

/** Iframes are kept (video players); only tracking / Marketo helper iframes go. */
function removeTrackingIframes(document) {
  document.querySelectorAll('body iframe').forEach((f) => {
    const src = f.getAttribute('src') || f.getAttribute('data-src') || '';
    const w = f.getAttribute('width');
    const h = f.getAttribute('height');
    if (TRACKING_SRC.test(src) || TRACKING_SRC.test(f.id || '') || (w === '0' && h === '0')) safeRemove(f);
  });
}

/** Inline <style> siblings; drop wrappers that hold nothing but styles. */
function removeStyleWrappers(document) {
  document.querySelectorAll('body style').forEach((style) => {
    if (!style.isConnected) return;
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

/** UserWay "Empty heading" and truly empty headings (h2 above .page-content, education h3, ...). */
function removeEmptyHeadings(document) {
  document.querySelectorAll('body h1, body h2, body h3, body h4, body h5, body h6').forEach((h) => {
    if (!h.querySelector(MEDIA_SELECTOR) && isEmptyHeadingText(normText(h.textContent))) safeRemove(h);
  });
}

/** Leftover "Feedback" widget text (Kampyle button injected into the page). */
function removeFeedbackWidget(document) {
  const main = document.querySelector('#main-container');
  const root = document.body;
  if (!root) return;
  [...root.querySelectorAll('*')].forEach((el) => {
    if (!el.isConnected || el.matches('h1, h2, h3, h4, h5, h6, p, li')) return;
    if (el.querySelector(MEDIA_SELECTOR)) return;
    if (normText(el.textContent) !== 'Feedback') return;
    // remove the outermost wrapper that holds only this text
    let target = el;
    while (
      target.parentElement
      && target.parentElement !== main
      && target.parentElement !== root
      && normText(target.parentElement.textContent) === 'Feedback'
      && !target.parentElement.querySelector(MEDIA_SELECTOR)
    ) {
      target = target.parentElement;
    }
    safeRemove(target);
  });
  // bare "Feedback" text nodes directly under body / #main-container
  [root, main].filter(Boolean).forEach((parent) => {
    [...parent.childNodes]
      .filter((n) => n.nodeType === 3 && normText(n.nodeValue) === 'Feedback')
      .forEach((n) => n.remove());
  });
}

function removeEmptyParagraphs(document, strict) {
  document.querySelectorAll('body p').forEach((p) => {
    if (p.closest('form')) return;
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

/** Text-empty, media-less links (empty anchors, icon-less arrows). */
function removeWhitespaceLinks(document) {
  document.querySelectorAll('body a').forEach((a) => {
    if (a.closest('form')) return;
    if (a.querySelector('img, picture, video, svg, iframe')) return;
    if (/url\(/i.test(a.getAttribute('style') || '')) return;
    if (normText(a.textContent) === '') safeRemove(a);
  });
}

function removeDecorativeHrs(document) {
  document
    .querySelectorAll('body hr:not([data-excat-section-break]):not([data-excat-section-end])')
    .forEach((hr) => hr.remove());
}

/**
 * Empty layout wrappers inside the sublayouts: the empty .sublayout.light-gray,
 * the trailing empty .page-content on urinalysis, spacers.
 */
function removeEmptyLayoutChildren(document) {
  document.querySelectorAll('#main-container .sublayout.light-gray').forEach((el) => {
    if (isContentEmpty(el)) safeRemove(el);
  });
  document.querySelectorAll('#main-container > .sublayout > *').forEach((child) => {
    if (!child.isConnected || child.matches('hr, form')) return;
    if (isContentEmpty(child)) safeRemove(child);
  });
}

/** afterTransform: drop now-empty direct children of #main-container. */
function removeEmptyMainChildren(document) {
  const main = document.querySelector('#main-container');
  if (!main) return;
  [...main.children].forEach((child) => {
    if (child.matches('hr') || child.querySelector('hr')) return;
    if (child.querySelector('[data-excat-section]') || child.matches('[data-excat-section]')) return;
    if ([...child.childNodes].some((n) => n.nodeType === 8)) return;
    if (child.matches('form.mktoForm')) return;
    if (isContentEmpty(child)) child.remove();
  });
}

export default function transform(hookName, element, payload) {
  const document = (element && element.ownerDocument) || (payload && payload.document) || element;
  if (!document || !document.querySelector) return;

  if (hookName === 'beforeTransform') {
    removeComments(document);
    cleanUserWayAttributes(document);
    removeStyleWrappers(document);
    removeOutsideMain(document);
    removeAll(document, CHROME_SELECTORS.join(', '));
    removeTrackingIframes(document);
    removeTrackingPixels(document);
    removeFeedbackWidget(document);
    removeEmptyHeadings(document);
    removeWhitespaceLinks(document);
    removeEmptyParagraphs(document, false);
    removeDecorativeHrs(document);
    removeEmptyLayoutChildren(document);
    normalizeLigatures(document);
  }

  if (hookName === 'afterTransform') {
    // Never touch comments here: XWalk field hints are comments written by parsers.
    cleanUserWayAttributes(document);
    removeAll(document, 'body style, body script, body noscript, body link');
    removeTrackingIframes(document);
    removeTrackingPixels(document);
    removeEmptyParagraphs(document, true);
    removeEmptyMainChildren(document);
    normalizeLigatures(document);
  }
}
