/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid (Product Lines style) from mybeckman.in `.product-series-callouts`.
 * Output matches the cards-grid xwalk model (blocks/cards-grid/_cards-grid.json):
 *   row 0: block "text" field (heading / intro) — empty here
 *   rows 1..N: one card each — image cell (field:image) | rich text cell (field:text):
 *              linked h4 title + description (paragraphs, lists, notes)
 * Count-agnostic; tolerates cards without image or description.
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/ /g, ' ').replace(/​/g, '').replace(/\s+/g, ' ').trim();
  const BLOCK_TAGS = new Set(['P', 'UL', 'OL', 'H4', 'H5', 'H6']);

  const rows = [['']];
  element.querySelectorAll('.product-series-callouts__item').forEach((item) => {
    const href = item.querySelector('a.product-series-callouts__block[href]')?.getAttribute('href') || '';
    const desc = item.querySelector('.product-series-callouts__description, .product-series-callouts__description-wrap');
    const titleEl = desc && desc.querySelector('h4');
    const title = clean(titleEl && titleEl.textContent);

    // image: the visible <img> (the wrapper repeats it); prefer one with alt text
    const imgs = [...item.querySelectorAll('.product-series-callouts__image-wrap img, .product-series-callouts__image-holder img')]
      .filter((i) => i.getAttribute('src'));
    const src = imgs[0]?.getAttribute('src');
    const alt = clean((imgs.find((i) => clean(i.getAttribute('alt'))) || imgs[0])?.getAttribute('alt'));

    const textCell = document.createDocumentFragment();
    if (title) {
      textCell.append(document.createComment(' field:text '));
      const h4 = document.createElement('h4');
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = title;
        h4.append(a);
      } else {
        h4.textContent = title;
      }
      textCell.append(h4);
    }

    // description: everything after the title, loose text/inline wrapped in <p>
    const body = desc && (desc.querySelector('.display-print') || desc);
    if (body) {
      let para = null;
      [...body.childNodes].forEach((node) => {
        if (node === titleEl) return;
        if (node.nodeType === 1 && BLOCK_TAGS.has(node.tagName)) {
          para = null;
          if (!clean(node.textContent)) return; // drop &nbsp; spacers
          const copy = node.cloneNode(true);
          copy.querySelectorAll('[style]').forEach((n) => n.removeAttribute('style'));
          textCell.append(copy);
        } else if (node.nodeType === 3 || node.nodeType === 1) {
          if (!clean(node.textContent)) return;
          if (!para) {
            para = document.createElement('p');
            textCell.append(para);
          }
          para.append(node.nodeType === 3 ? document.createTextNode(node.textContent.replace(/\s+/g, ' ')) : node.cloneNode(true));
        }
      });
    }

    let imageCell = '';
    if (src) {
      imageCell = document.createDocumentFragment();
      imageCell.append(document.createComment(' field:image '));
      const img = document.createElement('img');
      img.setAttribute('src', src);
      img.setAttribute('alt', alt);
      imageCell.append(img);
    }
    if (!src && !title) return;
    rows.push([imageCell, textCell.childNodes.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid (productlines)', cells: rows });
  element.replaceWith(block);
}
