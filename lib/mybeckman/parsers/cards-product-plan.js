/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-product-plan (mybeckman.in /service/plans, exact-match design).
 * Source: #main .productCards > .productCard (x4) =
 *   img.productCardImg + .productCardBody > h3 + a.btn "Read More"
 * (the "Product Specific Service Plans" h2 above stays default content).
 * Library convention (Cards): one card per row, cells = image | text; an empty image
 * cell is still included.
 * Model cards-product-plan-item: image (+imageAlt collapsed into <img alt>), text.
 *   Rows (document order): [ field:image -> <img> | field:text -> <h3>Title</h3>
 *          <p><strong><a href>Read More</a></strong></p> ]  (blue button)
 * Images: original absolute URL, origin + path (query dropped); alts from the approved
 * mapping. The Particle Analysis image is a broken relative link on the live site; the
 * importer's browser resolves it to the LS 13 320 XR product photo, which is used (an
 * unresolved .ashx still gives an EMPTY image cell; the block keeps the image area).
 */

const SITE = 'https://www.mybeckman.in/';
const HEADINGS = 'h1, h2, h3, h4, h5, h6';

const IMAGE_ALTS = {
  'https://media.beckman.com/-/media/centrifugation/products/instruments/ultracentrifuge/optima-xe/centrifuge-ultracentrifuge-optima-xe-full-view-2017-04.png':
    'Optima XE ultracentrifuge',
  'https://media.beckman.com/-/media/flow-cytometry/products/instruments/cytoflex/flow-cytometry-cytometers-cytoflex-full-view-2017-05.png':
    'CytoFLEX flow cytometer',
  'https://media.beckman.com/-/media/automation/products/instruments/biomek-i-series/i5/automation-liquid-handler-biomek-i5-full-view-2017-04.png':
    'Biomek i5 automated liquid handler',
  'https://media.beckman.com/-/media/particle-characterization/products/instruments/ls-13-320-xr/particle-characterization-ls-13-320-xr-full-view-2018-01.png':
    'LS 13 320 XR particle analyzer',
};

// Images that are broken on the live site: emit an empty image cell instead.
const BROKEN_IMAGES = new Set([
  'https://www.mybeckman.in/service/-/media/005c80a9d9b34c9484ffb4733db4dbc9.ashx',
]);

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

function cleanSrc(src) {
  const s = (src || '').trim();
  if (!s || s.startsWith('data:')) return '';
  try {
    const u = new URL(s, SITE);
    return `${u.origin}${u.pathname}`;
  } catch (e) {
    return s.split('?')[0];
  }
}

function plainEl(document, tag, text) {
  const t = norm(text);
  if (!t) return null;
  const el = document.createElement(tag);
  el.textContent = t;
  return el;
}

function parseCard(document, card) {
  // image
  let imageCell = '';
  const srcImg = card.querySelector('img.productCardImg') || card.querySelector('img');
  const src = srcImg ? cleanSrc(srcImg.getAttribute('src') || srcImg.getAttribute('data-src')) : '';
  if (src && !BROKEN_IMAGES.has(src)) {
    const img = document.createElement('img');
    img.setAttribute('src', src);
    img.setAttribute('alt', IMAGE_ALTS[src] || norm(srcImg.getAttribute('alt')));
    imageCell = [hint(document, 'image'), img];
  }

  // text: H3 title first, then the Read More link
  const text = [];
  const titleSrc = Array.from(card.querySelectorAll(HEADINGS)).find((h) => norm(h.textContent));
  const h3 = titleSrc ? plainEl(document, 'h3', titleSrc.textContent) : null;
  if (h3) text.push(h3);
  Array.from(card.querySelectorAll('p'))
    .filter((p) => norm(p.textContent) && !p.closest(HEADINGS) && !p.querySelector('a[href]'))
    .forEach((p) => text.push(plainEl(document, 'p', p.textContent)));
  Array.from(card.querySelectorAll('a[href]'))
    .filter((a) => norm(a.textContent) && !a.closest(HEADINGS))
    .forEach((a) => {
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.setAttribute('href', a.getAttribute('href').trim());
      link.textContent = norm(a.textContent);
      const strong = document.createElement('strong');
      strong.append(link);
      p.append(strong);
      text.push(p);
    });

  return [imageCell, text.length ? [hint(document, 'text'), ...text] : ''];
}

export default function parse(element, { document }) {
  // element = .productCards; the section heading above it stays default content
  const cards = Array.from(element.querySelectorAll('.productCard, .ProductCard'));
  const cells = cards.map((card) => parseCard(document, card));
  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-product-plan', cells: cells.length ? cells : [['', '']] });
  element.replaceWith(block);
}
