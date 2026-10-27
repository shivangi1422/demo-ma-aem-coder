/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-promo (block: hero, Style option: promo).
 * Source: div.photo-hero-promotional-banner (beckmancoulter.com product category
 * pages, "Articles and Stories" blog banner):
 *   background image (data-bg-src recorded by the product cleanup, else inline
 *   background url, else the banner's <img>)
 *   .banner-heading / .banner-details / .carousel-button-wrapper a.button
 *
 * Library hero convention: 1 column; row 1 = background image, row 2 = title,
 * subheading, CTA. xwalk model `hero`: image (reference, imageAlt collapsed),
 * text (richtext), classes.
 * Row 1: background image (decorative, empty alt unless the source has one)
 * Row 2: <h2>heading</h2> <p>details</p> <p><strong><a>CTA</a></strong></p>
 *   H2 because the page's only H1 is the intro heading (analysis); the CTA is
 *   bold so EDS decorates it as the primary (red) button.
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

/** escape stray '%' so URI decoding in html2md does not throw */
const safeUrl = (url) => (url || '').trim().replace(/%(?![0-9a-fA-F]{2})/g, '%25');

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

function bgUrl(el) {
  if (!el || !el.getAttribute) return '';
  const style = el.getAttribute('style') || '';
  const m = style.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
  return m && m[1] ? m[1].replace(/&amp;/g, '&').trim() : '';
}

export default function parse(element, { document }) {
  const cells = [];

  // ---- row 1: background image ---------------------------------------------
  const holder = [element, ...element.querySelectorAll('[data-bg-src], [style*="url("]')]
    .find((el) => el.getAttribute('data-bg-src') || bgUrl(el));
  const srcImg = [...element.querySelectorAll('img')]
    .find((i) => i.getAttribute('src') && !/^data:/i.test(i.getAttribute('src')));
  const src = (holder && (holder.getAttribute('data-bg-src') || bgUrl(holder)))
    || (srcImg && srcImg.getAttribute('src')) || '';
  if (src) {
    const img = document.createElement('img');
    img.src = safeUrl(src);
    img.alt = clean(srcImg ? srcImg.getAttribute('alt') : '');
    cells.push([[document.createComment(' field:image '), img]]);
  } else {
    cells.push(['']);
  }

  // ---- row 2: text -----------------------------------------------------------
  const textCell = [];
  const headingEl = element.querySelector('.banner-heading, h1, h2, h3, .heading');
  const headingText = clean(headingEl ? headingEl.textContent : '');
  if (headingText) {
    const h2 = document.createElement('h2');
    h2.textContent = headingText;
    textCell.push(h2);
  }
  const details = element.querySelectorAll('.banner-details, .heading-container > p, .content-container > p');
  [...details].forEach((d) => {
    const text = clean(d.textContent);
    if (!text) return;
    const p = document.createElement('p');
    p.textContent = text;
    textCell.push(p);
  });
  const ctas = [...element.querySelectorAll('.carousel-button-wrapper a, a.ui.button, a.btn-cta')]
    .filter((a, i, arr) => arr.indexOf(a) === i && clean(a.textContent));
  ctas.forEach((cta, i) => {
    const text = clean(cta.textContent);
    const href = cta.getAttribute('href');
    const p = document.createElement('p');
    if (isUsableHref(href)) {
      const a = document.createElement('a');
      a.href = safeUrl(href);
      a.textContent = text;
      if (i === 0) {
        // first CTA = primary button
        const strong = document.createElement('strong');
        strong.append(a);
        p.append(strong);
      } else {
        p.append(a);
      }
    } else {
      p.textContent = text;
    }
    textCell.push(p);
  });
  if (textCell.length) {
    cells.push([[document.createComment(' field:text '), ...textCell]]);
  } else {
    cells.push(['']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero (promo)', cells });
  element.replaceWith(block);
}
