/* eslint-disable */
/* global WebImporter */

/**
 * Beckman Coulter cleanup transformer (mybeckman.in service template, Sitecore).
 *
 * Page shape: body > #wrapper holds header#mainNav, div#main (content) and
 * .footer2023. Content lives in div.bc-rich-text components under
 * #main .bc-test-layout > .block.
 *
 * Removes non-authorable chrome: everything outside #main (header#mainNav,
 * Coveo search, .footer2023 with the Marketo newsletter form #mktoForm_3594,
 * flash message / mask overlay, TrustArc #consent_blackbar, hidden Marketo
 * form + XD iframe, skip link, hidden inputs), plus inside #main the empty
 * .custome-container, the style-only .row.js-component, the empty
 * #content-holder / #ModalPopup, the empty spacer .bc-rich-text, all inline
 * <style>, the Font Awesome icon spans of the service cards (with their empty
 * links), tracking pixels and script/noscript/link/iframe.
 *
 * Kept on purpose: the hero <img>, card titles, links and descriptions.
 *
 * Elements tagged by the sections transformer ([data-excat-section]),
 * protected section breaks (hr[data-excat-section-break]), section end
 * markers (hr[data-excat-section-end]) and their ancestors are never
 * removed, so the result is the same whichever transformer runs first.
 */

const PROTECTED_SELECTOR = [
  '[data-excat-section]',
  'hr[data-excat-section-break]',
  'hr[data-excat-section-end]',
  '#main',
].join(', ');

const BLOCK_WRAPPER_SELECTOR = '#main .bc-test-layout > .block';

const CHROME_SELECTORS = [
  // header / nav / search
  'header',
  '#mainNav',
  'nav',
  '.skip-to-main-content-link',
  '[class*="Coveo"]',
  '[id*="coveo" i]',
  // footer + Marketo newsletter form
  '.footer2023',
  'footer',
  '#mktoForm_3594',
  '#mktoStyleLoaded',
  '#MktoForms2XDIframe',
  'body > form.mktoForm',
  // TrustArc cookie consent
  '#consent_blackbar',
  '[id^="truste"]',
  '[id^="trustarc"]',
  '[class*="truste"]',
  // misc overlays
  '.flash-message',
  '.MaskOverlay',
  '#ModalPopup',
  // empty / style-only Sitecore wrappers inside #main
  '#main .custome-container',
  '#main .row.js-component',
  // Font Awesome icon spans in the service cards (icons are lost by design)
  '#main .ServiceCard > span.fa',
  '#main span.fa',
  '#main i.fa',
  // non-content elements
  'style',
  'script',
  'noscript',
  'link',
  'template',
  'iframe',
  'input[type="hidden"]',
];

const TRACKING_SRC = /(doubleclick\.net|facebook\.com\/tr|bat\.bing\.com|google-analytics\.com|googletagmanager\.com|px\.ads\.linkedin\.com|linkedin\.com\/px|demdex\.net|everesttech\.net|adsrvr\.org|analytics\.twitter\.com|t\.co\/i\/adsct|omtrdc\.net|2o7\.net|trustarc\.com|truste\.com|munchkin|mktoresp|pixel\.)/i;

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

/** Text of an element ignoring style/script and empty/filler headings. */
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

/** Everything outside #main is chrome (header, footer, consent, widgets, hidden Marketo form). */
function removeOutsideMain(document) {
  const main = document.querySelector('#main');
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
  document
    .querySelectorAll('body hr:not([data-excat-section-break]):not([data-excat-section-end])')
    .forEach((hr) => hr.remove());
}

/** Drop text-empty, media-less wrappers in #main (spacer .bc-rich-text, empty headers). */
function removeEmptyContainers(document) {
  const candidates = [
    ...document.querySelectorAll(`${BLOCK_WRAPPER_SELECTOR} > *`),
    ...document.querySelectorAll('#main #content-holder, #main .bcls-aeo-published'),
  ];
  candidates.forEach((el) => {
    if (!el.isConnected || el.matches('hr[data-excat-section-break], hr[data-excat-section-end]')) return;
    if (isContentEmpty(el)) safeRemove(el);
  });
}

function stripTrackingAttributes(document) {
  document.querySelectorAll('body *').forEach((el) => {
    [...el.attributes]
      .filter((a) => /^(data-(ga|gtm|track|analytics|mkto|tealium)|onclick|onload|onerror)/i.test(a.name))
      .forEach((a) => el.removeAttribute(a.name));
  });
}

export default function transform(hookName, element, payload) {
  const document = (element && element.ownerDocument) || (payload && payload.document);
  if (!document) return;

  if (hookName === 'beforeTransform') {
    removeComments(document);
    removeOutsideMain(document);
    removeAll(document, CHROME_SELECTORS.join(', '));
    removeTrackingPixels(document);
    stripTrackingAttributes(document);
    removeEmptyHeadings(document);
    removeWhitespaceLinks(document);
    removeEmptyParagraphs(document, false);
    removeDecorativeHrs(document);
    removeEmptyContainers(document);
    normalizeLigatures(document);
  }

  if (hookName === 'afterTransform') {
    // Never touch comments here: XWalk field hints are comments written by parsers.
    removeAll(document, 'body style, body script, body noscript, body link, body iframe');
    removeTrackingPixels(document);
    removeEmptyParagraphs(document, true);
    normalizeLigatures(document);
  }
}
