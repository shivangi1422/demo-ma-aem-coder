/* eslint-disable */
/* global WebImporter */

/**
 * Intro text (mybeckman.in /service/tech-support): .Section--grey .Intro paragraphs
 * -> Columns 1x1. Empty anchors are dropped; links are kept (the link step rewrites them).
 */
export default function parse(element, { document }) {
  const intro = element.querySelector('.Intro') || element;
  const cell = document.createElement('div');
  intro.querySelectorAll(':scope > p, :scope > h2, :scope > h3, :scope > ul, :scope > ol').forEach((node) => {
    const copy = node.cloneNode(true);
    copy.querySelectorAll('a').forEach((a) => { if (!a.textContent.trim()) a.remove(); });
    if (copy.textContent.trim()) cell.append(copy);
  });
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [[cell]] }));
}
