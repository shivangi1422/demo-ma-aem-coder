import { moveInstrumentation } from '../../scripts/scripts.js';

function moveRowContent(row, target) {
  moveInstrumentation(row, target);
  [...row.children].forEach((cell) => {
    moveInstrumentation(cell, target);
    while (cell.firstChild) target.append(cell.firstChild);
  });
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const [introRow, ...itemRows] = rows;
  const intro = document.createElement('div');
  intro.className = 'service-contact-intro';
  moveRowContent(introRow, intro);

  const list = document.createElement('ul');
  list.className = 'service-contact-list';

  itemRows.forEach((row) => {
    const item = document.createElement('li');
    item.className = 'service-contact-item';
    const content = document.createElement('div');
    content.className = 'service-contact-content';
    moveRowContent(row, content);

    content.querySelectorAll('p').forEach((paragraph) => {
      const link = paragraph.querySelector(':scope > a[href]');
      if (link
        && paragraph.children.length === 1
        && paragraph.textContent.trim() === link.textContent.trim()) {
        paragraph.classList.add('service-contact-action');
        link.classList.add('service-contact-link');
      }
    });

    item.append(content);
    list.append(item);
  });

  block.replaceChildren(intro, list);
}
