import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Dot pagination for a horizontally scrolling card track. Cards per page come
 * from the block's --carousel-per-view custom property (set per breakpoint).
 * @param {Element} block
 * @param {Element} track scrolling list of cards
 * @param {() => Element[]} getCards the currently visible cards
 * @param {{hideWhenSinglePage?: boolean}} [options] hideWhenSinglePage hides
 *   the (empty) dot bar when every card fits in view
 * @returns {{dots: Element, renderDots: () => void}}
 */
function createPager(block, track, getCards, { hideWhenSinglePage = false } = {}) {
  const dots = document.createElement('div');
  dots.className = 'carousel-dots';

  const perView = () => {
    const value = parseInt(getComputedStyle(block).getPropertyValue('--carousel-per-view'), 10);
    return Number.isNaN(value) || value < 1 ? 1 : value;
  };

  const pageFromScroll = () => {
    // a partial last page can never scroll a full width: treat the scroll end as the last page
    const pages = dots.children.length;
    const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
    if (pages > 1 && atEnd) return pages - 1;
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
    const target = getCards()[page * perView()];
    if (!target) return;
    // track is position: relative, so offsetLeft is measured from its edge
    track.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
    setActiveDot(page);
  };

  const renderDots = () => {
    const pages = Math.ceil(getCards().length / perView());
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
    if (hideWhenSinglePage) dots.hidden = pages <= 1;
    setActiveDot(0);
  };

  let scrollTimer;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => setActiveDot(pageFromScroll()), 100);
  });

  ['(width >= 600px)', '(width >= 900px)', '(width >= 1200px)'].forEach((query) => {
    window.matchMedia(query).addEventListener('change', renderDots);
  });

  return { dots, renderDots };
}

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

  const { dots, renderDots } = createPager(block, track, () => cards.filter((c) => !c.hidden));

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

  if (labels.length) wrapper.append(filters);
  wrapper.append(track, dots);
  block.replaceChildren(wrapper);
  renderDots();
}

/**
 * PRODUCTS: related-product card slider (4-up desktop, fewer on smaller
 * screens) with dot pagination and no arrows. Row 0 = optional heading;
 * rows 1..N = one card each: image cell + rich text cell (heading = title,
 * paragraph = description, trailing link paragraph = "Learn more" CTA).
 * The image links to the CTA target so the whole card top is clickable.
 * @param {Element} block
 * @param {Element|null} headingRow
 * @param {Element[]} slideRows
 */
function decorateProducts(block, headingRow, slideRows) {
  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-inner';

  if (headingRow && headingRow.textContent.trim()) {
    const heading = document.createElement('div');
    heading.className = 'carousel-heading';
    const cells = [...headingRow.children];
    const source = cells.length === 1 ? cells[0] : headingRow;
    while (source.firstElementChild) heading.append(source.firstElementChild);
    wrapper.append(heading);
  }

  const track = document.createElement('ul');
  track.className = 'carousel-track';
  track.setAttribute('tabindex', '0');
  track.setAttribute('aria-label', 'Products');

  const cards = slideRows.map((row) => {
    const li = document.createElement('li');
    li.className = 'carousel-card';
    moveInstrumentation(row, li);
    const cells = [...row.children];
    const imageCell = cells.find((c) => c.querySelector('picture'));
    const bodyCell = cells.find((c) => c !== imageCell && c.textContent.trim() !== '');

    const body = document.createElement('div');
    body.className = 'carousel-card-body';
    if (bodyCell) while (bodyCell.firstChild) body.append(bodyCell.firstChild);

    const last = body.lastElementChild;
    const ctaLink = last && last.tagName === 'P' && last.querySelector('a[href]');
    if (ctaLink && last.textContent.trim() === ctaLink.textContent.trim()) {
      last.className = 'carousel-card-cta';
      ctaLink.classList.remove('button');
      last.classList.remove('button-container');
    }
    const href = ctaLink && ctaLink.getAttribute('href');

    const img = imageCell && imageCell.querySelector('img');
    if (img) {
      const media = document.createElement(href ? 'a' : 'div');
      media.className = 'carousel-card-image';
      if (href) {
        // duplicate of the CTA link: keep it out of the tab order and a11y tree
        media.href = href;
        media.tabIndex = -1;
        media.setAttribute('aria-hidden', 'true');
      }
      const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]);
      moveInstrumentation(img, optimized.querySelector('img'));
      media.append(optimized);
      li.append(media);
    }

    li.append(body);
    track.append(li);
    return li;
  });

  const { dots, renderDots } = createPager(block, track, () => cards, { hideWhenSinglePage: true });
  wrapper.append(track, dots);
  block.replaceChildren(wrapper);
  renderDots();
}

