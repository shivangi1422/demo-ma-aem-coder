/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-grid-products -> existing block "cards-grid" with class "simple".
 * Source (mybeckman.in /service/plans): #main .bc-rich-text:has(.productCards)
 *   .Section > h2 + .productCards > .productCard (x4) =
 *     img.productCardImg + .productCardBody > h3 + a.btn "Read More"
 *
 * Library convention (Cards): one card per row, cells = image | text; an empty image
 * cell is still included.
 * Project model cards-grid (blocks/cards-grid/_cards-grid.json):
 *   container: text (Heading / Intro), classes (-> variant "simple")
 *   item cards-grid-item: image (+imageAlt collapsed into <img alt>), text
 *   Row 0: field:text -> H2 "Product Specific Service Plans"
 *   Rows 1..N (document order): [ field:image -> <img> | field:text -> <h3>Title</h3>
 *          <p><a href>Read More</a></p> ]
 * The simple variant styles the first body <p> as a volume pill and a leading bold-only
 * paragraph as a NEW badge; these cards have neither, so the H3 goes first and the link
 * paragraph is plain (not bold).
 * Images: original absolute URL, origin + path (query string dropped); alts from the
 * approved mapping. The Particle Analysis image is broken on the live site, so that
 * card gets an EMPTY image cell.
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
      p.append(link);
      text.push(p);
    });

  return [imageCell, text.length ? [hint(document, 'text'), ...text] : ''];
}

export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('.productCard'));

  // Row 0: section heading (outside the cards)
  const headingSrc = Array.from(element.querySelectorAll(HEADINGS))
    .find((h) => !h.closest('.productCard') && norm(h.textContent));
  const heading = headingSrc ? plainEl(document, 'h2', headingSrc.textContent) : null;

  const cells = [];
  cells.push([heading ? [hint(document, 'text'), heading] : '']);
  cards.forEach((card) => cells.push(parseCard(document, card)));

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid', variants: ['simple'], cells });
  element.replaceWith(block);
}
