/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for beckmancoulter.com `solutions` pages
 * (e.g. /en/solutions/host-response-infection).
 *
 * Only runs when payload.template.name === 'solutions' (every import script
 * loads all transformers in this folder).
 *
 * beforeTransform:
 *  - removes global chrome: UserWay widget, header/nav, search, country/language
 *    and gigya profile modals, breadcrumb/share bar, footer, OneTrust cookie
 *    banner, kampyle feedback button
 *  - removes inline <script>/<style>/<link> elements and the wrapper divs that
 *    only hold them
 *  - removes the Marketo form (deferred) and its MktoForms2 wrappers/iframe,
 *    keeping the "Speak to a Representative about MeMed BV" heading
 *  - removes "Empty heading" placeholder headings
 *  - removes the decorative <hr> inside div.intro-content (becomes the
 *    next section's divider style)
 *  - demotes every h1 outside the hero (div.large-header-banner) to h2
 *  - pulls decorative icons out of icon headings into their own paragraph
 *  - removes empty spacer wrappers (empty div.page-content, section#demos,
 *    empty div.wysiwyg-content)
 *  Block instance elements from template.blocks[] are never removed.
 *
 * afterTransform:
 *  - removes remaining non-content elements and tracking attributes
 *  (HTML comments are kept: they carry xwalk field hints)
 */

const TEMPLATE_NAME = 'solutions';

const CHROME_SELECTORS = [
  // UserWay accessibility widget
  '.uw-sl',
  '.uwy',
  '[class*="userway"]',
  '[class^="uw-s"]',
  '.uwaw-dictionary-tooltip',
  // header / navigation / search
  'header',
  '.nav-container',
  '#universal-navigation',
  '#mobile-universal-nav',
  '#dx-navigation',
  '.primary-navigation',
  '.mobile-subnav-header',
  '#mobile-language-select-btn',
  '.global-search-spacer',
  '.coveo-global-search',
  // country selector + profile (gigya) modals
  '.country-language-modal',
  '.country-language-selector',
  '.gigya-prefs-modal',
  '#gigya-prefs-modal',
  // breadcrumb + share bar
  '.photo-header-container',
  '.breadcrumb-container',
  '.breadcrumbs',
  '.share-container',
  // footer
  'footer',
  '.footer-container',
  '.universal-footer',
  '.universal-footer-text',
  // cookie banner / feedback widgets
  '#onetrust-consent-sdk',
  '.onetrust-pc-dark-filter',
  '#kampyleButtonContainer',
  '.kampyle_button',
  // Marketo form (deferred to the forms add-on)
  'form.mktoForm',
  'div.mktoForm',
  '[id^="mktoForm_"]',
  '#mktoStyleLoaded',
  '#MktoForms2XDIframe',
  // inline code
  'script',
  'style',
  'noscript',
  'link',
];

function safeQueryAll(root, selector) {
  try {
    return [...root.querySelectorAll(selector)];
  } catch (e) {
    return [];
  }
}

function norm(text) {
  return (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

/** elements matching template block instance selectors must survive cleanup */
function collectProtected(element, template) {
  const set = new Set();
  ((template && template.blocks) || []).forEach((block) => {
    (block.instances || []).forEach((sel) => {
      safeQueryAll(element, sel).forEach((el) => set.add(el));
    });
  });
  return [...set];
}

function makeRemover(element, protectedEls) {
  const main = element.querySelector('#main-container');
  return (el) => {
    if (!el || !el.isConnected) return;
    if (el === main || (main && el.contains(main))) return;
    if (protectedEls.some((p) => p === el || el.contains(p))) return;
    el.remove();
  };
}

function hasMedia(el) {
  return !!el.querySelector('img, picture, video, iframe, table, svg');
}

function isEmpty(el) {
  return !norm(el.textContent) && !hasMedia(el);
}

function removeChrome(element, remove) {
  CHROME_SELECTORS.forEach((sel) => {
    safeQueryAll(element, sel).forEach(remove);
  });

  // top-level <nav> outside the content area (keep the carousel filter bar)
  safeQueryAll(element, 'nav').forEach((nav) => {
    if (!nav.closest('#main-container')) remove(nav);
  });

  // any remaining country/region chooser modal
  safeQueryAll(element, '.ui.modal').forEach((el) => {
    if (/Choose your country\/region and language/i.test(el.textContent || '')) remove(el);
  });

  // wrapper divs left holding only (now removed) inline scripts/styles or
  // MktoForms2 code: no text, no media, no element children
  safeQueryAll(element, 'body > div, #main-container div').forEach((div) => {
    if (div.id === 'main-container') return;
    if (!div.children.length && !norm(div.textContent)) remove(div);
  });
}

function removeEmptyHeadings(element, remove) {
  safeQueryAll(element, 'h1, h2, h3, h4, h5, h6').forEach((h) => {
    if (norm(h.textContent) === 'empty heading' && !hasMedia(h)) remove(h);
  });
}

function removeIntroRules(element) {
  // the source's trailing rule inside intro-content would open a stray section
  safeQueryAll(element, 'div.intro-content hr').forEach((hr) => hr.remove());
}

function renameTag(el, tagName) {
  const doc = el.ownerDocument;
  const next = doc.createElement(tagName);
  [...el.attributes].forEach(({ name, value }) => next.setAttribute(name, value));
  while (el.firstChild) next.append(el.firstChild);
  el.replaceWith(next);
  return next;
}

function demoteBodyH1s(element) {
  safeQueryAll(element, 'h1').forEach((h1) => {
    if (h1.closest('div.large-header-banner')) return;
    renameTag(h1, 'h2');
  });
}

/**
 * h2 > img + br + span(text)  =>  p > img  +  h2(text)
 * (Advancing Diagnostic Biomarkers, Partnering..., Improved Diagnostic Efficiency)
 */
function extractHeadingIcons(element) {
  const doc = element.ownerDocument;
  safeQueryAll(element, 'div.page-content h2, div.page-content h3').forEach((h) => {
    if (h.closest('div.education-filter-carousel')) return;
    const imgs = [...h.querySelectorAll('img')];
    if (!imgs.length || !norm(h.textContent)) return;
    const p = doc.createElement('p');
    imgs.forEach((img) => p.append(img));
    h.before(p);
    safeQueryAll(h, 'br').forEach((br) => br.remove());
    const text = (h.textContent || '').replace(/\s+/g, ' ').trim();
    h.textContent = text;
  });
}

function removeEmptySpacers(element, remove) {
  safeQueryAll(
    element,
    '#main-container div.page-content, #main-container div.wysiwyg-content, #main-container section',
  ).forEach((el) => {
    if (isEmpty(el)) remove(el);
  });
}

// Showcase backgrounds come from stylesheets that removeChrome strips, so
// record each computed background URL inline before any removal.
function preserveShowcaseBackgrounds(element) {
  const view = element.ownerDocument && element.ownerDocument.defaultView;
  const urlOf = (el) => {
    const inline = (el.getAttribute('style') || '').match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    if (inline) return inline[1].replace(/&amp;/g, '&');
    if (!view || !view.getComputedStyle) return '';
    const computed = (view.getComputedStyle(el).backgroundImage || '').match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    return computed ? computed[1] : '';
  };
  // stored on the showcase container: the empty .floating-bg div itself is
  // dropped later by removeEmptySpacers
  safeQueryAll(element, '.double-showcase-feature, .tripple-showcase-feature').forEach((el) => {
    if (el.getAttribute('data-bg-src')) return;
    const src = [el, ...el.querySelectorAll('.floating-bg')].map(urlOf).find(Boolean);
    if (src) el.setAttribute('data-bg-src', src);
  });
  // feature icons are inline backgrounds on empty .custom-icon divs (also dropped later)
  safeQueryAll(element, '.data-visualization-container .chart-feature').forEach((el) => {
    if (el.getAttribute('data-icon-src')) return;
    const src = [...el.querySelectorAll('.custom-icon, .chart-graph')].map(urlOf).find(Boolean);
    if (src) el.setAttribute('data-icon-src', src);
  });
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  if (!template || template.name !== TEMPLATE_NAME) return;

  // onLoad runs on the live page; html2md later works on a style-less copy
  if (hookName === 'onLoad') {
    preserveShowcaseBackgrounds(element);
    return;
  }

  if (hookName === 'beforeTransform') {
    preserveShowcaseBackgrounds(element);
    const protectedEls = collectProtected(element, template);
    const remove = makeRemover(element, protectedEls);
    removeChrome(element, remove);
    removeEmptyHeadings(element, remove);
    removeIntroRules(element);
    demoteBodyH1s(element);
    extractHeadingIcons(element);
    removeEmptySpacers(element, remove);
  }

  if (hookName === 'afterTransform') {
    WebImporter.DOMUtils.remove(element, [
      'script',
      'noscript',
      'style',
      'link',
      'iframe',
      'input',
      'form',
      '.uw-sl',
      '.uwy',
      '#onetrust-consent-sdk',
      '#kampyleButtonContainer',
      '.kampyle_button',
    ]);

    safeQueryAll(element, '*').forEach((el) => {
      [...el.attributes].forEach(({ name }) => {
        if (
          name.startsWith('data-gtm')
          || name.startsWith('data-uw')
          || name.startsWith('data-track')
          || name === 'onclick'
        ) {
          el.removeAttribute(name);
        }
      });
    });
  }
}
