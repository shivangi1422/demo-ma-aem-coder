/* eslint-disable */
/* global WebImporter */

/**
 * Parser for marketo-form-compact (Marketo Form block, compact option).
 * Source: https://www.mybeckman.in/resources/industries/synthetic-biology
 *   ("Our team is ready to help": .formassembly-container.marketo-two-column with
 *    form 3101 - two 150px label | 150px field pairs per row in a 720px form)
 * Selector: #main .formassembly-container.marketo-two-column
 * Model: "marketo-form" (form = Marketo form URL, classes = style).
 * Same single cell as the marketo-form parser (field:form = link to
 * {origin}/index.php/form/getForm?munchkinId=682-XWP-826&form=3101, read from the
 * data-excat-mkto-* attributes the cleanup transformer stamps); only the block name
 * changes to "Marketo Form (compact)".
 */
import parseMarketoForm from './marketo-form.js';

export default function parse(element, { document, url, params }) {
  const marker = document.createComment('marketo-form-compact');
  element.before(marker);
  parseMarketoForm(element, { document, url, params });
  const block = marker.nextElementSibling;
  marker.remove();
  if (!block || block === element) return;
  const header = block.querySelector('tr:first-child > th, tr:first-child > td');
  if (header && /^Marketo Form/.test(header.textContent.trim())) header.textContent = 'Marketo Form (compact)';
}
