/* eslint-disable no-console */
/* eslint-disable no-cond-assign */
/* eslint-disable import/prefer-default-export */

// group editable texts in single wrappers if applicable.
// this script should execute after script.js but before the the universal editor cors script
// and any block being loaded

/**
 * True when the richtext elements are the only content of a block cell (block > row > cell);
 * a block is a component element that is not a section or main.
 * @param {Element} element first richtext element
 * @param {Element[]} siblings the following elements of the same richtext
 * @returns {boolean}
 */
function isWholeBlockCell(element, siblings) {
  const cell = element.parentElement;
  const block = cell?.parentElement?.parentElement;
  if (!cell || cell.tagName !== 'DIV' || !block) return false;
  if (!block.matches('[data-aue-resource][data-aue-model]')) return false;
  if (block.matches('main, .section, [data-aue-model="section"]')) return false;
  if (Object.keys(cell.dataset).some((key) => key.startsWith('aue'))) return false;
  const parts = [element, ...siblings];
  const blankText = (node) => node.nodeType !== Node.TEXT_NODE || !node.textContent.trim();
  return [...cell.children].every((child) => parts.includes(child))
    && [...cell.childNodes].every(blankText);
}

export function decorateRichtext(container = document) {
  function deleteInstrumentation(element) {
    delete element.dataset.richtextResource;
    delete element.dataset.richtextProp;
    delete element.dataset.richtextFilter;
    delete element.dataset.richtextLabel;
  }

  let element;
  while (element = container.querySelector('[data-richtext-prop]:not(div)')) {
    const {
      richtextResource,
      richtextProp,
      richtextFilter,
      richtextLabel,
    } = element.dataset;
    deleteInstrumentation(element);
    const siblings = [];
    let sibling = element;
    while (sibling = sibling.nextElementSibling) {
      if (sibling.dataset.richtextResource === richtextResource
        && sibling.dataset.richtextProp === richtextProp) {
        deleteInstrumentation(sibling);
        siblings.push(sibling);
      } else break;
    }

    let orphanElements;
    if (richtextResource && richtextProp) {
      orphanElements = document.querySelectorAll(`[data-richtext-id="${richtextResource}"][data-richtext-prop="${richtextProp}"]`);
    } else {
      const editable = element.closest('[data-aue-resource]');
      if (editable) {
        orphanElements = editable.querySelectorAll(`:scope > :not([data-aue-resource]) [data-richtext-prop="${richtextProp}"]`);
      } else {
        console.warn(`Editable parent not found or richtext property ${richtextProp}`);
        return;
      }
    }

    if (orphanElements.length) {
      console.warn('Found orphan elements of a richtext, that were not consecutive siblings of '
        + 'the first paragraph', orphanElements);
      orphanElements.forEach((orphanElement) => deleteInstrumentation(orphanElement));
    } else if (isWholeBlockCell(element, siblings)) {
      // the richtext is the whole content of a block cell: instrument the cell itself instead of
      // adding a wrapper, so blocks see the same cell structure as on the published page
      const cell = element.parentElement;
      if (richtextResource) {
        cell.dataset.aueResource = richtextResource;
        cell.dataset.aueBehavior = 'component';
      }
      if (richtextProp) cell.dataset.aueProp = richtextProp;
      if (richtextLabel) cell.dataset.aueLabel = richtextLabel;
      if (richtextFilter) cell.dataset.aueFilter = richtextFilter;
      cell.dataset.aueType = 'richtext';
    } else {
      const group = document.createElement('div');
      if (richtextResource) {
        group.dataset.aueResource = richtextResource;
        group.dataset.aueBehavior = 'component';
      }
      if (richtextProp) group.dataset.aueProp = richtextProp;
      if (richtextLabel) group.dataset.aueLabel = richtextLabel;
      if (richtextFilter) group.dataset.aueFilter = richtextFilter;
      group.dataset.aueType = 'richtext';
      element.replaceWith(group);
      group.append(element, ...siblings);
    }
  }
}
