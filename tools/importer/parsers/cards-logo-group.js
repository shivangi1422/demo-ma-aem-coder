/* eslint-disable */
/* global WebImporter */

/**
 * Parser for `cards-logo-group` (GSPANN "Platforms and technologies" category cards).
 * Source: div.platforms-categories-wrapper > div.platform-category-card
 *   h4.platform-category-title + p.platform-category-desc
 *   + logos in .platform-card img — either directly in .platforms-grid or spread over
 *     several .platforms-carousel-slide pages (hidden pages are still in the DOM).
 * Output (xwalk model cards-logo-group-item: image, imageAlt, text) — FLAT rows:
 *   per category: [ empty | <!-- field:text --> H3 title, p description ]
 *   then per logo: [ <!-- field:image --> img | empty ]
 * Sanity SVG logos are requested as PNG (?fm=png&w=400); Next.js /_next/image URLs are
 * unwrapped to the original asset URL.
 */

function cleanImageSrc(src) {
  if (!src) return '';
  const next = src.match(/_next\/image\?(?:.*&)?url=([^&]+)/);
  let url = next ? decodeURIComponent(next[1]) : src;
  if (/cdn\.sanity\.io\/.+\.svg$/i.test(url)) url += '?fm=png&w=400';
  return url;
}

export default function parse(element, { document }) {
  const cells = [];

  element.querySelectorAll('.platform-category-card').forEach((card) => {
    const text = [];
    const titleEl = card.querySelector('.platform-category-title');
    if (titleEl) {
      const h3 = document.createElement('h3');
      h3.textContent = titleEl.textContent.trim();
      text.push(h3);
    }
    const descEl = card.querySelector('.platform-category-desc');
    if (descEl) {
      const p = document.createElement('p');
      p.textContent = descEl.textContent.trim();
      text.push(p);
    }
    if (text.length) cells.push(['', [document.createComment(' field:text '), ...text]]);

    // every logo of the category, across all carousel pages, in document order
    card.querySelectorAll('.platform-card img').forEach((srcImg) => {
      const src = cleanImageSrc(srcImg.getAttribute('src'));
      if (!src) return;
      const img = document.createElement('img');
      img.src = src;
      img.alt = srcImg.getAttribute('alt') || '';
      cells.push([[document.createComment(' field:image '), img], '']);
    });
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-logo-group', cells });
  element.replaceWith(block);
}
