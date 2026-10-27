/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-promo (mybeckman.in home, "Fresh insights").
 * Source: #latest > div.grid
 *   > a.group[href] (x7, whole card is the link)
 *       > div.relative.aspect-[3/2] > img (real image)
 *                                   > div[role=status] skeleton > img (data-URI placeholder)
 *       > p (eyebrow)
 *       > p > span (title, may contain <br>)
 *
 * Library convention (Cards): one row per card, 2 columns (image | text).
 * Block cards-promo (blocks/cards-promo/_cards-promo.json, README): collection of
 * cards-promo-item (fields: image, imageAlt -> collapses into <img alt>, text).
 *   cell 1: field:image -> <img> original absolute URL (query removed), fixed alt
 *   cell 2: field:text  -> <p>eyebrow</p><p><a href="(card href)">title</a></p>
 * Data-URI placeholder images are skipped.
 */

const SITE_ORIGIN = 'https://www.mybeckman.in/';

// Alts keyed by image URL (origin + path). Live typos fixed
// ("LIquid" -> "Liquid", "Maufacturing" -> "Manufacturing").
const IMAGE_ALTS = {
  'https://media.beckman.com/-/media/automation/products/instruments/echo-series/echo-655t-plus-acoustic-liquid-handler-lab-scientists-promo-card.jpg':
    'Two lab scientists are working on Echo 655T Plus Acoustic Liquid Handler',
  'https://media.beckman.com/-/media/flow-cytometry/media/banner/flow-cytometry-dxflex-home-page-banner-2024-05.jpg':
    'DxFLEX Flow Cytometer banner',
  'https://media.beckman.com/-/media/beckman/site_promotion_banners/promotional-cards/maufacturing-quality-control.jpg':
    'Manufacturing Quality Control',
  'https://media.beckman.com/-/media/beckman/site_promotion_banners/promotional-cards/evidense-evifluor-biomek-integration-homepage-promo-card.jpg':
    'Biomek-automated nucleic acid quantification using eviFluor DUO and eviDense UV modules',
  'https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-homepage-hero.jpg':
    'Laboratory technician pipetting',
  'https://media.beckman.com/-/media/centrifugation/products/instruments/optimate-gradient-maker/optimate-gradient-maker-in-a-laboratory.jpg':
    'OptiMATE Gradient Maker in a laboratory',
  'https://media.beckman.com/-/media/beckman/site_promotion_banners/promotional-cards/biomanufacturing-ebook-promo-card.jpg':
    'Biomanufacturing eBook illustration',
};

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function fixAlt(s) {
  return norm(s).replace(/\bLIquid\b/g, 'Liquid').replace(/\bMaufacturing\b/g, 'Manufacturing');
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

/** Text lines of `src`, split at <br> (spans/classes dropped). */
function textLines(src) {
  const lines = [''];
  const walk = (node) => {
    node.childNodes.forEach((c) => {
      if (c.nodeType === 3) lines[lines.length - 1] += c.nodeValue;
      else if (c.nodeType === 1 && c.tagName === 'BR') lines.push('');
      else if (c.nodeType === 1) walk(c);
    });
  };
  walk(src);
  return lines.map(norm).filter(Boolean);
}

/**
 * Title paragraph. A multi-line title (source <br>s) becomes one link per
 * line, all with the card href, joined by <br>: a <br> INSIDE a link is
 * dropped by md2jcr (words run together), between links it survives. The
 * block JS takes the card href from the first link and unwraps all of them.
 */
function titleParagraph(document, src, href) {
  const p = document.createElement('p');
  textLines(src).forEach((line, i) => {
    if (i) p.append(document.createElement('br'));
    if (href) {
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = line;
      p.append(a);
    } else {
      p.append(document.createTextNode(line));
    }
  });
  return p;
}

export default function parse(element, { document }) {
  const cells = [];

  // Card links: direct children of the grid (fallback: any link holding a <p>).
  let cards = [...element.querySelectorAll(':scope > a[href]')];
  if (!cards.length) cards = [...element.querySelectorAll('a[href]')].filter((a) => a.querySelector('p'));

  cards.forEach((card) => {
    const href = (card.getAttribute('href') || '').trim();

    // cell 1: real image (skip data-URI skeleton placeholders)
    let imageCell = '';
    const srcImg = [...card.querySelectorAll('img')]
      .find((i) => !i.closest('[role="status"]') && cleanSrc(i.getAttribute('src') || i.getAttribute('data-src')));
    if (srcImg) {
      const src = cleanSrc(srcImg.getAttribute('src') || srcImg.getAttribute('data-src'));
      const img = document.createElement('img');
      img.setAttribute('src', src);
      img.setAttribute('alt', IMAGE_ALTS[src] || fixAlt(srcImg.getAttribute('alt')));
      imageCell = [hint(document, 'image'), img];
    }

    // cell 2: eyebrow + linked title (document order; last paragraph is the title)
    const paras = [...card.querySelectorAll('p')]
      .filter((p) => !p.closest('[role="status"]') && norm(p.textContent));
    const text = [];
    if (paras.length) {
      const titleSrc = paras[paras.length - 1];
      paras.slice(0, -1).forEach((p) => {
        const eyebrow = document.createElement('p');
        eyebrow.textContent = norm(p.textContent);
        text.push(eyebrow);
      });
      text.push(titleParagraph(document, titleSrc, href));
    }

    if (!imageCell && !text.length) return;
    cells.push([imageCell, text.length ? [hint(document, 'text'), ...text] : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-promo', cells });
  element.replaceWith(block);
}
