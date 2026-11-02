/* eslint-disable */
/* global WebImporter */

/**
 * Parser for link-list.
 * Source: https://www.mybeckman.in/microbioreactor/biolector-xt/software
 * Selector: .two-columns-holder__right > .bc-rich-text:has(ul)
 * Content: bold label paragraph + list of related links (the source wraps the
 * <li> elements in <small>, which is rebuilt as a plain list).
 *
 * XWalk model (blocks/link-list/_link-list.json): text (richtext)
 */
export default function parse(element, { document }) {
  const label = element.querySelector(':scope > p');
  const links = Array.from(element.querySelectorAll('li a[href]'));

  const cell = document.createDocumentFragment();
  cell.appendChild(document.createComment(' field:text '));
  if (label && label.textContent.trim()) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = label.textContent.replace(/\s+/g, ' ').trim();
    p.appendChild(strong);
    cell.appendChild(p);
  }
  if (links.length) {
    const ul = document.createElement('ul');
    links.forEach((link) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.setAttribute('href', link.getAttribute('href'));
      a.textContent = link.textContent.replace(/\s+/g, ' ').trim();
      li.appendChild(a);
      ul.appendChild(li);
    });
    cell.appendChild(ul);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'link-list', cells: [[cell]] });
  element.replaceWith(block);
}
