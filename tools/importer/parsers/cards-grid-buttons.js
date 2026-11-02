/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-buttons, emitted as the Cards Grid block with the
 * buttons option. Base: cards.
 * Source: https://www.mybeckman.in/service/training
 * Selectors: .containercustom > .menu
 * Model: block "cards-grid" (text = optional heading/intro, classes = style)
 *        items "cards-grid-item" (image/imageAlt, text).
 * Row 1: heading/intro (empty).
 * Rows 2..N: one per .menu > a - [white icon, <p><a href>Label</a></p>].
 * Source nests <button> inside <a>; iterate the <a> wrappers and fall back to
 * pairing icons / buttons by document order if the nesting was flattened.
 */

// drop Sitecore params (h, w, iar, hash, sc_lang) but keep rev
const cleanImageSrc = (src) => {
  if (!src || !/^https?:/i.test(src)) return src;
  try {
    const url = new URL(src);
    ['h', 'w', 'iar', 'hash', 'sc_lang'].forEach((p) => url.searchParams.delete(p));
    return url.toString();
  } catch (e) {
    return src;
  }
};

const norm = (s) => (s || '').replace(/[\s ]+/g, ' ').trim();

export default function parse(element, { document }) {
  const links = Array.from(element.querySelectorAll(':scope > a[href]'));
  const allImgs = Array.from(element.querySelectorAll('img'));
  const allButtons = Array.from(element.querySelectorAll('button'));
  const cells = [];

  // Row 1: block-level heading/intro (none in source) - keep the empty row, no hint.
  cells.push(['']);

  links.forEach((link, i) => {
    const img = link.querySelector('img') || allImgs[i] || null;
    let label = norm(link.textContent);
    if (!label && allButtons[i]) label = norm(allButtons[i].textContent);
    const href = link.getAttribute('href');

    // Cell 1: white icon (source alt is empty - use the label)
    const imageFrag = document.createDocumentFragment();
    if (img) {
      const newImg = document.createElement('img');
      newImg.setAttribute('src', cleanImageSrc(img.getAttribute('src')));
      newImg.setAttribute('alt', img.getAttribute('alt') || label);
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(newImg);
    }

    // Cell 2: link tile label
    const textFrag = document.createDocumentFragment();
    if (label) {
      textFrag.appendChild(document.createComment(' field:text '));
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = label;
      p.appendChild(a);
      textFrag.appendChild(p);
    }

    cells.push([imageFrag, textFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards Grid (buttons)', cells });
  element.replaceWith(block);
}