const VIDYARD_RE = /(?:play|embed|share)\.vidyard\.com\/(?:watch\/)?([A-Za-z0-9_-]+)/i;

/**
 * GALLERY: product hero. Row 0 (the container "text" field) is the product
 * text panel: H1, intro, variant, notice, CTA and an optional list of in-page
 * jump links. Rows 1..N = one slide each: image cell + text cell. A slide
 * whose text holds a Vidyard link is a video: its image (or the Vidyard
 * poster) shows with a play overlay and the inline player loads on click.
 * Layout: main stage + thumbnail strip on the left, text panel on the right.
 * @param {Element} block
 * @param {Element|null} headingRow
 * @param {Element[]} slideRows
 */
function decorateGallery(block, headingRow, slideRows) {
  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-inner';

  const media = document.createElement('div');
  media.className = 'carousel-gallery';

  const stage = document.createElement('div');
  stage.className = 'carousel-stage';

  const thumbs = document.createElement('div');
  thumbs.className = 'carousel-thumbs';
  thumbs.setAttribute('role', 'group');
  thumbs.setAttribute('aria-label', 'Choose a slide');

  const slides = [];
  slideRows.forEach((row) => {
    const cells = [...row.children];
    const imageCell = cells.find((c) => c.querySelector('picture, img'));
    const textCell = cells.find((c) => c !== imageCell && c.querySelector('a[href]'))
      || cells.find((c) => c !== imageCell && c.textContent.trim() !== '');
    const link = textCell && [...textCell.querySelectorAll('a[href]')]
      .find((a) => VIDYARD_RE.test(a.href));
    const uuid = link ? link.href.match(VIDYARD_RE)[1] : '';
    let img = imageCell && imageCell.querySelector('img');
    if (!img && !uuid) {
      row.remove();
      return;
    }
    const linkText = link ? link.textContent.trim() : '';
    const title = linkText && linkText !== link.href ? linkText : '';

    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    moveInstrumentation(row, slide);

    if (!img) {
      img = document.createElement('img');
      img.src = `https://play.vidyard.com/${uuid}.jpg`;
      img.alt = title;
    }
    const index = slides.length;
    const picture = createOptimizedPicture(img.src, img.alt, index === 0, [{ width: '1200' }]);
    moveInstrumentation(img, picture.querySelector('img'));

    let poster = picture;
    if (uuid) {
      slide.classList.add('carousel-slide-video');
      poster = document.createElement('a');
      poster.className = 'carousel-video-poster';
      poster.href = link.href;
      poster.setAttribute('aria-label', title ? `Play video: ${title}` : 'Play video');
      const play = document.createElement('span');
      play.className = 'carousel-video-play';
      play.setAttribute('aria-hidden', 'true');
      poster.append(picture, play);
      poster.addEventListener('click', (e) => {
        e.preventDefault();
        const iframe = document.createElement('iframe');
        iframe.src = `https://play.vidyard.com/${uuid}?autoplay=1&type=inline&disable_popouts=1`;
        iframe.title = title || 'Video player';
        iframe.allow = 'autoplay; fullscreen; picture-in-picture';
        iframe.className = 'carousel-video-frame';
        poster.replaceWith(iframe);
        iframe.focus();
      });
    }
    slide.append(poster);
    stage.append(slide);

    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'carousel-thumb';
    if (uuid) thumb.classList.add('carousel-thumb-video');
    const thumbImg = document.createElement('img');
    thumbImg.src = img.src;
    thumbImg.alt = '';
    thumbImg.loading = 'lazy';
    thumb.append(thumbImg);
    thumbs.append(thumb);

    slides.push({ slide, thumb, poster });
  });

  const activate = (index) => {
    slides.forEach(({ slide, thumb, poster }, i) => {
      const active = i === index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      thumb.classList.toggle('is-active', active);
      thumb.setAttribute('aria-current', active ? 'true' : 'false');
      // stop a playing video when its slide is left
      const frame = !active && slide.querySelector('.carousel-video-frame');
      if (frame) frame.replaceWith(poster);
    });
  };

  slides.forEach(({ thumb }, i) => {
    const kind = thumb.classList.contains('carousel-thumb-video') ? 'video' : 'image';
    thumb.setAttribute('aria-label', `Show ${kind} ${i + 1} of ${slides.length}`);
    thumb.addEventListener('click', () => activate(i));
  });

  media.append(stage);
  if (slides.length > 1) media.append(thumbs);

  const panel = document.createElement('div');
  panel.className = 'carousel-panel';
  if (headingRow) {
    const cells = [...headingRow.children];
    const source = cells.length === 1 ? cells[0] : headingRow;
    moveInstrumentation(source, panel);
    while (source.firstChild) panel.append(source.firstChild);
    // a list made only of in-page links becomes the jump-link strip
    panel.querySelectorAll(':scope > ul, :scope > ol').forEach((list) => {
      const items = [...list.children];
      const jump = items.length && items.every((li) => {
        const a = li.querySelector('a[href]');
        return a && a.getAttribute('href').startsWith('#');
      });
      if (jump) list.classList.add('carousel-jump-links');
    });
  }

  if (slides.length) wrapper.append(media);
  if (panel.textContent.trim() || panel.querySelector('img')) wrapper.append(panel);
  block.replaceChildren(wrapper);
  if (slides.length) activate(0);
}

