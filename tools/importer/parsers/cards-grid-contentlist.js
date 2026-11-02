/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-contentlist, emitted as the Cards Grid block with the
 * contentlist option. Base: cards.
 * Source: https://www.mybeckman.in/support
 * Selectors: .content-list.column-count-3, .content-list
 * Model: block "cards-grid" (text = optional heading/intro, classes = style)
 *        items "cards-grid-item" (image/imageAlt, text).
 * Row 1: heading/intro (empty - the source <h2> is blank).
 * Rows 2..N: one per .content-list-item -
 *   [image, <h3><a>Title</a></h3><p><a>Description</a></p>].
 */

// https://www.mybeckman.in/contact-us -> /contact-us ; "#" stays "#"
const toRelative = (href) => {
  if (!href) return '';
  const m = href.match(/^https?:\/\/(?:www\.)?mybeckman\.in(\/.*)?$/i);
  if (m) return m[1] || '/';
  return href;
};

// drop Sitecore resize params (h, w, iar, hash, sc_lang) but keep rev
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

export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.content-list-item'));
  const cells = [];

  // Row 1: block-level heading/intro (none in source) - keep the empty row, no hint.
  cells.push(['']);

  items.forEach((item) => {
    const img = item.querySelector('.image-wrap img') || item.querySelector('img');
    const heading = item.querySelector('.description-wrap h3') || item.querySelector('h3');
    const desc = item.querySelector('.para-text');
    const linkEl = item.querySelector('.description-wrap a[href]') || item.querySelector('a[href]');

    const title = norm(heading && heading.textContent);
    const description = norm(desc && desc.textContent);
    const href = linkEl ? toRelative(linkEl.getAttribute('href')) : '';

    // Cell 1: image (source alt is empty - use the card title)
    const imageFrag = document.createDocumentFragment();
    if (img) {
      const newImg = document.createElement('img');
      newImg.setAttribute('src', cleanImageSrc(img.getAttribute('src')));
      newImg.setAttribute('alt', img.getAttribute('alt') || title);
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(newImg);
    }

    // Cell 2: linked H3 title + linked description
    const textFrag = document.createDocumentFragment();
    if (title || description) textFrag.appendChild(document.createComment(' field:text '));
    const linked = (text) => {
      if (!href) return document.createTextNode(text);
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = text;
      return a;
    };
    if (title) {
      const h3 = document.createElement('h3');
      h3.appendChild(linked(title));
      textFrag.appendChild(h3);
    }
    if (description) {
      const p = document.createElement('p');
      p.appendChild(linked(description));
      textFrag.appendChild(p);
    }

    cells.push([imageFrag, textFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards Grid (contentlist)', cells });
  element.replaceWith(block);
}
