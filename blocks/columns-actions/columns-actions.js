import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Columns of call-to-action buttons, each with a short caption below.
 * Each row: link (button), caption.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const link = row.querySelector('a');
    if (link) {
      const wrapper = document.createElement('p');
      wrapper.className = 'button-wrapper';
      link.className = 'button';
      wrapper.append(link);
      li.append(wrapper);
    }
    row.querySelectorAll(':scope > div').forEach((cell) => {
      [...cell.children].forEach((child) => {
        if (child.textContent.trim() || child.querySelector('img')) li.append(child);
      });
    });
    ul.append(li);
  });
  block.replaceChildren(ul);
}
