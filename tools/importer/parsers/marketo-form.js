/* eslint-disable */
/* global WebImporter */

/**
 * Parser for marketo-form.
 * Source: https://www.mybeckman.in/microbioreactor/biolector-xt/software
 * Selector: .two-columns-holder__right .formassembly-container
 * The heading is the rich-text h3 just before the form container; the form id comes
 * from form#mktoForm_<id>. The rendered Marketo fields are not content — the block
 * loads the live form from Marketo.
 *
 * XWalk model (blocks/marketo-form/_marketo-form.json): title (text) | formUrl (text)
 */
const MARKETO_BASE = 'https://pages.beckman.com';
const DEFAULT_MUNCHKIN = '682-XWP-826';

export default function parse(element, { document }) {
  // heading block: previous rich-text sibling holding an h2/h3
  let headingHost = element.previousElementSibling;
  while (headingHost && !headingHost.querySelector('h2, h3') && headingHost.classList.contains('js-component')) {
    headingHost = headingHost.previousElementSibling;
  }
  const heading = headingHost && headingHost.querySelector('h2, h3');

  const form = element.querySelector('form[id^="mktoForm_"]');
  const formId = form ? form.id.replace('mktoForm_', '') : '';
  const munchkin = (element.innerHTML.match(/\d{3}-[A-Z]{3}-\d{3}/) || [DEFAULT_MUNCHKIN])[0];

  const titleCell = document.createDocumentFragment();
  titleCell.appendChild(document.createComment(' field:title '));
  if (heading) titleCell.appendChild(document.createTextNode(heading.textContent.replace(/\s+/g, ' ').trim()));

  const urlCell = document.createDocumentFragment();
  urlCell.appendChild(document.createComment(' field:formUrl '));
  if (formId) urlCell.appendChild(document.createTextNode(`${MARKETO_BASE}/index.php/form/getForm?munchkinId=${munchkin}&form=${formId}`));

  const block = WebImporter.Blocks.createBlock(document, { name: 'marketo-form', cells: [[titleCell], [urlCell]] });
  element.replaceWith(block);
  if (heading && headingHost && headingHost.textContent.trim() === heading.textContent.trim()) headingHost.remove();
}
