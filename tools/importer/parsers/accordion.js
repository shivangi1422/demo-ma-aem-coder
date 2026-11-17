/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion (new block).
 * Source: https://www.mybeckman.in/resources/disease-research/leukemia-and-lymphoma
 *   (consecutive div.wrap-collabsible items: checkbox + label.lbl-toggle title +
 *    div.collapsible-content > .content-inner with paragraphs and a .btn link)
 * Selector: .wrap-collabsible (the first of each run of siblings; the following
 *   siblings are pulled into the same block)
 * Model: block "accordion" (no fields), items "accordion-item" (summary text, text richtext).
 * Library convention: 2 columns, one row per item - [title cell, content cell].
 * A .btn link in its own paragraph stays a plain link; the accordion block shows it
 * as the panel's outlined button.
 */

const KEEP = ['P', 'UL', 'OL', 'H3', 'H4', 'H5', 'H6', 'IMG', 'PICTURE', 'TABLE'];

export default function parse(element, { document }) {
  const items = [element];
  let next = element.nextElementSibling;
  while (next && next.classList.contains('wrap-collabsible')) {
    items.push(next);
    next = next.nextElementSibling;
  }

  const cells = [];
  items.forEach((item) => {
    const label = item.querySelector('.lbl-toggle, label');
    const title = (label ? label.textContent : '').replace(/\s+/g, ' ').trim();
    const inner = item.querySelector('.collapsible-content .content-inner')
      || item.querySelector('.collapsible-content') || item;

    const titleFrag = document.createDocumentFragment();
    titleFrag.appendChild(document.createComment(' field:summary '));
    titleFrag.appendChild(document.createTextNode(title));

    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    Array.from(inner.children).forEach((child) => {
      if (!KEEP.includes(child.tagName)) return;
      if (!child.textContent.trim() && !child.querySelector('img, picture')) return;
      child.querySelectorAll('a.btn').forEach((a) => a.removeAttribute('class'));
      textFrag.appendChild(child);
    });
    cells.push([titleFrag, textFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Accordion', cells });
  items.slice(1).forEach((item) => item.remove());
  element.replaceWith(block);
}
