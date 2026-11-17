/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-centered-banner (Hero Centered block, no option; the
 * "industries" page template gives it the source look). Base: hero.
 * Source: https://www.mybeckman.in/resources/industries/synthetic-biology
 *   (.outimg: .largebanner photo, .smallbanner square photo for phones,
 *    #topbannertext with H1 "Synthetic Biology" + H2 tagline)
 * Selector: .bc-rich-text > .outimg:has(#topbannertext)
 * Model (hero-centered): image (reference, imageAlt collapsed), text (richtext),
 *   mobileImage (reference, mobileImageAlt collapsed).
 * Library convention: Row 1 = banner image, Row 2 = title + subheading (the
 * tagline, emitted as a paragraph). Project contract (blocks/hero-centered, as in
 * hero-centered-left.js): an optional Row 3 = mobile image, last in the model.
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

const norm = (s) => (s || '').replace(/[\s ]+/g, ' ').trim();

export default function parse(element, { document }) {
  const text = element.querySelector('#topbannertext') || element;
  const h1 = text.querySelector('h1');
  const title = norm(h1 && h1.textContent);
  const sub = text.querySelector('h2, h3, p');
  const tagline = norm(sub && sub.textContent);
  const alt = title || 'Banner';

  const imageCell = (img, field) => {
    const frag = document.createDocumentFragment();
    if (img && img.getAttribute('src')) {
      const out = document.createElement('img');
      out.setAttribute('src', cleanImageSrc(img.getAttribute('src')));
      out.setAttribute('alt', img.getAttribute('alt') || alt);
      frag.appendChild(document.createComment(` field:${field} `));
      frag.appendChild(out);
    }
    return frag;
  };

  const cells = [];
  cells.push([imageCell(element.querySelector('.largebanner img') || element.querySelector('img'), 'image')]);

  const textFrag = document.createDocumentFragment();
  if (title || tagline) textFrag.appendChild(document.createComment(' field:text '));
  if (title) {
    const h = document.createElement('h1');
    h.textContent = title;
    textFrag.appendChild(h);
  }
  if (tagline) {
    const p = document.createElement('p');
    p.textContent = tagline;
    textFrag.appendChild(p);
  }
  cells.push([textFrag]);

  cells.push([imageCell(element.querySelector('.smallbanner img'), 'mobileImage')]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero Centered', cells });
  element.replaceWith(block);
}
