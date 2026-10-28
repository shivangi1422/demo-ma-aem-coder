/* eslint-disable */
/* global WebImporter */

/**
 * Parser for `hero-overlay-left` (GSPANN service hero).
 * Source: section.service-hero
 *   .service-hero-background picture img | .service-hero-content h1 + p + .service-hero-ctas a
 * Output (xwalk model hero-overlay-left: image, imageAlt, text):
 *   row 1: <!-- field:image --> img
 *   row 2: <!-- field:text --> H1, description, CTA link
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

  const srcImg = element.querySelector('.service-hero-background img, img');
  if (srcImg) {
    // prefer the desktop art-direction source (widest min-width) over the 750x750 mobile fallback
    const widest = [...(srcImg.closest('picture')?.querySelectorAll('source[srcset], source[srcSet]') || [])]
      .map((s) => ({
        min: parseInt((s.getAttribute('media') || '').match(/min-width:\s*(\d+)/)?.[1] || '0', 10),
        src: (s.getAttribute('srcset') || s.getAttribute('srcSet') || '').split(',')[0].trim().split(/\s+/)[0],
      }))
      .filter((s) => s.src)
      .sort((a, b) => b.min - a.min)[0];
    const img = document.createElement('img');
    img.src = cleanImageSrc(widest ? widest.src : srcImg.getAttribute('src'));
    img.alt = srcImg.getAttribute('alt') || '';
    cells.push([[document.createComment(' field:image '), img]]);
  } else {
    cells.push(['']);
  }

  const content = element.querySelector('.service-hero-content') || element;
  const text = [];
  const h1 = content.querySelector('h1, h2');
  if (h1) {
    const h = document.createElement('h1');
    h.textContent = h1.textContent.trim();
    text.push(h);
  }
  const desc = content.querySelector('.service-hero-description, p');
  if (desc) {
    const p = document.createElement('p');
    p.textContent = desc.textContent.trim();
    text.push(p);
  }
  content.querySelectorAll('.service-hero-ctas a').forEach((a) => {
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = a.getAttribute('href') || '';
    link.textContent = a.textContent.trim();
    p.append(link);
    text.push(p);
  });
  cells.push(text.length ? [[document.createComment(' field:text '), ...text]] : ['']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-overlay-left', cells });
  element.replaceWith(block);
}
