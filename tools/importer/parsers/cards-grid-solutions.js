/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-solutions (block: cards-grid, Style option: solutions).
 * Source: div.col-3-default-padding (beckmancoulter.com dxs-service-and-supports pages).
 *
 * xwalk container model `cards-grid`: text (richtext), classes.
 * Item model `cards-grid-item`: image (reference, imageAlt collapsed), text (richtext).
 *
 * Row 1: heading/intro - empty (the section H2 is default content above the block)
 * Rows 2..N: one per .card -> image | [<p><strong>NEW</strong></p>] <h3>title</h3> <p>desc</p> <p><a>CTA</a></p>
 * The inner anchors have no href; the card URL comes from the card's
 * onclick="window.location.href='...'" (CTA kept as plain text if absent).
 */

const clean = (str) => (str || '').replace(/\s+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

function onclickUrl(el) {
  const onclick = (el && el.getAttribute('onclick')) || '';
  const m = onclick.match(/location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i)
    || onclick.match(/window\.open\(\s*['"]([^'"]+)['"]/i);
  return m ? m[1].trim() : '';
}

/** title content keeping inline emphasis (PRO<em>Service</em>) */
function buildTitle(titleEl, document) {
  const h3 = document.createElement('h3');
  [...titleEl.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      h3.append(document.createTextNode(node.textContent.replace(/\s+/g, ' ')));
    } else if (node.nodeType === 1 && /^(EM|I|STRONG|B)$/.test(node.tagName)) {
      const tag = /^(EM|I)$/.test(node.tagName) ? 'em' : 'strong';
      const inline = document.createElement(tag);
      inline.textContent = clean(node.textContent);
      if (inline.textContent) h3.append(inline);
    } else if (node.nodeType === 1) {
      h3.append(document.createTextNode(node.textContent.replace(/\s+/g, ' ')));
    }
  });
  // trim leading/trailing whitespace text nodes
  const first = h3.firstChild;
  if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
  const last = h3.lastChild;
  if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
  return clean(h3.textContent) ? h3 : null;
}

export default function parse(element, { document }) {
  const cells = [];

  // ---- row 1: heading (empty) ---------------------------------------------
  cells.push(['']);

  // ---- items --------------------------------------------------------------
  const cards = [...element.querySelectorAll(':scope > .column .card, :scope > .column > .card')]
    .filter((c, i, arr) => arr.indexOf(c) === i);
  cards.forEach((card) => {
    const url = onclickUrl(card)
      || (card.querySelector('a[href]') && card.querySelector('a[href]').getAttribute('href'))
      || '';

    // image
    const imageCell = [];
    const srcImg = card.querySelector('.image img[src], img[src]');
    const titleEl = card.querySelector('.card-header-text, .content .header');
    const titleText = clean(titleEl ? titleEl.textContent : '');
    if (srcImg) {
      const img = document.createElement('img');
      img.src = srcImg.getAttribute('src');
      const alt = clean(srcImg.getAttribute('alt'));
      // source alts are truncated ("PRO", "DxI9000"); prefer the card title
      const squash = (s) => s.replace(/\s+/g, '').toLowerCase();
      const truncated = !alt || alt.length <= 3 || squash(titleText).startsWith(squash(alt));
      img.alt = truncated ? (titleText || alt) : alt;
      imageCell.push(document.createComment(' field:image '), img);
    }

    // text
    const textCell = [];
    const tag = card.querySelector('.card-tag span');
    const tagText = clean(tag ? tag.textContent : '');
    if (tagText && !card.querySelector('.card-tag.hide')) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = tagText;
      p.append(strong);
      textCell.push(p);
    }
    if (titleEl) {
      const h3 = buildTitle(titleEl, document);
      if (h3) textCell.push(h3);
    }
    const desc = card.querySelector('.card-content-text');
    const descText = clean(desc ? desc.textContent : '');
    if (descText) {
      const p = document.createElement('p');
      p.textContent = descText;
      textCell.push(p);
    }
    const cta = card.querySelector('.btn-cta, .explore-link a, .explore-link .button');
    const ctaText = clean(cta ? cta.textContent : '');
    if (ctaText) {
      const p = document.createElement('p');
      const href = (cta && cta.getAttribute('href')) || url;
      if (isUsableHref(href)) {
        const a = document.createElement('a');
        a.href = href;
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid (solutions)', cells });
  element.replaceWith(block);
}
