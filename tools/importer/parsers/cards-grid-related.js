/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-related (Cards Grid block, related option): related
 * products carousel on product pages.
 * Source: https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise
 * Selector: .related-parts
 * Model: block "cards-grid" (text = heading, classes = style),
 *        items "cards-grid-item" (image/imageAlt, text).
 * Row 1: empty heading row. Rows 2..N: [image] [<h3><a>title</a></h3><p>description</p>].
 * Images: the site-relative /pimassets/ proxy path is rewritten to the public
 * PIM CDN (files.plytix.com) the proxy serves, so they load outside the site.
 */

const norm = (s) => (s || '').replace(/[\s ]+/g, ' ').trim();

const imageUrl = (src) => (src || '').replace(/^\/pimassets\//, 'https://files.plytix.com/');

export default function parse(element, { document }) {
  const cells = [['']];
  element.querySelectorAll('.related-part').forEach((part) => {
    if (part.classList.contains('slick-cloned')) return;
    const img = part.querySelector('.related-part__img img');
    const titleLink = part.querySelector('.related-part__title > a:not(.related-part__desc)');
    const desc = part.querySelector('.related-part__desc');
    const imageCell = document.createDocumentFragment();
    if (img) {
      const image = document.createElement('img');
      image.setAttribute('src', imageUrl(img.getAttribute('src')));
      // source alt is "<part no>_<title>"
      image.setAttribute('alt', norm(titleLink ? titleLink.textContent : img.getAttribute('alt')));
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(image);
    }
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (titleLink) {
      const h3 = document.createElement('h3');
      const a = document.createElement('a');
      a.setAttribute('href', titleLink.getAttribute('href'));
      a.textContent = norm(titleLink.textContent);
      h3.appendChild(a);
      textCell.appendChild(h3);
    }
    if (desc) {
      const p = document.createElement('p');
      p.textContent = norm(desc.textContent);
      textCell.appendChild(p);
    }
    cells.push([imageCell, textCell]);
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards Grid (related)', cells });
  element.replaceWith(block);
}
