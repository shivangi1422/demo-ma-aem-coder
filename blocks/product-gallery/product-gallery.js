import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Opens an image full size in a modal dialog (shared by all slides).
 * @returns {{ open: (img: HTMLImageElement) => void, dialog: HTMLDialogElement }}
 */
function buildLightbox() {
  const dialog = document.createElement('dialog');
  dialog.className = 'product-gallery-lightbox';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'product-gallery-lightbox-close';
  close.setAttribute('aria-label', 'Close');
  close.textContent = '×';
  close.addEventListener('click', () => dialog.close());
  const large = document.createElement('img');
  large.alt = '';
  dialog.append(close, large);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  return {
    dialog,
    open(img) {
      large.src = img.currentSrc || img.src;
      large.alt = img.alt;
      dialog.setAttribute('aria-label', img.alt || 'Product image');
      dialog.showModal();
    },
  };
}

/**
 * Decorates the product-gallery block: one row per image. Shows one image at a time
 * with previous/next arrows and a strip of thumbnails; clicking an image enlarges it.
 * Inside a product-hero it fills the hero's image column.
 * @param {Element} block
 */
export default function decorate(block) {
  const slides = [];
  const thumbs = document.createElement('ul');
  thumbs.className = 'product-gallery-thumbs';
  const track = document.createElement('div');
  track.className = 'product-gallery-track';
  const lightbox = buildLightbox();

  [...block.children].forEach((row) => {
    const picture = row.querySelector('picture') || row.querySelector('img');
    if (!picture) return;
    const img = picture.tagName === 'IMG' ? picture : picture.querySelector('img');
    const i = slides.length;

    const slide = document.createElement('div');
    slide.className = 'product-gallery-slide';
    moveInstrumentation(row, slide);
    const zoom = document.createElement('button');
    zoom.type = 'button';
    zoom.className = 'product-gallery-zoom';
    zoom.setAttribute('aria-label', `Enlarge image${img.alt ? `: ${img.alt}` : ''}`);
    zoom.setAttribute('aria-haspopup', 'dialog');
    zoom.append(picture);
    zoom.addEventListener('click', () => lightbox.open(img));
    slide.append(zoom);
    track.append(slide);

    const li = document.createElement('li');
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'product-gallery-thumb';
    thumb.setAttribute('aria-label', `Show image ${i + 1}${img.alt ? `: ${img.alt}` : ''}`);
    const mini = document.createElement('img');
    mini.src = img.currentSrc || img.src;
    mini.alt = '';
    mini.loading = 'lazy';
    thumb.append(mini);
    li.append(thumb);
    thumbs.append(li);
    slides.push({ slide, thumb });
  });

  const viewport = document.createElement('div');
  viewport.className = 'product-gallery-viewport';
  viewport.append(track);

  const arrow = (dir, label) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `product-gallery-${dir}`;
    b.setAttribute('aria-label', label);
    return b;
  };
  const prev = arrow('prev', 'Previous image');
  const next = arrow('next', 'Next image');

  let index = 0;
  const show = (n) => {
    index = Math.min(Math.max(n, 0), slides.length - 1);
    track.style.transform = `translateX(${-100 * index}%)`;
    slides.forEach(({ slide, thumb }, i) => {
      slide.inert = i !== index;
      slide.setAttribute('aria-hidden', i !== index);
      if (i === index) thumb.setAttribute('aria-current', 'true');
      else thumb.removeAttribute('aria-current');
    });
    prev.disabled = index === 0;
    next.disabled = index === slides.length - 1;
  };
  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  slides.forEach(({ thumb }, i) => thumb.addEventListener('click', () => show(i)));

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'Product images');
  const stage = document.createElement('div');
  stage.className = 'product-gallery-stage';
  stage.append(viewport);
  if (slides.length > 1) stage.append(prev, next);
  block.replaceChildren(stage);
  if (slides.length > 1) block.append(thumbs);
  block.append(lightbox.dialog);
  show(0);
}
