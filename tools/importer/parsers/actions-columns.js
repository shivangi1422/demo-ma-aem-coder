/* eslint-disable */
/* global WebImporter */

/**
 * Parser for actions-columns (xwalk items: actions-columns-item: link (+linkText), text).
 * Source: div.Contact > h2, p (kept as default content) + .Contact__body > div (a.btn + p).
 * Output: one row per action: [<!-- field:link --><p><a></a></p>] [<!-- field:text --><p>caption</p>]
 */
export default function parse(element, { document }) {
  const body = element.querySelector(':scope > .Contact__body');
  if (!body) return;
  const cells = [];
  [...body.children].forEach((item) => {
    const a = item.querySelector('a[href]');
    const linkCell = document.createDocumentFragment();
    if (a) {
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = a.textContent.trim();
      p.append(link);
      linkCell.appendChild(document.createComment(' field:link '));
      linkCell.appendChild(p);
    }
    const textCell = document.createDocumentFragment();
    const captions = [...item.querySelectorAll(':scope > p')].filter((p) => !(a && p.contains(a)));
    if (captions.length) {
      textCell.appendChild(document.createComment(' field:text '));
      captions.forEach((p) => textCell.appendChild(p));
    }
    cells.push([linkCell, textCell]);
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'actions-columns', cells });
  body.replaceWith(block);
  // heading and intro stay as default content in the (blue) section
  element.replaceWith(...element.childNodes);
}
