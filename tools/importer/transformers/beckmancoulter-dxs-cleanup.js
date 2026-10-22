/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for beckmancoulter.com `dxs-service-and-supports` pages
 * (e.g. /en/products/dxs-service-and-supports/remote-services-and-diagnostics).
 *
 * Only runs when payload.template.name === 'dxs-service-and-supports' (every
 * import script loads all transformers in this folder).
 *
 * beforeTransform:
 *  - removes global chrome: UserWay widget, header/nav, search, country/language
 *    and gigya profile modals, breadcrumb/share/print bar, footer, OneTrust
 *    cookie banner, kampyle feedback button
 *  - removes <script>/<style>/<noscript>/<link>, empty <section> code wrappers,
 *    div.line-break spacers and "Empty heading" placeholder headings
 *  - removes empty spacer wrappers / &nbsp; paragraphs outside blocks
 *  - rewrites in-page anchors to EDS auto-generated heading ids
 *    (#IntelliServe -> #key-benefits-of-remote-desktop-sharing)
 *  - cleans the "Contact us" link (drops preview query params) and makes it a
 *    primary button (<p><strong><a></a></strong></p>)
 *  Block instance elements from template.blocks[] (and their ancestors) are
 *  never removed.
 *
 * afterTransform:
 *  - removes remaining non-content elements and tracking attributes
 *  (HTML comments are kept: they carry xwalk field hints)
 */

const TEMPLATE_NAME = 'dxs-service-and-supports';

// explicit anchor rewrites: source id -> EDS heading id
const ANCHOR_OVERRIDES = {
  IntelliServe: 'key-benefits-of-remote-desktop-sharing',
};

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
  // breadcrumb + share / print bar
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
  // spacers
  'div.line-break',
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
  return (text || '').replace(/[\s ]+/g, ' ').trim().toLowerCase();
}

/** EDS heading id slug: lowercase, non-alphanumerics to '-', collapse, trim */
function slugify(text) {
  return norm(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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
  return !!el.querySelector('img, picture, video, iframe, table, svg, input');
}

function isEmpty(el) {
  return !norm(el.textContent) && !hasMedia(el);
}

function isEmptyHeading(h) {
  return norm(h.textContent) === 'empty heading' && !hasMedia(h);
}

function removeChrome(element, remove) {
  CHROME_SELECTORS.forEach((sel) => {
    safeQueryAll(element, sel).forEach(remove);
  });

  // <nav> outside the content area (keep any carousel filter bars)
  safeQueryAll(element, 'nav').forEach((nav) => {
    if (!nav.closest('#main-container')) remove(nav);
  });

  // any remaining country/region chooser modal
  safeQueryAll(element, '.ui.modal').forEach((el) => {
    if (/Choose your country\/region and language/i.test(el.textContent || '')) remove(el);
  });

  // wrapper divs left holding only (now removed) inline scripts/styles
  safeQueryAll(element, 'body > div, body > span').forEach((el) => {
    if (el.querySelector('#main-container')) return;
    if (isEmpty(el)) remove(el);
  });
}

function removeEmptyHeadings(element, remove) {
  safeQueryAll(element, 'h1, h2, h3, h4, h5, h6').forEach((h) => {
    if (isEmptyHeading(h)) remove(h);
  });
}

function removeEmptySpacers(element, remove, protectedEls) {
  const inBlock = (el) => protectedEls.some((p) => p.contains(el));
  // &nbsp; spacer paragraphs in default content
  safeQueryAll(element, '#main-container p').forEach((p) => {
    if (!inBlock(p) && isEmpty(p)) remove(p);
  });
  // empty code / layout wrappers (section#demos, empty grids, page-content)
  safeQueryAll(
    element,
    '#main-container section, #main-container div.page-content, #main-container div.sublayout, #main-container div.content-container',
  ).forEach((el) => {
    if (isEmpty(el)) remove(el);
  });
}

/** first real heading in the element's top-level content block */
function headingFor(target, element) {
  if (/^H[1-6]$/.test(target.tagName) && !isEmptyHeading(target)) return target;
  const main = element.querySelector('#main-container') || element;
  let node = target;
  while (node && node.parentElement && node.parentElement !== main) {
    const parent = node.parentElement;
    if (parent.matches('div.sublayout') && parent.parentElement === main) break;
    node = parent;
  }
  const headings = safeQueryAll(node, 'h1, h2, h3, h4, h5, h6').filter((h) => !isEmptyHeading(h));
  return headings[0] || null;
}

function rewriteInPageAnchors(element) {
  safeQueryAll(element, 'a[href^="#"]').forEach((a) => {
    const id = (a.getAttribute('href') || '').slice(1);
    if (!id) return;
    if (ANCHOR_OVERRIDES[id]) {
      a.setAttribute('href', `#${ANCHOR_OVERRIDES[id]}`);
      return;
    }
    let target = null;
    try {
      target = element.querySelector(`#${CSS.escape(id)}`);
    } catch (e) {
      target = safeQueryAll(element, '[id]').find((el) => el.id === id) || null;
    }
    if (!target) return;
    const h = headingFor(target, element);
    const slug = h && slugify(h.textContent);
    if (slug) a.setAttribute('href', `#${slug}`);
  });
}

function fixContactLink(element) {
  const doc = element.ownerDocument;
  safeQueryAll(element, '#main-container a[href]').forEach((a) => {
    if (norm(a.textContent) !== 'contact us') return;
    const href = a.getAttribute('href') || '';
    if (/[?&](sc_database|preview|country|lang)=/i.test(href)) {
      const hashIdx = href.indexOf('#');
      const hash = hashIdx >= 0 ? href.slice(hashIdx) : '';
      const base = href.split(/[?#]/)[0];
      a.setAttribute('href', `${base}${hash}`);
    }
    a.removeAttribute('class');

    // primary button: <p><strong><a/></strong></p>, alone in its paragraph
    let strong = a.parentElement && a.parentElement.tagName === 'STRONG' ? a.parentElement : null;
    if (!strong) {
      strong = doc.createElement('strong');
      a.replaceWith(strong);
      strong.append(a);
    }
    const parent = strong.parentElement;
    const alone = parent && parent.tagName === 'P'
      && [...parent.childNodes].every((n) => n === strong || (n.nodeType === 3 && !norm(n.textContent)));
    if (!alone) {
      const p = doc.createElement('p');
      if (parent && parent.tagName === 'P') parent.after(p);
      else strong.before(p);
      p.append(strong);
    }
  });
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  if (!template || template.name !== TEMPLATE_NAME) return;

  if (hookName === 'beforeTransform') {
    const protectedEls = collectProtected(element, template);
    const remove = makeRemover(element, protectedEls);
    // anchors first: target ids (e.g. span#IntelliServe) must still exist
    rewriteInPageAnchors(element);
    removeChrome(element, remove);
    removeEmptyHeadings(element, remove);
    fixContactLink(element);
    removeEmptySpacers(element, remove, protectedEls);
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
