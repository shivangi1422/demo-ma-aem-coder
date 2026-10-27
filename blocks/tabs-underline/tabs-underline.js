import { createOptimizedPicture, toClassName } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// unique ids when several tab blocks are on one page
let blockCount = 0;

const VIDYARD_RE = /(?:play|embed|share)\.vidyard\.com\/(?:watch\/)?([A-Za-z0-9_-]+)/i;

const IMAGE_RE = /\.(?:png|jpe?g|webp|gif|avif|svg)$/i;

/**
 * Universal Editor rich text can't hold images, so extra panel images are
 * authored as link-only paragraphs to the image file (link text = alt).
 * Render those as pictures in place.
 * @param {Element} container panel text
 */
function decorateImageLinks(container) {
  container.querySelectorAll('p > a[href]').forEach((link) => {
    const para = link.parentElement;
    let url;
    try { url = new URL(link.href); } catch { return; }
    if (!IMAGE_RE.test(url.pathname) || para.textContent.trim() !== link.textContent.trim()) return;
    const picture = createOptimizedPicture(link.href, link.textContent.trim(), false, [{ width: '1200' }]);
    moveInstrumentation(link, picture.querySelector('img'));
    para.classList.add('tabs-underline-image');
    para.replaceChildren(picture);
  });
}

/**
 * Turns link-only paragraphs pointing at Vidyard into a poster with a play
 * overlay; clicking swaps in the inline player. An image-only paragraph
 * right before the link is used as the poster (else the Vidyard thumbnail).
 * @param {Element} container panel text
 */
function decorateVideos(container) {
  container.querySelectorAll('a[href]').forEach((link) => {
    const match = link.href.match(VIDYARD_RE);
    const para = link.closest('p');
    if (!match || !para || para.textContent.trim() !== link.textContent.trim()) return;
    const [, uuid] = match;
    const linkText = link.textContent.trim();
    const title = linkText && linkText !== link.href ? linkText : '';

    const poster = document.createElement('a');
    poster.className = 'tabs-underline-video-poster';
    poster.href = link.href;
    poster.setAttribute('aria-label', title ? `Play video: ${title}` : 'Play video');
    moveInstrumentation(link, poster);

    const prev = para.previousElementSibling;
    const prevImg = prev && prev.tagName === 'P' && prev.textContent.trim() === ''
      ? prev.querySelector('img') : null;
    const img = document.createElement('img');
    img.src = prevImg ? prevImg.src : `https://play.vidyard.com/${uuid}.jpg`;
    img.alt = (prevImg && prevImg.alt) || title;
    img.loading = 'lazy';
    if (prevImg) prev.remove();
    const play = document.createElement('span');
    play.className = 'tabs-underline-video-play';
    play.setAttribute('aria-hidden', 'true');
    poster.append(img, play);

    const video = document.createElement('div');
    video.className = 'tabs-underline-video';
    video.append(poster);
    para.replaceWith(video);

    poster.addEventListener('click', (e) => {
      e.preventDefault();
      const iframe = document.createElement('iframe');
      iframe.src = `https://play.vidyard.com/${uuid}?autoplay=1&type=inline&disable_popouts=1`;
      iframe.title = title || 'Video player';
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.className = 'tabs-underline-video-frame';
      poster.replaceWith(iframe);
      iframe.focus();
    });
  });
}

/**
 * Decorates the tabs-underline block: a horizontal tab bar with an underlined
 * active tab (a "Filter By" select on small screens) and one panel per tab.
 * Authored structure: one row per tab item with the cells
 *   title (plain text) | image (optional) | text (rich text)
 * The image, when present, is laid out beside the text on desktop.
 * Panels: Vidyard links play inline; tables without images get data-table
 * styling. A URL hash (or in-page link) matching the slug of a tab title,
 * e.g. #specifications, activates that tab and scrolls to the block.
 * @param {Element} block
 */