// unique ids when several testimonial carousels are on one page
let testimonialCount = 0;

/**
 * TESTIMONIALS: one quote slide at a time in a light grey card, prev/next
 * arrows at the sides, dot pagination below, no autoplay.
 * Row 0 = optional heading (single-cell row, may be empty); rows 1..N = one
 * slide each: optional image cell + rich text cell. In the text: a leading
 * bold-only paragraph = name, a following italic-only paragraph = role, a
 * trailing link-only paragraph = CTA, everything else = the quote.
 * @param {Element} block
 * @param {Element[]} rows
 */
function decorateTestimonials(block, rows) {
  testimonialCount += 1;
  const prefix = `carousel-testimonials-${testimonialCount}`;
  const [first] = rows;
  const headingRow = first && !first.querySelector('picture')
    && (first.textContent.trim() === ''
      || (first.children.length <= 1 && rows.slice(1).some((r) => r.children.length > 1)))
    ? first : null;
  const slideRows = rows.filter((r) => r !== headingRow);

  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-inner';
  wrapper.setAttribute('role', 'region');
  wrapper.setAttribute('aria-roledescription', 'carousel');

  let label = 'Customer testimonials';
  if (headingRow && headingRow.textContent.trim()) {
    const heading = document.createElement('div');
    heading.className = 'carousel-heading';
    const cells = [...headingRow.children];
    const source = cells.length === 1 ? cells[0] : headingRow;
    while (source.firstElementChild) heading.append(source.firstElementChild);
    const h = heading.querySelector('h1, h2, h3, h4, h5, h6');
    if (h) {
      h.id = h.id || `${prefix}-heading`;
      wrapper.setAttribute('aria-labelledby', h.id);
    }
    wrapper.append(heading);
  } else {
    // the section heading right above the block names the carousel, if any
    const prev = (block.parentElement || block).previousElementSibling;
    const h = prev && (prev.matches('h1, h2, h3, h4, h5, h6') ? prev
      : [...prev.querySelectorAll('h1, h2, h3, h4, h5, h6')].pop());
    if (h) label = h.textContent.trim();
  }
  if (!wrapper.hasAttribute('aria-labelledby')) wrapper.setAttribute('aria-label', label);

  const track = document.createElement('div');
  track.className = 'carousel-slides';
  track.setAttribute('aria-live', 'polite');

  const slides = [];
  slideRows.forEach((row) => {
    const cells = [...row.children];
    const imageCell = cells.find((c) => c.querySelector('picture') && c.textContent.trim() === '');
    const textCell = cells.find((c) => c !== imageCell && c.textContent.trim() !== '');
    if (!textCell && !imageCell) return;

    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    moveInstrumentation(row, slide);

    const figure = document.createElement('figure');
    figure.className = 'carousel-testimonial';
    const caption = document.createElement('figcaption');
    caption.className = 'carousel-testimonial-author';
    const quote = document.createElement('blockquote');
    quote.className = 'carousel-testimonial-quote';
    let cta = null;

    if (textCell) {
      const parts = [...textCell.children];
      const onlyChild = (el, tag) => {
        const inner = el && el.tagName === 'P' && el.querySelector(`:scope > ${tag}`);
        return inner && el.textContent.trim() === inner.textContent.trim() && !el.querySelector('a');
      };
      if (onlyChild(parts[0], 'strong')) {
        const name = parts.shift();
        name.className = 'carousel-testimonial-name';
        caption.append(name);
        if (onlyChild(parts[0], 'em')) {
          const role = parts.shift();
          role.className = 'carousel-testimonial-role';
          caption.append(role);
        }
      }
      const last = parts[parts.length - 1];
      const link = last && last.tagName === 'P' && last.querySelector('a[href]');
      if (link && last.textContent.trim() === link.textContent.trim()) {
        cta = parts.pop();
        cta.classList.add('carousel-testimonial-cta');
      }
      parts.forEach((p) => quote.append(p));
    }

    if (caption.children.length) figure.append(caption);
    if (quote.children.length) figure.append(quote);
    if (cta) figure.append(cta);

    const content = document.createElement('div');
    content.className = 'carousel-testimonial-body';
    content.append(figure);
    slide.append(content);

    const img = imageCell && imageCell.querySelector('img');
    if (img) {
      slide.classList.add('carousel-slide-has-image');
      const media = document.createElement('div');
      media.className = 'carousel-testimonial-image';
      const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]);
      moveInstrumentation(img, optimized.querySelector('img'));
      media.append(optimized);
      slide.append(media);
    }

    track.append(slide);
    slides.push(slide);
  });

  if (!slides.length) {
    block.replaceChildren(wrapper);
    return;
  }

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-arrow carousel-arrow-prev';
  prev.setAttribute('aria-label', 'Previous testimonial');
  prev.setAttribute('aria-controls', `${prefix}-slides`);

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-arrow carousel-arrow-next';
  next.setAttribute('aria-label', 'Next testimonial');
  next.setAttribute('aria-controls', `${prefix}-slides`);
  track.id = `${prefix}-slides`;

  const dots = document.createElement('div');
  dots.className = 'carousel-dots';
  dots.setAttribute('role', 'group');
  dots.setAttribute('aria-label', 'Choose a testimonial');

  let active = 0;
  const show = (index) => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.hidden = i !== active;
    });
    [...dots.children].forEach((dot, i) => {
      dot.classList.toggle('is-active', i === active);
      if (i === active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  };

  slides.forEach((slide, i) => {
    slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Show testimonial ${i + 1} of ${slides.length}`);
    dot.addEventListener('click', () => show(i));
    dots.append(dot);
  });

  prev.addEventListener('click', () => show(active - 1));
  next.addEventListener('click', () => show(active + 1));
  // arrow keys move between slides while focus is inside the carousel
  wrapper.addEventListener('keydown', (e) => {
    if (e.target.closest('a, input, textarea, select')) return;
    if (e.key === 'ArrowLeft') show(active - 1);
    else if (e.key === 'ArrowRight') show(active + 1);
  });

  const stage = document.createElement('div');
  stage.className = 'carousel-stage';
  if (slides.length > 1) stage.append(prev, track, next);
  else stage.append(track);
  wrapper.append(stage);
  if (slides.length > 1) wrapper.append(dots);
  block.replaceChildren(wrapper);
  show(0);
}

/**
 * Decorates the carousel block. One block, three styles via the "Style"
 * dropdown (variant class):
 *   - .carousel.instruments (default) dark thumbnail slider: a large stage with
 *     an overlay panel, and a thumbnail rail flanked by prev/next arrows.
 *   - .carousel.split  a single item rendered as image + text panel (with an
 *     optional specs list).
 *   - .carousel.resources filter pills + 3-up card slider with dot pagination.
 *   - .carousel.products 4-up related-product card slider with dot pagination
 *     (dots hidden when every card fits in view).
 *   - .carousel.gallery product hero: main slide + thumbnail strip (images and
 *     inline Vidyard videos) beside the product text panel (row 0).
 *   - .carousel.testimonials one quote slide at a time (name, role, quote,
 *     optional image and CTA) in a grey card, side arrows and dots.
 * Authored structure: optional row 0 = heading, rows 1..N = one slide each
 * (image cell + text cell).
 * @param {Element} block
 */
export default function decorate(block) {
  const split = block.classList.contains('split');
  const rows = [...block.children];

  // ---- TESTIMONIALS: one quote slide at a time, arrows + dots ----
  if (block.classList.contains('testimonials')) {
    decorateTestimonials(block, rows);
    return;
  }

  const headingRow = rows[0] && !rows[0].querySelector('picture') ? rows[0] : null;
  const slideRows = rows.filter((r) => r !== headingRow);

  // ---- RESOURCES: filterable 3-up card slider ----
  if (block.classList.contains('resources')) {
    decorateResources(block, headingRow, slideRows);
    return;
  }

  // ---- PRODUCTS: 4-up related-product card slider ----
  if (block.classList.contains('products')) {
    decorateProducts(block, headingRow, slideRows);
    return;
  }

  // ---- GALLERY: product hero, media gallery + text panel ----
  if (block.classList.contains('gallery')) {
    // row 0 (container text field, no picture) is the product text panel
    decorateGallery(block, headingRow, slideRows);
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
