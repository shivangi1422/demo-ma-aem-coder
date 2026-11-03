import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Product specifications (source: "... Specifications" on product pages): one
 * row per specification, label cell + value cell (text or list). Rendered as a
 * description list; from 900px the rows flow into two columns like the source.
 * @param {Element} block
 */
export default function decorate(block) {
  const dl = document.createElement('dl');
  [...block.children].forEach((row) => {
    const [labelCell, valueCell] = row.children;
    if (!labelCell || !valueCell) return;
    const item = document.createElement('div');
    item.className = 'specifications-item';
    moveInstrumentation(row, item);
    const dt = document.createElement('dt');
    dt.textContent = labelCell.textContent.trim();
    const dd = document.createElement('dd');
    moveInstrumentation(valueCell, dd);
    while (valueCell.firstChild) dd.append(valueCell.firstChild);
    item.append(dt, dd);
    dl.append(item);
  });
  block.replaceChildren(dl);
}
