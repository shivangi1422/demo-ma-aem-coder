/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-wide-first (Columns block, wide-first option).
 * Source: https://www.mybeckman.in/resources/industries/synthetic-biology
 *   (intro: .intro grid 7fr | 5fr - .intro-text paragraphs + red "Find out More"
 *    button to #form | .intro-image Design-Build-Test-Learn graphic)
 * Selector: .intro:has(> .intro-text):has(> .intro-image)
 * Model: columns (no field hints for Columns blocks); option class "wide-first".
 * Library convention: one row, one cell per column. The plain columns parser does
 * the extraction (the <a><button> CTA becomes <p><strong><a href="#form"></a></strong></p>);
 * only the block name changes to "Columns (wide-first)".
 */
import parseColumns from './columns.js';

export default function parse(element, { document, url, params }) {
  const marker = document.createComment('columns-wide-first');
  element.before(marker);
  parseColumns(element, { document, url, params });
  const block = marker.nextElementSibling;
  marker.remove();
  if (!block) return;
  const header = block.querySelector('tr:first-child > th, tr:first-child > td');
  if (header && header.textContent.trim() === 'Columns') header.textContent = 'Columns (wide-first)';
}
