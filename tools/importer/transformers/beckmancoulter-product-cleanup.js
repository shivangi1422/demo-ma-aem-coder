/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for beckmancoulter.com PRODUCT pages:
 *  - product-detail-informatics (/en/products/advanced-informatics/*)
 *  - product-detail-automation
 *  - product-category
 *
 * Every import script loads all transformers in this folder, so this one
 * early-returns unless payload.template.name is in PRODUCT_TEMPLATES.
 *
 * onLoad (live page, computed styles available):
 *  - records CSS background images that analysed blocks need
 *    (showcase .floating-bg -> data-bg-src on the showcase container;
 *    icons on empty divs -> data-icon-src on the nearest item)
 *
 * beforeTransform:
 *  - same background recording (inline style / child <img> fallback)
 *  - in-page #anchor links -> EDS heading slug of the target
 *  - removes global chrome: UserWay, header/nav outside #main-container,
 *    breadcrumb/share/print sublayout, footer, OneTrust, kampyle feedback,
 *    country/region and gigya profile modals
 *  - removes <script>/<style>/<noscript>/<link>, empty <section> code
 *    wrappers, div.line-break spacers, "Empty heading" placeholders,
 *    slider prev/next/dots controls and owl/slick clones, the tabs' mobile
 *    "Filter By" dropdown and empty lists
 *  - keeps the hero's H1 as the only H1 (others demoted to H2)
 *  - merges the hero's extra .content-container blocks (availability notice,
 *    CTA) into the first one, which is all hero-split-left reads
 *  - splits eyebrow labels / sub-headers out of headings in DEFAULT content
 *    only (cards-media-list handles `h2 .label`, cards-grid-showcase handles
 *    `.intro-content .sub-header` themselves)
 *  - strips Sitecore preview params (sc_database, preview, country, lang) and
 *    GA linker params (_ga, _gl); maps Sitecore item-id links (/?item=web:{GUID})
 *    via ITEM_LINKS; same-page hash routes (#/connections) and tab ids
 *    (#tab-x) point at the tab label slug
 *  - top-level hero shop widgets: single "Product Variants" selector -> plain
 *    paragraph, "Request more info" add-to-quote button -> primary link
 *    (REQUEST_INFO_HREF), icon jump-link table -> list of #tab links,
 *    "Added"/"Error" status icons and loaders removed
 *  - Documents tab: client-side search UI removed (Sort dropdown, empty
 *    techdocssearch results); "View all documents" link kept
 *  - .tb_button / ws_toolbar editor junk removed
 *  - splits <br>-separated disclaimer lines and <br><br> paragraphs into
 *    paragraphs; link-only headings in table cells become paragraphs
 *  - removes empty spacer wrappers / &nbsp; paragraphs
 *  Block instance elements from template.blocks[] (and their ancestors) plus
 *  ALWAYS_PROTECTED (Genially iframes) are collected first and never removed.
 *
 * afterTransform:
 *  - removes leftover non-content elements, tracking and temp attributes
 *  (HTML comments are kept: they carry xwalk field hints)
 */

// Templates this transformer runs for - extend here. (Top-level const, not an
// ES `export`: the transformer validator evaluates the file as a classic
// script where only `export default` is rewritten.)
const PRODUCT_TEMPLATES = [
  'product-detail-informatics',
  'product-detail-automation',
  'product-category',
];

const PREVIEW_PARAMS = ['sc_database', 'preview', 'country', 'lang', '_ga', '_gl'];

// embed instances that must survive every cleanup step
const ALWAYS_PROTECTED = ['iframe[src*="genial.ly"]', 'iframe[src*="genially"]'];

// Sitecore item-id links (/?item=web:{GUID}@en) -> EDS paths (from the analyses)
const ITEM_LINKS = {
  '72F8A13D-4071-49C6-8E5C-2A6948EF4047': '/en/products/immunoassay',
};

// "Request more info" add-to-quote button has no href in the source; the
// DxA analysis points it at the request-quote portal used in the Configurations tab
const REQUEST_INFO_HREF = 'https://www.beckmancoulter.com/wsrportal/page/requestQuote';

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
  // breadcrumb + share / print bar (incl. the sublayout that holds it)
  'div.sublayout.photo-header-container',
  '.photo-header-container',
  '.breadcrumb-container',
  '.breadcrumbs',
  '.share-container',
  '.print-container',
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
  '[id^="kampyle"]',
  // spacers
  'div.line-break',
  // slider controls / clones
  '.owl-nav',
  '.owl-prev',
  '.owl-next',
  '.owl-dots',
  '.owl-item.cloned',
  '.slick-prev',
  '.slick-next',
  '.slick-dots',
  '.slick-cloned',
  '.swiper-button-prev',
  '.swiper-button-next',
  '.swiper-pagination',
  // tabs: mobile "Filter By" dropdown duplicates the tab labels
  '.tabs-mobile-dropdown',
  // Documents tab: client-side tech-doc search UI (link is kept)
  '.filters-dropdowns',
  '#sort-dropdown-header',
  '.techdocssearch',
  // rich-text editor toolbar junk inside tab panels
  '.tb_button',
  '[class*="tb_button"]',
  '[id^="ws_toolbar"]',
  '[class*="ws_toolbar"]',
  // shop widget status ("Added" / "Error") and spinners
  '.add-to-quote i.icon',
  '.add-to-quote .loader',
  '.product-links i.checkmark.icon',
  '.product-links i.exclamation.icon',
  // inline code
  'script',
  'style',
  'noscript',
  'link',
];

