/* eslint-disable */
/* global WebImporter */

/**
 * Parser for marketo-form, emitted as the Marketo Form block (two-column
 * option when the container has class marketo-two-column).
 * Source: https://www.mybeckman.in/support, https://www.mybeckman.in/service/training
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
  const name = element.classList.contains('marketo-two-column')
    ? 'Marketo Form (two-column)'
    : 'Marketo Form';

  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
