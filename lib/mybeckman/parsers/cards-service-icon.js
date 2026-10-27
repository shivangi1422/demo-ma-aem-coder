/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-service-icon (mybeckman.in home, "Service & technical support").
 * Source: #service div.grid
 *   > a[href] (x4, whole card is the link)
 *       > div > div > img[src^="data:image/svg+xml;base64,"] (Heroicon, solid 24px)
 *             > h3 (title)
 *             > p (description)
 *       > div ("->" decorative arrow)
 *
 * Library convention (Cards): one row per card, image | text. Deviation on
 * purpose: this block's xwalk model (cards-service-icon-item) has a single
 * rich-text field, so each row has exactly 1 cell and the icon is an icon
 * token inside the text (per the block README); md2jcr needs cells == fields.
 *   cell 1: field:text -> <p>:heroicons-<name>:</p>
 *                         <h3><a href="(card href)">Title</a></h3>
 *                         <p>Description</p>
 *
 * Icon mapping: the data-URI SVG is decoded and its path data compared with
 * the path data of the files in /icons (fingerprints below were taken from
 * those files; the four source icons match them exactly). In the importer the
 * data-URI is already gone (blob: URL) when parsers run, so a card-href map
 * built from that comparison is the fallback:
 *   heroicons-user-plus, heroicons-wrench-screwdriver,
 *   heroicons-rocket-launch, heroicons-cursor-arrow-rays
 */

// Start of the first <path d="..."> of each /icons/heroicons-*.svg file.
const ICON_FINGERPRINTS = {
  'heroicons-user-plus': 'M6.25 6.375a4.125 4.125 0 118.25 0',
  'heroicons-wrench-screwdriver': 'M12 6.75a5.25 5.25 0 016.775-5.025',
  'heroicons-rocket-launch': 'M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5',
  'heroicons-cursor-arrow-rays': 'M17.303 5.197A7.5 7.5 0 006.697 15.803',
};

// Fallback when the SVG is not readable (see iconName): card href -> icon.
// Derived from the path-data comparison above on the saved home page snapshot.
const HREF_ICONS = {
  '/service/plans': 'heroicons-user-plus',
  '/service/instrument-optimization/preventive-maintenance': 'heroicons-wrench-screwdriver',
  '/service/instrument-qualification-calibration': 'heroicons-rocket-launch',
  '/service/tech-support': 'heroicons-cursor-arrow-rays',
};

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

function decodeBase64(b64) {
  try {
    if (typeof atob === 'function') {
      const bin = atob(b64);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }
  } catch (e) { /* fall through */ }
  try {
    // eslint-disable-next-line no-undef
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch (e) {
    return '';
  }
}

/** SVG markup of the card icon: data-URI <img> (base64 or url-encoded) or inline <svg>. */
function iconSvg(card) {
  const svg = card.querySelector('svg');
  if (svg) return svg.outerHTML;
  const img = [...card.querySelectorAll('img')].find((i) => /^data:image\/svg\+xml/i.test(i.getAttribute('src') || ''));
  if (!img) return '';
  const src = img.getAttribute('src');
  const comma = src.indexOf(',');
  const meta = src.slice(0, comma);
  const data = src.slice(comma + 1);
  if (/;base64$/i.test(meta)) return decodeBase64(data);
  try {
    return decodeURIComponent(data);
  } catch (e) {
    return data;
  }
}

/** "/service/plans/", "https://www.mybeckman.in/service/plans" -> "/service/plans" */
function pathOf(href) {
  try {
    return new URL(href, 'https://www.mybeckman.in/').pathname.replace(/\/+$/, '') || '/';
  } catch (e) {
    return (href || '').split(/[?#]/)[0].replace(/\/+$/, '');
  }
}

function iconName(card, href) {
  const svg = iconSvg(card);
  if (svg) {
    const paths = [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1].replace(/\s+/g, ' ').trim());
    const found = paths.length && Object.entries(ICON_FINGERPRINTS).find(([, fp]) => paths[0].startsWith(fp));
    if (found) return found[0];
  }
  // helix-importer's preProcess turns data-URI <img> into blob: URLs (or drops
  // them) before parsers run, so the SVG is usually unreadable here.
  return HREF_ICONS[pathOf(href)] || '';
}

export default function parse(element, { document }) {
  const cells = [];
  let cards = [...element.querySelectorAll(':scope > a[href]')];
  if (!cards.length) cards = [...element.querySelectorAll('a[href]')].filter((a) => a.querySelector('h1, h2, h3, h4, h5, h6'));

  cards.forEach((card) => {
    const href = (card.getAttribute('href') || '').trim();
    const titleEl = [...card.querySelectorAll('h1, h2, h3, h4, h5, h6')].find((h) => norm(h.textContent));
    const title = titleEl ? norm(titleEl.textContent) : '';
    const desc = [...card.querySelectorAll('p')].map((p) => norm(p.textContent)).filter(Boolean);
    if (!title && !desc.length) return;

    const content = [];
    const icon = iconName(card, href);
    if (icon) {
      const p = document.createElement('p');
      p.textContent = `:${icon}:`;
      content.push(p);
    }
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
      content.push(h3);
    }
    desc.forEach((t) => {
      const p = document.createElement('p');
      p.textContent = t;
      content.push(p);
    });

    cells.push([[hint(document, 'text'), ...content]]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-service-icon', cells });
  element.replaceWith(block);
}