const TEMP_ATTR_PREFIX = 'data-excat-';

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

function contentRoot(element) {
  return element.querySelector('#main-container') || element;
}

/** elements matching template block instance selectors must survive cleanup */
function collectProtected(element, template) {
  const set = new Set();
  ALWAYS_PROTECTED.forEach((sel) => safeQueryAll(element, sel).forEach((el) => set.add(el)));
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
    if (el === element || el === main || (main && el.contains(main))) return;
    if (protectedEls.some((p) => p === el || el.contains(p))) return;
    el.remove();
  };
}

function hasMedia(el) {
  return !!el.querySelector('img, picture, video, iframe, table, svg, input, select, textarea, hr');
}

function isEmpty(el) {
  return !norm(el.textContent) && !hasMedia(el);
}

function isEmptyHeading(h) {
  return norm(h.textContent) === 'empty heading' && !hasMedia(h);
}

function hasTempAttr(el) {
  return [...el.attributes].some(({ name }) => name.startsWith(TEMP_ATTR_PREFIX)
    || name === 'data-bg-src' || name === 'data-icon-src');
}

function renameTag(el, tagName) {
  const doc = el.ownerDocument;
  const next = doc.createElement(tagName);
  [...el.attributes].forEach(({ name, value }) => next.setAttribute(name, value));
  while (el.firstChild) next.append(el.firstChild);
  el.replaceWith(next);
  return next;
}

/* ------------------------------------------------------------------------ */
/* background images                                                        */
/* ------------------------------------------------------------------------ */

const URL_RE = /url\(\s*['"]?([^'")]+)['"]?\s*\)/i;

function bgUrlOf(el) {
  if (!el || !el.getAttribute) return '';
  const inline = (el.getAttribute('style') || '').match(URL_RE);
  if (inline && inline[1]) return inline[1].replace(/&amp;/g, '&').trim();
  try {
    const view = el.ownerDocument && el.ownerDocument.defaultView;
    if (!view || !view.getComputedStyle) return '';
    const computed = (view.getComputedStyle(el).backgroundImage || '').match(URL_RE);
    return computed && computed[1] ? computed[1].trim() : '';
  } catch (e) {
    return '';
  }
}

const SHOWCASE_SELECTOR = 'div.double-showcase-feature, div.tripple-showcase-feature';
const PHOTO_FEATURE_SELECTOR = 'div.photo-feature';
const PROMO_SELECTOR = 'div.photo-hero-promotional-banner';

/**
 * Clickable cards (product cards, photo cards) navigate via onclick JS.
 * Keep the onclick attribute (stripped only in afterTransform, after the
 * parsers ran) and also record its destination as data-href on the card.
 * Cards whose link is "#" are left for the parser to decide.
 */
