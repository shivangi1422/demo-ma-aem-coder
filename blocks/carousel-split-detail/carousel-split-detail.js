import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const SHOW_EVENT = 'carousel-split-detail:show';
const ARROW_PATH = 'M9 6l6 6-6 6';

function arrowButton(direction, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `carousel-split-detail-${direction}`;
  button.setAttribute('aria-label', label);
  button.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="${ARROW_PATH}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return button;
}

/**
 * Groups the metric paragraphs (those starting with a bold value, e.g.
 * <p><strong>20+</strong> label</p>) into a metrics row.
 * @param {Element} body slide text cell
 */
function decorateMetrics(body) {
  const metrics = [...body.querySelectorAll(':scope > p')].filter((p) => {
    const first = p.firstElementChild;
    return first && first.tagName === 'STRONG' && p.firstChild === first && p.textContent.trim() !== first.textContent.trim();
  });
  if (!metrics.length) return;
  const row = document.createElement('div');
  row.className = 'carousel-split-detail-metrics';
  metrics[0].before(row);
  metrics.forEach((p) => {
    p.classList.add('carousel-split-detail-metric');
    const strong = p.firstElementChild;
    const value = document.createElement('span');
    value.className = 'carousel-split-detail-metric-value';
    value.append(...strong.childNodes);
    strong.remove();
    const label = document.createElement('span');
    label.className = 'carousel-split-detail-metric-label';
    label.append(...p.childNodes);
    label.textContent = label.textContent.trim();
    p.replaceChildren(value, label);
    row.append(p);
  });
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const slides = [];
  const track = document.createElement('ul');
  track.className = 'carousel-split-detail-slides';

  [...block.children].forEach((row, index) => {
    const li = document.createElement('li');
    li.className = 'carousel-split-detail-slide';
    li.id = `${block.id || 'carousel-split-detail'}-slide-${index + 1}`;
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((cell) => {
      if (cell.querySelector('picture') && !cell.querySelector('h1, h2, h3, h4, ul, ol')) {
        cell.className = 'carousel-split-detail-image';
      } else if (cell.textContent.trim()) {
        cell.className = 'carousel-split-detail-content';
      } else {
        cell.className = 'carousel-split-detail-empty';
      }
    });
    const content = li.querySelector('.carousel-split-detail-content');
    if (content) {
      decorateMetrics(content);
      content.querySelectorAll(':scope > ul, :scope > ol').forEach((list) => list.classList.add('carousel-split-detail-list'));
    }
    // text panel first, image second
    const image = li.querySelector('.carousel-split-detail-image');
    if (image) li.append(image);
    li.setAttribute('role', 'group');
    li.setAttribute('aria-roledescription', 'slide');
    track.append(li);
    slides.push(li);
  });

  track.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    const picture = createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 900px)', width: '1200' }, { width: '750' }]);
    moveInstrumentation(img, picture.querySelector('img'));
    img.closest('picture').replaceWith(picture);
  });

  const titleOf = (slide, i) => slide.querySelector('h1, h2, h3, h4')?.textContent.trim() || `Slide ${i + 1}`;
  slides.forEach((slide, i) => slide.setAttribute('aria-label', `${i + 1} of ${slides.length}: ${titleOf(slide, i)}`));

  const controls = document.createElement('div');
  controls.className = 'carousel-split-detail-controls';
  const prev = arrowButton('prev', 'Previous slide');
  const next = arrowButton('next', 'Next slide');
  const dots = document.createElement('div');
  dots.className = 'carousel-split-detail-dots';
  slides.forEach((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-split-detail-dot';
    dot.setAttribute('aria-label', `Show slide ${i + 1}: ${titleOf(slide, i)}`);
    dot.setAttribute('aria-controls', slide.id);
    dots.append(dot);
  });
  controls.append(prev, dots, next);

  const live = document.createElement('div');
  live.className = 'carousel-split-detail-live';
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('aria-atomic', 'true');

  const viewport = document.createElement('div');
  viewport.className = 'carousel-split-detail-viewport';
  viewport.append(track);

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  if (!block.hasAttribute('aria-label')) block.setAttribute('aria-label', 'Capability details');
  block.replaceChildren(controls, viewport, live);

  if (slides.length < 2) controls.hidden = true;

  let current = 0;
  // the card takes the height of the visible slide (as on the source)
  const syncHeight = () => {
    const height = slides[current]?.offsetHeight;
    if (height) viewport.style.height = `${height}px`;
  };
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(syncHeight);
    slides.forEach((slide) => observer.observe(slide));
  }

  const show = (index, { announce = true } = {}) => {
    if (!slides.length) return;
    current = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    syncHeight();
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      slide.querySelectorAll('a, button, input, select, textarea').forEach((el) => {
        if (active) el.removeAttribute('tabindex');
        else el.setAttribute('tabindex', '-1');
      });
    });
    [...dots.children].forEach((dot, i) => {
      dot.classList.toggle('is-active', i === current);
      dot.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
    if (announce) live.textContent = `Slide ${current + 1} of ${slides.length}: ${titleOf(slides[current], current)}`;
  };

  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  [...dots.children].forEach((dot, i) => dot.addEventListener('click', () => show(i)));
  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    else if (e.key === 'ArrowRight') show(current + 1);
  });

  // opened from another block (e.g. cards-capability "Learn More")
  block.addEventListener(SHOW_EVENT, (e) => {
    const { index = 0, focus = false } = e.detail || {};
    show(index);
    if (focus) {
      block.scrollIntoView({ behavior: 'smooth', block: 'center' });
      slides[current]?.querySelector('h1, h2, h3, h4')?.setAttribute('tabindex', '-1');
      slides[current]?.querySelector('h1, h2, h3, h4')?.focus({ preventScroll: true });
    }
  });

  // Universal Editor: reveal the slide being edited
  block.addEventListener('aue:ui-select', (e) => {
    const slide = slides.findIndex((s) => s.contains(e.target) || s === e.target);
    if (slide >= 0) show(slide, { announce: false });
  });

  show(0, { announce: false });
}
