/* eslint-disable */
/* global WebImporter */
/**
 * Parser: hero-dim-photo (mybeckman.in /service, exact-match design).
 * Source: .bc-rich-text > .hero
 *   > img (background photo, shown at 50% over black)
 *   > div > h1, p (intro), a.btn.btn-primary[href="#getInTouch"] (CTA)
 *
 * Library convention (Hero): 1 column; row 1 = background image,
 * row 2 = title, text and call-to-action.
 * Block hero-dim-photo (blocks/hero-dim-photo/_hero-dim-photo.json, README),
 * model fields: image, imageAlt (collapses into <img alt>), text.
 *   Row 1: field:image -> <img> (original absolute URL, query removed)
 *   Row 2: field:text  -> <h1/><p>intro</p><p><a href>CTA</a></p>
 * The CTA is a plain link in its own paragraph; the block renders any
 * link-only paragraph as the outline button.
 */

const SITE_ORIGIN = 'https://www.mybeckman.in/';

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

function cleanSrc(src) {
  const s = (src || '').trim();
  if (!s || /^(data|blob):/i.test(s)) return '';
  try {
    const u = new URL(s, SITE_ORIGIN);
    return `${u.origin}${u.pathname}`;
  } catch (e) {
    return s.split(/[?#]/)[0];
  }
}

export default function parse(element, { document }) {
  let imageCell = '';
  const srcImg = [...element.querySelectorAll('img')]
    .find((i) => cleanSrc(i.getAttribute('src') || i.getAttribute('data-src')));
  if (srcImg) {
    const img = document.createElement('img');
    img.setAttribute('src', cleanSrc(srcImg.getAttribute('src') || srcImg.getAttribute('data-src')));
    img.setAttribute('alt', norm(srcImg.getAttribute('alt')));
    imageCell = [hint(document, 'image'), img];
  }

  const heading = [...element.querySelectorAll('h1, h2, h3, h4, h5, h6')].find((h) => norm(h.textContent));
  const box = (heading && heading.parentElement) || element;
  const text = [];
  [...box.children].forEach((el) => {
    if (el.matches('img, picture') || el.querySelector('img')) return;
    const t = norm(el.textContent);
    if (!t) return;
    if (el.matches('h1, h2, h3, h4, h5, h6')) {
      const h1 = document.createElement('h1');
      h1.textContent = t;
      text.push(h1);
      return;
    }
    const link = el.matches('a[href]') ? el : el.querySelector('a[href]');
    if (link && norm(link.textContent) === t) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', (link.getAttribute('href') || '').trim());
      a.textContent = t;
      p.append(a);
      text.push(p);
      return;
    }
    const p = document.createElement('p');
    p.textContent = t;
    text.push(p);
  });

  const cells = [
    [imageCell],
    [text.length ? [hint(document, 'text'), ...text] : ''],
  ];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-dim-photo', cells });
  element.replaceWith(block);
}
