import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const VIDYARD_RE = /(?:play|embed|share)\.vidyard\.com\/(?:watch\/)?([A-Za-z0-9_-]+)/i;
// fast.wistia.net/embed/iframe/{id}, {account}.wistia.com/medias/{id}
const WISTIA_RE = /wistia\.(?:net|com)\/(?:embed\/(?:iframe|medias)|medias)\/([A-Za-z0-9]+)/i;

function isVideoUrl(href = '') {
  return VIDYARD_RE.test(href) || WISTIA_RE.test(href)
    || /youtube\.com|youtu\.be|vimeo\.com|\.mp4(\?|$)/i.test(href);
}

/** inline player URL for Vidyard / Wistia links, else null */
function inlinePlayerUrl(href = '') {
  const vidyard = href.match(VIDYARD_RE);
  if (vidyard) return `https://play.vidyard.com/${vidyard[1]}?autoplay=1&type=inline&disable_popouts=1`;
  const wistia = href.match(WISTIA_RE);
  if (wistia) return `https://fast.wistia.net/embed/iframe/${wistia[1]}?autoPlay=true&videoFoam=true`;
  return null;
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
 * video (link text = video title, used as the accessible label). Vidyard and
 * Wistia links inline the player on click; other links open normally.
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
      const playerUrl = inlinePlayerUrl(link.href);
      if (playerUrl) {
        media.addEventListener('click', (e) => {
          e.preventDefault();
          const iframe = document.createElement('iframe');
          iframe.src = playerUrl;
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
 * PRODUCTS / PHOTO: white shadowed cards (beckmancoulter.com .product-card and
 * .photo-card). Optional heading row (no picture, no link), then one card per
 * row: image cell + text cell. In the text cell, a leading link-free paragraph
 * directly before the title becomes a tag pill; a trailing link-only
 * paragraph becomes the "Learn more" / "Explore" text link.
 */
function decorateTileCards(block, rows) {
  const headingRow = rows[0] && !rows[0].querySelector('picture, a[href]') ? rows[0] : null;
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

    const body = li.querySelector('.cards-grid-body');
    if (body) {
      const first = body.firstElementChild;
      if (first && first.tagName === 'P' && !first.querySelector('a, picture')
        && first.nextElementSibling && /^H[1-6]$/.test(first.nextElementSibling.tagName)) {
        first.className = 'cards-grid-tag';
      }
      const last = body.lastElementChild;
      const cta = last && last.tagName === 'P' && last.querySelector('a[href]');
      if (cta && last.textContent.trim() === cta.textContent.trim()) {
        // always a text link in these styles, even if authored bold/italic
        last.className = 'cards-grid-cta';
        cta.className = 'cards-grid-link';
        last.replaceChildren(cta);
      }
    }
    ul.append(li);
  });

  const heading = buildHeading(headingRow);
  block.replaceChildren(...(heading ? [heading, ul] : [ul]));
}

/**
 * Heading row for styles whose cards may have no image: row 0 when it is a
 * single-cell row (the container "Heading / Intro" field) while the cards
 * are image + text rows, or when it is empty.
 * @param {Element[]} rows
 * @returns {Element|null}
 */
function findHeadingRow(rows) {
  const [first] = rows;
  if (!first || first.querySelector('picture')) return null;
  if (first.textContent.trim() === '') return first;
  if (first.children.length <= 1 && rows.slice(1).some((r) => r.children.length > 1)) return first;
  return null;
}

/**
 * ACCENT / ICONS: simple text cards.
 *   accent: white text cards with a red top border; title, description and an
 *           optional outlined pill link (trailing link-only paragraph); 2-up.
 *   icons:  no card chrome; large icon on top, bold title, text; 4-up.
 * Optional heading row, then one card per row: image cell (accent: usually
 * empty; icons: the icon) + rich text cell. The title is the first heading,
 * or a leading bold-only paragraph.
 * @param {Element} block
 * @param {Element[]} rows
 */
function decorateTextCards(block, rows) {
  const icons = block.classList.contains('icons');
  const headingRow = findHeadingRow(rows);
  const ul = document.createElement('ul');
  rows.filter((r) => r !== headingRow).forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    [...row.children].forEach((cell) => {
      const img = cell.querySelector('img');
      if (img && cell.textContent.trim() === '') {
        const image = document.createElement('div');
        image.className = 'cards-grid-image';
        image.append(optimize(img, icons ? '150' : '750'));
        li.append(image);
      } else if (cell.textContent.trim() !== '') {
        cell.className = 'cards-grid-body';
        li.append(cell);
      }
    });
    if (!li.children.length) return;

    const body = li.querySelector('.cards-grid-body');
    if (body) {
      let title = body.querySelector(':scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');
      if (!title) {
        const first = body.firstElementChild;
        const strong = first && first.tagName === 'P' && first.querySelector(':scope > strong');
        if (strong && first.textContent.trim() === strong.textContent.trim()) title = first;
      }
      if (title) title.classList.add('cards-grid-title');

      // trailing link-only paragraph = pill link (plain link, whatever the authored emphasis)
      const last = body.lastElementChild;
      const cta = last && last !== title && last.tagName === 'P' && last.querySelector('a[href]');
      if (cta && last.textContent.trim() === cta.textContent.trim()) {
        last.className = 'cards-grid-cta';
        cta.className = 'cards-grid-pill';
        last.replaceChildren(cta);
      }
    }
    ul.append(li);
  });

  const heading = buildHeading(headingRow);
  block.replaceChildren(...(heading ? [heading, ul] : [ul]));
}

/**
 * Decorates the cards-grid block. One block, several styles via the "Style"
 * dropdown (variant class):
 *   - .cards-grid.solutions    heading + 3-up cards (image, category, title, link)
 *   - .cards-grid.productlines heading + 3-up cards (image, title, desc)
 *   - .cards-grid.insights     intro panel + stacked text cards (two-column)
 *   - .cards-grid.simple       4-up cards (image, tag, title, link)
 *   - .cards-grid.features     centered borderless columns (title, icon, desc)
 *   - .cards-grid.features-purple  features layout on a purple band, white text
 *   - .cards-grid.video        3-up 16:9 video posters with a play overlay
 *   - .cards-grid.showcase     white cards over a full-bleed background image
 *   - .cards-grid.products     4-up product cards (image, tag pill, title, desc, link)
 *   - .cards-grid.photo        3-up centred photo cards (image, title, desc, link)
 *   - .cards-grid.accent       2-up text cards, red top border, outlined pill link
 *   - .cards-grid.icons        4-up borderless items (large icon, bold title, text)
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
  if (block.classList.contains('products') || block.classList.contains('photo')) {
    decorateTileCards(block, rows);
    return;
  }
  if (block.classList.contains('accent') || block.classList.contains('icons')) {
    decorateTextCards(block, rows);
    return;
  }

  const insights = block.classList.contains('insights');
  // features-purple shares the features layout; only the colour scheme differs.
  if (block.classList.contains('features-purple')) block.classList.add('features');
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
      let heading = textCell && textCell.querySelector('h2, h3, h4, h5');
      if (!heading && textCell) {
        // Fallback: a leading bold-only paragraph acts as the title.
        const first = textCell.firstElementChild;
        const strong = first && first.tagName === 'P' && first.querySelector(':scope > strong');
        if (strong && first.textContent.trim() === strong.textContent.trim()) {
          first.classList.add('cards-grid-title');
          heading = first;
        }
      }
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
