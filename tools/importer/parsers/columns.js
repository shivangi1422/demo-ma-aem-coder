/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: columns
 * Base block: columns
 * Source: https://www.beckmancoulter.com/en/products/immunoassay
 * Model (blocks/columns/_columns.json): columns block — NO field hints (Columns blocks are exempt).
 * Library structure: row 0 = block name; row 1 = N cells (one per column).
 * Handles two source shapes:
 *   1) Clinical category link lists: three `.column` cells each holding a <ul> of links.
 *   2) Dual promo panels (`.double-showcase-feature`): each `.feature-content` becomes a column
 *      with heading + optional body + CTA.
 */
export default function parse(element, { document }) {
  const isPlaceholder = (t) => !t || /^\s*(empty heading)?\s*$/i.test(t);
  const cells = [];

  const isDoublePromo = element.classList.contains('double-showcase-feature')
    || element.querySelector(':scope > .content-container .feature-content, :scope .feature-content');

  if (isDoublePromo) {
    // Optional section heading spanning above the columns (skip auto "Empty heading").
    const introHeading = Array.from(
      element.querySelectorAll(':scope .intro-content h1, :scope .intro-content h2'),
    ).find((h) => !isPlaceholder(h.textContent));
    if (introHeading) {
      cells.push([introHeading]);
    }

    const panels = Array.from(element.querySelectorAll(':scope .feature-content'));
    const row = panels.map((panel) => {
      const cell = [];
      const heading = panel.querySelector('h1, h2, h3, h4');
      if (heading && !isPlaceholder(heading.textContent)) cell.push(heading);
      panel.querySelectorAll('p').forEach((p) => {
        if (p.textContent.trim()) cell.push(p);
      });
      const cta = panel.querySelector('a.button, a.ui.button, a[href]');
      if (cta) cell.push(cta);
      return cell;
    });
    if (row.length) cells.push(row);
  } else {
    // Link-list columns: one cell per `.column`, preserving its list markup.
    const columns = Array.from(element.querySelectorAll(':scope > .column'));
    if (columns.length) {
      const row = columns.map((col) => {
        const list = col.querySelector('ul, ol');
        return list ? [list] : [...col.childNodes];
      });
      cells.push(row);
    } else {
      // Text-only section (convention: single text/title is wrapped in columns).
      // Single column cell carrying the section's headings + paragraphs.
      const cell = [];
      element.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach((el) => {
        if (!isPlaceholder(el.textContent) && el.textContent.trim()) cell.push(el);
      });
      if (cell.length) cells.push([cell]);
    }
  }

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
