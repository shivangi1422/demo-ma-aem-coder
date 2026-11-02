/* eslint-disable */
/* global WebImporter */

/**
 * Parser for table-comparison. Base: table.
 * Source: https://www.mybeckman.in/service/plans/<product-line>
 * Selectors: #service-plans-table > table, #service-plans-table table
 * Model: block "table-comparison" (classes = highlight option),
 *        items "table-comparison-row" (column1..column6, plain text).
 * Every row has the same number of cells (6):
 *   Row 1: group headers - empty, label, (span-1) empties, label, ...
 *   Row 2: plan names (first cell empty)
 *   Rows 3+: feature label + one value per plan (● included, ○ optional, text, empty)
 * .blank spacer columns are dropped (group span = colspan, else plan columns up to the next .blank). Option (highlight) only on the centrifuge page.
 * The legend (.footnotes) is rewritten as "● included" / "○ optional ..."
 * paragraphs placed right after the block as default content.
 */

const COLUMN_COUNT = 6;
const INCLUDED = '●';
const OPTIONAL = '○';

const isBlank = (cell) => cell.classList.contains('blank');

function cellValue(cell) {
  if (cell.querySelector('.circle')) return INCLUDED;
  if (cell.querySelector('.whiteCircle, .emptycircle, .emptyCircle, .white-circle')) return OPTIONAL;
  return cell.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function pageUrl(document, ctx) {
  const params = (ctx && ctx.params) || {};
  const candidates = [params.originalURL, ctx && ctx.url];
  const meta = document.querySelector('meta[property="og:url"], link[rel="canonical"]');
  if (meta) candidates.push(meta.getAttribute('content') || meta.getAttribute('href'));
  try { candidates.push(document.location && document.location.href); } catch (e) { /* no location */ }
  return candidates.filter(Boolean).map(String).join(' ');
}

export default function parse(element, { document }) {
  // the import script also passes { url, params } (see import-service.js)
  const ctx = arguments[1] || {};
  const allRows = Array.from(element.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tr'));
  if (!allRows.length) return;

  const headRows = Array.from(element.querySelectorAll(':scope > thead > tr'));
  const groupRow = headRows.find((tr) => tr.querySelector('.section-header'));
  const bodyRows = allRows.filter((tr) => tr !== groupRow);
  const planRow = bodyRows[0];
  const featureRows = bodyRows.slice(1);

  const toRow = (values) => {
    const padded = values.slice(0, COLUMN_COUNT);
    while (padded.length < COLUMN_COUNT) padded.push('');
    return padded.map((value, i) => {
      if (!value) return '';
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(` field:column${i + 1} `));
      frag.appendChild(document.createTextNode(value));
      return frag;
    });
  };

  const cells = [];

  // Row 1: group headers
  if (groupRow && planRow) {
    const planCells = Array.from(planRow.children);
    // blank spacer positions in the plan-name row, used when colspan is missing
    const groupValues = [''];
    let planIndex = 1; // position in planRow (index 0 = label column)
    Array.from(groupRow.children).slice(1).forEach((th) => {
      const colspanAttr = parseInt(th.getAttribute('colspan') || '', 10);
      if (isBlank(th)) {
        planIndex += Number.isNaN(colspanAttr) ? 1 : colspanAttr;
        return;
      }
      let span;
      if (!Number.isNaN(colspanAttr) && colspanAttr > 0) {
        span = colspanAttr;
      } else {
        span = 0;
        while (planIndex + span < planCells.length && !isBlank(planCells[planIndex + span])) span += 1;
        span = Math.max(span, 1);
      }
      planIndex += span;
      const label = th.textContent.replace(/\s+/g, ' ').trim();
      groupValues.push(label);
      for (let s = 1; s < span; s += 1) groupValues.push('');
    });
    cells.push(toRow(groupValues));
  }

  // Row 2: plan names; rows 3+: features
  [planRow, ...featureRows].filter(Boolean).forEach((tr, rowIndex) => {
    const values = Array.from(tr.children)
      .filter((cell) => !isBlank(cell))
      .map((cell, i) => (i === 0 && rowIndex === 0 ? cell.textContent.trim() : cellValue(cell)));
    if (rowIndex > 0 && !values.some(Boolean)) return;
    cells.push(toRow(values));
  });

  const highlight = /\/service\/plans\/centrifuge(?:[/?#.]|\s|$)/i.test(pageUrl(document, ctx));
  const name = highlight ? 'Table Comparison (highlight)' : 'Table Comparison';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });

  // Legend: rewrite the footnotes as default content right after the block.
  const wrapper = element.parentElement;
  const footnotes = wrapper ? wrapper.querySelector(':scope > .footnotes') : null;
  const legend = [];
  if (footnotes) {
    footnotes.querySelectorAll('p').forEach((p) => {
      const text = p.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
      if (!text) return;
      let glyph = '';
      if (p.querySelector('.circle')) glyph = INCLUDED;
      else if (p.querySelector('.whiteCircle, .emptycircle, .emptyCircle, .white-circle')) glyph = OPTIONAL;
      else if (/^included$/i.test(text)) glyph = INCLUDED;
      else if (/^optional/i.test(text)) glyph = OPTIONAL;
      const out = document.createElement('p');
      out.textContent = glyph ? `${glyph} ${text}` : text;
      legend.push(out);
    });
    footnotes.remove();
  }

  element.replaceWith(block);
  if (legend.length) block.after(...legend);
}
