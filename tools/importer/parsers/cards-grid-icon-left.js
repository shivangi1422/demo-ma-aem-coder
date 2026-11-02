/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-icon-left, emitted as the Cards Grid block with the
 * icon-left option. Base: cards.
 * Source: https://www.mybeckman.in/service/training
 * Selectors: .containercustom > .row:has(> .col-md-1 img)
 * Model: block "cards-grid" (text = optional heading/intro, classes = style)
 *        items "cards-grid-item" (image/imageAlt, text).
 * Row 1: heading/intro (empty).
 * Rows 2..N: one per .col-md-1 (icon) + following .col-md-5 (text), paired by
 *   document order - [icon, <p><strong>Title</strong></p><p>desc</p>...<p><a>Sign Up</a></p>].
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

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

// sentence(s) that start a new paragraph in the description
const PARAGRAPH_BREAKS = ['For those courses that are VR-enabled'];

const splitParagraphs = (text) => {
  let parts = [text];
  PARAGRAPH_BREAKS.forEach((marker) => {
    parts = parts.flatMap((part) => {
      const i = part.indexOf(marker);
      if (i <= 0) return [part];
      return [part.slice(0, i).trim(), part.slice(i).trim()];
    });
  });
  return parts.filter(Boolean);
};

export default function parse(element, { document }) {
  // pair icon columns with text columns by document order
  const iconCols = Array.from(element.querySelectorAll(':scope > .col-md-1'));
  const textCols = Array.from(element.querySelectorAll(':scope > .col-md-5'));
  const cells = [];

  // Row 1: block-level heading/intro (none in source) - keep the empty row, no hint.
  cells.push(['']);

  const count = Math.max(iconCols.length, textCols.length);
  for (let i = 0; i < count; i += 1) {
    const iconCol = iconCols[i];
    const textCol = textCols[i];
    const img = iconCol ? iconCol.querySelector('img') : null;

    let title = '';
    const descParts = [];
    const ctas = [];
    if (textCol) {
      const strong = textCol.querySelector('strong, b');
      title = norm(strong && strong.textContent);

      // CTA links (the <a> wraps a <button> in source - take its text)
      textCol.querySelectorAll('a[href]').forEach((a) => {
        const label = norm(a.textContent);
        if (label) ctas.push({ href: a.getAttribute('href'), label });
      });

      // description = text of the column minus title and CTA blocks
      const clone = textCol.cloneNode(true);
      clone.querySelectorAll('strong, b, a, button, p.pcenter').forEach((el) => el.remove());
      const desc = norm(clone.textContent);
      if (desc) descParts.push(...splitParagraphs(desc));
    }

    // Cell 1: icon (source alt is empty - use the item title)
    const imageFrag = document.createDocumentFragment();
    if (img) {
      const newImg = document.createElement('img');
      newImg.setAttribute('src', cleanImageSrc(img.getAttribute('src')));
      newImg.setAttribute('alt', img.getAttribute('alt') || title);
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(newImg);
    }

    // Cell 2: bold title, description paragraphs, Sign Up link
    const textFrag = document.createDocumentFragment();
    if (title || descParts.length || ctas.length) {
      textFrag.appendChild(document.createComment(' field:text '));
    }
    if (title) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = title;
      p.appendChild(strong);
      textFrag.appendChild(p);
    }
    descParts.forEach((d) => {
      const p = document.createElement('p');
      p.textContent = d;
      textFrag.appendChild(p);
    });
    ctas.forEach(({ href, label }) => {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = label;
      p.appendChild(a);
      textFrag.appendChild(p);
    });

    cells.push([imageFrag, textFrag]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards Grid (icon-left)', cells });
  element.replaceWith(block);
}