function recordClickTargets(element) {
  safeQueryAll(contentRoot(element), '[onclick]').forEach((el) => {
    if (el.getAttribute('data-href')) return;
    const onclick = el.getAttribute('onclick') || '';
    const m = onclick.match(/location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i)
      || onclick.match(/window\.open\(\s*['"]([^'"]+)['"]/i)
      || onclick.match(/openUrl\(\s*['"]([^'"]+)['"]/i);
    if (m && m[1]) el.setAttribute('data-href', m[1]);
  });
}

/**
 * product-list: its heading ("Full Portfolio of ...") is default content of
 * the section, not part of the cards block -> move it in front of the block.
 */
function liftProductListHeadings(element) {
  safeQueryAll(element, 'div.product-list').forEach((list) => {
    const heading = list.querySelector(':scope > .content-container > .heading, :scope > .heading');
    if (!heading || !heading.querySelector('h1, h2, h3, h4, h5, h6')) return;
    list.before(heading);
  });
  // decorative <hr> inside product cards would open a stray section if a
  // card survived unparsed (the analysis drops it)
  safeQueryAll(element, 'div.product-list .product-card hr').forEach((hr) => hr.remove());
}
const PHOTO_BG_SELECTOR = '.image-container.bg-parallax, .bg-parallax, .image-container';

/**
 * Once recorded, the background must not also be authored as an inline image:
 * drop <img>s that are direct children of the photo-feature background holder
 * when they repeat the recorded URL (scraped/parallax copies).
 */
function dropRecordedBackgroundImages(element) {
  safeQueryAll(element, `${PHOTO_FEATURE_SELECTOR}[data-bg-src]`).forEach((el) => {
    const src = el.getAttribute('data-bg-src');
    safeQueryAll(el, PHOTO_BG_SELECTOR).forEach((holder) => {
      safeQueryAll(holder, ':scope > img[src]').forEach((img) => {
        const s = (img.getAttribute('src') || '').replace(/&amp;/g, '&');
        if (s === src || s.split('?')[0] === src.split('?')[0]) img.remove();
      });
    });
  });
}
const ITEM_SELECTOR = [
  '.chart-feature',
  '.feature-content',
  '.showcase-feature',
  '.product-card',
  '.photo-card',
  '.card',
  '.owl-item',
  '.item',
  'li',
].join(', ');

function preserveBackgrounds(element, protectedEls) {
  // showcase background: stored on the container (the empty .floating-bg
  // div is dropped later by empty-wrapper removal)
  safeQueryAll(element, SHOWCASE_SELECTOR).forEach((el) => {
    if (el.getAttribute('data-bg-src')) return;
    const bgs = [...el.querySelectorAll('.floating-bg')];
    let src = [...bgs, el].map(bgUrlOf).find(Boolean);
    if (!src) {
      const img = bgs.map((b) => b.querySelector('img[src]')).find(Boolean);
      src = img ? img.getAttribute('src') : '';
    }
    if (src) el.setAttribute('data-bg-src', src);
  });

  // photo-feature (image-panel section): inline background on
  // .image-container.bg-parallax -> data-bg-src on div.photo-feature
  safeQueryAll(element, PHOTO_FEATURE_SELECTOR).forEach((el) => {
    if (el.getAttribute('data-bg-src')) return;
    const holders = safeQueryAll(el, PHOTO_BG_SELECTOR);
    let src = [...holders, el].map(bgUrlOf).find(Boolean);
    if (!src) {
      const img = holders.map((h) => h.querySelector(':scope > img[src]')).find(Boolean);
      src = img ? img.getAttribute('src') : '';
    }
    if (src) el.setAttribute('data-bg-src', src);
  });

  // promotional banner (hero-promo parser): background on the banner itself
  safeQueryAll(element, PROMO_SELECTOR).forEach((el) => {
    if (el.getAttribute('data-bg-src')) return;
    let src = [el, ...el.querySelectorAll(':scope > .image-container, :scope > .bg-parallax, :scope > .floating-bg')]
      .map(bgUrlOf).find(Boolean);
    if (!src) {
      const img = el.querySelector(':scope > img[src], :scope > picture img[src]');
      src = img ? img.getAttribute('src') : '';
    }
    if (src) el.setAttribute('data-bg-src', src);
  });

  // other backgrounds inside analysed blocks
  protectedEls.forEach((block) => {
    if (!block.isConnected || block.matches(SHOWCASE_SELECTOR)) return;
    [block, ...block.querySelectorAll('div, span, a, i')].forEach((el) => {
      if (el.closest(SHOWCASE_SELECTOR)) return;
      if (el.getAttribute('data-bg-src') || el.getAttribute('data-icon-src')) return;
      // cheap pre-filter in the copied DOM: only inline styles exist there
      const style = el.getAttribute('style') || '';
      const view = el.ownerDocument && el.ownerDocument.defaultView;
      const liveStyles = !!(view && view.getComputedStyle && el.ownerDocument.styleSheets
        && el.ownerDocument.styleSheets.length);
      if (!/url\(/i.test(style) && !liveStyles) return;
      const src = bgUrlOf(el);
      if (!src || /^data:/i.test(src)) return;
      if (isEmpty(el)) {
        // icon on an empty div -> nearest item (inside the block)
        let holder = el.parentElement && el.parentElement.closest(ITEM_SELECTOR);
        if (!holder || !block.contains(holder)) holder = el.parentElement || block;
        if (!holder.getAttribute('data-icon-src')) holder.setAttribute('data-icon-src', src);
      } else {
        el.setAttribute('data-bg-src', src);
      }
    });
  });
}

/* ------------------------------------------------------------------------ */
/* links                                                                    */
/* ------------------------------------------------------------------------ */

function stripPreviewParams(href) {
  if (!href || !/[?&]/.test(href)) return href;
  const hashIdx = href.indexOf('#');
  const hash = hashIdx >= 0 ? href.slice(hashIdx) : '';
  const beforeHash = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
  const qIdx = beforeHash.indexOf('?');
  if (qIdx < 0) return href;
  const base = beforeHash.slice(0, qIdx);
  const query = beforeHash.slice(qIdx + 1);
  const kept = query.split('&').filter((pair) => {
    if (!pair) return false;
    const key = decodeURIComponentSafe(pair.split('=')[0]).toLowerCase();
    return !PREVIEW_PARAMS.includes(key);
  });
  return `${base}${kept.length ? `?${kept.join('&')}` : ''}${hash}`;
}

function decodeURIComponentSafe(str) {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
}

function cleanLinks(element) {
  safeQueryAll(element, 'a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    const next = stripPreviewParams(href);
    if (next !== href) a.setAttribute('href', next);
  });
}

/** heading text as the parsers will author it (eyebrows / sub-headers removed) */
function headingText(h) {
  const clone = h.cloneNode(true);
  clone.querySelectorAll('.label, .sub-header, .data-uw-rm-autofix-hide').forEach((s) => s.remove());
  return clone.textContent;
}

/** first real heading at/after the anchor target */
function headingFor(target, element) {
  if (/^H[1-6]$/.test(target.tagName) && !isEmptyHeading(target)) return target;
  const inner = safeQueryAll(target, 'h1, h2, h3, h4, h5, h6').find((h) => !isEmptyHeading(h));
  if (inner) return inner;
  // next heading in document order
  const all = safeQueryAll(contentRoot(element), 'h1, h2, h3, h4, h5, h6')
    .filter((h) => !isEmptyHeading(h));
  return all.find((h) => target.compareDocumentPosition(h) & 4 /* FOLLOWING */) || null;
}

function findById(element, id) {
  return safeQueryAll(element, '[id]').find((el) => el.id === id)
    || safeQueryAll(element, 'a[name]').find((el) => el.getAttribute('name') === id)
    || null;
}

function rewriteInPageAnchors(element, url) {
  let pagePath = '';
  try {
    pagePath = url ? new URL(url).pathname.replace(/\/$/, '') : '';
  } catch (e) {
    pagePath = '';
  }
  const tabs = collectTabSlugs(element);
  safeQueryAll(contentRoot(element), 'a[href*="#"]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    const hashIdx = href.indexOf('#');
    const before = href.slice(0, hashIdx).split('?')[0].replace(/\/$/, '');
    let samePage = !before;
    if (!samePage && pagePath) {
      try {
        samePage = new URL(before, url).pathname.replace(/\/$/, '') === pagePath;
      } catch (e) {
        samePage = false;
      }
    }
    if (!samePage) return;
    // hash routes (#/connections) -> plain ids
    const id = decodeURIComponentSafe(href.slice(hashIdx + 1)).replace(/^\/+/, '');
    if (!id) return;
    // product tabs: #connections, #/connections, #tab-connections -> tab label slug
    const tabSlug = tabs.get(slugify(id)) || tabs.get(slugify(id.replace(/^tab-/, '')));
    if (tabSlug) {
      a.setAttribute('href', `#${tabSlug}`);
      return;
    }
    const target = findById(element, id);
    if (!target) {
      if (href !== `#${id}`) a.setAttribute('href', `#${id}`);
      return;
    }
    const h = headingFor(target, element);
    const slug = h && slugify(headingText(h));
    if (slug) a.setAttribute('href', `#${slug}`);
  });
}

/** product tab labels: slug -> slug (keys also include the source tab ids) */
function collectTabSlugs(element) {
  const map = new Map();
  safeQueryAll(element, '.product-tabs .ui.menu a.item, .product-tabs .tabs .menu a.item').forEach((tab) => {
    const slug = slugify(tab.textContent);
    if (!slug) return;
    map.set(slug, slug);
    if (tab.id) map.set(slugify(tab.id.replace(/^tab-/, '')), slug);
  });
  return map;
}

/** Sitecore item-id links: /?item=web%3a%7bGUID%7d%40en -> ITEM_LINKS[GUID] */
function rewriteItemLinks(element) {
  safeQueryAll(element, 'a[href*="item="]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    const m = decodeURIComponentSafe(href).match(/[?&]item=[^{&]*\{([0-9a-f-]{36})\}/i);
    if (!m) return;
    const path = ITEM_LINKS[m[1].toUpperCase()];
    if (path) a.setAttribute('href', path);
    else console.warn(`[product-cleanup] unmapped Sitecore item link: ${href}`);
  });
}

