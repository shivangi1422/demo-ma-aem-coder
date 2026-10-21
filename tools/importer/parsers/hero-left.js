/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-left (block: hero, Style option: left).
 * Source: div.large-header-banner (beckmancoulter.com solutions pages).
 *
 * xwalk model `hero`: image (reference, imageAlt collapsed), text (richtext), classes.
 * Row 1: background image (img.lgb-banner-bg or the banner's CSS background-image)
 * Row 2: h1 title + subtitle paragraph (source h3 "role=heading" becomes a p)
 */

const clean = (str) => (str || '').replace(/\s+/g, ' ').trim();

function bgUrl(el) {
  if (!el) return '';
  const style = el.getAttribute('style') || '';
  const m = style.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
  return m ? m[1].replace(/&amp;/g, '&').trim() : '';
}

export default function parse(element, { document }) {
  const cells = [];

  // ---- row 1: image -------------------------------------------------------
  // prefer the banner <img>; a background converted to <img> is the fallback
  const srcImg = element.querySelector('.lbg-banner-wrapper img')
    || element.querySelector('img.lgb-banner-bg')
    || element.querySelector('img');
  const src = (srcImg && srcImg.getAttribute('src')) || bgUrl(element);
  if (src) {
    const altSource = [srcImg, ...element.querySelectorAll('img[alt]')]
      .find((i) => i && clean(i.getAttribute('alt')));
    const img = document.createElement('img');
    img.src = src;
    img.alt = clean(altSource ? altSource.getAttribute('alt') : '');
    cells.push([[document.createComment(' field:image '), img]]);
  } else {
    cells.push(['']);
  }

  // ---- row 2: text --------------------------------------------------------
  const textCell = [];
  const details = element.querySelector('.lgb-banner-details, .lgb-heading-container, .lgb-content-container') || element;
  const title = details.querySelector('h1') || details.querySelector('h2');
  if (title && clean(title.textContent)) {
    const h1 = document.createElement('h1');
    h1.textContent = clean(title.textContent);
    textCell.push(h1);
  }
  details.querySelectorAll('h2, h3, h4, h5, h6, p').forEach((el) => {
    if (el === title) return;
    const text = clean(el.textContent);
    if (!text) return;
    const p = document.createElement('p');
    p.textContent = text;
    textCell.push(p);
  });
  if (textCell.length) {
    textCell.unshift(document.createComment(' field:text '));
    cells.push([textCell]);
  } else {
    cells.push(['']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero (left)', cells });
  element.replaceWith(block);
}
