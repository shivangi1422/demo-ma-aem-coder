import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const BUTTON_CLASSES = ['button', 'primary', 'secondary', 'accent'];

/**
 * Turns a paragraph that holds only a link (optionally wrapped in strong/em,
 * or already decorated as p.button-wrapper > a.button) into the outline CTA.
 * @param {Element} p
 */
function decorateCta(p) {
  const links = p.querySelectorAll('a[href]');
  if (links.length !== 1) return;
  const a = links[0];
  if (a.querySelector('img, picture') || p.textContent.trim() !== a.textContent.trim()) return;

  // unwrap <strong>/<em> around the link
  let outer = a;
  while (outer.parentElement !== p && ['STRONG', 'EM', 'B', 'I'].includes(outer.parentElement.tagName)) {
    outer = outer.parentElement;
  }
  if (outer !== a) outer.replaceWith(a);

  a.classList.remove(...BUTTON_CLASSES);
  a.classList.add('hero-dim-photo-button');
  p.classList.remove('button-wrapper', 'button-container');
  p.classList.add('hero-dim-photo-cta');
}

/**
 * Hero (dim photo): full-bleed photo dimmed to 50% over black with a centred
 * h1, paragraph and outline CTA sitting directly on it.
 *
 * Authored structure (xwalk model: image + imageAlt, text):
 *   row 1: image (alt from imageAlt)
 *   row 2: rich text — h1, paragraph(s), link paragraph (CTA)
 * @param {Element} block
 */
export default function decorate(block) {
  let picture;
  const content = document.createElement('div');
  content.className = 'hero-dim-photo-content';

  [...block.children].forEach((row) => {
    const img = row.querySelector('img');
    if (img && !picture) {
      // LCP image: eager, high priority
      picture = createOptimizedPicture(img.src, img.alt || '', true, [
        { media: '(min-width: 992px)', width: '2000' },
        { width: '1200' },
      ]);
      const newImg = picture.querySelector('img');
      newImg.setAttribute('fetchpriority', 'high');
      newImg.loading = 'eager';
      moveInstrumentation(img, newImg);
      picture.classList.add('hero-dim-photo-image');
      (img.closest('picture') || img).remove();
    }

    if (row.textContent.trim() === '') {
      row.remove();
      return;
    }

    // text cell(s): move their content into the centred text box
    const cells = [...row.children];
    (cells.length ? cells : [row]).forEach((cell) => {
      if (cell.textContent.trim() === '') return;
      moveInstrumentation(cell, content);
      content.append(...cell.childNodes);
    });
    row.remove();
  });

  // bare text nodes (single-cell rows without <p>) get a paragraph
  [...content.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      const p = document.createElement('p');
      node.replaceWith(p);
      p.append(node);
    }
  });

  content.querySelectorAll('p').forEach(decorateCta);

  block.replaceChildren(...(picture ? [picture] : []), content);
}
