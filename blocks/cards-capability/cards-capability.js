import { moveInstrumentation } from '../../scripts/scripts.js';

const SHOW_EVENT = 'carousel-split-detail:show';

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((cell) => {
      if (cell.querySelector('picture')) cell.className = 'cards-capability-card-image';
      else if (cell.textContent.trim()) cell.className = 'cards-capability-card-body';
      else cell.className = 'cards-capability-card-empty';
    });
    ul.append(li);
  });
  block.replaceChildren(ul);

  // "Learn More" on card N opens slide N of the detail carousel in this section
  [...ul.children].forEach((li, index) => {
    const body = li.querySelector('.cards-capability-card-body');
    const link = body && [...body.querySelectorAll('a[href]')].pop();
    if (!link) return;
    link.closest('p')?.classList.add('cards-capability-link');
    link.addEventListener('click', (e) => {
      const detail = block.closest('.section')?.querySelector('.carousel-split-detail');
      if (!detail) return;
      e.preventDefault();
      detail.dispatchEvent(new CustomEvent(SHOW_EVENT, { detail: { index, focus: true } }));
    });
  });
}
