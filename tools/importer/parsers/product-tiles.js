/* eslint-disable */
/* global WebImporter */

/**
 * Parser for product-tiles.
 * Source: https://www.mybeckman.in/flow-cytometry/software (and /liquid-handlers/software)
 * Selector: .product-series-callouts > .row
 * Item: .product-series-callouts__item > a.product-series-callouts__block
 *   image  -> .product-series-callouts__image-wrap (background-image, hidden <img> fallback)
 *   title  -> .product-series-callouts__description h4
 *   description -> .product-series-callouts__description .hidden-xs (text, <p>, <ul>)
 *
 * XWalk model (blocks/product-tiles/_product-tiles.json), item product-tile:
 *   image (+ imageAlt collapsed into the img) | text (richtext: h2 title + description) | textSize | link
 * The source renders bare-text descriptions at 16px and <p> descriptions at 14px;
 * textSize records which one a tile used ("regular" / "small").
 */

/** Wraps loose text/inline nodes into paragraphs so the description is valid rich text. */
function toRichText(source, document) {
  const fragment = document.createDocumentFragment();
  let paragraph = null;
  const flush = () => {
    if (paragraph && paragraph.textContent.trim()) fragment.appendChild(paragraph);
    paragraph = null;
  };
  [...source.childNodes].forEach((node) => {
    const isBlock = node.nodeType === 1 && /^(P|UL|OL|DIV|H[1-6]|TABLE)$/.test(node.tagName);
    if (isBlock) {
      flush();
      if (node.tagName === 'DIV') {
        fragment.appendChild(toRichText(node, document));
      } else if (node.textContent.trim()) {
        fragment.appendChild(node.cloneNode(true));
      }
      return;
    }
    if (node.nodeType === 3 && !node.textContent.trim()) {
      if (paragraph) paragraph.appendChild(document.createTextNode(' '));
      return;
    }
    if (!paragraph) paragraph = document.createElement('p');
    paragraph.appendChild(node.nodeType === 3
      ? document.createTextNode(node.textContent.replace(/\s+/g, ' ').trim())
      : node.cloneNode(true));
  });
  flush();
  return fragment;
}

export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll(':scope > .product-series-callouts__item'));

  const cells = items.map((item) => {
    const link = item.querySelector('a.product-series-callouts__block');
    const wrap = item.querySelector('.product-series-callouts__image-wrap');
    const hiddenImg = item.querySelector('.product-series-callouts__image-wrap img, img');
    const bg = wrap && (wrap.getAttribute('style') || '').match(/url\(['"]?([^'")]+)['"]?\)/);
    const src = (bg && bg[1]) || (hiddenImg && hiddenImg.getAttribute('src'));
    const heading = item.querySelector('.product-series-callouts__description h4, .product-series-callouts__description h3');
    const description = item.querySelector('.product-series-callouts__description .hidden-xs, .product-series-callouts__description > div');

    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    if (src) {
      const img = document.createElement('img');
      img.setAttribute('src', src);
      img.setAttribute('alt', (hiddenImg && hiddenImg.getAttribute('alt')) || '');
      imageCell.appendChild(img);
    }

    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (heading) {
      const h2 = document.createElement('h2');
      h2.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
      textCell.appendChild(h2);
    }
    if (description) textCell.appendChild(toRichText(description, document));

    const bareText = description && [...description.childNodes]
      .some((node) => node.nodeType === 3 && node.textContent.trim());
    const sizeCell = document.createDocumentFragment();
    sizeCell.appendChild(document.createComment(' field:textSize '));
    sizeCell.appendChild(document.createTextNode(bareText ? 'regular' : 'small'));

    const linkCell = document.createDocumentFragment();
    linkCell.appendChild(document.createComment(' field:link '));
    if (link && link.getAttribute('href')) {
      const a = document.createElement('a');
      a.setAttribute('href', link.getAttribute('href'));
      a.textContent = link.getAttribute('href');
      linkCell.appendChild(a);
    }

    return [imageCell, textCell, sizeCell, linkCell];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'product-tiles', cells });
  element.replaceWith(block);
}
