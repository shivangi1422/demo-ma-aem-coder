/* eslint-disable */
/* global WebImporter */

/**
 * Parser for contact-form (xwalk model: contact-form: text (richtext), link (aem-content)).
 * Source: div.contact-form-source[data-form-url], the placeholder mybeckman-service-prepare leaves for
 * a .formassembly-container (Marketo or FormAssembly form). In a sidebar column
 * (.two-columns-holder__right) the form title chunk above the form becomes the block text.
 * Output: [<!-- field:text -->h2…] [<!-- field:link --><a href=form url>]
 */
export default function parse(element, { document }) {
  const url = element.getAttribute('data-form-url');
  if (!url) { element.remove(); return; }

  const textCell = document.createDocumentFragment();
  const column = element.parentElement && element.parentElement.closest('.two-columns-holder__right');
  if (column) {
    const parts = [];
    let prev = element.previousElementSibling;
    while (prev && prev.matches('.bc-rich-text')) { parts.unshift(prev); prev = prev.previousElementSibling; }
    const nodes = parts.flatMap((chunk) => [...chunk.querySelectorAll('h1, h2, h3, h4, p, ul, ol')]
      .filter((n) => !n.parentElement.closest('p, ul, ol, h1, h2, h3, h4')));
    if (nodes.length) {
      textCell.appendChild(document.createComment(' field:text '));
      nodes.forEach((n) => textCell.appendChild(n));
    }
    parts.forEach((chunk) => chunk.remove());
  }

  const linkCell = document.createDocumentFragment();
  linkCell.appendChild(document.createComment(' field:link '));
  const a = document.createElement('a');
  a.href = url;
  a.textContent = url;
  linkCell.appendChild(a);

  const block = WebImporter.Blocks.createBlock(document, { name: 'contact-form', cells: [[textCell], [linkCell]] });
  element.replaceWith(block);
}
