/**
 * Standalone site-footer block (Beckman Coulter).
 * Expected initial structure — three rows:
 *   row 1: brand (wordmark + description)
 *   row 2: link columns (each cell = one column with a heading + list)
 *   row 3: legal / copyright
 */
export default function decorate(block) {
  const rows = [...block.children];
  const [brandRow, columnsRow, legalRow] = rows;

  if (brandRow) brandRow.classList.add('site-footer-brand');

  if (columnsRow) {
    columnsRow.classList.add('site-footer-columns');
    [...columnsRow.children].forEach((col) => col.classList.add('site-footer-col'));
  }

  if (legalRow) legalRow.classList.add('site-footer-legal');
}
