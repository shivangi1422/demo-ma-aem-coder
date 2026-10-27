/* eslint-disable */
/* global WebImporter */
/**
 * Parser: columns-intro -> existing block "columns" (no variant).
 * Sources:
 *   (a) mybeckman.in /service/instrument-qualification-calibration:
 *       .Section--grey .Section__intro > h2 + p+
 *       -> columns 1x2 = [H2] | [paragraph(s)]
 *   (b) mybeckman.in /service/tech-support:
 *       .Section--grey .Intro > p+ (no heading)
 *       -> columns 1x1 = [paragraph(s)]
 * Rule: a leading heading becomes its own cell; everything after it is the second cell.
 * With no leading heading all content stays in one cell.
 *
 * Model columns (blocks/columns/_columns.json): columns/rows numbers only; cells are
 * default content, so no XWalk field hints are emitted.
 * Empty anchors are dropped; hrefs are kept (the shared link step rewrites them).
 */

const CONTENT = ':scope > p, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, :scope > ul, :scope > ol';

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  const intro = element.querySelector('.Section__intro, .Intro') || element;

  const nodes = [];
  intro.querySelectorAll(CONTENT).forEach((node) => {
    const copy = node.cloneNode(true);
    copy.querySelectorAll('a').forEach((a) => { if (!norm(a.textContent)) a.remove(); });
    copy.querySelectorAll('style, script').forEach((n) => n.remove());
    if (norm(copy.textContent)) nodes.push(copy);
  });

  let cells;
  if (nodes.length > 1 && /^H[1-6]$/.test(nodes[0].tagName)) {
    const heading = document.createElement('h2');
    heading.innerHTML = nodes[0].innerHTML.trim();
    cells = [[[heading], nodes.slice(1)]];
  } else {
    cells = [[nodes.length ? nodes : '']];
  }

  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'columns', cells }));
}