/* ------------------------------------------------------------------------ */
/* chrome / spacers                                                         */
/* ------------------------------------------------------------------------ */

function removeChrome(element, remove) {
  CHROME_SELECTORS.forEach((sel) => {
    safeQueryAll(element, sel).forEach(remove);
  });

  // <nav> outside the content area
  safeQueryAll(element, 'nav').forEach((nav) => {
    if (!nav.closest('#main-container')) remove(nav);
  });

  // any remaining modal outside the content area / country chooser
  safeQueryAll(element, '.ui.modal, .bc-modal').forEach((el) => {
    if (!el.closest('#main-container')
      || /Choose your country\/region and language/i.test(el.textContent || '')) remove(el);
  });

  // top-level wrappers outside #main-container (inline scripts/styles holders,
  // overlays, widgets)
  safeQueryAll(element, 'body > div, body > span, body > iframe').forEach((el) => {
    if (el.id === 'main-container' || el.querySelector('#main-container')) return;
    remove(el);
  });
  // siblings of #main-container inside its wrapper (e.g. diagnostics-container)
  const main = element.querySelector('#main-container');
  if (main && main.parentElement && main.parentElement !== element) {
    [...main.parentElement.children].forEach((sib) => {
      if (sib !== main) remove(sib);
    });
  }
}

