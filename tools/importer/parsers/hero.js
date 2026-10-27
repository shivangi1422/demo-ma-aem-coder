/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero (template: reagent-product, style: home).
 * Source: https://www.mybeckman.in/reagents/particle/valita-titer-assays
 * Selector: .product-spotlight-wrapper .spotlight-content-wrapper .banner-container
 *
 * Model (blocks/hero/_hero.json): image (reference) [+ imageAlt collapsed],
 *   text (richtext), classes (select -> "home" variant, no hint)
 *
 * Output rows (library convention: 1 column, image row + text row):
 *   row 1: image (background image; URL kept as-is, it has no file extension)
 *   row 2: text  (heading, tagline, Learn more CTA)
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  const banner = element.querySelector('.banner-val') || element;

  // Image: direct <img>, else CSS background-image url(...)
  let imgSrc = '';
  let imgAlt = '';
  const srcImg = banner.querySelector(':scope > img') || banner.querySelector('img');
  if (srcImg && srcImg.getAttribute('src')) {
    imgSrc = srcImg.getAttribute('src');
    imgAlt = clean(srcImg.getAttribute('alt'));
  } else {
    const style = banner.getAttribute('style') || '';
    const m = style.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
    if (m) imgSrc = m[1];
  }

  // media.beckman.com rejects (403) image paths without a file extension; it serves them with one.
  if (imgSrc) {
    const [path, query] = imgSrc.split('?');
    if (/\/-\/media\//.test(path) && !/\.[a-z0-9]{2,5}$/i.test(path)) {
      imgSrc = `${path}.jpg${query ? `?${query}` : ''}`;
    }
  }

  let imageCell = '';
  if (imgSrc) {
    const img = document.createElement('img');
    img.setAttribute('src', imgSrc);
    img.setAttribute('alt', imgAlt);
    imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    imageCell.appendChild(img);
  }

  // Text: heading + paragraphs + CTA links
  const textNodes = [];
  const content = Array.from(banner.children).find((c) => c.tagName === 'DIV') || banner;
  Array.from(content.children).forEach((child) => {
    const tag = child.tagName;
    if (/^H[1-6]$/.test(tag)) {
      if (!clean(child.textContent)) return;
      const h = document.createElement(tag.toLowerCase());
      h.textContent = clean(child.textContent);
      textNodes.push(h);
    } else if (tag === 'P') {
      if (!clean(child.textContent)) return;
      const p = child.cloneNode(true);
      p.removeAttribute('style');
      textNodes.push(p);
    } else if (tag === 'A') {
      const text = clean(child.textContent);
      const href = child.getAttribute('href');
      if (!text || !href) return;
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = text;
      p.appendChild(a);
      textNodes.push(p);
    }
  });

  let textCell = '';
  if (textNodes.length) {
    textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    textNodes.forEach((n) => textCell.appendChild(n));
  }

  const cells = [[imageCell], [textCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', variants: ['home'], cells });
  element.replaceWith(block);
}
