/* eslint-disable */
/* global WebImporter */

/**
 * Parser for `cards-leader` (GSPANN "Connect with Us" leadership cards).
 * Source: div.leadership-grid > div.leader-card
 *   .leader-image-wrapper img.leader-image (Next.js /_next/image?url=...)
 *   .leader-info: h3.leader-name, p.leader-title, button.leader-contact-link ("Get In Touch →")
 * Output (xwalk model cards-leader-item: image, imageAlt, text), one row per leader:
 *   [ <!-- field:image --> portrait | <!-- field:text --> H3 name, p title, p>a "Get In Touch" ]
 * The contact button opens a JS modal; it is rebuilt as a link to the #connect section.
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

  element.querySelectorAll('.leader-card').forEach((card) => {
    const srcImg = card.querySelector('img.leader-image, .leader-image-wrapper img');
    let imageCell = '';
    if (srcImg) {
      const img = document.createElement('img');
      img.src = cleanImageSrc(srcImg.getAttribute('src'));
      img.alt = srcImg.getAttribute('alt') || '';
      imageCell = [document.createComment(' field:image '), img];
    }

    const text = [];
    const name = card.querySelector('.leader-name');
    if (name) {
      const h3 = document.createElement('h3');
      h3.textContent = name.textContent.trim();
      text.push(h3);
    }
    const title = card.querySelector('.leader-title');
    if (title) {
      const p = document.createElement('p');
      p.textContent = title.textContent.trim();
      text.push(p);
    }
    const cta = card.querySelector('.leader-contact-link');
    if (cta) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = cta.getAttribute('href') || '#connect';
      a.textContent = cta.textContent.replace(/[→›]/g, '').trim() || 'Get In Touch';
      p.append(a);
      text.push(p);
    }

    if (!imageCell && !text.length) return;
    cells.push([imageCell, text.length ? [document.createComment(' field:text '), ...text] : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-leader', cells });
  element.replaceWith(block);
}
