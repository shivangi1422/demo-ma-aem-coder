/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-centered-strip (Hero Centered block, strip option). Base: hero.
 * Source: https://www.mybeckman.in/resources/disease-research/leukemia-and-lymphoma
 *   (.image_wrapper_vk: contained 1140x380 banner photo, H2 on a dark band at the left;
 *    the H2 is repeated in a mobile and a desktop overlay - only one copy is kept)
 * Selector: .image_wrapper_vk
 * Model (hero-centered): image (reference, imageAlt collapsed), text (richtext).
 * Library convention (1 column, never more than 3 rows incl. the name row):
 * Row 1: banner image. Row 2: the title (H2).
 * The jump-link anchor comes from the heading text (see columns-jumplinks).
 */

export default function parse(element, { document }) {
  const img = element.querySelector(':scope > img, img');
  const heading = element.querySelector('.overlay_vk h2, h2, h3');

  const cells = [];
  const imageFrag = document.createDocumentFragment();
  if (img) {
    imageFrag.appendChild(document.createComment(' field:image '));
    imageFrag.appendChild(img);
  }
  cells.push([imageFrag]);

  const textFrag = document.createDocumentFragment();
  if (heading) {
    const h2 = document.createElement('h2');
    h2.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
    textFrag.appendChild(document.createComment(' field:text '));
    textFrag.appendChild(h2);
  }
  cells.push([textFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero Centered (strip)', cells });
  element.replaceWith(block);
}
