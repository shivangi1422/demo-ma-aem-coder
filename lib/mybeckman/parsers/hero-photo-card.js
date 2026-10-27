/* eslint-disable */
/* global WebImporter */
/**
 * Parser: hero-photo-card (mybeckman.in home, "Our company").
 * Source: #about
 *   > div.relative.z-10 > div > div.rounded-xl (card)
 *       > p "Our company" (eyebrow)
 *       > h2 "A Leader in Life (and Science)"
 *       > p (text)
 *       > a.rounded-full[href="/about-us"] label + span "->" (button)
 *   > img.absolute (background photo)
 *
 * Library convention (Hero): 1 column; row 1 = background image,
 * row 2 = title, text and call-to-action.
 * Block hero-photo-card (blocks/hero-photo-card/_hero-photo-card.json, README),
 * model fields: image, imageAlt (collapses into <img alt>), text.
 *   Row 1: field:image -> background <img> (original absolute URL, query removed)
 *   Row 2: field:text  -> <p>eyebrow</p><h2/><p>text</p><p><strong><a href>label</a></strong></p>
 * The "->" arrow glyph is not authored (the block JS adds it).
 */

const SITE_ORIGIN = 'https://www.mybeckman.in/';

const IMAGE_ALTS = {
  'https://media.beckman.com/-/media/images/homepage/about-us-bg.jpeg':
    'Empty laboratory with white benches, chairs and a sink',
};

const ARROW_TRAILING = /\s*(->|→)\s*$/;

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

function cleanSrc(src) {
  const s = (src || '').trim();
  // data: placeholders (and the blob: URLs the importer turns them into) are not real images
  if (!s || /^(data|blob):/i.test(s)) return '';
  try {
    const u = new URL(s, SITE_ORIGIN);
    return `${u.origin}${u.pathname}`;
  } catch (e) {
    return s.split(/[?#]/)[0];
  }
}

export default function parse(element, { document }) {
  // Row 1: background image
  let imageCell = '';
  const srcImg = [...element.querySelectorAll('img')]
    .find((i) => cleanSrc(i.getAttribute('src') || i.getAttribute('data-src')));
  if (srcImg) {
    const src = cleanSrc(srcImg.getAttribute('src') || srcImg.getAttribute('data-src'));
    const img = document.createElement('img');
    img.setAttribute('src', src);
    img.setAttribute('alt', IMAGE_ALTS[src] || norm(srcImg.getAttribute('alt')));
    imageCell = [hint(document, 'image'), img];
  }

  // Row 2: card content in document order
  const heading = [...element.querySelectorAll('h1, h2, h3, h4, h5, h6')].find((h) => norm(h.textContent));
  const card = (heading && heading.parentElement) || element;
  const text = [];
  [...card.children].forEach((el) => {
    if (el.matches('img, picture') || el.querySelector('img')) return;
    const t = norm(el.textContent);
    if (!t) return;
    if (el.matches('h1, h2, h3, h4, h5, h6')) {
      const h2 = document.createElement('h2');
      h2.textContent = t;
      text.push(h2);
    } else if (el.matches('a[href]') || (el.matches('p') && el.querySelector('a[href]')
      && norm(el.querySelector('a[href]').textContent) === t)) {
      const src = el.matches('a') ? el : el.querySelector('a[href]');
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      const a = document.createElement('a');
      a.setAttribute('href', (src.getAttribute('href') || '').trim());
      a.textContent = norm(src.textContent).replace(ARROW_TRAILING, '');
      strong.append(a);
      p.append(strong);
      text.push(p);
    } else {
      const p = document.createElement('p');
      p.textContent = t;
      text.push(p);
    }
  });

  const cells = [
    [imageCell],
    [text.length ? [hint(document, 'text'), ...text] : ''],
  ];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-photo-card', cells });
  element.replaceWith(block);
}
