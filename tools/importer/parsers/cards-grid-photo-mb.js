/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-photo-mb (block: cards-grid, Style option: photo).
 * Sources on mybeckman.in (one card per unit, document order):
 *   1. div.product-series-callouts > .row > div.product-series-callouts__item
 *        a.product-series-callouts__block (whole card is a link) or
 *        div.product-series-callouts__block > a (clinical-trials "Related products")
 *        > __image-wrap > img (+ hidden duplicate img, removed by the cleanup)
 *        + __description > h4 (title) + div.hidden-xs (description)
 *      (clinical-trials, leukemia-and-lymphoma)
 *   2. div.row > div.panel-wrapper > div.panel: a > img + div.panel-content > a > h4
 *      (monoclonal-antibodies, cell-line-development, analytical-ultracentrifugation;
 *      the AUC "Related Content" root is the first row: the following sibling
 *      div.row:has(> div.panel-wrapper) is taken in and removed; div.panel-noborder
 *      fillers are skipped)
 *   3. div.cards-row > a.card: div.card-image > img + div.text-container > h4
 *      (analytical-ultracentrifugation applications, no description)
 *   4. div.row.InsArt > div.col-md-3 > a.artlink > div.artcard > div.artimg > img + p.arttitle
 *      (next-generation-sequencing)
 *
 * Library cards convention (one row per card: image | text) preceded by the
 * local cards-grid container row (heading / intro, left empty: the section
 * heading stays default content).
 * xwalk container model `cards-grid`: text (richtext), classes.
 * Item model `cards-grid-item`: image (reference, imageAlt collapsed), text (richtext).
 *
 * Sources 2-4 (small tiles) are emitted as "cards-grid (photo, compact)".
 *
 * Row 1: heading row - empty
 * Rows 2..N: image | <h3><a href>title</a></h3> [<p>description</p>]
 *   The source h4 / p.arttitle title becomes an H3 linked to the card href
 *   (unlinked when the source href is empty); target=_blank is dropped.
 *   Missing or placeholder alts ("testing", none) become the card title.
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

/** escape stray '%' so URI decoding in html2md does not throw */
const safeUrl = (url) => (url || '').trim().replace(/%(?![0-9a-fA-F]{2})/g, '%25');

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

const PLACEHOLDER_ALT = /^(testing|test|image|img|photo|picture|banner)$/i;

const UNIT_SELECTOR = [
  '.product-series-callouts__item',
  '.panel-wrapper > .panel:not(.panel-noborder)',
  'a.card',
  'a.artlink',
].join(', ');

const ROW_SELECTOR = 'div.row:has(> div.panel-wrapper)';

function matchesSafe(el, selector) {
  try {
    return el.matches(selector);
  } catch (e) {
    return false;
  }
}

function cardHref(unit) {
  if (unit.matches('a[href]')) return unit.getAttribute('href');
  const links = [...unit.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
  return links.find(isUsableHref) || '';
}

export default function parse(element, { document }) {
  // ---- sibling rows of the same grid (AUC "Related Content") ---------------
  const roots = [element];
  if (matchesSafe(element, ROW_SELECTOR)) {
    let next = element.nextElementSibling;
    while (next && matchesSafe(next, ROW_SELECTOR)) {
      roots.push(next);
      next = next.nextElementSibling;
    }
  }

  const cells = [];

  // ---- row 1: heading row (empty) -----------------------------------------
  cells.push(['']);

  // ---- items ---------------------------------------------------------------
  const units = roots.flatMap((root) => [...root.querySelectorAll(UNIT_SELECTOR)])
    .filter((u, i, arr) => arr.indexOf(u) === i && !arr.some((o) => o !== u && o.contains(u)));

  units.forEach((unit) => {
    const titleEl = unit.querySelector('h1, h2, h3, h4, h5, h6, p.arttitle, .arttitle');
    const title = clean(titleEl && titleEl.textContent);
    const href = cardHref(unit);

    // image (first visible one)
    const imageCell = [];
    const srcImg = [...unit.querySelectorAll('img[src]')]
      .find((img) => !/display:\s*none/i.test(img.getAttribute('style') || ''));
    if (srcImg) {
      const img = document.createElement('img');
      img.src = safeUrl(srcImg.getAttribute('src'));
      const alt = clean(srcImg.getAttribute('alt'));
      img.alt = alt && !PLACEHOLDER_ALT.test(alt) ? alt : title;
      imageCell.push(document.createComment(' field:image '), img);
    }

    // text: linked H3 title + description
    const textCell = [];
    if (title) {
      const h3 = document.createElement('h3');
      if (isUsableHref(href)) {
        const a = document.createElement('a');
        a.href = safeUrl(href);
        a.textContent = title;
        h3.append(a);
      } else {
        h3.textContent = title;
      }
      textCell.push(h3);
    }
    const descEl = unit.querySelector('.product-series-callouts__description > div, .product-series-callouts__description > p, .panel-content > p:not(:has(h1, h2, h3, h4, h5, h6))');
    const desc = clean(descEl && descEl !== titleEl && !descEl.contains(titleEl) ? descEl.textContent : '');
    if (desc && desc !== title) {
      const p = document.createElement('p');
      p.textContent = desc;
      textCell.push(p);
    }

    if (textCell.length) textCell.unshift(document.createComment(' field:text '));
    if (!imageCell.length && !textCell.length) return;
    cells.push([imageCell.length ? imageCell : '', textCell.length ? textCell : '']);
  });

  roots.slice(1).forEach((root) => root.remove());

  // related-content panels (source 2), the AUC application tiles (source 3)
  // and the NGS article tiles (source 4)
  // are small tiles: Style "compact"
  const compact = roots.some((root) => matchesSafe(root, ROW_SELECTOR)
    || !!root.querySelector('.panel-wrapper, a.card, a.artlink'));
  const name = compact ? 'cards-grid (photo, compact)' : 'cards-grid (photo)';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
