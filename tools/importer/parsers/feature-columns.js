/* eslint-disable */
/* global WebImporter */

/**
 * Parser for feature-columns.
 * Source: https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise
 * Selector: #features-wrapper .bc-columns
 * Item: .bc-column -> .bc-rich-text (h4 + .bc-rich-text-desc list)
 *
 * XWalk model (blocks/feature-columns/_feature-columns.json), item feature-column: text (richtext)
 */

const clean = (text) => text.replace(/\s+/g, ' ').trim();

function copyInline(source, target, document) {
  [...source.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      // keep &nbsp; (it holds words together on the live page)
      target.appendChild(document.createTextNode(node.textContent.replace(/[ \t\r\n\f]+/g, ' ')));
    } else if (node.nodeType === 1 && node.tagName === 'A') {
      const a = document.createElement('a');
      a.setAttribute('href', node.getAttribute('href'));
      a.textContent = clean(node.textContent);
      target.appendChild(a);
    } else if (node.nodeType === 1 && /^(STRONG|B|EM|I|SUP|SUB)$/.test(node.tagName)) {
      target.appendChild(copyInline(node, document.createElement(node.tagName.toLowerCase()), document));
    } else if (node.nodeType === 1 && !/^(BR|UL|OL)$/.test(node.tagName)) {
      copyInline(node, target, document);
    }
  });
  if (target.firstChild && target.firstChild.nodeType === 3) {
    target.firstChild.textContent = target.firstChild.textContent.replace(/^[ \t\r\n\f]+/, '');
  }
  if (target.lastChild && target.lastChild.nodeType === 3) {
    target.lastChild.textContent = target.lastChild.textContent.replace(/[ \t\r\n\f]+$/, '');
  }
  return target;
}

export default function parse(element, { document }) {
  const columns = [...element.querySelectorAll(':scope > .bc-column')];
  const cells = columns.map((column) => {
    const cell = document.createDocumentFragment();
    cell.appendChild(document.createComment(' field:text '));
    const heading = column.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      const h4 = document.createElement('h4');
      h4.textContent = clean(heading.textContent);
      cell.appendChild(h4);
    }
    column.querySelectorAll('ul, ol').forEach((list) => {
      if (list.parentElement.closest('ul, ol')) return;
      const copy = document.createElement(list.tagName.toLowerCase());
      list.querySelectorAll(':scope > li').forEach((li) => {
        copy.appendChild(copyInline(li, document.createElement('li'), document));
      });
      cell.appendChild(copy);
    });
    column.querySelectorAll('.bc-rich-text-desc > p').forEach((p) => {
      if (clean(p.textContent)) cell.appendChild(copyInline(p, document.createElement('p'), document));
    });
    return [cell];
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'feature-columns', cells });
  element.replaceWith(block);
}
