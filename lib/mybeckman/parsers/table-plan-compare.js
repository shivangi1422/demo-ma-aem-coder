/* eslint-disable */
/* global WebImporter */
/**
 * Parser: table-plan-compare (mybeckman.in /service/plans/centrifuge, plan comparison).
 * Source: #service-plans-table.wrapper
 *   > table > thead > tr > th (corner) + th.section-header[colspan] + th.blank + ...
 *            tbody > tr (first = column headers) > td (label) + td (plan) ... td.blank (spacer)
 *     cells: div.circle = included, div.whiteCircle = optional, text (e.g. "10% Off"), empty
 *   > .footnotes (legend: span.circle "included", span.whiteCircle "optional at additional charge")
 *
 * Library convention (Table): header row + one row per data row, one cell per column.
 * Model (blocks/table-plan-compare/_table-plan-compare.json), xwalk container:
 *   block fields (one row each): field:groups -> <p>Label: span, Label: span</p>
 *                                field:highlight -> plan column number (or none)
 *                                field:legend -> <p>:dot: included</p><p>:dot-ring: …</p>
 *   items (Plan Row): 7 cells field:label, field:plan1..plan6 (first item = column headers)
 *   cell values: :dot: (included), :dot-ring: (optional), text, or empty.
 * The spacer column (td.blank / th.blank) is not authored; the block inserts it between groups.
 * Highlight: the page CSS highlights `td:nth-child(7)` = the 5th plan column (PT - Protective).
 * The live page leaves optional cells blank (.whiteCircle has no CSS); they are authored as
 * :dot-ring: so the intended ring shows.
 */

const PLAN_FIELDS = 6;
const HIGHLIGHT_NTH_CHILD = 7; // from the page's inline style

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

function titleCase(s) {
  return norm(s).toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, sep, c) => sep + c.toUpperCase());
}

function cellValue(td) {
  if (td.querySelector('.circle')) return ':dot:';
  if (td.querySelector('.whiteCircle, .emptycircle')) return ':dot-ring:';
  return norm(td.textContent);
}

function textEl(document, tag, text) {
  const el = document.createElement(tag);
  el.textContent = text;
  return el;
}

export default function parse(element, { document }) {
  const table = element.querySelector('table');
  if (!table) return;
  const cells = [];

  // groups: thead th.section-header with their colspans
  const groups = [...table.querySelectorAll('thead th.section-header')]
    .map((th) => `${titleCase(th.textContent)}: ${th.getAttribute('colspan') || '1'}`);
  // "Label: span", comma-separated (a "|" would break the xwalk table conversion)
  cells.push([[hint(document, 'groups'), textEl(document, 'p', groups.join(', '))]]);

  // highlight: plan index of the highlighted source column (spacer columns not counted)
  const firstRow = table.querySelector('tbody tr');
  const sourceCells = firstRow ? [...firstRow.children] : [];
  const highlighted = sourceCells[HIGHLIGHT_NTH_CHILD - 1];
  const planIndex = highlighted
    ? sourceCells.slice(1, HIGHLIGHT_NTH_CHILD).filter((c) => !c.classList.contains('blank')).length
    : 0;
  cells.push([[hint(document, 'highlight'), textEl(document, 'p', planIndex ? String(planIndex) : 'none')]]);

  // legend
  const legend = [];
  [...element.querySelectorAll('.footnotes p')].forEach((p) => {
    const t = norm(p.textContent);
    if (!t) return;
    const token = p.querySelector('.circle') ? ':dot: ' : (p.querySelector('.whiteCircle, .emptycircle') ? ':dot-ring: ' : '');
    legend.push(textEl(document, 'p', `${token}${t}`));
  });
  cells.push([legend.length ? [hint(document, 'legend'), ...legend] : '']);

  // rows: label + plan1..plan6 (spacer columns dropped)
  [...table.querySelectorAll('tbody tr')].forEach((tr) => {
    const tds = [...tr.children].filter((td) => !td.classList.contains('blank'));
    if (!tds.length) return;
    const row = [];
    const label = norm(tds[0].textContent);
    row.push(label ? [hint(document, 'label'), textEl(document, 'p', label)] : [hint(document, 'label')]);
    for (let i = 1; i <= PLAN_FIELDS; i += 1) {
      const td = tds[i];
      const v = td ? cellValue(td) : '';
      row.push(v ? [hint(document, `plan${i}`), textEl(document, 'p', v)] : [hint(document, `plan${i}`)]);
    }
    cells.push(row);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-plan-compare', cells });
  element.replaceWith(block);
}
