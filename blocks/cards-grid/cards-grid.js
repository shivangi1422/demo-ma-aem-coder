import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const VIDYARD_RE = /(?:play|embed|share)\.vidyard\.com\/(?:watch\/)?([A-Za-z0-9_-]+)/i;

function isVideoUrl(href = '') {
  return VIDYARD_RE.test(href) || /youtube\.com|youtu\.be|vimeo\.com|\.mp4(\?|$)/i.test(href);
}

/**
 * True for a single-cell row that is a container field (not an authored item):
 * it has no UE item instrumentation and holds no text.
 * @param {Element} row
 */
function optimize(img, width, eager = false) {
  const picture = createOptimizedPicture(img.src, img.alt, eager, [{ width }]);
  moveInstrumentation(img, picture.querySelector('img'));
  return picture;
}

function buildHeading(headingRow) {
  if (!headingRow) return null;
  const heading = document.createElement('div');
  heading.className = 'cards-grid-heading';
  const cells = [...headingRow.children];
  const source = cells.length === 1 ? cells[0] : headingRow;
  while (source.firstElementChild) heading.append(source.firstElementChild);
  // Drop wrappers emptied by moving the background picture out.
  heading.querySelectorAll(':scope > p').forEach((p) => {
    if (!p.children.length && p.textContent.trim() === '') p.remove();
    else if (p.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > p')) p.replaceWith(...p.childNodes);
  });
  return heading.textContent.trim() ? heading : null;
}

/**
 * VIDEO: 3-up grid of 16:9 posters. Each row = poster image + a link to the
 * video (link text = video title, used as the accessible label). Vidyard
 * links inline the player on click; other links open normally.
 */
function decorateVideo(block, rows) {
  const headingRow = rows[0] && !rows[0].querySelector('picture, a[href]') ? rows[0] : null;
  const ul = document.createElement('ul');
  rows.filter((r) => r !== headingRow).forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const img = row.querySelector('img');
    const link = row.querySelector('a[href]');
    const title = (link && link.textContent.trim()) || (img && img.alt) || '';

    const media = document.createElement(link ? 'a' : 'div');
    media.className = 'cards-grid-video-poster';
    if (img) media.append(optimize(img, '750'));
    if (link) {
      media.href = link.href;
      moveInstrumentation(link, media);
      if (isVideoUrl(link.href)) {
        media.setAttribute('aria-label', title ? `Play video: ${title}` : 'Play video');
        const play = document.createElement('span');
        play.className = 'cards-grid-video-play';
        play.setAttribute('aria-hidden', 'true');
        media.append(play);
      }
      const match = link.href.match(VIDYARD_RE);
      if (match) {
        media.addEventListener('click', (e) => {
          e.preventDefault();
          const iframe = document.createElement('iframe');
          iframe.src = `https://play.vidyard.com/${match[1]}?autoplay=1&type=inline&disable_popouts=1`;
          iframe.title = title || 'Video player';
          iframe.allow = 'autoplay; fullscreen; picture-in-picture';
          iframe.className = 'cards-grid-video-frame';
          media.replaceWith(iframe);
          iframe.focus();
        });
      }
    }
    li.append(media);

    if (title) {
      const caption = document.createElement('p');
      caption.className = 'cards-grid-video-title';
      caption.textContent = title;
      li.append(caption);
    }
    ul.append(li);
  });

  const heading = buildHeading(headingRow);
  block.replaceChildren(...(heading ? [heading, ul] : [ul]));
}

/**
 * SHOWCASE: white cards over a full-bleed background image. Row 0 is always
 * the heading row (optional heading/subheading); the background comes from
 * the section's "background" metadata.
 * Cards: optional image + text (title, description, "Learn more" link).
 */
function decorateShowcase(block, rows) {
  const headingRow = rows[0] || null;
  const bgImg = headingRow && headingRow.querySelector('img');
  // the background is authored on the section ("Background Image" property)
  const sectionBg = block.closest('.section')?.dataset.background;

  const children = [];
  if (bgImg || sectionBg) {
    const bg = document.createElement('div');
    bg.className = 'cards-grid-background';
    const picture = bgImg
      ? optimize(bgImg, '2000')
      : createOptimizedPicture(sectionBg, '', false, [{ width: '2000' }]);
    picture.querySelector('img').alt = '';
    bg.append(picture);
    if (bgImg) {
      bgImg.closest('picture')?.remove();
      bgImg.remove();
    }
    children.push(bg);
  }

  const heading = buildHeading(headingRow);
  if (heading) children.push(heading);

  const ul = document.createElement('ul');
  rows.filter((r) => r !== headingRow).forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    [...row.children].forEach((cell) => {
      const img = cell.querySelector('img');
      if (img && cell.textContent.trim() === '') {
        const image = document.createElement('div');
        image.className = 'cards-grid-image';
        image.append(optimize(img, '750'));
        li.append(image);
      } else if (cell.textContent.trim() !== '') {
        cell.className = 'cards-grid-body';
        li.append(cell);
      }
    });
    li.classList.toggle('cards-grid-has-image', !!li.querySelector('.cards-grid-image'));

    // Trailing link-only paragraph = "Learn more" button.
    const body = li.querySelector('.cards-grid-body');
    const last = body && body.lastElementChild;
    const cta = last && last.tagName === 'P' && last.querySelector('a[href]');
    if (cta && last.textContent.trim() === cta.textContent.trim()) {
      last.className = 'cards-grid-cta';
      cta.classList.add('button');
    }
    ul.append(li);
  });
  children.push(ul);
  block.replaceChildren(...children);
}

