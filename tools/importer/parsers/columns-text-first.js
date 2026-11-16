/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-text-first (Columns block, text-first option).
 * Source: https://www.mybeckman.in/service/tech-support/repairs ("Onsite Repairs, Calibration &
 * Instrument Validation": image left, heading + text + call button right; on mobile the source
 * shows the text before the image).
 * Selector: .Section > .Section__two-column:has(> .Section__two-column-left > img:only-child)
 * Model: columns (no field hints for Columns blocks); option class "text-first".
 * Same rows/cells as the plain columns parser (it does the extraction: one row, one cell per
 * column); only the block name changes to "Columns (text-first)".
 */

import parseColumns from './columns.js';

export default function parse(element, { document, url, params }) {
  const marker = document.createComment('columns-text-first');
  element.before(marker);
  parseColumns(element, { document, url, params });
  const block = marker.nextElementSibling;
  marker.remove();
  if (!block) return;
  const header = block.querySelector('tr:first-child > th, tr:first-child > td');
  if (header && header.textContent.trim() === 'Columns') header.textContent = 'Columns (text-first)';
}
