/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for the beckmancoulter.com `solutions-hematology` page
 * (/en/solutions/hematology-solution).
 *
 * Only runs when payload.template.name === 'solutions-hematology' (every
 * import script loads all transformers in this folder).
 *
 * beforeTransform:
 *  - removes global chrome (UserWay widget, header/nav, search, modals,
 *    breadcrumb, footer, cookie banner, feedback button), inline code and the
 *    wrapper divs that only held it
 *  - removes the Marketo form 1891 and its confirmation message (not migrated:
 *    no form definition exists for it), keeping the "Let's talk ..." heading
 *  - records the hero poster (inline background of an empty div) as
 *    data-bg-src on div.video-hero-carousel before empty divs are removed
 *  - removes HTML comments inside the content (the intro holds a commented-out
 *    infographic) - parsers add their xwalk field hints afterwards
 *  - removes "Empty heading" placeholders, the hero scroll chevron, line-break
 *    spacers and empty paragraphs / spacer containers
 *  - rewrites in-page jump links to the EDS heading id of their target:
 *    the target itself when it is a heading (#WatchVideo -> h2 "Find more
 *    answers ..."), else the next heading after it (#markForm sits in a
 *    slider slide -> h2 "Let's talk ...")
 *  - statement blocks (div.intro-content): h4 -> <p><strong>, ui buttons ->
 *    <p><strong><a> (primary button), trailing icon glyphs dropped
 *  - demotes every h1 outside the hero to h2
 *  Block instance elements from template.blocks[] are never removed.
 *
 * afterTransform: removes remaining non-content elements and tracking attributes.
 */

const TEMPLATE_NAME = 'solutions-hematology';

const CHROME_SELECTORS = [
  '.uw-sl',
  '.uwy',
  '[class*="userway"]',
  '[class^="uw-s"]',
  '.uwaw-dictionary-tooltip',
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
  '.country-language-modal',
  '.country-language-selector',
  '.gigya-prefs-modal',
  '#gigya-prefs-modal',
  '.photo-header-container',
  '.breadcrumb-container',
  '.breadcrumbs',
  '.share-container',
  'footer',
  '.footer-container',
  '.universal-footer',
  '.universal-footer-text',
  '#onetrust-consent-sdk',
  '.onetrust-pc-dark-filter',
  '#kampyleButtonContainer',
  '.kampyle_button',
  // Marketo form 1891 (not migrated) + its thank-you message
  'form.mktoForm',
  'div.mktoForm',
  '[id^="mktoForm_"]',
  '#mktoStyleLoaded',
  '#MktoForms2XDIframe',
  '#confirmform',
  // hero scroll chevron, spacers
  '.banner-arrow',
  '.line-break',
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

const clean = (text) => (text || '').replace(/[\s ]+/g, ' ').trim();
const norm = (text) => clean(text).toLowerCase();

/** EDS heading id (github-slugger rules, as rendered by the pipeline) */
function slug(text) {
  return clean(text).toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '')
    .replace(/ /g, '-');
}

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

const hasMedia = (el) => !!el.querySelector('img, picture, video, iframe, table, svg');
const isEmpty = (el) => !norm(el.textContent) && !hasMedia(el);

function removeChrome(element, remove) {
  CHROME_SELECTORS.forEach((sel) => safeQueryAll(element, sel).forEach(remove));
  safeQueryAll(element, 'nav').forEach((nav) => {
    if (!nav.closest('#main-container')) remove(nav);
  });
  safeQueryAll(element, '.ui.modal').forEach((el) => {
    if (/Choose your country\/region and language/i.test(el.textContent || '')) remove(el);
  });
  safeQueryAll(element, 'body > div, #main-container div').forEach((div) => {
    if (div.id === 'main-container') return;
    if (!div.children.length && !norm(div.textContent)) remove(div);
  });
}

// the hero poster is an inline background on an empty div that removeChrome
// drops, so record it on the (protected) hero first
function preserveHeroPoster(element) {
  safeQueryAll(element, '.video-hero-carousel').forEach((hero) => {
    if (hero.getAttribute('data-bg-src')) return;
    const poster = hero.querySelector('#video-tag-thumbnail, [id*="thumbnail"]');
    const m = ((poster && poster.getAttribute('style')) || '').match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    if (m) hero.setAttribute('data-bg-src', m[1].replace(/&amp;/g, '&').trim());
  });
}

