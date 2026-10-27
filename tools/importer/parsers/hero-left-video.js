/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-left-video (block: hero, Style option: left).
 * Source: div.video-hero-carousel (beckmancoulter.com /en/solutions/hematology-solution):
 *   .banner-details > h1 + h3 (subtitle) + p > a.ui.button (in-page jump link)
 *   .item-container > video (looping MP4) + #video-tag-thumbnail (poster as
 *   inline CSS background)
 *
 * Library convention (Hero): 1 column, block name row + 2 content rows:
 *   Row 1: background image (optional)
 *   Row 2: title (heading), subheading, call-to-action (text with a link)
 * xwalk model `hero`: image (reference, imageAlt collapsed), text (richtext), classes.
 *
 * Row 1: poster image (the hero has no video field, so the MP4 is not migrated)
 * Row 2: h1 title + subtitle paragraph + CTA paragraph. The CTA keeps the live
 *        link; in-page anchors (#WatchVideo) were already rewritten by the
 *        hematology cleanup transformer to the target heading's EDS id. A
 *        link-less CTA (href missing / "#") is authored as plain text.
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

function bgUrl(el) {
  if (!el) return '';
  const style = el.getAttribute('style') || '';
  const m = style.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
  return m ? m[1].replace(/&amp;/g, '&').trim() : '';
}

export default function parse(element, { document }) {
  const cells = [];
  const details = element.querySelector('.banner-details') || element;
  const titleEl = details.querySelector('h1') || details.querySelector('h2');
  const title = clean(titleEl && titleEl.textContent);

  // ---- row 1: background image (video poster) ----------------------------
  const poster = element.querySelector('#video-tag-thumbnail, [id*="thumbnail"]');
  const srcImg = element.querySelector('.item-container img');
  const src = bgUrl(poster) || element.getAttribute('data-bg-src')
    || (srcImg && srcImg.getAttribute('src')) || '';
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = title;
    cells.push([[document.createComment(' field:image '), img]]);
  } else {
    cells.push(['']);
  }

  // ---- row 2: title, subheading, call-to-action ---------------------------
  const text = [];
  if (title) {
    const h1 = document.createElement('h1');
    h1.textContent = title;
    text.push(h1);
  }
  [...details.querySelectorAll('h2, h3, h4, h5, h6, p')].forEach((el) => {
    if (el === titleEl) return;
    const value = clean(el.textContent);
    if (!value) return;
    const link = el.querySelector('a');
    const p = document.createElement('p');
    if (link && clean(link.textContent) === value) {
      const href = link.getAttribute('href');
      if (isUsableHref(href)) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = value;
        // source renders it as a button
        if (/\bbutton\b/.test(link.className || '')) {
          const strong = document.createElement('strong');
          strong.append(a);
          p.append(strong);
        } else {
          p.append(a);
        }
      } else {
        p.textContent = value;
      }
    } else {
      p.textContent = value;
    }
    text.push(p);
  });
  if (text.length) {
    cells.push([[document.createComment(' field:text '), ...text]]);
  } else {
    cells.push(['']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero (left)', cells });
  element.replaceWith(block);
}
