import { loadCSS } from '../../scripts/aem.js';

export default async function decorate(block) {
  // variant "media" (mybeckman.in inner pages: media + text): own decoration and styles
  if (block.classList.contains('media')) {
    const [{ default: decorateMediaText }] = await Promise.all([
      import('./media-text.js'),
      loadCSS(`${window.hlx.codeBasePath}/blocks/columns/media-text.css`),
    ]);
    decorateMediaText(block);
    return;
  }

  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

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
