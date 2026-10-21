/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for beckmancoulter.com learning-and-events pages.
 *
 * beforeTransform:
 *  - removes site chrome (header/nav, search, country/language + gigya modals,
 *    breadcrumb/share bar, footer, cookie banner, accessibility/feedback widgets)
 *  - removes div.line-break spacers
 *  - unwraps h2 > span.sub-header > div#X headings into a clean h2 (id kept)
 *  - converts the intro's layout table of buttons into a paragraph of links
 *  - wraps each run of consecutive div.media-showcase-simple siblings into
 *    div.media-showcase-group (cards-media-list block instance selector)
 *
 * afterTransform:
 *  - removes remaining non-content elements (scripts, styles, iframes, links)
 *  - strips tracking / lazyload attributes
 */

const CHROME_SELECTORS = [
  // accessibility widget (UserWay)
  '.uw-sl',
  '.uwy',
  '[class*="userway"]',
  '[class^="uw-s"]',
  // header / navigation / search
  'header',
  'nav',
  '.nav-container',
  '#universal-navigation',
  '#mobile-universal-nav',
  '#dx-navigation',
  '.primary-navigation',
  '.mobile-subnav-header',
  '#mobile-language-select-btn',
  '.global-search-spacer',
  '.coveo-global-search',
  // modals
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
  '.kampyle_button',
  // spacers
  '.line-break',
];

function safeQueryAll(root, selector) {
  try {
    return [...root.querySelectorAll(selector)];
  } catch (e) {
    return [];
  }
}

function removeChrome(element) {
  const main = element.querySelector('#main-container');
  CHROME_SELECTORS.forEach((sel) => {
    safeQueryAll(element, sel).forEach((el) => {
      if (!el.isConnected) return;
      // never remove a wrapper that holds the authorable main content
      if (main && el !== main && el.contains(main)) return;
      if (el === main) return;
      el.remove();
    });
  });

  // any remaining modal containing the country/region chooser
  safeQueryAll(element, '.ui.modal').forEach((el) => {
    if (/Choose your country\/region and language/i.test(el.textContent || '')) {
      el.remove();
    }
  });
}

function unwrapSubHeaders(element) {
  safeQueryAll(element, 'h2').forEach((h2) => {
    const sub = h2.querySelector(':scope > span.sub-header');
    if (!sub) return;
    const idEl = sub.querySelector('[id]');
    const text = (sub.textContent || '').replace(/\s+/g, ' ').trim();
    if (idEl && idEl.id && !h2.id) h2.id = idEl.id;
    h2.textContent = text;
  });
}

function convertButtonTables(element) {
  const { document } = element.ownerDocument ? { document: element.ownerDocument } : { document };
  safeQueryAll(element, 'table').forEach((table) => {
    const links = [...table.querySelectorAll('a')];
    if (!links.length) return;
    // only layout tables whose content is just links
    const text = (table.textContent || '').replace(/\s+/g, '');
    const linkText = links.map((a) => (a.textContent || '').replace(/\s+/g, '')).join('');
    if (text !== linkText) return;
    // one bold link per paragraph so EDS decorates each as a primary button
    const paragraphs = links.map((a) => {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = (a.textContent || '').trim();
      strong.append(link);
      p.append(strong);
      return p;
    });
    table.replaceWith(...paragraphs);
  });
}

// EDS generates heading ids from heading text, so source anchors (#High)
// must be rewritten to the slug of the heading that carried that id
function rewriteHeadingAnchors(element) {
  const slug = (text) => (text || '').toLowerCase().replace(/[^0-9a-z]/gi, '-')
    .replace(/-+/g, '-').replace(/^-|-$/g, '');
  safeQueryAll(element, 'a[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    const heading = safeQueryAll(element, 'h1, h2, h3, h4, h5, h6').find((h) => h.id === id);
    if (heading) a.setAttribute('href', `#${slug(heading.textContent)}`);
  });
}

function groupMediaShowcases(element) {
  const { document } = element.ownerDocument ? { document: element.ownerDocument } : { document };
  const rows = safeQueryAll(element, 'div.media-showcase-simple');
  const handled = new Set();
  rows.forEach((row) => {
    if (handled.has(row)) return;
    // skip rows already grouped
    if (row.parentElement && row.parentElement.classList.contains('media-showcase-group')) {
      handled.add(row);
      return;
    }
    const run = [row];
    handled.add(row);
    let next = row.nextElementSibling;
    while (next && next.matches('div.media-showcase-simple')) {
      run.push(next);
      handled.add(next);
      next = next.nextElementSibling;
    }
    const group = document.createElement('div');
    group.className = 'media-showcase-group';
    row.before(group);
    run.forEach((r) => group.append(r));
  });
}

export default function transform(hookName, element, payload) {
  // all import scripts load every transformer; only run for this template
  if (!payload || !payload.template || payload.template.name !== 'learning-and-events') return;

  if (hookName === 'beforeTransform') {
    removeChrome(element);
    unwrapSubHeaders(element);
    convertButtonTables(element);
    rewriteHeadingAnchors(element);
    groupMediaShowcases(element);
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
      'button',
      '.uw-sl',
      '.uwy',
      '#onetrust-consent-sdk',
      '.kampyle_button',
      '.line-break',
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
