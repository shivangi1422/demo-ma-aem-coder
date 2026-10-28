import { moveInstrumentation } from '../../scripts/scripts.js';

const PER_PAGE = 4;
let groupCount = 0;

/**
 * Creates a 2-column logo grid.
 * @param {Element[]} logos logo li elements
 * @returns {Element}
 */
function createGrid(logos) {
  const grid = document.createElement('ul');
  grid.className = 'cards-logo-group-logos';
  grid.append(...logos);
  return grid;
}

/**
 * Slides the track to one page and syncs slide visibility and the dots.
 * @param {Element} track
 * @param {Element} dots
 * @param {number} page
 */
function showPage(track, dots, page) {
  track.style.transform = `translateX(${page * -100}%)`;
  [...track.children].forEach((slide, i) => {
    slide.inert = i !== page;
    slide.setAttribute('aria-hidden', i === page ? 'false' : 'true');
  });
  [...dots.children].forEach((dot, i) => {
    dot.classList.toggle('is-active', i === page);
    dot.setAttribute('aria-current', i === page ? 'true' : 'false');
  });
}

/**
 * Builds the category card: header (title + description), logo grid and,
 * with more than four logos, a sliding carousel of 2x2 pages with dots.
 * @param {Element} card li element
 * @param {Element|null} header text cell of the category row
 * @param {Element[]} logos logo li elements
 */
function buildCard(card, header, logos) {
  groupCount += 1;
  if (header) {
    header.className = 'cards-logo-group-card-body';
    card.append(header);
  }
  if (!logos.length) return;

  const pages = Math.ceil(logos.length / PER_PAGE);
  if (pages < 2) {
    card.append(createGrid(logos));
    return;
  }

  const title = header?.querySelector('h1, h2, h3, h4, h5, h6')?.textContent.trim() || 'logos';
  const viewport = document.createElement('div');
  viewport.className = 'cards-logo-group-viewport';
  const track = document.createElement('div');
  track.className = 'cards-logo-group-track';
  track.id = `cards-logo-group-track-${groupCount}`;
  for (let page = 0; page < pages; page += 1) {
    const slide = createGrid(logos.slice(page * PER_PAGE, (page + 1) * PER_PAGE));
    slide.classList.add('cards-logo-group-slide');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${page + 1} of ${pages}`);
    track.append(slide);
  }
  viewport.append(track);
  card.append(viewport);

  const dots = document.createElement('div');
  dots.className = 'cards-logo-group-dots';
  dots.setAttribute('role', 'group');
  dots.setAttribute('aria-label', `${title} pages`);
  for (let page = 0; page < pages; page += 1) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'cards-logo-group-dot';
    dot.setAttribute('aria-label', `Show ${title} logos page ${page + 1} of ${pages}`);
    dot.setAttribute('aria-controls', track.id);
    dots.append(dot);
  }
  dots.addEventListener('click', (e) => {
    const dot = e.target.closest('.cards-logo-group-dot');
    if (dot) showPage(track, dots, [...dots.children].indexOf(dot));
  });
  card.append(dots);
  showPage(track, dots, 0);
}

/**
 * loads and decorates the block
 * Authored as flat rows: a text-only row (H3 + p) starts a category, the
 * image-only rows that follow are its logos.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  let current = null;

  const flush = () => {
    if (current) buildCard(current.card, current.header, current.logos);
    current = null;
  };

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const imageCell = cells.find((cell) => cell.querySelector('picture, img'));
    const textCell = cells.find((cell) => cell !== imageCell && cell.textContent.trim());

    if (textCell && !imageCell) {
      flush();
      const card = document.createElement('li');
      card.className = 'cards-logo-group-card';
      moveInstrumentation(row, card);
      ul.append(card);
      current = { card, header: textCell, logos: [] };
      return;
    }

    if (imageCell) {
      if (!current) {
        // logos before any category: give them an untitled card
        const card = document.createElement('li');
        card.className = 'cards-logo-group-card';
        ul.append(card);
        current = { card, header: null, logos: [] };
      }
      const logo = document.createElement('li');
      logo.className = 'cards-logo-group-logo';
      moveInstrumentation(row, logo);
      while (imageCell.firstChild) logo.append(imageCell.firstChild);
      if (textCell) {
        const caption = document.createElement('span');
        caption.className = 'cards-logo-group-logo-caption';
        caption.textContent = textCell.textContent.trim();
        logo.append(caption);
      }
      current.logos.push(logo);
    }
  });
  flush();

  block.replaceChildren(ul);
}
