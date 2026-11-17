/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-callouts, emitted as the Cards Grid block with the
 * callouts option. Base: cards.
 * Source: https://www.mybeckman.in/resources/disease-research/leukemia-and-lymphoma
 *   (div.product-series-callouts: linked tiles - image, H4 title, description)
 * Selector: .product-series-callouts
 * Model: block "cards-grid" (text = optional heading/intro, classes = style)
 *        items "cards-grid-item" (image/imageAlt, text).
 * Row 1: heading/intro (empty - none in source; the row must be present).
 * Rows 2..N: one per .product-series-callouts__item - [image, <hN><a>Title</a></hN><p>Description</p>].
 * Title level: one below the closest heading before the grid (H3 under an H2 banner,
 * H4 under an H3), so the heading order has no gaps; the source uses H4 throughout.
 */

// https://www.mybeckman.in/resources/... -> /resources/...
const toRelative = (href) => {
  if (!href) return '';
  const m = href.match(/^https?:\/\/(?:www\.)?mybeckman\.in(\/.*)?$/i);
  if (m) return m[1] || '/';
  return href;
};

// absolute media.beckman.com URL; drop Sitecore resize params but keep rev
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

const imageOf = (item) => {
  const img = item.querySelector('img');
  if (img && img.getAttribute('src')) return { src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' };
  const bg = item.querySelector('[style*="background-image"]');
  if (bg) {
    const m = (bg.getAttribute('style') || '').match(/background-image\s*:\s*url\(\s*(?:&quot;|['"])?([^'")&]+)/i);
    if (m) return { src: m[1], alt: '' };
  }
  return null;
};

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

// level of the last heading before `element` in document order (banners repeat
// their H2 for mobile/desktop; either copy counts)
const previousHeadingLevel = (document, element) => {
  let level = 2;
  Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).forEach((h) => {
    // eslint-disable-next-line no-bitwise
    if (!element.contains(h) && (h.compareDocumentPosition(element) & 4)) level = Number(h.tagName[1]);
  });
  return level;
};

export default function parse(element, { document }) {
  const level = Math.min(Math.max(previousHeadingLevel(document, element) + 1, 2), 4);
  const cells = [['']];

  element.querySelectorAll('.product-series-callouts__item').forEach((item) => {
    const link = item.querySelector('a[href]');
    const href = toRelative(link && link.getAttribute('href'));
    const heading = item.querySelector('h4, h3, h5, h2');
    const title = norm(heading && heading.textContent);
    const descEl = item.querySelector('.product-series-callouts__description > div, .product-series-callouts__description > p');
    const description = norm(descEl && descEl.textContent);
    const image = imageOf(item);

    const imageFrag = document.createDocumentFragment();
    if (image && image.src) {
      const img = document.createElement('img');
      img.setAttribute('src', cleanImageSrc(image.src));
      img.setAttribute('alt', image.alt);
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img);
    }

    const textFrag = document.createDocumentFragment();
    if (title || description) textFrag.appendChild(document.createComment(' field:text '));
    if (title) {
      const h = document.createElement(`h${level}`);
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = title;
        h.appendChild(a);
      } else {
        h.textContent = title;
      }
      textFrag.appendChild(h);
    }
    if (description) {
      const p = document.createElement('p');
      p.textContent = description;
      textFrag.appendChild(p);
    }
    cells.push([imageFrag, textFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards Grid (callouts)', cells });
  element.replaceWith(block);
}
