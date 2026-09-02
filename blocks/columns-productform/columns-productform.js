import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the columns-productform block.
 * Authored structure: a single row with two cells —
 *   cell 0: product column (title, image, highlight list)
 *   cell 1: mini form (heading, subtitle, then field rows and a submit label)
 *
 * The form cell content is authored as rich text (label lines / paragraphs); this
 * decorator renders it as a styled presentational form card.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const firstRow = rows[0];
  if (!firstRow) return;

  const cells = [...firstRow.children];
  const productCell = cells[0];
  const formCell = cells[1];

  if (productCell) {
    productCell.classList.add('columns-productform-product');
    const img = productCell.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '1000' }]);
      moveInstrumentation(img, optimized.querySelector('img'));
      img.closest('picture').replaceWith(optimized);
    }
  }

  if (formCell) {
    formCell.classList.add('columns-productform-form');
    // eslint-disable-next-line no-use-before-define
    decorateForm(formCell);
  }
}

/**
 * Turns the authored form column into real, editable fields.
 * Field paragraphs are authored as `<strong>Label</strong>placeholder`; a bold
 * link becomes the submit button; headings/subtitles are preserved.
 * @param {Element} formCell
 */
function decorateForm(formCell) {
  const source = [...formCell.children];
  const form = document.createElement('form');
  form.setAttribute('novalidate', '');

  source.forEach((el) => {
    const strong = el.querySelector(':scope > strong');
    const link = el.querySelector('a');

    // The CTA link becomes the submit button.
    if (el.tagName === 'P' && link) {
      const submit = document.createElement('button');
      submit.type = 'submit';
      submit.className = 'columns-productform-submit';
      submit.textContent = link.textContent.trim();
      submit.addEventListener('click', (e) => e.preventDefault());
      form.append(submit);
      return;
    }

    // A field paragraph: bold label followed by placeholder text.
    if (el.tagName === 'P' && strong) {
      const label = strong.textContent.trim();
      const placeholder = el.textContent.replace(label, '').trim();
      const id = `columns-productform-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

      const field = document.createElement('div');
      field.className = 'columns-productform-field';

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

    // Heading / subtitle and anything else stays as-is.
    form.append(el);
  });

  formCell.replaceChildren(form);
}
