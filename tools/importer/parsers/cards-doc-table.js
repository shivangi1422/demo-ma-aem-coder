/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-doc-table (template: reagent-product).
 * Source: https://www.mybeckman.in/reagents/particle/valita-titer-assays
 *         https://www.mybeckman.in/reagents/particle/valita-aggregation-pure
 * Selector: #techdocs-wrapper .techdocs-table
 *
 * Model (blocks/cards-doc-table/_cards-doc-table.json):
 *   block "cards-doc-table": headings (text, comma-separated column headings)
 *   item  "cards-doc-table-item": link (aem-content) [+ linkText collapsed],
 *         category, documentId, lotNumbers (text)
 *
 * Output rows:
 *   row 0  : headings (from the rendered Coveo table header; empty -> block defaults)
 *   row 1..: one per rendered .CoveoResult row -> [linked title | type | doc id | lot number(s)]
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

  const hinted = (field, content) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    frag.appendChild(typeof content === 'string' ? document.createTextNode(content) : content);
    return frag;
  };

  const cells = [];

  // Row 0: column headings (block field)
  const headings = Array.from(element.querySelectorAll('.coveo-result-list-table-header th'))
    .map((th) => clean(th.textContent))
    .filter(Boolean);
  cells.push([headings.length ? hinted('headings', headings.join(', ')) : '']);

  // Rows 1..N: documents
  const rows = Array.from(element.querySelectorAll('tr.CoveoResult'));
  rows.forEach((tr) => {
    const tds = Array.from(tr.querySelectorAll(':scope > td'));
    if (!tds.length) return;

    const srcLink = (tds[0] && tds[0].querySelector('a[href]')) || tr.querySelector('a.CoveoResultLink[href]');
    const title = clean(srcLink ? srcLink.textContent : (tds[0] && tds[0].textContent));
    let linkCell = '';
    if (srcLink && title) {
      const a = document.createElement('a');
      a.setAttribute('href', srcLink.getAttribute('href'));
      a.textContent = title;
      linkCell = hinted('link', a);
    }

    const textCell = (field, td) => {
      const value = clean(td && td.textContent);
      return value ? hinted(field, value) : '';
    };

    const row = [
      linkCell,
      textCell('category', tds[1]),
      textCell('documentId', tds[2]),
      textCell('lotNumbers', tds[3]),
    ];
    if (row.every((c) => c === '')) return;
    cells.push(row);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-doc-table', cells });
  element.replaceWith(block);
}
