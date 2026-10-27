/* eslint-disable */
/* global WebImporter */

/**
 * Beckman Coulter cleanup transformer (mybeckman.in home template, Tailwind).
 *
 * Adapted from the inner-page (service template) cleanup in
 * migration-work/importer-tooling/lib/mybeckman/transformers/.
 *
 * Page shape: body > #wrapper holds header#mainNav, div#main and .footer2023.
 * Home content lives directly under #main > div.main-holder as Tailwind
 * wrappers (hero, jump-to nav, #latest, .gradient-section-background > #topics,
 * diagnostics bar, #service, #about).
 *
 * Removes non-authorable chrome: everything outside #main (header#mainNav,
 * Coveo search, .footer2023 + Marketo newsletter form, TrustArc consent
 * banner, hidden Marketo form + XD iframe, skip link, hidden inputs,
 * font-resize iframe), plus inside #main the empty .custome-container,
 * #ModalPopup, the mobile jump-nav <select> duplicate (only when it lives
 * outside the section-2 nav), the promo-card loading skeletons, Font Awesome
 * icons, tracking pixels/attributes and script/style/noscript/link/iframe.
 *
 * Kept on purpose: everything in the template section selectors, the hero
 * <img>, promo card images, the about background, the diagnostics logo,
 * inline SVG / data-URI SVG icons of the service cards.
 *
 * Default content (template defaultContent selectors) is normalised into
 * plain headings/paragraphs/links: Tailwind classes dropped, nested spans
 * unwrapped, "->" arrow glyphs removed from links.
 *
 * Elements tagged by the sections transformer ([data-excat-section]),
 * protected section breaks (hr[data-excat-section-break]), section end
 * markers (hr[data-excat-section-end]), template section / block / default
 * content elements and their ancestors are never removed, so the result is
 * the same whichever transformer runs first.
 */

const BASE_PROTECTED = [
  '[data-excat-section]',
  'hr[data-excat-section-break]',
  'hr[data-excat-section-end]',
  '#main',
  '#main > div.main-holder',
];

