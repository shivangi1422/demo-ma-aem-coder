/* eslint-disable */
/* global WebImporter */
/**
 * Parser: hero-curved-panel (mybeckman.in home).
 * Source: #main > div.main-holder > div.relative.justify-end.sm:flex
 *   > div (photo column) > div > img
 *   > div.hero__body > div > h1 > span > span "Beckman Coulter Life Sciences"
 *                          > p.hero-intro-animate (intro)
 *
 * Library convention (Hero): 1 column; row 1 = background image,
 * row 2 = title (heading) + subheading. No CTA on this source.
 * Block hero-curved-panel (blocks/hero-curved-panel/_hero-curved-panel.json),
 * model fields: image, imageAlt (collapses into <img alt>), text.
 *   Row 1: field:image -> hero <img> (original absolute URL, query removed)
 *   Row 2: field:text  -> <h1> + intro <p>
 */

const SITE_ORIGIN = 'https://www.mybeckman.in/';

const IMAGE_ALTS = {
  'https://media.beckman.com/-/media/beckman/site_promotion_banners/homepage_hero_images/homepage-hero-20231218.jpg':
    'Scientist in the lab holding a mechanical pipette',
};

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
  // Row 1: hero image (first real, non data-URI image)
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

  // Row 2: h1 + intro paragraph(s), plain text only (Tailwind spans dropped)
  const text = [];
  const heading = [...element.querySelectorAll('h1, h2')].find((h) => norm(h.textContent));
  if (heading) {
    const h1 = document.createElement('h1');
    h1.textContent = norm(heading.textContent);
    text.push(h1);
  }
  element.querySelectorAll('p').forEach((p) => {
    const t = norm(p.textContent);
    if (!t) return;
    const out = document.createElement('p');
    out.textContent = t;
    text.push(out);
  });

  const cells = [
    [imageCell],
    [text.length ? [hint(document, 'text'), ...text] : ''],
  ];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-curved-panel', cells });
  element.replaceWith(block);
}
