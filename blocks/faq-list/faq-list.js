import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * List of FAQ questions linking to their answer pages.
 * Each row: question link, optional categories (comma separated, used by faq-search filters).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const link = row.querySelector('a[href]');
    if (!link) return;
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const cells = [...row.children];
    const categories = cells
      .filter((cell) => !cell.contains(link))
      .map((cell) => cell.textContent.trim())
      .filter(Boolean)
      .join(',');
    if (categories) {
      li.dataset.categories = categories.split(',').map((c) => c.trim()).filter(Boolean).join('|');
    }
    link.className = '';
    li.append(link);
    ul.append(li);
  });
  block.replaceChildren(ul);
}
