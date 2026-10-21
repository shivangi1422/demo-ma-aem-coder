import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const BADGE_WORDS = ['new', 'updated', 'featured'];

function isVideoUrl(href = '') {
  return /vidyard\.com|youtube\.com|youtu\.be|vimeo\.com|\.mp4(\?|$)/i.test(href);
}

/**
 * Builds the media (left) column: optimized picture, optionally wrapped in
 * the authored link (video poster links get a play affordance).
 * @param {Element} cell image cell
 * @param {string} [fallbackLabel] accessible label when the image has no alt
 * @param {boolean} [isLcp] load eagerly with high priority (LCP candidate)
 * @returns {Element|null}
 */
function buildMedia(cell, fallbackLabel = '', isLcp = false) {
  if (!cell) return null;
  const media = document.createElement('div');
  media.className = 'cards-media-list-media';

  const img = cell.querySelector('img');
  let picture = null;
  if (img) {
    picture = createOptimizedPicture(img.src, img.alt, isLcp, [{ width: '450' }]);
    const optimized = picture.querySelector('img');
    if (isLcp) optimized.setAttribute('fetchpriority', 'high');
    moveInstrumentation(img, optimized);
  }

  const link = cell.querySelector('a[href]');
  if (link) {
    const a = document.createElement('a');
    a.href = link.href;
    // ignore titles that only echo the URL (auto-added by decorateButtons)
    const linkText = link.textContent.trim();
    if (link.title && link.title !== linkText && link.title !== link.href) a.title = link.title;
    moveInstrumentation(link, a);
    if (picture) a.append(picture);
    if (isVideoUrl(link.href)) {
      media.classList.add('cards-media-list-video');
      const label = (img && img.alt) || fallbackLabel || linkText;
      a.setAttribute('aria-label', label ? `Play video: ${label}` : 'Play video');
      const play = document.createElement('span');
      play.className = 'cards-media-list-play';
      play.setAttribute('aria-hidden', 'true');
      a.append(play);
    }
    media.append(a);
  } else if (picture) {
    media.append(picture);
  }

  return media.childElementCount ? media : null;
}

/**
 * Builds the body (right) column: badge, eyebrow, title, description, CTA.
 * @param {Element} cell text cell
 * @param {Element|null} media media column (receives the badge)
 * @returns {Element}
 */
function buildBody(cell, media) {
  const body = document.createElement('div');
  body.className = 'cards-media-list-body';
  if (!cell) return body;
  moveInstrumentation(cell, body);
  while (cell.firstChild) body.append(cell.firstChild);

  const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) heading.classList.add('cards-media-list-title');

  // Short paragraphs before the heading are the badge / eyebrow.
  const lead = [];
  if (heading) {
    let el = heading.previousElementSibling;
    while (el) {
      if (el.tagName === 'P') lead.unshift(el);
      el = el.previousElementSibling;
    }
  }
  // Badge: first lead paragraph when it is a known badge word, or when two
  // lead paragraphs exist (badge + eyebrow). Remaining lead = eyebrow.
  const first = lead[0];
  const firstText = first ? first.textContent.trim() : '';
  if (first && (lead.length > 1 || BADGE_WORDS.includes(firstText.toLowerCase()))) {
    const badge = document.createElement('span');
    badge.className = 'cards-media-list-badge';
    badge.textContent = firstText;
    (media || body).prepend(badge);
    first.remove();
    lead.shift();
  }
  lead.forEach((p) => p.classList.add('cards-media-list-eyebrow'));

  // A trailing paragraph holding only a link is the CTA.
  const paragraphs = [...body.querySelectorAll(':scope > p')];
  const last = paragraphs[paragraphs.length - 1];
  const lastLink = last && last.querySelector('a');
  if (lastLink && last.textContent.trim() === lastLink.textContent.trim()
    && !last.classList.contains('cards-media-list-eyebrow')) {
    last.classList.add('cards-media-list-cta');
    last.classList.remove('button-container');
    lastLink.classList.remove('button', 'primary', 'secondary');
  }

  paragraphs
    .filter((p) => !p.className)
    .forEach((p) => p.classList.add('cards-media-list-description'));

  return body;
}

/**
 * Decorates the cards-media-list block: a vertical list of horizontal rows,
 * media (image / video poster) left and text right.
 * Authored structure: one row per item, cell 1 = image (+ optional link),
 * cell 2 = rich text (optional badge, eyebrow, heading, description, CTA).
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  // the first image of the first list on the page is the likely LCP element
  let lcpPending = block === document.querySelector('.cards-media-list');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-media-list-item';
    moveInstrumentation(row, li);

    const cells = [...row.children];
    const mediaCell = cells.find((c) => c.querySelector('picture, img'));
    const textCell = cells.find((c) => c !== mediaCell && c.textContent.trim() !== '');

    const headingText = textCell?.querySelector('h1, h2, h3, h4, h5, h6')?.textContent.trim();
    const media = buildMedia(mediaCell, headingText, lcpPending && !!mediaCell);
    if (mediaCell) lcpPending = false;
    const body = buildBody(textCell, media);
    if (media) li.append(media);
    else li.classList.add('cards-media-list-no-media');
    li.append(body);
    ul.append(li);
  });
  block.replaceChildren(ul);
}
