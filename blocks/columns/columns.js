/**
 * Call-to-action variant: each column is a button above a short description.
 * A lone link in its own paragraph becomes the button, even when the global
 * button decoration skipped it (e.g. tel:/mailto: links).
 * @param {Element} block
 */
function decorateCta(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-cta-row');
    [...row.children].forEach((col) => {
      col.classList.add('columns-cta-col');
      const linkPara = [...col.querySelectorAll(':scope > p')].find((p) => {
        const a = p.querySelector(':scope > a');
        return a && p.children.length === 1 && p.textContent.trim() === a.textContent.trim();
      });
      if (linkPara) {
        linkPara.querySelector('a').classList.add('button');
        linkPara.classList.add('button-wrapper', 'columns-cta-action');
      }
    });
  });
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  if (block.classList.contains('cta')) {
    decorateCta(block);
    return;
  }

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
