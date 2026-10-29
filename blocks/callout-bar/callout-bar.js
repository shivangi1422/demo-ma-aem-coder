import { rowContentCells } from '../../scripts/scripts.js';

/**
 * Callout bar: a white, shadowed bar with a short prompt and one button
 * (mybeckman.in /service/tech-support "In need of immediate assistance?").
 * It sits 18 / 40 / 54px lower than its place in the flow, over the start of
 * the next section, as on the source.
 *
 * Authored structure: one row, one rich-text cell:
 *   In need of immediate assistance?
 *   **[Get Help Now](tel:18002109340)**   (bold link = filled button)
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    rowContentCells(row).forEach((cell) => {
      if (!cell.textContent.trim()) return;
      // bare text / bare links get a paragraph
      [...cell.childNodes].forEach((node) => {
        if ((node.nodeType === Node.TEXT_NODE && node.textContent.trim())
          || (node.nodeType === Node.ELEMENT_NODE && ['A', 'STRONG', 'EM'].includes(node.tagName))) {
          const p = document.createElement('p');
          node.replaceWith(p);
          p.append(node);
        }
      });
      cell.classList.add('callout-bar-body');
      cell.querySelectorAll(':scope > p').forEach((p) => {
        const links = p.querySelectorAll('a[href]');
        const isButton = links.length === 1 && p.textContent.trim() === links[0].textContent.trim();
        if (!isButton) {
          p.classList.add('callout-bar-text');
          return;
        }
        // a link still wrapped in <strong>/<em> becomes the button decorateButtons makes of it
        const a = links[0];
        let outer = a;
        while (outer.parentElement !== p && ['STRONG', 'EM', 'B', 'I'].includes(outer.parentElement.tagName)) {
          outer = outer.parentElement;
        }
        if (!a.classList.contains('button')) {
          a.classList.add('button', outer.tagName === 'EM' || outer.tagName === 'I' ? 'secondary' : 'primary');
        }
        if (outer !== a) outer.replaceWith(a);
        p.classList.add('button-wrapper', 'callout-bar-cta');
      });
    });
  });
}