function removeComments(element) {
  const root = element.querySelector('#main-container') || element;
  const doc = element.ownerDocument;
  const walker = doc.createTreeWalker(root, 128 /* NodeFilter.SHOW_COMMENT */);
  const comments = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach((c) => c.remove());
}

function removeEmptyHeadings(element, remove) {
  safeQueryAll(element, 'h1, h2, h3, h4, h5, h6').forEach((h) => {
    if (norm(h.textContent) === 'empty heading' && !hasMedia(h)) {
      // a link wrapping only the placeholder goes too
      const link = h.parentElement && h.parentElement.tagName === 'A' ? h.parentElement : null;
      remove(link && norm(link.textContent) === 'empty heading' ? link : h);
    }
  });
}

function removeEmptyParagraphs(element, remove) {
  safeQueryAll(element, '#main-container p').forEach((p) => {
    if (isEmpty(p)) remove(p);
  });
  safeQueryAll(element, '#main-container div.page-content, #main-container div.wysiwyg-content, #main-container section')
    .forEach((el) => {
      if (isEmpty(el)) remove(el);
    });
}

/** #id links -> the EDS id of the target heading (or the next heading after it) */
function rewriteJumpLinks(element) {
  const root = element.querySelector('#main-container') || element;
  const headings = safeQueryAll(root, 'h1, h2, h3, h4, h5, h6').filter((h) => clean(h.textContent));
  safeQueryAll(root, 'a[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    const target = root.querySelector(`[id="${id.replace(/"/g, '')}"]`);
    if (!target) return;
    let heading = /^H[1-6]$/.test(target.tagName) ? target : null;
    if (!heading) {
      // first heading that follows the target in document order
      heading = headings.find((h) => !target.contains(h)
        && (target.compareDocumentPosition(h) & 4 /* DOCUMENT_POSITION_FOLLOWING */));
    }
    if (heading) a.setAttribute('href', `#${slug(heading.textContent)}`);
  });
}

function renameTag(el, tagName) {
  const next = el.ownerDocument.createElement(tagName);
  while (el.firstChild) next.append(el.firstChild);
  el.replaceWith(next);
  return next;
}

/** default-content statements + buttons (div.intro-content) */
function normalizeStatements(element) {
  const doc = element.ownerDocument;
  safeQueryAll(element, '#main-container div.intro-content').forEach((intro) => {
    safeQueryAll(intro, 'h1, h2, h3, h4, h5, h6').forEach((h) => {
      const p = doc.createElement('p');
      const strong = doc.createElement('strong');
      strong.textContent = clean(h.textContent);
      p.append(strong);
      h.replaceWith(p);
    });
  });
  safeQueryAll(element, '#main-container a.ui.button, #main-container a.button').forEach((a) => {
    if (a.closest('.video-hero-carousel')) return; // the hero parser handles its CTA
    // drop icon-font glyphs (<em class="icon ..."></em>)
    safeQueryAll(a, 'em, i, span').forEach((g) => {
      if (!clean(g.textContent)) g.remove();
    });
    a.textContent = clean(a.textContent);
    if (!a.closest('strong, b')) {
      const strong = doc.createElement('strong');
      a.replaceWith(strong);
      strong.append(a);
    }
  });
}

function demoteBodyH1s(element) {
  safeQueryAll(element, 'h1').forEach((h1) => {
    if (h1.closest('.video-hero-carousel')) return;
    renameTag(h1, 'h2');
  });
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  if (!template || template.name !== TEMPLATE_NAME) return;

  if (hookName === 'beforeTransform') {
    const protectedEls = collectProtected(element, template);
    const remove = makeRemover(element, protectedEls);
    preserveHeroPoster(element);
    removeChrome(element, remove);
    removeComments(element);
    removeEmptyHeadings(element, remove);
    rewriteJumpLinks(element);
    normalizeStatements(element);
    demoteBodyH1s(element);
    removeEmptyParagraphs(element, remove);
  }

  if (hookName === 'afterTransform') {
    WebImporter.DOMUtils.remove(element, [
      'script',
      'noscript',
      'style',
      'link',
      'iframe',
      'video',
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
        if (name.startsWith('data-gtm') || name.startsWith('data-uw')
          || name.startsWith('data-track') || name === 'onclick') {
          el.removeAttribute(name);
        }
      });
    });
  }
}
