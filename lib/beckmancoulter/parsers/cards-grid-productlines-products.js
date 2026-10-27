/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-grid-productlines -> existing block "cards-grid" with class "productlines".
 * Source: div.col-3-default-padding (3-up photo cards on the hematology page).
 *
 * No heading row (the source has no section heading for this grid).
 * Model cards-grid-item: image (+imageAlt collapsed), text
 *   Rows 1..N (one per .column card, document order):
 *     field:image -> card image (absolute src; alt = source alt, else card title)
 *     field:text  -> H3 title + description <p> + "Learn more" link
 * Link: the source CTA href when non-empty; otherwise the user-approved title -> link
 * map (the live cards 2 and 3 have href-less "Learn more" anchors). Cards with
 * neither (Clinical Lab Automation Systems) get no link.
 */

const SITE = 'https://www.beckmancoulter.com/';
const HEADINGS = 'h1, h2, h3, h4, h5, h6';

// Approved targets for cards whose live "Learn more" anchor has no href.
const LINK_MAP = {
  'DxS Service & Support': '/en/support/dxs-clinical-laboratory-service-and-support',
  'Clinical Informatic Solutions': '/en/products/advanced-informatics',
};

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanText(node) {
  if (!node) return '';
  const clone = node.cloneNode(true);
  clone.querySelectorAll('style, script, noscript, template').forEach((n) => n.remove());
  return norm(clone.textContent);
}

function absUrl(src) {
  const s = (src || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  try {
    return new URL(s, SITE).href;
  } catch (e) {
    return s;
  }
}

function plainEl(document, tag, text) {
  const t = norm(text);
  if (!t) return null;
  const el = document.createElement(tag);
  el.textContent = t;
  return el;
}

export default function parse(element, { document }) {
  const cells = [];

  let cards = [...element.querySelectorAll(':scope > .column')];
  if (!cards.length) cards = [...element.querySelectorAll('.card')];

  cards.forEach((card) => {
    const titleSrc = card.querySelector('.card-header-text')
      || [...card.querySelectorAll(`.header, ${HEADINGS}`)].find((h) => cleanText(h) !== '' && !h.querySelector('a'));
    const title = cleanText(titleSrc);

    // image
    const img = card.querySelector('.image-card-box img') || card.querySelector('img');
    const src = img ? (img.getAttribute('src') || img.getAttribute('data-src') || '') : '';
    let imageCell = '';
    if (src) {
      const out = document.createElement('img');
      out.setAttribute('src', absUrl(src));
      out.setAttribute('alt', norm(img.getAttribute('alt')) || title);
      imageCell = [hint(document, 'image'), out];
    }

    const text = [];
    const h3 = plainEl(document, 'h3', title);
    if (h3) text.push(h3);

    const descText = cleanText(card.querySelector('.card-content-text'));
    const desc = plainEl(document, 'p', descText);
    if (desc) text.push(desc);

    // Learn more: source href, else approved title map, else no link
    const cta = card.querySelector('.explore-link a, a.btn-cta')
      || [...card.querySelectorAll('a')].find((a) => /learn more/i.test(norm(a.textContent)));
    const label = cta ? norm(cta.textContent) : '';
    const href = ((cta && cta.getAttribute('href')) || '').trim() || LINK_MAP[title] || '';
    if (label && href) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = label;
      p.append(a);
      text.push(p);
    }

    if (!imageCell && !text.length) return;
    cells.push([imageCell, text.length ? [hint(document, 'text'), ...text] : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid', variants: ['productlines'], cells });
  element.replaceWith(block);
}