const CHROME_SELECTORS = [
  // header / nav / search (outside #main only; section 2 is a <nav> in #main)
  'header',
  '#mainNav',
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
  // misc overlays / helpers
  '.flash-message',
  '.MaskOverlay',
  '#ModalPopup',
  '.font-resize-helper',
  // empty Sitecore wrapper inside #main
  '#main .custome-container',
  // promo card loading skeletons (placeholder data-URI image)
  '#main [role="status"]',
  '#latest div.animate-pulse',
  // Font Awesome icons
  '#main span.fa',
  '#main span.far',
  '#main span.fas',
  '#main i.fa',
  '#main i.far',
  '#main i.fas',
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

const MEDIA_SELECTOR = 'img, picture, video, iframe, form, svg, select';
const ARROW_TEXT = /^\s*(->|-&gt;|→|›|»)\s*$/;
const ARROW_TRAILING = /\s*(->|→)\s*$/;
const SHOW_TEXT = 4;
const SHOW_COMMENT = 128;

const FALLBACK_TEMPLATE = {
  sections: [
    { id: '1', selector: ['#main > div.main-holder > div.relative.justify-end.sm\\:flex'], defaultContent: [] },
    { id: '2', selector: ['#main > div.main-holder > nav.sticky.top-4.z-20.hidden.items-center.md\\:\\!flex'], defaultContent: [] },
    { id: '3', selector: ['#latest'], defaultContent: ['#latest > h2'] },
    { id: '4', selector: ['#main > div.main-holder > div.gradient-section-background'], defaultContent: ['#topics > div:first-child'] },
    { id: '5', selector: ['#main > div.main-holder > div.mx-auto.bg-brand-gray-50.p-2'], defaultContent: [] },
    { id: '6', selector: ['#service'], defaultContent: ['#service > div > div:first-child'] },
    { id: '7', selector: ['#about'], defaultContent: [] },
  ],
  blocks: [],
};

function getTemplate(payload) {
  const tpl = payload && payload.template;
  if (tpl && Array.isArray(tpl.sections) && tpl.sections.length) return tpl;
  return FALLBACK_TEMPLATE;
}

function toList(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function safeQueryAll(root, selector) {
  try {
    return [...root.querySelectorAll(selector)];
  } catch (e) {
    return [];
  }
}

/** Template-derived elements that must survive cleanup. */
function collectProtected(document, template) {
  const set = new Set();
  const add = (sel) => safeQueryAll(document, sel).forEach((el) => set.add(el));
  BASE_PROTECTED.forEach(add);
  (template.sections || []).forEach((s) => {
    toList(s.selector).forEach(add);
    toList(s.defaultContent).forEach(add);
  });
  (template.blocks || []).forEach((b) => toList(b.instances).forEach(add));
  return set;
}

function makeGuard(document, template) {
  const protectedEls = collectProtected(document, template);
  const isProtected = (el) => {
    if (!el || el.nodeType !== 1) return false;
    for (const p of protectedEls) {
      if (p === el || (p.isConnected && el.contains(p))) return true;
    }
    return el.matches(BASE_PROTECTED.join(', ')) || !!el.querySelector(BASE_PROTECTED.slice(0, 3).join(', '));
  };
  const safeRemove = (el) => {
    if (el && el.parentNode && !isProtected(el)) el.remove();
  };
  const removeAll = (root, selector) => {
    safeQueryAll(root, selector).forEach((el) => {
      if (el.isConnected) safeRemove(el);
    });
  };
  return { isProtected, safeRemove, removeAll };
}

function normText(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
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
function removeOutsideMain(document, guard) {
  const main = document.querySelector('#main');
  if (!main || !document.body) return;
  let node = main;
  while (node && node !== document.body) {
    const parent = node.parentElement;
    if (!parent) break;
    [...parent.children].forEach((sib) => {
      if (sib !== node) guard.safeRemove(sib);
    });
    node = parent;
  }
}

/** Mobile jump-nav <select> duplicate, unless it sits inside the section-2 nav. */
function removeMobileJumpNav(document, guard, template) {
  const navSection = (template.sections || [])[1];
  const navEls = navSection ? toList(navSection.selector).flatMap((s) => safeQueryAll(document, s)) : [];
  safeQueryAll(document, '#main select#scrollToMobile, #main select').forEach((select) => {
    if (navEls.some((n) => n.contains(select))) return;
    // remove the whole wrapper (label + select) when it only holds the jump select
    const wrapper = select.closest('#main > div.main-holder > div');
    if (wrapper && !navEls.some((n) => wrapper.contains(n))
      && !wrapper.querySelector('a[href], img, h1, h2, h3, h4, h5, h6, p')) {
      guard.safeRemove(wrapper);
      return;
    }
    const label = select.id ? document.querySelector(`label[for="${select.id}"]`) : null;
    if (label) guard.safeRemove(label);
    const prev = select.previousElementSibling;
    if (prev && prev.matches('label.sr-only')) guard.safeRemove(prev);
    guard.safeRemove(select);
  });
}

function removeTrackingPixels(document, guard) {
  document.querySelectorAll('body img').forEach((img) => {
    const w = img.getAttribute('width');
    const h = img.getAttribute('height');
    const src = img.getAttribute('src') || '';
    if ((w === '0' || w === '1') && (h === '0' || h === '1')) guard.safeRemove(img);
    else if (TRACKING_SRC.test(src)) guard.safeRemove(img);
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

function removeEmptyParagraphs(document, guard, strict) {
  document.querySelectorAll('body p').forEach((p) => {
    if (strict) {
      // only paragraphs made purely of whitespace text (never touch comments/field hints)
      const onlyText = [...p.childNodes].every((n) => n.nodeType === 3);
      if (onlyText && normText(p.textContent) === '') guard.safeRemove(p);
      return;
    }
    if (p.querySelector('img, picture, video, iframe, svg, input, select, textarea, a[href]')) return;
    if (normText(p.textContent) === '') guard.safeRemove(p);
  });
}

function removeWhitespaceLinks(document, guard) {
  document.querySelectorAll('body a').forEach((a) => {
    if (a.querySelector('img, picture, video, svg, iframe')) return;
    if (normText(a.textContent) === '') guard.safeRemove(a);
  });
}

function removeDecorativeHrs(document) {
  document
    .querySelectorAll('body hr:not([data-excat-section-break]):not([data-excat-section-end])')
    .forEach((hr) => hr.remove());
}

/** Drop text-empty, media-less direct children of the main holder. */
function removeEmptyContainers(document, guard) {
  safeQueryAll(document, '#main > div.main-holder > *').forEach((el) => {
    if (!el.isConnected || el.matches('hr')) return;
    if (el.matches(MEDIA_SELECTOR) || el.querySelector(MEDIA_SELECTOR)) return;
    if (normText(el.textContent) === '') guard.safeRemove(el);
  });
}

function stripTrackingAttributes(document) {
  document.querySelectorAll('body *').forEach((el) => {
    [...el.attributes]
      .filter((a) => /^(data-(ga|gtm|track|analytics|mkto|tealium)|onclick|onload|onerror)/i.test(a.name))
      .forEach((a) => el.removeAttribute(a.name));
  });
}

function unwrap(el) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  el.remove();
}

/** Trim leading/trailing whitespace text inside a text-level element. */
function trimEdges(el) {
  const first = el.firstChild;
  if (first && first.nodeType === 3) first.nodeValue = first.nodeValue.replace(/^\s+/, '');
  const last = el.lastChild;
  if (last && last.nodeType === 3) last.nodeValue = last.nodeValue.replace(/\s+$/, '');
}

/**
 * Default content -> plain headings / paragraphs / links: drop Tailwind
 * classes, unwrap nested spans, remove "->" arrow glyphs from links.
 */
function normalizeDefaultContent(document, template) {
  (template.sections || []).forEach((section) => {
    toList(section.defaultContent).forEach((sel) => {
      safeQueryAll(document, sel).forEach((root) => {
        // arrow glyph spans / text inside links
        root.querySelectorAll('a').forEach((a) => {
          [...a.querySelectorAll('span, div')].forEach((s) => {
            if (ARROW_TEXT.test(s.textContent) && !s.querySelector(MEDIA_SELECTOR)) s.remove();
          });
          const walker = document.createTreeWalker(a, SHOW_TEXT);
          const texts = [];
          let n = walker.nextNode();
          while (n) {
            texts.push(n);
            n = walker.nextNode();
          }
          texts.forEach((t) => {
            if (ARROW_TEXT.test(t.nodeValue)) t.remove();
            else t.nodeValue = t.nodeValue.replace(ARROW_TRAILING, ' ');
          });
        });
        // unwrap nested spans (deepest first)
        [...root.querySelectorAll('span')].reverse().forEach(unwrap);
        // drop Tailwind / presentational attributes
        [root, ...root.querySelectorAll('*')].forEach((el) => {
          el.removeAttribute('class');
          el.removeAttribute('style');
          el.removeAttribute('id');
        });
        const textEls = 'h1, h2, h3, h4, h5, h6, p, a, li';
        [root, ...root.querySelectorAll(textEls)].filter((el) => el.matches(textEls)).forEach((el) => {
          el.normalize();
          trimEdges(el);
        });
      });
    });
  });
}

export default function transform(hookName, element, payload) {
  const document = (element && element.ownerDocument) || (payload && payload.document);
  if (!document) return;
  const template = getTemplate(payload);

  if (hookName === 'beforeTransform') {
    const guard = makeGuard(document, template);
    removeComments(document);
    removeOutsideMain(document, guard);
    guard.removeAll(document, CHROME_SELECTORS.join(', '));
    removeMobileJumpNav(document, guard, template);
    removeTrackingPixels(document, guard);
    stripTrackingAttributes(document);
    removeWhitespaceLinks(document, guard);
    removeEmptyParagraphs(document, guard, false);
    removeDecorativeHrs(document);
    removeEmptyContainers(document, guard);
    normalizeDefaultContent(document, template);
    normalizeLigatures(document);
  }

  if (hookName === 'afterTransform') {
    const guard = makeGuard(document, { sections: [], blocks: [] });
    // Never touch comments here: XWalk field hints are comments written by parsers.
    guard.removeAll(document, 'body style, body script, body noscript, body link, body iframe');
    removeTrackingPixels(document, guard);
    removeEmptyParagraphs(document, guard, true);
    normalizeLigatures(document);
  }
}
