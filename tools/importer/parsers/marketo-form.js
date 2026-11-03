/* eslint-disable */
/* global WebImporter */

/**
 * Parser for marketo-form, emitted as the Marketo Form block: default (sidebar
 * panel) in .two-columns-holder__right, two-column for .marketo-two-column,
 * stacked otherwise.
 * Source: https://www.mybeckman.in/support, /service/training, /service/plans/request
 * Selectors: #main .formassembly-container
 * Model: "marketo-form" (form = Marketo form URL, classes = style).
 * Row 1: field:form = link to
 *   {origin}/index.php/form/getForm?munchkinId={munchkin}&form={formId}
 * The config is read from data-excat-mkto-* attributes stamped by the
 * mybeckman-cleanup transformer (beforeTransform) before form.mktoForm is
 * removed. Without those attributes the element is left untouched.
 */
export default function parse(element, { document }) {
  const origin = element.getAttribute('data-excat-mkto-origin');
  const munchkin = element.getAttribute('data-excat-mkto-munchkin');
  const formId = element.getAttribute('data-excat-mkto-form');

  // config not stamped by the cleanup transformer - leave the element untouched
  if (!origin || !munchkin || !formId) return;

  const url = `${origin.replace(/\/+$/, '')}/index.php/form/getForm?munchkinId=${munchkin}&form=${formId}`;

  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(' field:form '));
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.textContent = url;
  frag.appendChild(a);

  const cells = [[frag]];
  // sidebar form (support) = default panel; wide band form (training) = two-column;
  // any other in-page form (e.g. /service/plans/request) = stacked
  let name = 'Marketo Form (stacked)';
  if (element.classList.contains('marketo-two-column')) name = 'Marketo Form (two-column)';
  else if (element.closest('.two-columns-holder__right')) name = 'Marketo Form';

  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
