/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-tiles (mybeckman.in /support/technical-documents)
 * Source: #main .bc-test-layout:has(.panel-wrapper) > .block
 *   > .col-md-12.text-center > h3 "Types of Technical Documents"
 *   > .row > .panel-wrapper > .panel (x4, x3 + empty .panel.panel-noborder filler)
 *       > a[href] > img
 *       > .panel-content > a[href] > h4 (title)
 *
 * Emits, replacing the element:
 *   1. columns 1x1 -> the section heading as H2 (source is H3)
 *   2. cards (no variant), model card (blocks/cards/_cards.json: image, text),
 *      no block-level fields and no heading row; one row per real tile:
 *        cell 1: field:image -> <img> with the original absolute URL (origin + path,
 *                no query), alt from template.imageAlts[url] (embedded fallback)
 *        cell 2: field:text  -> <h3><a href="(source href)">Title</a></h3>
 * Hrefs are kept as on the source; the shared link step rewrites them later.
 */

// Copy of page-templates.json templates[].imageAlts (parsers do not get the template).
const IMAGE_ALTS = {
  'https://media.beckman.com/-/media/stock-images/labware/technology-instrument-crop-2017-05.jpg': 'Close-up of microscope objective lenses',
  'https://media.beckman.com/-/media/stock-images/tech-docs/scientist1-in-lab-2020-05.jpg': 'Scientist working at a laboratory bench',
  'https://media.beckman.com/-/media/stock-images/abstracts-and-backgrounds/custom-reagent-manufacturing-2017-08.png': 'Laboratory flasks with coloured reagents and a pipette',
  'https://media.beckman.com/-/media/stock-images/tech-docs/scientists-in-lab-2020-05.jpg': 'Team of scientists working together in a laboratory',
  'https://media.beckman.com/-/media/stock-images/tech-docs/scientist2-in-lab-2020-05.jpg': 'Scientist pipetting samples in a laboratory',
  'https://media.beckman.com/-/media/stock-images/labware/labware-assay-research-2017-05.jpg': 'Pink assay sample tubes',
  'https://media.beckman.com/-/media/stock-images/labware/lab-tools-tubes-2017-05.jpg': 'Rows of glass laboratory vials',
};

const SITE_ORIGIN = 'https://www.mybeckman.in';

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

function absoluteNoQuery(src, base) {
  try {
    const u = new URL(src, base);
    return u.origin + u.pathname;
  } catch (e) {
    return src.split(/[?#]/)[0];
  }
}

export default function parse(element, { document, params }) {
  const alts = (params && params.template && params.template.imageAlts) || IMAGE_ALTS;
  const base = (params && params.originalURL) || SITE_ORIGIN;

  // Section heading (first non-empty heading outside the tiles).
  const heading = [...element.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .find((h) => !h.closest('.panel') && norm(h.textContent));

  const rows = [];
  element.querySelectorAll('.panel-wrapper > .panel:not(.panel-noborder)').forEach((panel) => {
    const titleEl = [...panel.querySelectorAll('h1, h2, h3, h4, h5, h6')].find((h) => norm(h.textContent));
    const title = titleEl ? norm(titleEl.textContent) : '';
    const img = panel.querySelector('img');
    if (!title && !img) return; // empty filler tile

    const linkEl = (titleEl && titleEl.closest('a[href]')) || panel.querySelector('a[href]');
    const href = linkEl ? (linkEl.getAttribute('href') || '').trim() : '';

    let imageCell = '';
    if (img && img.getAttribute('src')) {
      const url = absoluteNoQuery(img.getAttribute('src'), base);
      const out = document.createElement('img');
      out.setAttribute('src', url);
      out.setAttribute('alt', alts[url] || norm(img.getAttribute('alt')) || '');
      imageCell = [hint(document, 'image'), out];
    }

    let textCell = '';
    if (title) {
      const h3 = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = title;
        h3.append(a);
      } else {
        h3.textContent = title;
      }
      textCell = [hint(document, 'text'), h3];
    }

    rows.push([imageCell, textCell]);
  });

  const out = [];
  if (heading) {
    const h2 = document.createElement('h2');
    h2.textContent = norm(heading.textContent);
    out.push(WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [[h2]] }));
  }
  if (rows.length) {
    out.push(WebImporter.Blocks.createBlock(document, { name: 'cards', cells: rows }));
  }
  element.replaceWith(...out);
}
