import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// unique ids when several workflow blocks are on one page
let blockCount = 0;

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
 * Picture for an image-file link: same-origin files go through the media
 * pipeline, external files (e.g. a DAM on another host) are used as-is.
 * @param {HTMLAnchorElement} link
 * @returns {Element}
 */
function pictureFromLink(link) {
  const alt = link.textContent.trim();
  let picture;
  if (new URL(link.href).origin === window.location.origin) {
    picture = createOptimizedPicture(link.href, alt, false, [{ width: '300' }]);
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
 * Product thumbnails in a panel. Rich text can't hold images in Universal
 * Editor, so each product is an image-file link paragraph (link text = alt)
 * followed by the product name (paragraph or heading, usually linked).
 * Consecutive products become one grid (ul); the name sits under the image.
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
    const picture = image.picture || pictureFromLink(image.link);
    const name = el.nextElementSibling;
    const isName = name && /^(P|H[2-6])$/.test(name.tagName) && !getImageParagraph(name)
      && name.textContent.trim() !== '';
    if (!isName) {
      el.classList.add('tabs-workflow-image');
      el.replaceChildren(picture);
      list = null;
      return;
    }

    const item = document.createElement('li');
    item.className = 'tabs-workflow-product';
    const media = document.createElement('div');
    media.className = 'tabs-workflow-product-image';
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
    name.classList.add('tabs-workflow-product-name');
    item.append(media, name);

    if (!list) {
      list = document.createElement('ul');
      list.className = 'tabs-workflow-products';
      el.before(list);
    }
    list.append(item);
    el.remove();
  });
}

/**
 * Decorates the tabs-workflow block: a process stepper of chevron-shaped
 * stage tabs (ARIA tablist) over one panel per stage.
 * Authored structure: one row per stage, cells
 *   title (plain text) | image (optional) | text (rich text)
 * In the text: a lead paragraph directly followed by an ordered list is the
 * stage subtitle (shown in the stage button); the ordered list renders as a
 * row of step chevrons; image-file link + name paragraphs are product
 * thumbnails. A stage with no text and no image is shown disabled.
 * @param {Element} block
 */
export default function decorate(block) {
  blockCount += 1;
  const prefix = `tabs-workflow-${blockCount}`;
  const rows = [...block.children];

  const tablist = document.createElement('div');
  tablist.className = 'tabs-workflow-list';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Workflow stages');

  const panels = document.createElement('div');
  panels.className = 'tabs-workflow-panels';

  const stages = [];

  rows.forEach((row, i) => {
    const cells = [...row.children];
    const titleCell = cells[0];
    const imageCell = cells.slice(1).find((c) => c.querySelector('picture')
      && c.textContent.trim() === '');
    const textCell = cells.slice(1).find((c) => c !== imageCell && c.textContent.trim() !== '');
    const label = (titleCell?.textContent || '').trim();
    if (!label && !textCell && !imageCell) return;
    const id = `${prefix}-panel-${i + 1}`;
    const disabled = !textCell && !imageCell;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-workflow-tab';
    tab.id = `${id}-tab`;
    tab.setAttribute('role', 'tab');
    tab.tabIndex = -1;
    const tabLabel = document.createElement('span');
    tabLabel.className = 'tabs-workflow-tab-title';
    tabLabel.textContent = label || `Stage ${i + 1}`;
    tab.append(tabLabel);
    tablist.append(tab);

    if (disabled) {
      tab.setAttribute('aria-disabled', 'true');
      tab.setAttribute('aria-selected', 'false');
      moveInstrumentation(row, tab);
      stages.push({ tab, panel: null });
      return;
    }

    const panel = document.createElement('div');
    panel.className = 'tabs-workflow-panel';
    panel.id = id;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    panel.hidden = true;
    tab.setAttribute('aria-controls', id);
    moveInstrumentation(row, panel);

    const img = imageCell && imageCell.querySelector('img');
    if (img) {
      const media = document.createElement('div');
      media.className = 'tabs-workflow-image';
      const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
      moveInstrumentation(img, optimized.querySelector('img'));
      media.append(optimized);
      panel.append(media);
    }

    const text = document.createElement('div');
    text.className = 'tabs-workflow-text';
    if (textCell) {
      moveInstrumentation(textCell, text);
      while (textCell.firstChild) text.append(textCell.firstChild);
    }

    // lead paragraph + step list: the paragraph is the stage subtitle
    const first = text.firstElementChild;
    if (first && first.tagName === 'P' && first.nextElementSibling?.tagName === 'OL'
      && !first.querySelector('a, picture')) {
      const subtitle = document.createElement('span');
      subtitle.className = 'tabs-workflow-tab-subtitle';
      subtitle.id = `${id}-subtitle`;
      subtitle.textContent = first.textContent.trim();
      tab.append(subtitle);
      tab.setAttribute('aria-describedby', subtitle.id);
      tab.classList.add('tabs-workflow-tab-has-subtitle');
      first.remove();
    }
    text.querySelectorAll(':scope > ol').forEach((ol) => ol.classList.add('tabs-workflow-steps'));
    decorateProducts(text);
    panel.append(text);

    panels.append(panel);
    stages.push({ tab, panel });
  });

  const enabled = stages.filter((s) => s.panel);
  if (!stages.length) {
    block.replaceChildren();
    return;
  }

  const activate = (stage, focus = false) => {
    enabled.forEach((s) => {
      const selected = s === stage;
      s.tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      s.tab.tabIndex = selected ? 0 : -1;
      s.panel.hidden = !selected;
    });
    if (focus) stage.tab.focus();
  };

  enabled.forEach((stage) => {
    stage.tab.addEventListener('click', () => activate(stage));
  });

  // ARIA tabs keyboard pattern over the selectable stages
  tablist.addEventListener('keydown', (e) => {
    const current = enabled.findIndex((s) => s.tab === document.activeElement);
    if (current < 0) return;
    let next;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (current + 1) % enabled.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      next = (current - 1 + enabled.length) % enabled.length;
    } else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = enabled.length - 1;
    else return;
    e.preventDefault();
    activate(enabled[next], true);
  });

  block.replaceChildren(tablist, panels);
  if (enabled.length) activate(enabled[0]);
}
