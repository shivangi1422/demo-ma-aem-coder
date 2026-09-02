import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the carousel-instruments block.
 * Authored structure:
 *   row 0 (optional, no picture): section heading
 *   row 1..N: one slide each — image cell + body cell (category, title, description)
 * The first slide is shown large in the stage; all slides render as a thumbnail
 * selector row flanked by prev/next arrow buttons. Selecting a thumbnail (or an
 * arrow) activates the corresponding slide.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];

  let headingRow = null;
  if (rows.length && !rows[0].querySelector('picture')) {
    [headingRow] = rows;
  }

  const slides = rows.filter((row) => row !== headingRow).map((row) => {
    const cells = [...row.children];
    const imageCell = cells.find((c) => c.querySelector('picture')) || cells[0];
    const bodyCell = cells.find((c) => c !== imageCell) || document.createElement('div');
    return { row, imageCell, bodyCell };
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-instruments-inner';

  if (headingRow) {
    const heading = document.createElement('div');
    heading.className = 'carousel-instruments-heading';
    while (headingRow.firstElementChild) heading.append(headingRow.firstElementChild);
    wrapper.append(heading);
  }

  const stage = document.createElement('div');
  stage.className = 'carousel-instruments-stage';

  // Controls row: prev arrow + thumbnail rail + next arrow.
  const controls = document.createElement('div');
  controls.className = 'carousel-instruments-controls';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-instruments-arrow carousel-instruments-arrow-prev';
  prev.setAttribute('aria-label', 'Previous instrument');

  const thumbs = document.createElement('div');
  thumbs.className = 'carousel-instruments-thumbs';

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-instruments-arrow carousel-instruments-arrow-next';
  next.setAttribute('aria-label', 'Next instrument');

  let activeIndex = 0;
  const activate = (i) => {
    activeIndex = (i + slides.length) % slides.length;
    stage.querySelectorAll('.carousel-instruments-slide').forEach((p, pi) => {
      p.classList.toggle('is-active', pi === activeIndex);
    });
    thumbs.querySelectorAll('.carousel-instruments-thumb').forEach((t, ti) => {
      t.classList.toggle('is-active', ti === activeIndex);
      t.setAttribute('aria-selected', ti === activeIndex ? 'true' : 'false');
    });
  };

  slides.forEach((slide, i) => {
    const panel = document.createElement('div');
    panel.className = 'carousel-instruments-slide';
    if (i === 0) panel.classList.add('is-active');
    moveInstrumentation(slide.row, panel);

    const img = slide.imageCell.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, img.alt, i === 0, [{ width: '1600' }]);
      moveInstrumentation(img, optimized.querySelector('img'));
      panel.append(optimized);
    }
    const overlay = document.createElement('div');
    overlay.className = 'carousel-instruments-overlay';
    [...slide.bodyCell.children].forEach((child) => overlay.append(child.cloneNode(true)));
    panel.append(overlay);
    stage.append(panel);

    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'carousel-instruments-thumb';
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
