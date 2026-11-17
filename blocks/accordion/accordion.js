import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the accordion block: each authored row (title cell, content cell)
 * becomes a native <details>/<summary> disclosure, so it opens with the keyboard
 * and is announced as expandable without extra ARIA.
 * A lone link in its own paragraph inside a panel is the panel's call-to-action
 * button (outlined), also when it was authored without bold/italic formatting.
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [titleCell, bodyCell] = row.children;
    if (!titleCell) return;

    const details = document.createElement('details');
    details.className = 'accordion-item';
    moveInstrumentation(row, details);

    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    moveInstrumentation(titleCell, summary);
    // the title is plain text; a lone wrapping paragraph is unwrapped
    const titlePara = titleCell.children.length === 1 && titleCell.querySelector(':scope > p');
    summary.append(...(titlePara || titleCell).childNodes);

    const body = document.createElement('div');
    body.className = 'accordion-item-body';
    if (bodyCell) {
      moveInstrumentation(bodyCell, body);
      body.append(...bodyCell.childNodes);
    }

    body.querySelectorAll(':scope > p').forEach((p) => {
      const links = p.querySelectorAll('a[href]');
      if (links.length !== 1 || p.textContent.trim() !== links[0].textContent.trim()) return;
      const a = links[0];
      p.replaceChildren(a);
      a.className = 'button secondary';
      p.className = 'button-wrapper';
    });

    details.append(summary, body);
    row.replaceWith(details);
  });
}
