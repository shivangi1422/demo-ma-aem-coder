/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-features (block: cards-grid, Style option: features).
 * Source: div.data-visualization-container (beckmancoulter.com solutions pages).
 *
 * xwalk container model `cards-grid`: text (richtext), classes.
 * Item model `cards-grid-item`: image (reference, imageAlt collapsed), text (richtext).
 *
 * Row 1: h2 + sub-header paragraph
 * Rows 3..N: one per div.chart-feature -> icon (CSS background of .custom-icon)
 *            | h3 title (.chart-header) + description (.chart-body)
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

/** rich text from a div holding text and <br> line breaks */
function textWithBreaks(el, document) {
  const p = document.createElement('p');
  const lines = (el.innerHTML || '').split(/<br\s*\/?>/i)
    .map((html) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return clean(tmp.textContent);
    })
    .filter(Boolean);
  lines.forEach((line, i) => {
    if (i) p.append(document.createElement('br'));
    p.append(document.createTextNode(line));
  });
  return lines.length ? p : null;
}

export default function parse(element, { document }) {
  const cells = [];

  // ---- row 1: heading / intro ------------------------------------------
  const intro = [];
  const headerWrap = element.querySelector('.dv-header');
  const heading = (headerWrap && headerWrap.querySelector('h1, h2, h3, h4')) || element.querySelector('.dv-content h2');
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
    const icon = feature.querySelector('.custom-icon');
    const iconImg = feature.querySelector('.chart-graph img');
    const src = (iconImg && iconImg.getAttribute('src')) || bgUrl(icon) || bgUrl(feature.querySelector('.chart-graph'));
    const titleEl = feature.querySelector('.chart-header');
    const title = clean(titleEl ? titleEl.textContent : '');
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = (iconImg && clean(iconImg.getAttribute('alt'))) || title;
      imageCell.push(document.createComment(' field:image '), img);
    }

    const textCell = [];
    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title;
      textCell.push(h3);
    }
    const body = feature.querySelector('.chart-body');
    const desc = body ? textWithBreaks(body, document) : null;
    if (desc) textCell.push(desc);
    if (textCell.length) textCell.unshift(document.createComment(' field:text '));

    cells.push([imageCell.length ? imageCell : '', textCell.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid (features)', cells });
  element.replaceWith(block);
}
