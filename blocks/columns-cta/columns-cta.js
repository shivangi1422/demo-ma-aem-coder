/**
 * Decorates the columns-cta block: equal centered columns, each a call-to-action
 * button above a short description.
 * Authored structure: one row, one cell per column:
 *   <p><a href="tel:...">Call Service</a></p><p>Have a question ...</p>
 * @param {Element} block
 */
export default function decorate(block) {
  const firstRow = block.firstElementChild;
  if (!firstRow) return;
  block.classList.add(`columns-cta-${firstRow.children.length}-cols`);

  [...block.children].forEach((row) => {
    row.classList.add('columns-cta-row');
    [...row.children].forEach((col) => {
      col.classList.add('columns-cta-col');
      // Make a lone link in its own paragraph a button even when the global
      // button decoration skipped it (e.g. tel:/mailto: links).
      const linkPara = [...col.querySelectorAll(':scope > p')].find((p) => {
        const a = p.querySelector(':scope > a');
        return a && p.children.length === 1 && p.textContent.trim() === a.textContent.trim();
      });
      if (linkPara) {
        const a = linkPara.querySelector('a');
        a.classList.add('button');
        linkPara.classList.add('button-wrapper', 'columns-cta-action');
      }
    });
  });
}