function removeEmptyHeadings(element, remove) {
  safeQueryAll(element, 'h1, h2, h3, h4, h5, h6').forEach((h) => {
    if (isEmptyHeading(h)) remove(h);
  });
}

function removeEmptyLists(element, remove) {
  safeQueryAll(contentRoot(element), 'ul, ol').forEach((list) => {
    if (isEmpty(list)) remove(list);
  });
}

function removeEmptySpacers(element, remove, protectedEls) {
  const root = contentRoot(element);
  const inBlock = (el) => protectedEls.some((p) => p.contains(el));

  // &nbsp; spacer paragraphs in default content
  safeQueryAll(root, 'p').forEach((p) => {
    if (!inBlock(p) && isEmpty(p)) remove(p);
  });

  // empty code / layout wrappers, deepest first
  safeQueryAll(root, 'section, div, span').reverse().forEach((el) => {
    if (el.tagName === 'SPAN' && !inBlock(el)) return; // inline spans in text
    if (el.tagName === 'SPAN' && el.closest('h1, h2, h3, h4, h5, h6, p, a')) return;
    if (el.id || hasTempAttr(el)) return;
    if (isEmpty(el)) remove(el);
  });
}

/* ------------------------------------------------------------------------ */
/* headings                                                                 */
/* ------------------------------------------------------------------------ */

/**
 * Page-top hero instances: blocks named hero* or the blocks of the template's
 * first section (e.g. carousel-gallery), restricted to direct children of
 * #main-container (a nested sublayout-two-column-dynamic inside the tabs is
 * NOT the hero).
 */
function heroElements(element, template) {
  const names = new Set();
  const sections = (template && template.sections) || [];
  if (sections.length) {
    // the page-top hero is whatever block the first section holds (none on
    // product-category: its first section is default content, and its
    // hero-promo banner sits lower down the page)
    ((sections[0] && sections[0].blocks) || []).forEach((name) => names.add(name));
  } else {
    ((template && template.blocks) || []).forEach((block) => {
      if (/^hero/i.test(block.name || '')) names.add(block.name);
    });
  }
  const els = new Set();
  ((template && template.blocks) || []).forEach((block) => {
    if (!names.has(block.name)) return;
    (block.instances || []).forEach((sel) => safeQueryAll(element, sel).forEach((el) => els.add(el)));
  });
  const root = element.querySelector('#main-container');
  const all = [...els];
  if (!root) return all;
  return all.filter((el) => el.parentElement === root);
}

