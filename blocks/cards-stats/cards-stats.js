import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Splits a trailing "+" (or "%") off the value so it can render smaller.
 * @param {Element} el element whose text is the stat value
 */
function splitSuffix(el) {
  const text = el.textContent.trim();
  const match = text.match(/^(.*?)([+%]+)$/);
  if (!match || !match[1]) return;
  const [, number, sign] = match;
  const value = document.createElement('span');
  value.className = 'cards-stats-number';
  value.textContent = number;
  const suffix = document.createElement('span');
  suffix.className = 'cards-stats-suffix';
  suffix.textContent = sign;
  el.replaceChildren(value, suffix);
}

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
      if (cell.querySelector('picture')) cell.className = 'cards-stats-card-image';
      else if (cell.textContent.trim()) cell.className = 'cards-stats-card-body';
      else cell.className = 'cards-stats-card-empty';
    });
    const body = li.querySelector('.cards-stats-card-body');
    if (body) {
      const paragraphs = [...body.querySelectorAll('p')];
      const valueP = paragraphs.find((p) => p.querySelector('strong')) || paragraphs[0];
      if (valueP) {
        valueP.classList.add('cards-stats-value');
        splitSuffix(valueP.querySelector('strong') || valueP);
        paragraphs.filter((p) => p !== valueP).forEach((p) => p.classList.add('cards-stats-label'));
      }
    }
    ul.append(li);
  });
  block.replaceChildren(ul);
}
