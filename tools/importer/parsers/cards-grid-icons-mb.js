/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-icons-mb (block: cards-grid, Style option: icons).
 * Source: next-generation-sequencing benefits row
 *   div.containercustom > div.row > div.col-sm-3 ×4:
 *     p > img (100px red line icon) + p > strong (title) + p (text)
 *
 * Library cards convention (one row per card: image | text) preceded by the
 * local cards-grid container row (heading / intro, left empty: the section
 * heading stays default content).
 * xwalk container model `cards-grid`: text (richtext), classes.
 * Item model `cards-grid-item`: image (reference, imageAlt collapsed), text (richtext).
 *
 * Row 1: heading row - empty
 * Rows 2..N: icon image | <p><strong>title</strong></p> <p>text</p>
 *   (a leading bold-only paragraph is the card title in the icons option)
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

export default function parse(element, { document }) {
  const cells = [];

  // ---- row 1: heading row (empty) -----------------------------------------
  cells.push(['']);

  let items = [...element.querySelectorAll(':scope > div.col-sm-3')];
  if (!items.length) items = [...element.children];

  items.forEach((item) => {
    const imageCell = [];
    const srcImg = item.querySelector('img[src]');
    const title = clean([...item.querySelectorAll('strong, b, h1, h2, h3, h4, h5, h6')].map((s) => s.textContent).join(' '));
    if (srcImg) {
      const img = document.createElement('img');
      img.src = srcImg.getAttribute('src');
      img.alt = clean(srcImg.getAttribute('alt')) || title;
      imageCell.push(document.createComment(' field:image '), img);
    }

    const text = [];
    item.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach((el) => {
      const value = clean(el.textContent);
      if (!value) return;
      const p = document.createElement('p');
      const strong = el.querySelector('strong, b');
      if (/^H[1-6]$/.test(el.tagName) || (strong && clean(strong.textContent) === value)) {
        const s = document.createElement('strong');
        s.textContent = value;
        p.append(s);
      } else {
        p.textContent = value;
      }
      text.push(p);
    });

    if (!imageCell.length && !text.length) return;
    cells.push([
      imageCell.length ? imageCell : '',
      text.length ? [document.createComment(' field:text '), ...text] : '',
    ]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid (icons)', cells });
  element.replaceWith(block);
}