/**
 * Sitecore shop widgets in the top-level hero text column:
 *  - single-option "Product Variants" selector -> <p>Product Variants: X</p>
 *    (several options -> label paragraph + list)
 *  - "Request more info" add-to-quote button (no href) -> primary link
 *  - icon jump-link table (Overview / Specifications / ...) -> list of
 *    #<tab-slug> links
 */
function convertHeroWidgets(element, template) {
  const doc = element.ownerDocument;
  heroElements(element, template).forEach((hero) => {
    const col = hero.querySelector('.column-2') || hero;

    // product variants
    safeQueryAll(col, '.product-variants').forEach((box) => {
      const label = (box.querySelector('label') || {}).textContent || 'Product Variants';
      const items = safeQueryAll(box, '.menu .item')
        .map((i) => (i.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean);
      const unique = [...new Set(items)];
      if (!unique.length) {
        const current = box.querySelector('.dropdown .text');
        if (current && norm(current.textContent)) unique.push(current.textContent.replace(/\s+/g, ' ').trim());
      }
      const container = box.querySelector('.content-container') || box;
      container.textContent = '';
      if (!unique.length) return;
      const labelText = label.replace(/\s+/g, ' ').trim().replace(/:$/, '');
      if (unique.length === 1) {
        const p = doc.createElement('p');
        p.textContent = `${labelText}: ${unique[0]}`;
        container.append(p);
      } else {
        const p = doc.createElement('p');
        p.textContent = `${labelText}:`;
        const ul = doc.createElement('ul');
        unique.forEach((t) => {
          const li = doc.createElement('li');
          li.textContent = t;
          ul.append(li);
        });
        container.append(p, ul);
      }
    });

    // request more info
    safeQueryAll(col, 'a.add-to-quote').forEach((btn) => {
      const text = (btn.querySelector('span') || btn).textContent.replace(/\s+/g, ' ').trim() || 'Request more info';
      const href = btn.getAttribute('href');
      const a = doc.createElement('a');
      a.setAttribute('href', href && href !== '#' ? href : REQUEST_INFO_HREF);
      a.textContent = text;
      const strong = doc.createElement('strong');
      strong.append(a);
      const p = doc.createElement('p');
      p.append(strong);
      btn.replaceWith(p);
    });

    // icon jump-link strip
    safeQueryAll(col, '.content-display table, table').forEach((table) => {
      const cells = safeQueryAll(table, '.tab-icon-container');
      if (!cells.length) return;
      const ul = doc.createElement('ul');
      cells.forEach((cell) => {
        const label = ((cell.querySelector('.info') || cell).textContent || '').replace(/\s+/g, ' ').trim();
        const slug = slugify(label);
        if (!slug) return;
        const li = doc.createElement('li');
        const a = doc.createElement('a');
        a.setAttribute('href', `#${slug}`);
        a.textContent = label;
        li.append(a);
        ul.append(li);
      });
      if (ul.children.length) table.replaceWith(ul);
    });
  });
}

function demoteExtraH1s(element, template) {
  const heroes = heroElements(element, template);
  const h1s = safeQueryAll(contentRoot(element), 'h1');
  let keep = h1s.find((h) => heroes.some((hero) => hero.contains(h)));
  if (!keep && !heroes.length) keep = h1s[0];
  h1s.forEach((h1) => {
    if (h1 !== keep) renameTag(h1, 'h2');
  });
}

/**
 * Eyebrow labels / sub-headers inside headings in DEFAULT content:
 * <h2><span class="label">Video</span> Title</h2> -> <p>Video</p><h2>Title</h2>
 * <h2>Title <span class="sub-header">Sub</span></h2> -> <h2>Title</h2><p>Sub</p>
 * Headings inside block instances are left for their parsers.
 */
function splitHeadingEyebrows(element, protectedEls) {
  const doc = element.ownerDocument;
  const inBlock = (el) => protectedEls.some((p) => p === el || p.contains(el));
  safeQueryAll(contentRoot(element), 'h1, h2, h3, h4, h5, h6').forEach((h) => {
    if (inBlock(h)) return;
    safeQueryAll(h, ':scope > .label, :scope > .eyebrow').forEach((label) => {
      const text = (label.textContent || '').replace(/\s+/g, ' ').trim();
      label.remove();
      if (!text) return;
      const p = doc.createElement('p');
      p.textContent = text;
      h.before(p);
    });
    const subs = safeQueryAll(h, ':scope > .sub-header');
    subs.reverse().forEach((sub) => {
      const text = (sub.textContent || '').replace(/\s+/g, ' ').trim();
      sub.remove();
      if (!text) return;
      const p = doc.createElement('p');
      p.textContent = text;
      h.after(p);
    });
  });
}

/**
 * hero-split-left reads only the FIRST .content-container of .column-2, but
 * product heroes split their text over several (product-content,
 * announcement-hero notice, product-ordering CTA). Move the later ones' text
 * into the first as <p>s (CTA links alone in their <p>) so nothing is lost.
 */
function mergeHeroContent(element, template) {
  const doc = element.ownerDocument;
  const INLINE = /^(SUP|SUB|SPAN|STRONG|B|EM|I|U|SMALL|BR|A)$/;
  heroElements(element, template).forEach((hero) => {
    const col = hero.querySelector('.column-2');
    if (!col) return;
    const containers = safeQueryAll(col, '.content-container')
      .filter((c) => !c.parentElement.closest('.content-container'));
    if (containers.length < 2) return;
    const [first, ...rest] = containers;
    rest.forEach((box) => {
      const out = [];
      const visit = (node) => {
        [...node.children].forEach((child) => {
          if (child.tagName === 'P' || /^H[1-6]$/.test(child.tagName) || child.tagName === 'UL' || child.tagName === 'OL') {
            if (norm(child.textContent) || hasMedia(child)) out.push(child);
            return;
          }
          if (child.tagName === 'A') {
            if (!norm(child.textContent)) return;
            const p = doc.createElement('p');
            p.append(child);
            out.push(p);
            return;
          }
          const inlineOnly = [...child.children].every((c) => INLINE.test(c.tagName) && c.tagName !== 'A');
          if (inlineOnly && norm(child.textContent)) {
            const p = doc.createElement('p');
            while (child.firstChild) p.append(child.firstChild);
            out.push(p);
            return;
          }
          visit(child);
        });
      };
      visit(box);
      out.forEach((n) => first.append(n));
    });
  });
}

/* ------------------------------------------------------------------------ */
/* default content shaping                                                  */
/* ------------------------------------------------------------------------ */

/** <div>line<br>line<br></div> -> <div><p>line</p><p>line</p></div> */
function splitBrLines(element, protectedEls) {
  const doc = element.ownerDocument;
  const inBlock = (el) => protectedEls.some((p) => p === el || p.contains(el));
  safeQueryAll(contentRoot(element), 'div.disclaimer-text > .content-container, div.disclaimer-text').forEach((box) => {
    if (inBlock(box) || !box.isConnected) return;
    const nodes = [...box.childNodes];
    const isInline = (n) => n.nodeType === 3
      || (n.nodeType === 1 && /^(SUP|SUB|SPAN|A|STRONG|B|EM|I|U|SMALL)$/.test(n.tagName));
    if (!nodes.some((n) => n.nodeType === 3 && norm(n.textContent))) return;
    if (!nodes.every((n) => isInline(n) || n.nodeType === 8 || (n.nodeType === 1 && n.tagName === 'BR'))) return;
    const paras = [];
    let current = doc.createElement('p');
    nodes.forEach((n) => {
      if (n.nodeType === 1 && n.tagName === 'BR') {
        paras.push(current);
        current = doc.createElement('p');
        n.remove();
        return;
      }
      current.append(n);
    });
    paras.push(current);
    paras.forEach((p) => {
      if (norm(p.textContent)) {
        // trim surrounding whitespace text nodes
        if (p.firstChild && p.firstChild.nodeType === 3) p.firstChild.textContent = p.firstChild.textContent.replace(/^\s+/, '');
        if (p.lastChild && p.lastChild.nodeType === 3) p.lastChild.textContent = p.lastChild.textContent.replace(/\s+$/, '');
        box.append(p);
      }
    });
  });
}

/** default-content <p>a<br><br>b</p> -> <p>a</p><p>b</p> */
function splitDoubleBrParagraphs(element, protectedEls) {
  const doc = element.ownerDocument;
  const inBlock = (el) => protectedEls.some((p) => p === el || p.contains(el));
  safeQueryAll(contentRoot(element), 'p').forEach((p) => {
    if (inBlock(p) || p.querySelectorAll(':scope > br').length < 2) return;
    const parts = [];
    let current = [];
    let lastBr = false;
    [...p.childNodes].forEach((n) => {
      const isBr = n.nodeType === 1 && n.tagName === 'BR';
      const isBlank = n.nodeType === 3 && !norm(n.textContent);
      if (isBr && lastBr) {
        // drop the first <br> of the pair from the current part
        const idx = current.lastIndexOf(lastBr);
        if (idx >= 0) current.splice(idx);
        parts.push(current);
        current = [];
        lastBr = false;
        return;
      }
      if (isBr) {
        lastBr = n;
        current.push(n);
        return;
      }
      if (!isBlank) lastBr = false;
      current.push(n);
    });
    parts.push(current);
    const paras = parts.filter((nodes) => nodes.some((n) => norm(n.textContent) || (n.nodeType === 1 && hasMedia(n))));
    if (paras.length < 2) return;
    paras.forEach((nodes) => {
      const np = doc.createElement('p');
      nodes.forEach((n) => np.append(n));
      if (np.firstChild && np.firstChild.nodeType === 3) np.firstChild.textContent = np.firstChild.textContent.replace(/^\s+/, '');
      if (np.lastChild && np.lastChild.nodeType === 3) np.lastChild.textContent = np.lastChild.textContent.replace(/\s+$/, '');
      p.before(np);
    });
    p.remove();
  });
}

/** <td><h5><a>Click here</a></h5></td> -> <td><p><a>Click here</a></p></td> */
function unwrapLinkHeadingsInCells(element) {
  safeQueryAll(contentRoot(element), 'td h1, td h2, td h3, td h4, td h5, td h6').forEach((h) => {
    const links = h.querySelectorAll('a[href]');
    if (links.length !== 1) return;
    if (norm(links[0].textContent) !== norm(h.textContent)) return;
    renameTag(h, 'p');
  });
}

/* ------------------------------------------------------------------------ */

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  if (!template || !PRODUCT_TEMPLATES.includes(template.name)) return;
  if (!element || !element.querySelectorAll) return;

  // live page: computed styles only available here
  if (hookName === 'onLoad') {
    preserveBackgrounds(element, collectProtected(element, template));
    recordClickTargets(element);
    return;
  }

  if (hookName === 'beforeTransform') {
    const protectedEls = collectProtected(element, template);
    const remove = makeRemover(element, protectedEls);
    preserveBackgrounds(element, protectedEls);
    recordClickTargets(element);
    liftProductListHeadings(element);
    // anchors first: target ids must still exist
    rewriteInPageAnchors(element, payload && payload.url);
    removeChrome(element, remove);
    removeEmptyHeadings(element, remove);
    demoteExtraH1s(element, template);
    convertHeroWidgets(element, template);
    mergeHeroContent(element, template);
    splitHeadingEyebrows(element, protectedEls);
    cleanLinks(element);
    rewriteItemLinks(element);
    splitBrLines(element, protectedEls);
    splitDoubleBrParagraphs(element, protectedEls);
    unwrapLinkHeadingsInCells(element);
    dropRecordedBackgroundImages(element);
    removeEmptyLists(element, remove);
    removeEmptySpacers(element, remove, protectedEls);
  }

  if (hookName === 'afterTransform') {
    WebImporter.DOMUtils.remove(element, [
      'script',
      'noscript',
      'style',
      'link',
      'input',
      'select',
      'textarea',
      'form',
      '.uw-sl',
      '.uwy',
      '#onetrust-consent-sdk',
      '#kampyleButtonContainer',
      '.kampyle_button',
    ]);

    // leftover iframes (players, widgets) - embed instances are kept
    safeQueryAll(element, 'iframe').forEach((frame) => {
      if (ALWAYS_PROTECTED.some((sel) => frame.matches(sel))) return;
      frame.remove();
    });

    cleanLinks(element);

    safeQueryAll(element, '*').forEach((el) => {
      [...el.attributes].forEach(({ name }) => {
        if (
          name.startsWith('data-gtm')
          || name.startsWith('data-uw')
          || name.startsWith('data-track')
          || name === 'data-bg-src'
          || name === 'data-icon-src'
          || name === 'onclick'
        ) {
          el.removeAttribute(name);
        }
      });
    });
  }
}
