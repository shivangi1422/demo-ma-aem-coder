/**
 * Decorates the form-request block.
 * Authored structure (rows):
 *   row 0: heading + subtitle (rich text)
 *   row 1..N-2: one field per row — cell 0 = label, cell 1 = placeholder,
 *               cell 2 = type (text|email|textarea|half)
 *   row N-1: consent text
 *   row N:   submit button label
 *
 * Renders a styled, accessible form card. The form posts nowhere by default
 * (design migration) — it is a presentational representation of the Figma design.
 * @param {Element} block
 */
function cellText(cell) {
  return (cell?.textContent || '').trim();
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const card = document.createElement('form');
  card.className = 'form-request-card';
  card.setAttribute('novalidate', '');

  const header = document.createElement('div');
  header.className = 'form-request-header';
  const headerCell = rows[0].firstElementChild || rows[0];
  while (headerCell.firstChild) header.append(headerCell.firstChild);
  card.append(header);

  const fields = document.createElement('div');
  fields.className = 'form-request-fields';

  let submitLabel = 'Submit';
  let consentText = '';

  rows.slice(1).forEach((row) => {
    const cells = [...row.children];
    const type = cellText(cells[2]).toLowerCase();
    const label = cellText(cells[0]);
    const placeholder = cellText(cells[1]);

    if (type === 'submit' || (cells.length === 1 && /submit|request|send/i.test(label))) {
      submitLabel = label || submitLabel;
      return;
    }
    if (type === 'consent' || (cells.length === 1 && label)) {
      consentText = label;
      return;
    }

    const field = document.createElement('div');
    field.className = 'form-request-field';
    if (type === 'half') field.classList.add('form-request-field-half');

    const id = `form-request-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
    const lbl = document.createElement('label');
    lbl.setAttribute('for', id);
    lbl.textContent = label;
    field.append(lbl);

    let input;
    if (type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 4;
    } else {
      input = document.createElement('input');
      input.type = type === 'email' ? 'email' : 'text';
    }
    input.id = id;
    input.name = id;
    if (placeholder) input.placeholder = placeholder;
    field.append(input);
    fields.append(field);
  });

  card.append(fields);

  if (consentText) {
    const consent = document.createElement('label');
    consent.className = 'form-request-consent';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    const span = document.createElement('span');
    span.textContent = consentText;
    consent.append(checkbox, span);
    card.append(consent);
  }

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'form-request-submit';
  submit.textContent = submitLabel;
  submit.addEventListener('click', (e) => e.preventDefault());
  card.append(submit);

  block.replaceChildren(card);
}
