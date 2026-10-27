import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const IMAGE_RE = /\.(?:png|jpe?g|webp|gif|avif|svg)$/i;

/**
 * Returns the image link of a link-only paragraph pointing at an image file
 * (link text = alt), or the picture of a picture-only paragraph.
 * @param {Element} el
 * @returns {{link?: HTMLAnchorElement, picture?: Element}|null}
 */
function getImageParagraph(el) {
  if (!el || el.tagName !== 'P') return null;
  const picture = el.querySelector(':scope > picture');
  if (picture && el.textContent.trim() === '' && el.children.length === 1) return { picture };
  const link = el.querySelector(':scope > a[href]');
  if (!link || el.children.length !== 1 || el.textContent.trim() !== link.textContent.trim()) {
    return null;
  }
  try {
    if (IMAGE_RE.test(new URL(link.href).pathname)) return { link };
  } catch { /* not a URL */ }
  return null;
}

/**
 * Builds a picture for an image-file link. Same-origin images go through
 * the media pipeline; external files (e.g. a DAM on another host) are used as-is.
 * @param {HTMLAnchorElement} link
 * @returns {Element}
 */
function pictureFromLink(link) {
  const alt = link.textContent.trim();
  let picture;
  if (new URL(link.href).origin === window.location.origin) {
    picture = createOptimizedPicture(link.href, alt, false, [{ width: '400' }]);
  } else {
    picture = document.createElement('picture');
    const img = document.createElement('img');
    img.src = link.href;
    img.alt = alt;
    img.loading = 'lazy';
    picture.append(img);
  }
  moveInstrumentation(link, picture.querySelector('img'));
  return picture;
}

/**
 * Product items inside a panel. Rich text can't hold images in Universal
 * Editor, so an item is authored as:
 *   image-file link paragraph (link text = alt)
 *   name: heading or paragraph, usually a link to the product
 *   optional short description: a link-free paragraph
 * Consecutive items become one responsive grid (ul). Lone image-file links
 * (no name after them) render as plain images in place.
 * @param {Element} container
 */
function decorateProducts(container) {
  let list = null;
  [...container.children].forEach((el) => {
    if (el.parentElement !== container) return; // already moved into an item
    const image = getImageParagraph(el);
    if (!image) {
      list = null;
      return;
    }
    const name = el.nextElementSibling;
    const isName = name && /^(P|H[2-6])$/.test(name.tagName) && !getImageParagraph(name)
      && name.textContent.trim() !== '';
    const picture = image.picture || pictureFromLink(image.link);
    if (!isName) {
      el.classList.add('accordion-toggle-image');
      el.replaceChildren(picture);
      list = null;
      return;
    }

    const item = document.createElement('li');
    item.className = 'accordion-toggle-product';
    const media = document.createElement('div');
    media.className = 'accordion-toggle-product-image';
    const nameLink = name.querySelector('a[href]');
    if (nameLink) {
      // duplicate of the name link: keep it out of the tab order and a11y tree
      const a = document.createElement('a');
      a.href = nameLink.href;
      a.tabIndex = -1;
      a.setAttribute('aria-hidden', 'true');
      a.append(picture);
      media.append(a);
    } else {
      media.append(picture);
    }
    const desc = name.nextElementSibling;
    name.classList.add('accordion-toggle-product-name');
    item.append(media, name);

    if (desc && desc.tagName === 'P' && !desc.querySelector('a, picture') && desc.textContent.trim()) {
      desc.classList.add('accordion-toggle-product-text');
      item.append(desc);
    }

    if (!list) {
      list = document.createElement('ul');
      list.className = 'accordion-toggle-products';
      el.before(list);
    }
    list.append(item);
    el.remove();
  });
}

/**
 * Decorates the accordion-toggle block: one native <details>/<summary>
 * toggle per row. Closed by default; the "open" option opens every item.
 * Authored structure: one row per item, cells
 *   title (plain text) | content (rich text)
 * @param {Element} block
 */
export default function decorate(block) {
  const open = block.classList.contains('open');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const [titleCell, ...rest] = cells;
    const label = (titleCell?.textContent || '').trim();
    const contentCell = rest.find((c) => c.textContent.trim() !== '' || c.querySelector('img'))
      || rest[0];
    if (!label && !contentCell) {
      row.remove();
      return;
    }

    const details = document.createElement('details');
    details.className = 'accordion-toggle-item';
    moveInstrumentation(row, details);
    if (open) details.open = true;

    const summary = document.createElement('summary');
    summary.className = 'accordion-toggle-title';
    const text = document.createElement('span');
    text.textContent = label;
    if (titleCell) moveInstrumentation(titleCell, text);
    summary.append(text);

    const panel = document.createElement('div');
    panel.className = 'accordion-toggle-panel';
    if (contentCell) {
      moveInstrumentation(contentCell, panel);
      while (contentCell.firstChild) panel.append(contentCell.firstChild);
    }
    decorateProducts(panel);

    details.append(summary, panel);
    row.replaceWith(details);
  });
}
