/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: form-request
 * Base block: form-request (container)
 * Source: https://www.beckmancoulter.com/en/products/dxs-service-and-supports
 *   Section: "Learn About our Service and Support Solutions" — a Marketo contact
 *   form (JS-injected, rendered live by the importer's headless browser).
 * Model + block JS: row 0 = header (title/subtitle richtext); field rows =
 *   [label, placeholder, type]; consent row = [text,,consent]; submit row.
 * The imported form is presentational only (posts nowhere).
 */
export default function parse(element, { document }) {
  const cleanLabel = (t) => (t || '')
    .replace(/\s+/g, ' ')
    .replace(/^\*+/, '')
    .replace(/\s*\*\s*$/, '')
    .trim();

  // Derive the header title from the nearest preceding heading sibling and
  // remember it so we can remove it (else it leaks as default content). Scan ALL
  // headings in the sibling — the source puts an auto "Empty heading" h2 first.
  let heading = null;
  let headingSibling = null;
  let prev = element.previousElementSibling;
  let hops = 0;
  const realHeading = (t) => t && t.trim() && !/^\s*(empty heading)?\s*$/i.test(t);
  while (prev && hops < 3 && !heading) {
    const candidates = prev.matches && prev.matches('h1, h2, h3')
      ? [prev] : Array.from((prev.querySelectorAll && prev.querySelectorAll('h1, h2, h3')) || []);
    const h = candidates.find((c) => realHeading(c.textContent));
    if (h) { heading = h; headingSibling = prev; }
    prev = prev.previousElementSibling;
    hops += 1;
  }

  const form = element.matches('form') ? element : element.querySelector('form');
  const scope = form || element;

  // Field inputs in document order (skip hidden + the header search box).
  const inputs = Array.from(
    scope.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], select, textarea'),
  ).filter((inp) => {
    const type = (inp.getAttribute('type') || inp.tagName).toLowerCase();
    if (type === 'hidden') return false;
    const name = (inp.getAttribute('name') || '').toLowerCase();
    return name && name !== 'q' && name !== 'search';
  });

  const cells = [];

  // Row 0: header (title).
  const headFrag = document.createDocumentFragment();
  headFrag.appendChild(document.createComment(' field:text '));
  if (heading && heading.textContent && heading.textContent.trim()) {
    const h = document.createElement('h2');
    h.textContent = heading.textContent.trim();
    headFrag.appendChild(h);
  }
  cells.push([headFrag]);

  const typeFor = (inp) => {
    if (inp.tagName === 'TEXTAREA') return 'textarea';
    const t = (inp.getAttribute('type') || '').toLowerCase();
    if (t === 'email') return 'email';
    return 'text';
  };

  // Field rows: [label, placeholder, type]. Alternate short text fields to half
  // width so the two-column source layout is roughly preserved.
  let halfToggle = false;
  inputs.forEach((inp) => {
    const id = inp.id;
    let label = '';
    if (id) {
      const l = scope.querySelector(`label[for="${id}"]`);
      if (l) label = l.textContent;
    }
    if (!label) label = inp.getAttribute('aria-label') || inp.getAttribute('placeholder') || inp.getAttribute('name') || '';
    label = cleanLabel(label);
    if (!label) return;

    let type = typeFor(inp);
    if (type === 'text') {
      type = halfToggle ? 'half' : 'text';
      halfToggle = !halfToggle;
    } else {
      halfToggle = false;
    }

    const labelCell = document.createElement('div');
    labelCell.textContent = label;
    const phCell = document.createElement('div');
    const typeCell = document.createElement('div');
    typeCell.textContent = type;
    cells.push([labelCell, phCell, typeCell]);
  });

  // Consent row: the fieldset's descriptive sentence only (NOT the <legend>
  // "Fieldset Label" nor the radio-option labels). Marketo puts it in .mktoHtmlText.
  const consentEl = scope.querySelector('fieldset .mktoHtmlText')
    || scope.querySelector('fieldset p')
    || scope.querySelector('.mktoHtmlText');
  let consentText = consentEl ? consentEl.textContent.replace(/\s+/g, ' ').trim() : '';
  consentText = consentText.replace(/^Fieldset Label\s*/i, '').trim();
  consentText = consentText.split(/\s*\*?\s*By (?:Email|Phone)\s*:/i)[0].trim();
  if (consentText) {
    const consentCell = document.createElement('div');
    consentCell.textContent = consentText;
    const typeCell = document.createElement('div');
    typeCell.textContent = 'consent';
    cells.push([consentCell, document.createElement('div'), typeCell]);
  }

  // Submit row.
  const submitEl = scope.querySelector('button[type="submit"], .mktoButton, button');
  const submitLabel = (submitEl && submitEl.textContent.trim()) || 'Submit';
  const submitCell = document.createElement('div');
  submitCell.textContent = submitLabel;
  const submitType = document.createElement('div');
  submitType.textContent = 'submit';
  cells.push([submitCell, document.createElement('div'), submitType]);

  // Empty-block guard: no real form fields -> unwrap.
  if (inputs.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'form-request', cells });
  element.replaceWith(block);
  if (headingSibling && headingSibling.parentNode && !headingSibling.contains(block)) {
    headingSibling.remove();
  }
}
