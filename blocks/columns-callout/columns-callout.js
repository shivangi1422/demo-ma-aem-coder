import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Benefits callout: intro text (heading + paragraph) beside a list of benefits,
 * shown in two columns (first half down the left column, second half down the right).
 * Rows: first row = intro (text), every other row = one benefit (text: bold title + description).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const [introRow, ...itemRows] = [...block.children];
  if (!introRow) return;

  const intro = document.createElement('div');
  intro.className = 'columns-callout-intro';
  moveInstrumentation(introRow, intro);
  introRow.querySelectorAll(':scope > div').forEach((cell) => intro.append(...cell.childNodes));

  const body = document.createElement('div');
  body.className = 'columns-callout-body';
  const half = Math.ceil(itemRows.length / 2);
  [itemRows.slice(0, half), itemRows.slice(half)].forEach((rows) => {
    if (!rows.length) return;
    const ul = document.createElement('ul');
    rows.forEach((row) => {
      const li = document.createElement('li');
      moveInstrumentation(row, li);
      row.querySelectorAll(':scope > div').forEach((cell) => li.append(...cell.childNodes));
      const title = li.querySelector('p, h3, h4');
      if (title && title.querySelector('strong')) title.classList.add('columns-callout-title');
      ul.append(li);
    });
    body.append(ul);
  });

  block.replaceChildren(intro, body);
}
