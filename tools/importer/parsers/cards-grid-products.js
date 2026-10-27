/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-products (block: cards-grid, Style option: products).
 * Source: div.product-list (beckmancoulter.com product category pages, e.g.
 * /en/products/advanced-informatics):
 *   .product-card > img.product-thumb
 *                 > .product-description > [.label] h3 p div > a.btn-cta
 *   (.product-specs duplicates the description and is dropped)
 * The "Full Portfolio..." H2 is moved out of the block by the product cleanup
 * and stays default content above it.
 *
 * Library cards convention (one row per card: image | text) preceded by the
 * local cards-grid container row (heading / intro, left empty here).
 * xwalk container model `cards-grid`: text (richtext), classes.
 * Item model `cards-grid-item`: image (reference, imageAlt collapsed), text (richtext).
 *
 * Row 1: heading row - empty
 * Rows 2..N: image (alt as plain text: markup such as "<sup>&dagger;</sup>"
 *   in the source alt is removed) | [<p>tag</p>] <h3>title (<sup> kept)</h3>
 *   <p>description</p> <p><a>Learn more</a></p>
 * CTA href: the CTA's href, else the card's data-href (recorded by the product
 * cleanup from onclick handlers), else the onclick target, else the image link.
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

/** escape stray '%' so URI decoding in html2md does not throw */
const safeUrl = (url) => (url || '').trim().replace(/%(?![0-9a-fA-F]{2})/g, '%25');

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

const INLINE_KEEP = /^(SUP|SUB|STRONG|B|EM|I|U|SMALL)$/;

function onclickUrl(el) {
  const holder = el && (el.matches('[onclick]') ? el : el.querySelector('[onclick]'));
  const onclick = (holder && holder.getAttribute('onclick')) || '';
  const m = onclick.match(/location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i)
    || onclick.match(/window\.open\(\s*['"]([^'"]+)['"]/i);
  return m ? m[1].trim() : '';
}

/** alt text with any (escaped) markup removed: "REMISOL Advance<sup>&dagger;</sup>" -> "REMISOL Advance" */
function plainAlt(alt, document) {
  if (!alt) return '';
  if (!/[<&]/.test(alt)) return clean(alt);
  const tmp = document.createElement('div');
  tmp.innerHTML = alt;
  tmp.querySelectorAll('sup, sub').forEach((s) => s.remove());
  return clean(tmp.textContent);
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
      } else if (!/^(SCRIPT|STYLE|IMG|SVG|BR)$/.test(child.tagName)) {
        inlineCopy(child, document, target);
      }
    }
  });
  return target;
}

function trimEdges(el) {
  if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.textContent = el.firstChild.textContent.replace(/^\s+/, '');
  if (el.lastChild && el.lastChild.nodeType === 3) el.lastChild.textContent = el.lastChild.textContent.replace(/\s+$/, '');
  // "REMISOL Advance <sup>" -> "REMISOL Advance<sup>"
  [...el.childNodes].forEach((n) => {
    const next = n.nextSibling;
    if (n.nodeType === 3 && next && next.nodeType === 1 && /^(SUP|SUB)$/.test(next.tagName)) {
      n.textContent = n.textContent.replace(/\s+$/, '');
    }
  });
  return el;
}

export default function parse(element, { document }) {
  const cells = [];

  // ---- row 1: heading row (heading is default content above) -------------
  cells.push(['']);

  // ---- items -----------------------------------------------------------------
  const cards = [...element.querySelectorAll('.product-card')]
    .filter((c) => !c.closest('.cloned') && !c.parentElement.closest('.product-card'));

  cards.forEach((card) => {
    const desc = card.querySelector('.product-description') || card;

    // title
    const titleEl = desc.querySelector('h1, h2, h3, h4, h5, h6');
    const h3 = document.createElement('h3');
    if (titleEl) trimEdges(inlineCopy(titleEl, document, h3));
    const titleText = clean(h3.textContent);

    // image
    const imageCell = [];
    const srcImg = [...card.querySelectorAll('img')]
      .find((i) => i.getAttribute('src') && !/^data:/i.test(i.getAttribute('src')));
    const bgSrc = card.getAttribute('data-icon-src') || card.getAttribute('data-bg-src') || '';
    if (srcImg || bgSrc) {
      const img = document.createElement('img');
      img.src = safeUrl(srcImg ? srcImg.getAttribute('src') : bgSrc);
      const titlePlain = titleEl ? (() => {
        const c = titleEl.cloneNode(true);
        c.querySelectorAll('sup, sub').forEach((s) => s.remove());
        return clean(c.textContent);
      })() : '';
      img.alt = plainAlt(srcImg ? srcImg.getAttribute('alt') : '', document) || titlePlain;
      imageCell.push(document.createComment(' field:image '), img);
    }

    // text
    const textCell = [];
    const tagEl = desc.querySelector('.label, .tag, .card-tag:not(.hide)');
    const tagText = clean(tagEl ? tagEl.textContent : '');
    if (tagText && (!titleEl || !tagEl.contains(titleEl))) {
      const p = document.createElement('p');
      p.textContent = tagText;
      textCell.push(p);
    }
    if (titleText) textCell.push(h3);

    const cta = desc.querySelector('a.btn-cta, a.ui.button, a.button')
      || [...desc.querySelectorAll('a[href]')].find((a) => clean(a.textContent) && !(titleEl && titleEl.contains(a)));
    [...desc.querySelectorAll('p')].forEach((p) => {
      if ((cta && p.contains(cta)) || !clean(p.textContent)) return;
      if (p.closest('.product-specs')) return;
      const para = document.createElement('p');
      trimEdges(inlineCopy(p, document, para));
      textCell.push(para);
    });

    const imageLink = srcImg && srcImg.closest('a[href]');
    const href = [
      cta && cta.getAttribute('href'),
      card.getAttribute('data-href'),
      onclickUrl(card),
      imageLink && imageLink.getAttribute('href'),
    ].find(isUsableHref) || '';
    const ctaText = clean(cta ? cta.textContent : '') || (href ? 'Learn more' : '');
    if (ctaText) {
      const p = document.createElement('p');
      if (href) {
        const a = document.createElement('a');
        a.href = safeUrl(href);
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid (products)', cells });
  element.replaceWith(block);
}
