import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the carousel block. One block, two styles via the "Style" dropdown
 * (variant class):
 *   - .carousel.instruments (default) dark thumbnail slider: a large stage with
 *     an overlay panel, and a thumbnail rail flanked by prev/next arrows.
 *   - .carousel.split  a single item rendered as image + text panel (with an
 *     optional specs list).
 * Authored structure: optional row 0 = heading, rows 1..N = one slide each
 * (image cell + text cell).
 * @param {Element} block
 */
export default function decorate(block) {
  const split = block.classList.contains('split');
  const rows = [...block.children];

  const headingRow = rows[0] && !rows[0].querySelector('picture') ? rows[0] : null;
  const slideRows = rows.filter((r) => r !== headingRow);

  // ---- SPLIT: single item, image beside text ----
  if (split) {
    const row = slideRows[0];
    if (row) {
      const cells = [...row.children];
      const imageCell = cells.find((c) => c.querySelector('picture')) || cells[0];
      const textCell = cells.find((c) => c !== imageCell);
      if (imageCell) {
        imageCell.classList.add('carousel-image');
        const img = imageCell.querySelector('img');
        if (img) {
          const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '1200' }]);
          moveInstrumentation(img, optimized.querySelector('img'));
          img.closest('picture').replaceWith(optimized);
        }
      }
      if (textCell) textCell.classList.add('carousel-text');
    }
    // Drop any extra rows and the heading (split shows one item only).
    if (headingRow) headingRow.remove();
    slideRows.slice(1).forEach((r) => r.remove());
    return;
  }

  // ---- INSTRUMENTS: thumbnail slider ----
  const slides = slideRows.map((row) => {
    const cells = [...row.children];
    const imageCell = cells.find((c) => c.querySelector('picture')) || cells[0];
    const bodyCell = cells.find((c) => c !== imageCell) || document.createElement('div');
    return { row, imageCell, bodyCell };
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-inner';

  if (headingRow) {
    const heading = document.createElement('div');
    heading.className = 'carousel-heading';
    while (headingRow.firstElementChild) heading.append(headingRow.firstElementChild);
    wrapper.append(heading);
  }

  const stage = document.createElement('div');
  stage.className = 'carousel-stage';

  const controls = document.createElement('div');
  controls.className = 'carousel-controls';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-arrow carousel-arrow-prev';
  prev.setAttribute('aria-label', 'Previous slide');

  const thumbs = document.createElement('div');
  thumbs.className = 'carousel-thumbs';

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-arrow carousel-arrow-next';
  next.setAttribute('aria-label', 'Next slide');

  let activeIndex = 0;
  const activate = (i) => {
    activeIndex = (i + slides.length) % slides.length;
    stage.querySelectorAll('.carousel-slide').forEach((p, pi) => {
      p.classList.toggle('is-active', pi === activeIndex);
    });
    thumbs.querySelectorAll('.carousel-thumb').forEach((t, ti) => {
      t.classList.toggle('is-active', ti === activeIndex);
      t.setAttribute('aria-selected', ti === activeIndex ? 'true' : 'false');
    });
  };

  slides.forEach((slide, i) => {
    const panel = document.createElement('div');
    panel.className = 'carousel-slide';
    if (i === 0) panel.classList.add('is-active');
    moveInstrumentation(slide.row, panel);

    const img = slide.imageCell.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, img.alt, i === 0, [{ width: '1600' }]);
      moveInstrumentation(img, optimized.querySelector('img'));
      panel.append(optimized);
    }
    const overlay = document.createElement('div');
    overlay.className = 'carousel-overlay';
    [...slide.bodyCell.children].forEach((child) => overlay.append(child.cloneNode(true)));
    panel.append(overlay);
    stage.append(panel);

    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'carousel-thumb';
    thumb.setAttribute('role', 'tab');
    if (i === 0) thumb.classList.add('is-active');
    [...slide.bodyCell.children].forEach((child) => thumb.append(child.cloneNode(true)));
    thumb.addEventListener('click', () => activate(i));
    thumbs.append(thumb);
  });

  prev.addEventListener('click', () => activate(activeIndex - 1));
  next.addEventListener('click', () => activate(activeIndex + 1));

  controls.append(prev, thumbs, next);
  wrapper.append(stage, controls);
  block.replaceChildren(wrapper);
}
