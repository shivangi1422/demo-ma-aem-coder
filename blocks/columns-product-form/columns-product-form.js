import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the columns-product-form block.
 * Authored as a simple block with three rows:
 *   row 0: product text (title, highlight list)
 *   row 1: product image
 *   row 2: form column (heading, subtitle, field lines, CTA)
 * Rendered as a two-column layout: product (text + image) left, form card right.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];

  const imageRow = rows.find((r) => r.querySelector('picture'));
  // The form row is the one whose content is a mini form (has a bold label line).
  const formRow = rows.find((r) => r !== imageRow
    && [...r.querySelectorAll('p')].some((p) => p.querySelector(':scope > strong') && !p.querySelector('a')));
  const textRow = rows.find((r) => r !== imageRow && r !== formRow);

  // Product column = text row + image.
  const productCol = document.createElement('div');
  productCol.className = 'columns-product-form-product';
  const textCell = textRow && textRow.firstElementChild;
  if (textCell) {
    while (textCell.firstChild) productCol.append(textCell.firstChild);
  }
  if (imageRow) {
    const img = imageRow.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '1000' }]);
      moveInstrumentation(img, optimized.querySelector('img'));
      productCol.append(optimized);
    }
  }

  // Form column.
  const formCol = document.createElement('div');
  formCol.className = 'columns-product-form-form';
  const formCell = formRow && formRow.firstElementChild;
  if (formCell) {
    while (formCell.firstChild) formCol.append(formCell.firstChild);
    // eslint-disable-next-line no-use-before-define
    decorateForm(formCol);
  }

  const layout = document.createElement('div');
  layout.append(productCol, formCol);
  block.replaceChildren(layout);
}

/**
 * Turns the authored form column into real, editable fields.
 * Field paragraphs are authored as `<strong>Label</strong>placeholder`; a bold
 * link becomes the submit button; headings/subtitles are preserved.
 * @param {Element} formCol
 */
function decorateForm(formCol) {
  const source = [...formCol.children];
  const form = document.createElement('form');
  form.setAttribute('novalidate', '');

  source.forEach((el) => {
    const strong = el.querySelector(':scope > strong');
    const link = el.querySelector('a');

    if (el.tagName === 'P' && link) {
      const submit = document.createElement('button');
      submit.type = 'submit';
      submit.className = 'columns-product-form-submit';
      submit.textContent = link.textContent.trim();
      submit.addEventListener('click', (e) => e.preventDefault());
      form.append(submit);
      return;
    }

    if (el.tagName === 'P' && strong) {
      const label = strong.textContent.trim();
      const placeholder = el.textContent.replace(label, '').trim();
      const id = `columns-product-form-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

      const field = document.createElement('div');
      field.className = 'columns-product-form-field';

      const lbl = document.createElement('label');
      lbl.setAttribute('for', id);
      lbl.textContent = label;

      const input = document.createElement('input');
      input.id = id;
      input.name = id;
      input.type = /email/i.test(label) ? 'email' : 'text';
      if (placeholder) input.placeholder = placeholder;

      field.append(lbl, input);
      form.append(field);
      return;
    }

    form.append(el);
  });

  formCol.replaceChildren(form);
}
