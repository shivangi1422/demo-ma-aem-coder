/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-thumblist, emitted as the Cards Grid block with the
 * thumblist option. Base: cards.
 * Source: https://www.mybeckman.in/support/faq
 * Selectors: #content-holder > div.row:has(a.faq-item), .faq-section #content-holder > .row
 * Model: block "cards-grid" (text = optional heading/intro, classes = style)
 *        items "cards-grid-item" (image/imageAlt, text).
 * Row 1: heading/intro (empty - none in source).
 * Rows 2..N: one per a.faq-item - [thumbnail, <h2><a>Title</a></h2><p>Description</p>].
 * Titles are H4 in the source; H2 keeps the heading order under the page H1.
 * Thumbnails are decorative (the title link names the tile): empty alt, as in the source.
 * Order: the source is two columns read top-to-bottom; cards render row by row,
 * so items are interleaved (left[0], right[0], left[1], ...) to keep the desktop order.
 */

// https://www.mybeckman.in/support/faq/product -> /support/faq/product
const toRelative = (href) => {
  if (!href) return '';
  const m = href.match(/^https?:\/\/(?:www\.)?mybeckman\.in(\/.*)?$/i);
  if (m) return m[1] || '/';
  return href;
};

// absolute media.beckman.com URL; drop Sitecore resize params (h, w, iar, hash, sc_lang) but keep rev
const cleanImageSrc = (src) => {
  if (!src) return src;
  let abs = src.trim();
  if (abs.startsWith('//')) abs = `https:${abs}`;
  else if (abs.startsWith('/-/media/')) abs = `https://media.beckman.com${abs}`;
  if (!/^https?:/i.test(abs)) return abs;
  try {
    const url = new URL(abs);
    ['h', 'w', 'iar', 'hash', 'sc_lang'].forEach((p) => url.searchParams.delete(p));
    return url.toString();
  } catch (e) {
    return abs;
  }
};

// thumbnail: <img> inside .faq-item--image, else the inline style background-image
const imageSrcOf = (item) => {
  const img = item.querySelector('.faq-item--image img') || item.querySelector('img');
  if (img && img.getAttribute('src')) return img.getAttribute('src');
  const bg = item.querySelector('.faq-item--image[style*="background-image"]');
  if (bg) {
    const m = (bg.getAttribute('style') || '').match(/background-image\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    if (m) return m[1];
  }
  return '';
};

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

const orderedItems = (element) => {
  const cols = Array.from(element.children).filter((c) => c.querySelector('a.faq-item'));
  if (cols.length < 2) return Array.from(element.querySelectorAll('a.faq-item'));
  const lists = cols.map((c) => Array.from(c.querySelectorAll('a.faq-item')));
  const max = Math.max(...lists.map((l) => l.length));
  const out = [];
  for (let i = 0; i < max; i += 1) {
    lists.forEach((l) => { if (l[i]) out.push(l[i]); });
  }
  return out;
};

export default function parse(element, { document }) {
  const cells = [];

  // Row 1: block-level heading/intro (none in source) - keep the empty row, no hint.
  cells.push(['']);

  orderedItems(element).forEach((item) => {
    const content = item.querySelector('.faq-item--content') || item;
    const heading = content.querySelector('h4, h3, h5');
    const title = norm(heading && heading.textContent);
    const clone = content.cloneNode(true);
    clone.querySelectorAll('h1, h2, h3, h4, h5, h6, .faq-item--image-wrap, img').forEach((h) => h.remove());
    const description = norm(clone.textContent);
    const href = toRelative(item.getAttribute('href'));
    const src = cleanImageSrc(imageSrcOf(item));

    // Cell 1: decorative thumbnail (empty alt, as in the source)
    const imageFrag = document.createDocumentFragment();
    if (src) {
      const img = document.createElement('img');
      img.setAttribute('src', src);
      img.setAttribute('alt', '');
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img);
    }

    // Cell 2: linked H2 title + description
    const textFrag = document.createDocumentFragment();
    if (title || description) textFrag.appendChild(document.createComment(' field:text '));
    if (title) {
      const h2 = document.createElement('h2');
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = title;
        h2.appendChild(a);
      } else {
        h2.textContent = title;
      }
      textFrag.appendChild(h2);
    }
    if (description) {
      const p = document.createElement('p');
      p.textContent = description;
      textFrag.appendChild(p);
    }

    cells.push([imageFrag, textFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards Grid (thumblist)', cells });
  element.replaceWith(block);
}
