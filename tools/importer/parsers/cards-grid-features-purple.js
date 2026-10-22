/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-features-purple (block: cards-grid, Style option: features-purple).
 * Source: div.data-visualization-container (beckmancoulter.com dxs-service-and-supports pages).
 *
 * xwalk container model `cards-grid`: text (richtext), classes.
 * Item model `cards-grid-item`: image (reference, imageAlt collapsed), text (richtext).
 *
 * Row 1: h2 heading (+ optional sub-header paragraph)
 * Rows 2..N: one per .chart-feature -> icon (CSS background of .custom-icon, decorative, alt '')
 *            | <p><strong>title</strong></p> + <p>description</p>
 */

const clean = (str) => (str || '').replace(/\s+/g, ' ').trim();

function bgUrl(el) {
  if (!el) return '';
  const style = el.getAttribute('style') || '';
  const re = /url\(\s*['"]?([^'")]*)['"]?\s*\)/gi;
  let m;
  while ((m = re.exec(style))) {
    const url = m[1].replace(/&amp;/g, '&').trim();
    if (url) return url;
  }
  return '';
}

export default function parse(element, { document }) {
  const cells = [];

  // ---- row 1: heading -----------------------------------------------------
  const intro = [];
  const headerWrap = element.querySelector('.dv-header');
  const heading = (headerWrap && headerWrap.querySelector('h1, h2, h3, h4'))
    || element.querySelector('.dv-content h2');
  if (heading && clean(heading.textContent)) {
    const h2 = document.createElement('h2');
    h2.textContent = clean(heading.textContent);
    intro.push(h2);
  }
  const sub = element.querySelector('.dv-sub-header');
  if (sub && clean(sub.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(sub.textContent);
    intro.push(p);
  }
  if (intro.length) {
    intro.unshift(document.createComment(' field:text '));
    cells.push([intro]);
  } else {
    cells.push(['']);
  }

  // ---- items --------------------------------------------------------------
  element.querySelectorAll('.charts .chart-feature').forEach((feature) => {
    const imageCell = [];
    const iconImg = feature.querySelector('.chart-graph img');
    const src = (iconImg && iconImg.getAttribute('src'))
      || bgUrl(feature.querySelector('.custom-icon'))
      || bgUrl(feature.querySelector('.chart-graph'));
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      imageCell.push(document.createComment(' field:image '), img);
    }

    const textCell = [];
    const titleEl = feature.querySelector('.chart-header');
    const title = clean(titleEl ? titleEl.textContent : '');
    if (title) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = title;
      p.append(strong);
      textCell.push(p);
    }
    const body = feature.querySelector('.chart-body');
    const desc = clean(body ? body.textContent : '');
    if (desc) {
      const p = document.createElement('p');
      p.textContent = desc;
      textCell.push(p);
    }
    if (textCell.length) textCell.unshift(document.createComment(' field:text '));

    if (!imageCell.length && !textCell.length) return;
    cells.push([imageCell.length ? imageCell : '', textCell.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid (features-purple)', cells });
  element.replaceWith(block);
}
