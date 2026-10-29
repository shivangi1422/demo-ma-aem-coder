/* eslint-disable */
/* global WebImporter */
/**
 * Parser: hero-dim-buttons (mybeckman.in /service/plans/centrifuge, exact-match design).
 * Source: .bc-rich-text > .hero
 *   > img (background photo, 50% over black)
 *   > div > h1, h2 (subtitle), a.btn.btn-primary (filled), a.btn.btn-secondary (outline)
 *   (the cleanup transformer has already wrapped each bare a.btn as <p><strong><a>)
 *
 * Library convention (Hero): 1 column; row 1 = background image, row 2 = text and CTAs.
 * Block hero-dim-buttons (blocks/hero-dim-buttons/_hero-dim-buttons.json), model fields:
 * image, imageAlt (collapses into <img alt>), text.
 *   Row 1: field:image -> <img> (original absolute URL, query removed)
 *   Row 2: field:text  -> <h1/><h2/><p><strong><a>primary</a></strong></p><p><em><a>outline</a></em></p>
 * Template option `variant` (e.g. "tall": /service/plans/flow-cytometry, min-height 450px, text
 * padding from 700px) becomes the block class (model field `classes`).
 */

const SITE_ORIGIN = 'https://www.mybeckman.in/';

// The live alt ("Scientist in Lab") does not describe this photo.
const IMAGE_ALTS = {
  'https://media.beckman.com/-/media/service/media/centrifuge_hero-2022-09.jpg':
    'Lab technician using the touchscreen of a Beckman Coulter centrifuge',
  'https://media.beckman.com/-/media/service/media/flow_cytometry_plans_hero-2022-09.jpg':
    'Beckman Coulter service engineer opening the cover of a CytoFLEX LX flow cytometer',
  'https://media.beckman.com/-/media/service/media/particle_analysis_plans-2022-09.jpg':
    'Lab scientist working at a Vi-CELL BLU cell viability analyzer',
};

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
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

function buttonPara(document, src) {
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.setAttribute('href', (src.getAttribute('href') || '').trim());
  a.textContent = norm(src.textContent);
  const wrap = document.createElement(src.classList.contains('btn-secondary') ? 'em' : 'strong');
  wrap.append(a);
  p.append(wrap);
  return p;
}

export default function parse(element, { document, options = {} }) {
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

  const heading = [...element.querySelectorAll('h1, h2, h3, h4, h5, h6')].find((h) => norm(h.textContent));
  const box = (heading && heading.parentElement) || element;
  const text = [];
  let headingCount = 0;
  [...box.children].forEach((el) => {
    if (el.matches('img, picture') || el.querySelector('img')) return;
    const t = norm(el.textContent);
    if (!t) return;
    if (el.matches('h1, h2, h3, h4, h5, h6')) {
      const h = document.createElement(headingCount === 0 ? 'h1' : 'h2');
      headingCount += 1;
      h.textContent = t;
      text.push(h);
      return;
    }
    const link = el.matches('a[href]') ? el : el.querySelector('a[href]');
    if (link && norm(link.textContent) === t) {
      text.push(buttonPara(document, link));
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
  const variants = options.variant ? [options.variant] : [];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-dim-buttons', variants, cells });
  element.replaceWith(block);
}
