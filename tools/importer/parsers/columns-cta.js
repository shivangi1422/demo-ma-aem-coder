/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-cta. Base: columns.
 * Source: https://www.mybeckman.in/service
 * Selectors: #getInTouch .Contact__body, .Contact .Contact__body
 * Model: columns (no field hints for Columns blocks).
 * One row, one cell per column: CTA link paragraph + description paragraph.
 */
export default function parse(element, { document }) {
  const columns = Array.from(element.querySelectorAll(':scope > div'));
  const row = [];

  columns.forEach((col) => {
    const content = [];

    Array.from(col.children).forEach((child) => {
      if (child.tagName === 'A' && child.getAttribute('href')) {
        const a = document.createElement('a');
        a.setAttribute('href', child.getAttribute('href'));
        a.textContent = child.textContent.trim();
        const p = document.createElement('p');
        p.appendChild(a);
        content.push(p);
      } else if (child.textContent.trim()) {
        content.push(child);
      }
    });

    row.push(content.length ? content : '');
  });

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-cta', cells });
  element.replaceWith(block);
}
