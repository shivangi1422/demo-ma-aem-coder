import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Splits a trailing "+" (or "%") off the value so it can render smaller.
 * @param {Element} el element whose text is the stat value
 */
function splitSuffix(el) {
  const text = el.textContent.trim();
  // suffixes: "+", "%" and multipliers like "7x"
  const match = text.match(/^(.*?\d)\s*([+%]+|[x×])$/i);
  const value = document.createElement('span');
  value.className = 'cards-stats-number';
  // values without a suffix (e.g. "10") still get the number styling
  if (!match || !match[1]) {
    value.textContent = text;
    el.replaceChildren(value);
    return;
  }
  const [, number, sign] = match;
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
        paragraphs.filter((p) => p !== valueP).forEach((p) => {
          // a link paragraph ("Read Case Study →") makes the whole tile clickable
          if (p.querySelector('a[href]')) {
            p.classList.add('cards-stats-cta');
            li.classList.add('cards-stats-linked');
          } else {
            p.classList.add('cards-stats-label');
          }
        });
      }
    }
    ul.append(li);
  });
  block.replaceChildren(ul);
}
