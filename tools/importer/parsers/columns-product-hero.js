/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-product-hero (Columns block, no option): product page intro.
 * Source: https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise
 * Selector: .product-intro-wrapper
 * Model: columns (no field hints for Columns blocks).
 * One row, two cells: [gallery image] [H1, intro paragraphs, bullet list,
 * buttons, "Resources + Tools" links]. "Explore Licenses" (outlined) becomes an
 * italic link (secondary button), "Request a Quote" a bold link (primary button).
 * The mobile-only duplicate "Licenses" / quote links are left out.
 */

const cleanImageSrc = (src) => {
  if (!src || !/^https?:/i.test(src)) return src;
  try {
    const url = new URL(src);
    ['h', 'w', 'iar', 'hash', 'la', 'sc_lang'].forEach((p) => url.searchParams.delete(p));
    return url.toString();
  } catch (e) {
    return src;
  }
};

const norm = (s) => (s || '').replace(/[\s ]+/g, ' ').trim();

function buttonParagraph(a, wrapTag, document) {
  const link = document.createElement('a');
  link.setAttribute('href', a.getAttribute('href'));
  link.textContent = norm(a.textContent);
  const wrap = document.createElement(wrapTag);
  wrap.appendChild(link);
  const p = document.createElement('p');
  p.appendChild(wrap);
  return p;
}

export default function parse(element, { document }) {
  const text = element.querySelector('.rt-holder') || element;
  const galleryImg = element.querySelector('.lt-holder img, .product-gallery-carousel img');

  const imageCell = [];
  if (galleryImg) {
    const img = document.createElement('img');
    img.setAttribute('src', cleanImageSrc(galleryImg.getAttribute('src')));
    const alt = galleryImg.getAttribute('alt') || '';
    const h1 = text.querySelector('h1');
    // source alt is "Product Image - 1"; use the product name
    img.setAttribute('alt', /^product image/i.test(alt) && h1 ? norm(h1.textContent) : alt);
    imageCell.push(img);
  }

  const textCell = [];
  Array.from(text.children).forEach((child) => {
    if (['H1', 'H2', 'H3', 'P', 'UL', 'OL'].includes(child.tagName)) {
      if (norm(child.textContent)) textCell.push(child);
      return;
    }
    if (child.classList.contains('twobuttons')) {
      child.querySelectorAll('a.btn[href]').forEach((a) => {
        textCell.push(buttonParagraph(a, a.classList.contains('btn-default') ? 'em' : 'strong', document));
      });
      return;
    }
    if (child.classList.contains('resource-tool-table-wrapper')) {
      const heading = child.querySelector('.resource-tool-table-links-heading');
      if (heading) {
        const h = document.createElement('h2');
        h.textContent = norm(heading.textContent);
        textCell.push(h);
      }
      const ul = document.createElement('ul');
      child.querySelectorAll('.resource-tool-table-links-wrapper a[href]').forEach((a) => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.setAttribute('href', a.getAttribute('href'));
        link.textContent = norm(a.textContent);
        li.appendChild(link);
        ul.appendChild(li);
      });
      if (ul.children.length) textCell.push(ul);
    }
    // other children (mobile-only button row, empty spacers) are not content
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Columns',
    cells: [[imageCell, textCell]],
  });
  element.replaceWith(block);
}
