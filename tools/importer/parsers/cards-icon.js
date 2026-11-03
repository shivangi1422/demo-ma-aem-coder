/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-icon (xwalk items: cards-icon-item: image, text) — cards convention:
 * one row per card, first cell image (icon), second cell rich text (title + description).
 * Sources:
 *  - a container (.Content__body) of div.ListingCard (img icon, h3 title, p text);
 *    content around the cards (e.g. the section h2) stays default content
 *  - variant horizontal (icon beside the text, two per row): a bootstrap .container whose
 *    .col-sm-6 columns hold .col-sm-3 (icon) + .col-sm-9 (a > h4 title, ol steps), or a .row of
 *    .col-md-1 (icon) + .col-md-5 (text) pairs (/service/training)
 *  - variant tiles (red link tiles): .menu > a > button.menu-item (icon + label) (/service/training)
 * Output: one row per card: [<!-- field:image --><img>] [<!-- field:text --><h3>…</h3><p>…</p>]
 * (an empty image cell is kept when a card has no icon)
 */
function parseTiles(element, document) {
  // (the section transformer may have wrapped the links into a paragraph)
  const links = [...element.querySelectorAll('a')].filter((a) => a.querySelector('button.menu-item'));
  if (!links.length) return;
  const cells = links.map((a) => {
    const imageCell = document.createDocumentFragment();
    const srcImg = a.querySelector('img');
    if (srcImg) {
      const img = document.createElement('img');
      img.src = srcImg.getAttribute('src');
      img.alt = srcImg.getAttribute('alt') || '';
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(img);
    }
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = a.getAttribute('href') || '';
    link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
    p.append(link);
    textCell.appendChild(p);
    return [imageCell, textCell];
  });
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'Cards Icon (tiles)', cells }));
}

function parseHorizontal(element, document) {
  // pairs: .col-sm-6 > .col-sm-3 + .col-sm-9, or sibling .col-md-1 + .col-md-5
  let pairs = [...element.querySelectorAll('.col-sm-6')]
    .filter((c) => c.querySelector(':scope > .col-sm-3 img') && c.querySelector(':scope > .col-sm-9'))
    .map((c) => [c.querySelector(':scope > .col-sm-3'), c.querySelector(':scope > .col-sm-9')]);
  if (!pairs.length) {
    pairs = [...element.querySelectorAll(':scope > .col-md-1')]
      .filter((c) => c.querySelector('img') && c.nextElementSibling && c.nextElementSibling.matches('.col-md-5'))
      .map((c) => [c, c.nextElementSibling]);
  }
  if (!pairs.length) return;
  const cells = pairs.map(([iconCol, body]) => {
    const imageCell = document.createDocumentFragment();
    const srcImg = iconCol.querySelector('img');
    const img = document.createElement('img');
    img.src = srcImg.getAttribute('src');
    img.alt = srcImg.getAttribute('alt') || '';
    imageCell.appendChild(document.createComment(' field:image '));
    imageCell.appendChild(img);
    // a > h4 (link around the title; often without href) -> h4 (> a)
    body.querySelectorAll('a > h2, a > h3, a > h4').forEach((h) => {
      const a = h.parentElement;
      if (a.getAttribute('href')) {
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
        link.append(...h.childNodes);
        h.append(link);
      }
      a.replaceWith(h);
    });
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    [...body.children].forEach((n) => textCell.appendChild(n));
    return [imageCell, textCell];
  });
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'Cards Icon (horizontal)', cells }));
}

export default function parse(element, { document }) {
  if (element.classList.contains('menu')) { parseTiles(element, document); return; }
  if (!element.classList.contains('Content__body')) { parseHorizontal(element, document); return; }
  const cards = [...element.children].filter((c) => c.classList.contains('ListingCard'));
  if (!cards.length) return;
  const cells = cards.map((card) => {
    const imageCell = document.createDocumentFragment();
    const srcImg = card.querySelector('img');
    if (srcImg && srcImg.getAttribute('src')) {
      const img = document.createElement('img');
      img.src = srcImg.getAttribute('src');
      img.alt = srcImg.getAttribute('alt') || '';
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(img);
      (srcImg.closest('p') || srcImg).remove();
    }
    const textCell = document.createDocumentFragment();
    const parts = [...card.querySelectorAll(':scope > h2, :scope > h3, :scope > h4, :scope > p, :scope > ul')];
    if (parts.length) {
      textCell.appendChild(document.createComment(' field:text '));
      parts.forEach((n) => textCell.appendChild(n));
    }
    return [imageCell, textCell];
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-icon', cells });
  cards[0].replaceWith(block);
  cards.slice(1).forEach((c) => c.remove());
}
