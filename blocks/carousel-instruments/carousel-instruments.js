import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Featured Instruments carousel.
 * Expected initial structure (one row per slide, 2 cells: image | text):
 *   <div class="carousel-instruments">
 *     <div><div><picture>…</picture></div><div><h.../><p.../></div></div>
 *     …
 *   </div>
 * Renders a single active slide with an overlay text panel, plus a thumbnail
 * row of category/label tabs and prev/next arrows for navigation.
 */
export default function decorate(block) {
  // Capture the tab label/category BEFORE content is moved out of the text
  // cell: the eyebrow (first <p>) is the category, first heading is the label.
  const slides = [...block.children].map((row, index) => {
    const [imageCell, textCell] = row.children;
    const category = textCell?.querySelector('p')?.textContent?.trim() || '';
    const label = textCell?.querySelector('h1,h2,h3,h4,h5,h6')?.textContent?.trim() || `Slide ${index + 1}`;
    return {
      index,
      imageCell,
      textCell,
      category,
      label,
    };
  });

  const container = document.createElement('div');
  container.className = 'carousel-instruments-track';

  const slidesWrap = document.createElement('div');
  slidesWrap.className = 'carousel-instruments-slides';

  slides.forEach((slide) => {
    const li = document.createElement('div');
    li.className = 'carousel-instruments-slide';
    moveInstrumentation(slide.imageCell?.closest('div') || slide.imageCell, li);

    const media = document.createElement('div');
    media.className = 'carousel-instruments-media';
    if (slide.imageCell) {
      while (slide.imageCell.firstChild) media.append(slide.imageCell.firstChild);
    }

    const panel = document.createElement('div');
    panel.className = 'carousel-instruments-panel';
    if (slide.textCell) {
      while (slide.textCell.firstChild) panel.append(slide.textCell.firstChild);
    }

    li.append(media, panel);
    slidesWrap.append(li);
  });

  // optimize images
  slidesWrap.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '2000' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  // thumbnail / tab row
  const nav = document.createElement('div');
  nav.className = 'carousel-instruments-nav';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-instruments-arrow carousel-instruments-prev';
  prev.setAttribute('aria-label', 'Previous slide');
  prev.textContent = '‹';

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-instruments-arrow carousel-instruments-next';
  next.setAttribute('aria-label', 'Next slide');
  next.textContent = '›';

  const tabs = document.createElement('div');
  tabs.className = 'carousel-instruments-tabs';

  slides.forEach((slide) => {
    const { category, label } = slide;
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'carousel-instruments-tab';
    tab.dataset.index = String(slide.index);
    tab.innerHTML = `<span class="carousel-instruments-tab-cat">${category}</span><span class="carousel-instruments-tab-label">${label}</span>`;
    tabs.append(tab);
  });

  nav.append(prev, tabs, next);
  container.append(slidesWrap, nav);
  block.replaceChildren(container);

  let active = 0;
  const slideEls = [...slidesWrap.children];
  const tabEls = [...tabs.children];

  const setActive = (i) => {
    active = (i + slideEls.length) % slideEls.length;
    slideEls.forEach((el, idx) => el.classList.toggle('is-active', idx === active));
    tabEls.forEach((el, idx) => el.classList.toggle('is-active', idx === active));
  };

  prev.addEventListener('click', () => setActive(active - 1));
  next.addEventListener('click', () => setActive(active + 1));
  tabEls.forEach((tab) => {
    tab.addEventListener('click', () => setActive(Number(tab.dataset.index)));
  });

  setActive(0);
}