export default function decorate(block) {
  blockCount += 1;
  const prefix = `tabs-underline-${blockCount}`;
  const rows = [...block.children];

  const tablist = document.createElement('div');
  tablist.className = 'tabs-underline-list';
  tablist.setAttribute('role', 'tablist');

  const filter = document.createElement('div');
  filter.className = 'tabs-underline-filter';
  const filterLabel = document.createElement('label');
  filterLabel.htmlFor = `${prefix}-filter`;
  filterLabel.textContent = 'Filter By';
  const select = document.createElement('select');
  select.id = `${prefix}-filter`;
  filter.append(filterLabel, select);

  const panels = document.createElement('div');
  panels.className = 'tabs-underline-panels';

  const tabs = [];
  const panelEls = [];

  const activate = (index, focus = false) => {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
      panelEls[i].hidden = !selected;
    });
    select.value = String(index);
    if (focus) tabs[index].focus();
  };

  rows.forEach((row, i) => {
    const cells = [...row.children];
    const titleCell = cells[0];
    // image field = a cell holding only a picture (the text cell may hold image tables)
    const imageCell = cells.slice(1).find((c) => c.querySelector('picture')
      && c.textContent.trim() === '' && !c.querySelector('table'));
    const textCell = cells.slice(1).find((c) => c !== imageCell && c.textContent.trim() !== '');
    const label = (titleCell?.textContent || '').trim() || `Tab ${i + 1}`;
    const id = `${prefix}-panel-${i + 1}`;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-underline-tab';
    tab.id = `${id}-tab`;
    tab.textContent = label;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', id);
    tab.addEventListener('click', () => activate(i));
    tabs.push(tab);
    tablist.append(tab);

    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = label;
    select.append(option);

    const panel = document.createElement('div');
    panel.className = 'tabs-underline-panel';
    panel.id = id;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    moveInstrumentation(row, panel);

    const img = imageCell && imageCell.querySelector('img');
    if (img) {
      panel.classList.add('tabs-underline-panel-has-image');
      const media = document.createElement('div');
      media.className = 'tabs-underline-image';
      const optimized = createOptimizedPicture(img.src, img.alt, false, [{ media: '(width >= 900px)', width: '1000' }, { width: '750' }]);
      moveInstrumentation(img, optimized.querySelector('img'));
      media.append(optimized);
      panel.append(media);
    }

    const text = document.createElement('div');
    text.className = 'tabs-underline-text';
    if (textCell) {
      moveInstrumentation(textCell, text);
      while (textCell.firstChild) text.append(textCell.firstChild);
    }
    decorateVideos(text);
    decorateImageLinks(text);
    text.querySelectorAll('table').forEach((table) => {
      if (!table.querySelector('img, picture')) table.classList.add('tabs-underline-data-table');
    });
    panel.append(text);

    panelEls.push(panel);
    panels.append(panel);
  });

  if (!tabs.length) {
    block.replaceChildren();
    return;
  }

  // ARIA tabs keyboard pattern: arrows move between tabs, Home/End jump.
  tablist.addEventListener('keydown', (e) => {
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    let next;
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    activate(next, true);
  });

  select.addEventListener('change', () => activate(parseInt(select.value, 10)));

  block.replaceChildren(tablist, filter, panels);

  // #slug of a tab title -> that tab
  const slugs = tabs.map((tab) => toClassName(tab.textContent));
  const activateFromHash = (hash, scroll = true) => {
    const index = slugs.indexOf(decodeURIComponent((hash || '').replace(/^#/, '')).toLowerCase());
    if (index < 0) return false;
    activate(index);
    if (scroll) block.scrollIntoView({ block: 'start' });
    return true;
  };

  // initial hash: scroll here unless the page already scrolls to an element with that id
  const initialHash = window.location.hash;
  const hasTarget = initialHash.length > 1 && !!document.getElementById(initialHash.slice(1));
  if (!activateFromHash(initialHash, !hasTarget)) activate(0);
  window.addEventListener('hashchange', () => activateFromHash(window.location.hash));
  // re-clicking a jump link whose hash is already current fires no hashchange
  document.addEventListener('click', (e) => {
    const link = e.target.closest && e.target.closest('a[href^="#"]');
    if (link && link.getAttribute('href') === window.location.hash) {
      if (activateFromHash(link.getAttribute('href'))) e.preventDefault();
    }
  });
}
