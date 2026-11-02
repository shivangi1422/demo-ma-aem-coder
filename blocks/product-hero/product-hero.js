import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Opens the product image full size in a modal dialog.
 * @param {HTMLImageElement} img
 * @returns {HTMLDialogElement}
 */
function buildLightbox(img) {
  const dialog = document.createElement('dialog');
  dialog.className = 'product-hero-lightbox';
  dialog.setAttribute('aria-label', img.alt || 'Product image');

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'product-hero-lightbox-close';
  close.setAttribute('aria-label', 'Close');
  close.textContent = '×';
  close.addEventListener('click', () => dialog.close());

  const large = document.createElement('img');
  large.src = img.currentSrc || img.src;
  large.alt = img.alt;
  large.loading = 'lazy';

  dialog.append(close, large);
  // a click on the backdrop (outside the image) closes the dialog
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  return dialog;
}

/**
 * Groups the button paragraphs (decorated by decorateButtons) into one row.
 * @param {Element} content
 */
function groupButtons(content) {
  const wrappers = [...content.querySelectorAll(':scope > p.button-wrapper')];
  if (!wrappers.length) return;
  const row = document.createElement('div');
  row.className = 'product-hero-buttons';
  wrappers[0].before(row);
  row.append(...wrappers);
}

/**
 * Decorates the product-hero block. Rows: product image | title, description and
 * buttons | resources and tools (heading line + list of links).
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const imageRow = rows.find((row) => row.querySelector('picture, img'));
  const textRow = rows.find((row) => row !== imageRow && row.querySelector('h1, h2'))
    || rows.find((row) => row !== imageRow);
  const resourcesRow = rows.find((row) => row !== imageRow && row !== textRow
    && row.querySelector('a'));

  const content = document.createElement('div');
  content.className = 'product-hero-content';
  if (textRow) {
    const cell = textRow.firstElementChild || textRow;
    moveInstrumentation(textRow, content);
    content.append(...cell.childNodes);
    groupButtons(content);
  }

  if (resourcesRow) {
    const resources = document.createElement('div');
    resources.className = 'product-hero-resources';
    moveInstrumentation(resourcesRow, resources);
    const cell = resourcesRow.firstElementChild || resourcesRow;
    resources.append(...cell.childNodes);
    const heading = resources.querySelector(':scope > p, :scope > h2, :scope > h3');
    if (heading) heading.classList.add('product-hero-resources-title');
    content.append(resources);
  }

  const children = [content];
  if (imageRow) {
    const media = document.createElement('div');
    media.className = 'product-hero-media';
    moveInstrumentation(imageRow, media);
    const picture = imageRow.querySelector('picture') || imageRow.querySelector('img');
    const img = picture.tagName === 'IMG' ? picture : picture.querySelector('img');
    const zoom = document.createElement('button');
    zoom.type = 'button';
    zoom.className = 'product-hero-zoom';
    zoom.setAttribute('aria-label', `Enlarge image${img.alt ? `: ${img.alt}` : ''}`);
    zoom.setAttribute('aria-haspopup', 'dialog');
    zoom.append(picture);
    media.append(zoom);

    let lightbox;
    zoom.addEventListener('click', () => {
      if (!lightbox) {
        lightbox = buildLightbox(img);
        block.append(lightbox);
      }
      lightbox.showModal();
    });
    children.push(media);
  }

  block.replaceChildren(...children);
}
