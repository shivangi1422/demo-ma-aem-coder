import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * RESOURCES: filter pills + 3-up card slider with dot pagination.
 * Row 0 (heading/config) holds an optional heading and a list of filter
 * labels. Rows 1..N = one card each: optional background image + text (first
 * paragraph = category, matching a filter label; heading = title; trailing
 * link paragraph = CTA). Cards without an image get a solid background
 * colour keyed on their category (data-category).
 * @param {Element} block
 * @param {Element|null} headingRow
 * @param {Element[]} slideRows
 */
function decorateResources(block, headingRow, slideRows) {
  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-inner';

  // Filter labels come from the authored list; other heading content stays.
  const labels = [];
  if (headingRow) {
    headingRow.querySelectorAll('li').forEach((li) => {
      const label = li.textContent.trim();
      if (label) labels.push(label);
    });
    headingRow.querySelectorAll('ul, ol').forEach((list) => list.remove());
    if (headingRow.textContent.trim()) {
      const heading = document.createElement('div');
      heading.className = 'carousel-heading';
      const cells = [...headingRow.children];
      const source = cells.length === 1 ? cells[0] : headingRow;
      while (source.firstElementChild) heading.append(source.firstElementChild);
      wrapper.append(heading);
    }
  }

  const track = document.createElement('ul');
  track.className = 'carousel-track';
  track.setAttribute('tabindex', '0');
  track.setAttribute('aria-label', 'Resources');

  const categoryCounts = new Map();
  const cards = slideRows.map((row) => {
    const li = document.createElement('li');
    li.className = 'carousel-card';
    moveInstrumentation(row, li);
    const cells = [...row.children];
    const imageCell = cells.find((c) => c.querySelector('picture'));
    const bodyCell = cells.find((c) => c !== imageCell && c.textContent.trim() !== '');

    const img = imageCell && imageCell.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]);
      moveInstrumentation(img, optimized.querySelector('img'));
      li.append(optimized);
    }

    const body = document.createElement('div');
    body.className = 'carousel-card-body';
    if (bodyCell) while (bodyCell.firstChild) body.append(bodyCell.firstChild);

    const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
    const first = body.firstElementChild;
    let category = '';
    if (first && first.tagName === 'P' && first !== heading && !first.querySelector('a')) {
      first.classList.add('carousel-card-eyebrow');
      category = first.textContent.trim();
    }
    const last = body.lastElementChild;
    const cta = last && last.tagName === 'P' && last.querySelector('a[href]');
    if (cta && last !== first && last.textContent.trim() === cta.textContent.trim()) {
      last.className = 'carousel-card-cta';
      cta.classList.add('button');
    }
    li.append(body);
    li.dataset.category = category.toLowerCase();
    if (!img) {
      // No image: CSS paints a solid colour per category; repeat cards of the
      // same category alternate between two shades (.carousel-card-alt).
      li.classList.add('carousel-card-no-image');
      const seen = categoryCounts.get(li.dataset.category) || 0;
      if (seen % 2 === 1) li.classList.add('carousel-card-alt');
      categoryCounts.set(li.dataset.category, seen + 1);
    }
    track.append(li);
    return li;
  });

  // Filter pills.
  let activeFilter = '';
  const filters = document.createElement('div');
  filters.className = 'carousel-filters';
  filters.setAttribute('role', 'group');
  filters.setAttribute('aria-label', 'Filter resources');

  const dots = document.createElement('div');
  dots.className = 'carousel-dots';

  const visibleCards = () => cards.filter((c) => !c.hidden);
  const perView = () => {
    const value = parseInt(getComputedStyle(block).getPropertyValue('--carousel-per-view'), 10);
    return Number.isNaN(value) || value < 1 ? 1 : value;
  };

  const pageFromScroll = () => {
    const width = track.clientWidth || 1;
    return Math.round(track.scrollLeft / width);
  };

  const setActiveDot = (page) => {
    [...dots.children].forEach((dot, di) => {
      dot.classList.toggle('is-active', di === page);
      dot.setAttribute('aria-current', di === page ? 'true' : 'false');
    });
  };

  const goTo = (page) => {
    const target = visibleCards()[page * perView()];
    if (!target) return;
    // track is position: relative, so offsetLeft is measured from its edge
    track.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
    setActiveDot(page);
  };

  const renderDots = () => {
    const pages = Math.ceil(visibleCards().length / perView());
    dots.replaceChildren();
    if (pages > 1) {
      for (let p = 0; p < pages; p += 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Show page ${p + 1} of ${pages}`);
        dot.addEventListener('click', () => goTo(p));
        dots.append(dot);
      }
    }
    setActiveDot(0);
  };

  const applyFilter = (value) => {
    activeFilter = value;
    cards.forEach((card) => {
      card.hidden = !!value && card.dataset.category !== value;
    });
    filters.querySelectorAll('button').forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.filter === value ? 'true' : 'false');
    });
    track.scrollTo({ left: 0 });
    renderDots();
  };

  labels.forEach((label) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'carousel-filter';
    btn.textContent = label;
    btn.dataset.filter = label.toLowerCase();
    btn.setAttribute('aria-pressed', 'false');
    // Clicking the active pill again clears the filter.
    btn.addEventListener('click', () => {
      applyFilter(activeFilter === btn.dataset.filter ? '' : btn.dataset.filter);
    });
    filters.append(btn);
  });

  let scrollTimer;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => setActiveDot(pageFromScroll()), 100);
  });

  ['(width >= 600px)', '(width >= 900px)'].forEach((query) => {
    window.matchMedia(query).addEventListener('change', renderDots);
  });

  if (labels.length) wrapper.append(filters);
  wrapper.append(track, dots);
  block.replaceChildren(wrapper);
  renderDots();
}

/**
 * Decorates the carousel block. One block, three styles via the "Style"
 * dropdown (variant class):
 *   - .carousel.instruments (default) dark thumbnail slider: a large stage with
 *     an overlay panel, and a thumbnail rail flanked by prev/next arrows.
 *   - .carousel.split  a single item rendered as image + text panel (with an
 *     optional specs list).
 *   - .carousel.resources filter pills + 3-up card slider with dot pagination.
 * Authored structure: optional row 0 = heading, rows 1..N = one slide each
 * (image cell + text cell).
 * @param {Element} block
 */
export default function decorate(block) {
  const split = block.classList.contains('split');
  const rows = [...block.children];

  const headingRow = rows[0] && !rows[0].querySelector('picture') ? rows[0] : null;
  const slideRows = rows.filter((r) => r !== headingRow);

  // ---- RESOURCES: filterable 3-up card slider ----
  if (block.classList.contains('resources')) {
    decorateResources(block, headingRow, slideRows);
    return;
  }

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