/**
 * Decorates the cards-grid block. One block, several styles via the "Style"
 * dropdown (variant class):
 *   - .cards-grid.solutions    heading + 3-up cards (image, category, title, link)
 *   - .cards-grid.productlines heading + 3-up cards (image, title, desc)
 *   - .cards-grid.insights     intro panel + stacked text cards (two-column)
 *   - .cards-grid.simple       4-up cards (image, tag, title, link)
 *   - .cards-grid.features     centered borderless columns (title, icon, desc)
 *   - .cards-grid.video        3-up 16:9 video posters with a play overlay
 *   - .cards-grid.showcase     white cards over a full-bleed background image
 * Authored structure: row 0 = heading/intro, rows 1..N = one card each.
 * Showcase takes its background image from the section's "Background Image"
 * property (section-metadata "background"), or a picture in the heading row.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  if (block.classList.contains('video')) {
    decorateVideo(block, rows);
    return;
  }
  if (block.classList.contains('showcase')) {
    decorateShowcase(block, rows);
    return;
  }

  const insights = block.classList.contains('insights');
  const features = block.classList.contains('features');

  // Row 0 (no picture) is the heading / intro panel.
  const headingRow = rows[0] && !rows[0].querySelector('picture') ? rows[0] : null;
  const cardRows = rows.filter((r) => r !== headingRow);

  if (features) {
    // Centered feature columns: title → icon → description.
    const ul = document.createElement('ul');
    cardRows.forEach((row) => {
      const li = document.createElement('li');
      moveInstrumentation(row, li);
      const cells = [...row.children];
      const imgCell = cells.find((c) => c.querySelector('picture, img'));
      const textCell = cells.find((c) => c !== imgCell && c.textContent.trim() !== '');

      // Title first.
      const heading = textCell && textCell.querySelector('h2, h3, h4, h5');
      if (heading) li.append(heading);

      // Icon between title and description.
      if (imgCell) {
        const icon = document.createElement('div');
        icon.className = 'cards-grid-image';
        const img = imgCell.querySelector('img');
        if (img) {
          const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '150' }]);
          moveInstrumentation(img, optimized.querySelector('img'));
          icon.append(optimized);
        }
        li.append(icon);
      }

      // Remaining description text.
      if (textCell) {
        const body = document.createElement('div');
        body.className = 'cards-grid-body';
        while (textCell.firstChild) body.append(textCell.firstChild);
        li.append(body);
      }
      ul.append(li);
    });

    const children = [];
    if (headingRow) {
      const heading = document.createElement('div');
      heading.className = 'cards-grid-heading';
      while (headingRow.firstElementChild) heading.append(headingRow.firstElementChild);
      children.push(heading);
    }
    children.push(ul);
    block.replaceChildren(...children);
    return;
  }

  if (insights) {
    // Intro panel on the left, stacked text cards on the right.
    const intro = document.createElement('div');
    intro.className = 'cards-grid-intro';
    if (headingRow) {
      const cell = headingRow.firstElementChild || headingRow;
      while (cell.firstChild) intro.append(cell.firstChild);
    }

    const list = document.createElement('div');
    list.className = 'cards-grid-list';
    cardRows.forEach((row) => {
      const card = document.createElement('div');
      card.className = 'cards-grid-card';
      moveInstrumentation(row, card);
      // The model gives each item an (empty) image cell + a text cell; use the
      // cell that actually has content.
      const cells = [...row.children];
      const cell = cells.find((c) => c.textContent.trim() !== '') || cells[cells.length - 1] || row;
      while (cell.firstChild) card.append(cell.firstChild);
      list.append(card);
    });

    block.replaceChildren(intro, list);
    return;
  }

  // Solutions / Product Lines: heading + card grid.
  const ul = document.createElement('ul');
  cardRows.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      // Drop empty cells (e.g. an unused image column) so no ghost boxes render.
      if (!div.querySelector('picture, img') && div.textContent.trim() === '') {
        div.remove();
        return;
      }
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-grid-image';
      } else {
        div.className = 'cards-grid-body';
      }
    });
    // A leading bold marker (e.g. "**NEW**") becomes a corner ribbon.
    const body = li.querySelector('.cards-grid-body');
    const firstEl = body && body.firstElementChild;
    const strong = firstEl && firstEl.querySelector(':scope > strong');
    if (strong && firstEl.textContent.trim() === strong.textContent.trim()) {
      const badge = document.createElement('span');
      badge.className = 'cards-grid-badge';
      badge.textContent = strong.textContent.trim();
      firstEl.remove();
      li.prepend(badge);
    }
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  const children = [];
  if (headingRow) {
    const heading = document.createElement('div');
    heading.className = 'cards-grid-heading';
    while (headingRow.firstElementChild) heading.append(headingRow.firstElementChild);
    children.push(heading);
  }
  children.push(ul);
  block.replaceChildren(...children);
}
