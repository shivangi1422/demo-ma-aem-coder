/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-products (block: carousel, Style option: products).
 * Source: div.related-products:has(h3) (beckmancoulter.com product pages):
 *   .owl-carousel .owl-item:not(.cloned) > .item > .product-card
 *     a[href] > img.product-thumb             (card image + card link)
 *     .product-description > h3 + p + a.btn-cta ("Learn more")
 * The "Additional ... tools" H2 lives in a separate div.related-products and
 * stays default content.
 *
 * xwalk container model `carousel`: text (richtext), classes.
 * Item model `carousel-item`: image (reference, imageAlt collapsed), text (richtext).
 *
 * Row 1: heading row - empty (heading is default content above the block)
 * Rows 2..N: one per product card ->
 *   image (<img>, else CSS background recorded by the product cleanup as
 *   data-icon-src / data-bg-src, else inline background url; alt falls back to
 *   the card title) | <h3>title (<sup> kept)</h3> <p>description</p> <p>Learn more link</p>
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

/** escape stray '%' so URI decoding in html2md does not throw */
const safeUrl = (url) => (url || '').trim().replace(/%(?![0-9a-fA-F]{2})/g, '%25');

const INLINE_KEEP = /^(SUP|SUB|STRONG|B|EM|I|U|SMALL|BR)$/;

function bgUrl(el) {
  if (!el || !el.getAttribute) return '';
  const style = el.getAttribute('style') || '';
  const m = style.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
  return m && m[1] ? m[1].replace(/&amp;/g, '&').trim() : '';
}

/** copy inline content keeping sup/sub/emphasis, dropping links and wrappers */
function inlineCopy(node, document, target) {
  [...node.childNodes].forEach((child) => {
    if (child.nodeType === 3) {
      target.append(document.createTextNode(child.textContent.replace(/[\s ]+/g, ' ')));
    } else if (child.nodeType === 1) {
      if (INLINE_KEEP.test(child.tagName)) {
        const el = document.createElement(child.tagName.toLowerCase());
        inlineCopy(child, document, el);
        target.append(el);
      } else if (!/^(SCRIPT|STYLE|IMG|SVG)$/.test(child.tagName)) {
        inlineCopy(child, document, target);
      }
    }
  });
  return target;
}

function trimEdges(el) {
  if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.textContent = el.firstChild.textContent.replace(/^\s+/, '');
  if (el.lastChild && el.lastChild.nodeType === 3) el.lastChild.textContent = el.lastChild.textContent.replace(/\s+$/, '');
  return el;
}

/** image source: <img>, then backgrounds recorded by the product cleanup */
function imageSrc(card, item) {
  const img = [...card.querySelectorAll('img')].find((i) => i.getAttribute('src') && !/^data:/i.test(i.getAttribute('src')));
  if (img) return { src: img.getAttribute('src'), alt: clean(img.getAttribute('alt')) };
  const holders = [card, item, ...card.querySelectorAll('[data-icon-src], [data-bg-src], [style*="url("]')].filter(Boolean);
  for (const el of holders) {
    const src = el.getAttribute('data-icon-src') || el.getAttribute('data-bg-src') || bgUrl(el);
    if (src && !/^data:/i.test(src)) return { src, alt: '' };
  }
  return null;
}

export default function parse(element, { document }) {
  const cells = [];

  // ---- row 1: heading row (heading is default content above) -------------
  cells.push(['']);

  // ---- items -----------------------------------------------------------------
  let cards = [...element.querySelectorAll('.owl-item:not(.cloned) .product-card')];
  if (!cards.length) cards = [...element.querySelectorAll('.product-card')].filter((c) => !c.closest('.cloned'));
  if (!cards.length) {
    cards = [...element.querySelectorAll('.owl-item:not(.cloned) > .item, .item')]
      .filter((c) => !c.closest('.cloned') && c.querySelector('h1, h2, h3, h4, h5, h6'));
  }

  cards.forEach((card) => {
    const item = card.closest('.item') || card.closest('.owl-item');
    const desc = card.querySelector('.product-description') || card;

    // title
    const titleEl = desc.querySelector('h1, h2, h3, h4, h5, h6');
    const h3 = document.createElement('h3');
    if (titleEl) trimEdges(inlineCopy(titleEl, document, h3));
    const titleText = clean(h3.textContent);
    const plainTitle = titleEl ? clean(titleEl.cloneNode(true).textContent) : '';

    // links
    const cta = desc.querySelector('a.btn-cta, a.ui.button, a.button')
      || [...desc.querySelectorAll('a[href]')].find((a) => clean(a.textContent) && !(titleEl && titleEl.contains(a)));
    const cardLink = [...card.querySelectorAll('a[href]')].find((a) => !desc.contains(a) || a === card)
      || (card.closest('a[href]'));
    const ctaHref = cta && isUsableHref(cta.getAttribute('href')) ? cta.getAttribute('href')
      : (cardLink && isUsableHref(cardLink.getAttribute('href')) ? cardLink.getAttribute('href') : '');

    // image
    const imageCell = [];
    const found = imageSrc(card, item);
    if (found) {
      const img = document.createElement('img');
      img.src = safeUrl(found.src);
      img.alt = found.alt || (plainTitle || titleText).replace(/[*†‡]+$/, '').trim();
      imageCell.push(document.createComment(' field:image '), img);
    }

    // text
    const textCell = [];
    if (titleText) textCell.push(h3);
    [...desc.querySelectorAll('p')].forEach((p) => {
      if (cta && p.contains(cta)) return;
      if (!clean(p.textContent)) return;
      const para = document.createElement('p');
      trimEdges(inlineCopy(p, document, para));
      textCell.push(para);
    });
    const ctaText = clean(cta ? cta.textContent : '') || (ctaHref ? 'Learn more' : '');
    if (ctaText) {
      const p = document.createElement('p');
      if (ctaHref) {
        const a = document.createElement('a');
        a.href = safeUrl(ctaHref);
        a.textContent = ctaText;
        p.append(a);
      } else {
        p.textContent = ctaText;
      }
      textCell.push(p);
    }

    if (textCell.length) textCell.unshift(document.createComment(' field:text '));
    if (!imageCell.length && !textCell.length) return;
    cells.push([imageCell.length ? imageCell : '', textCell.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel (products)', cells });
  element.replaceWith(block);
}
