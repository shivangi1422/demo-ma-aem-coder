import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Only same-origin, non-SVG images can be optimized; migrated images still point
 * at the source site until uploaded, and SVGs can't be transcoded.
 * @param {HTMLImageElement} img
 * @returns {boolean}
 */
function canOptimize(img) {
  const url = new URL(img.src, window.location.href);
  return url.origin === window.location.origin && !/\.svg$/i.test(url.pathname);
}

/**
 * Turns a cell holding only icon tokens (e.g. ":user-plus:") into icon spans.
 * Published pages already get span.icon from the pipeline; local previews keep the raw token.
 * @param {Element} cell
 * @returns {boolean} true when the cell is an icon cell
 */
function decorateIconCell(cell) {
  if (cell.querySelector('span.icon') && !cell.textContent.trim()) return true;
  const text = cell.textContent.trim();
  if (!/^(:[a-z0-9-]+:\s*)+$/.test(text)) return false;
  const names = text.match(/:([a-z0-9-]+):/g).map((t) => t.slice(1, -1));
  cell.replaceChildren(...names.map((name) => {
    const span = document.createElement('span');
    span.className = `icon icon-${name}`;
    return span;
  }));
  return true;
}

/**
 * Returns the image cell and the text cell of an authored card row.
 * @param {Element} row
 * @returns {{imgCell: Element|undefined, textCell: Element|undefined}}
 */
function splitCells(row) {
  const cells = [...row.children];
  const imgCell = cells.find((c) => c.querySelector('picture, img'));
  const textCell = cells.find((c) => c !== imgCell && c.textContent.trim() !== '');
  return { imgCell, textCell };
}

/**
 * Returns the cell's picture (or bare img), optimized when the image allows it.
 * @param {Element} cell
 * @param {string} width
 * @returns {Element|null}
 */
function pictureFrom(cell, width) {
  const img = cell && cell.querySelector('img');
  if (!img) return null;
  if (!canOptimize(img)) return img.closest('picture') || img;
  const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width }]);
  moveInstrumentation(img, optimized.querySelector('img'));
  return optimized;
}

/**
 * Wraps a non-empty heading row in .cards-grid-heading; an empty one renders nothing.
 * @param {Element|null} headingRow
 * @returns {Element[]}
 */
function headingFrom(headingRow) {
  if (!headingRow || !headingRow.textContent.trim()) return [];
  const heading = document.createElement('div');
  heading.className = 'cards-grid-heading';
  while (headingRow.firstElementChild) heading.append(headingRow.firstElementChild);
  return [heading];
}

/**
 * Content list: bordered 4:3 image (linked to the card's title link), H3 title,
 * linked description. The image link is a duplicate of the title link, so it is
 * kept out of the tab order.
 * @param {Element[]} cardRows
 * @returns {Element}
 */
function buildContentList(cardRows) {
  const ul = document.createElement('ul');
  cardRows.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const { imgCell, textCell } = splitCells(row);
    const link = textCell && textCell.querySelector('a[href]');

    const picture = pictureFrom(imgCell, '750');
    if (picture) {
      const media = document.createElement('div');
      media.className = 'cards-grid-image';
      moveInstrumentation(imgCell, media);
      if (link) {
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.tabIndex = -1;
        a.setAttribute('aria-label', (textCell.querySelector('h2, h3, h4') || link).textContent.trim());
        a.append(picture);
        media.append(a);
      } else {
        media.append(picture);
      }
      li.append(media);
    }

    if (textCell) {
      const body = document.createElement('div');
      body.className = 'cards-grid-body';
      moveInstrumentation(textCell, body);
      while (textCell.firstChild) body.append(textCell.firstChild);
      li.append(body);
    }
    ul.append(li);
  });
  return ul;
}

/**
 * Icon left: small icon beside a bold title, text and a solid red button
 * (the lone link in its own paragraph).
 * @param {Element[]} cardRows
 * @returns {Element}
 */
function buildIconLeft(cardRows) {
  const ul = document.createElement('ul');
  cardRows.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const { imgCell, textCell } = splitCells(row);

    const picture = pictureFrom(imgCell, '150');
    if (picture) {
      const icon = document.createElement('div');
      icon.className = 'cards-grid-image';
      moveInstrumentation(imgCell, icon);
      icon.append(picture);
      li.append(icon);
    }

    if (textCell) {
      const body = document.createElement('div');
      body.className = 'cards-grid-body';
      moveInstrumentation(textCell, body);
      while (textCell.firstChild) body.append(textCell.firstChild);
      body.querySelectorAll(':scope > p').forEach((p) => {
        const a = p.querySelector('a[href]');
        if (a && p.querySelectorAll('a').length === 1 && p.textContent.trim() === a.textContent.trim()) {
          p.replaceChildren(a);
          a.className = 'button';
          p.className = 'button-wrapper cards-grid-action';
        }
      });
      li.append(body);
    }
    ul.append(li);
  });
  return ul;
}

/**
 * Buttons: each item is one red link tile holding the white icon and the label.
 * External links open in a new tab.
 * @param {Element[]} cardRows
 * @returns {Element}
 */
function buildButtons(cardRows) {
  const ul = document.createElement('ul');
  cardRows.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const { imgCell, textCell } = splitCells(row);
    const link = textCell && textCell.querySelector('a[href]');

    const tile = document.createElement(link ? 'a' : 'div');
    tile.className = 'cards-grid-tile';
    if (link) {
      tile.href = link.getAttribute('href');
      if (link.title) tile.title = link.title;
      try {
        if (new URL(tile.href, window.location.href).origin !== window.location.origin) {
          tile.target = '_blank';
          tile.rel = 'noopener';
        }
      } catch { /* relative or malformed href: same tab */ }
    }

    const picture = pictureFrom(imgCell, '150');
    if (picture) {
      const icon = document.createElement('span');
      icon.className = 'cards-grid-image';
      // decorative next to the label: keep the tile's accessible name to the label only
      icon.setAttribute('aria-hidden', 'true');
      moveInstrumentation(imgCell, icon);
      icon.append(picture);
      tile.append(icon);
    }

    const label = document.createElement('span');
    label.className = 'cards-grid-label';
    if (textCell) moveInstrumentation(textCell, label);
    label.textContent = (link || textCell)?.textContent.trim() || '';
    tile.append(label);

    li.append(tile);
    ul.append(li);
  });
  return ul;
}

/**
 * Thumb list: 90px square thumbnail left of an uppercase title and text,
 * 1-up on mobile, 2-up from 992px. The title link is stretched over the whole
 * tile in CSS, so the tile is clickable while the link keeps the title as its
 * accessible name. The thumbnail is decorative next to the title.
 * @param {Element[]} cardRows
 * @returns {Element}
 */
function buildThumbList(cardRows) {
  const ul = document.createElement('ul');
  cardRows.forEach((row, index) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const { imgCell, textCell } = splitCells(row);

    const picture = pictureFrom(imgCell, '180');
    if (picture) {
      // 90px square slot: size hints avoid layout shift; only the first row
      // (two tiles from 992px) can be in the first viewport, so defer the rest
      const img = picture.querySelector('img') || picture;
      img.width = 90;
      img.height = 90;
      img.decoding = 'async';
      if (index > 1) img.loading = 'lazy';
      const thumb = document.createElement('div');
      thumb.className = 'cards-grid-image';
      moveInstrumentation(imgCell, thumb);
      thumb.append(picture);
      li.append(thumb);
    }

    if (textCell) {
      const body = document.createElement('div');
      body.className = 'cards-grid-body';
      moveInstrumentation(textCell, body);
      while (textCell.firstChild) body.append(textCell.firstChild);
      const heading = body.querySelector('h2, h3, h4, h5, h6');
      const link = (heading && heading.querySelector('a[href]')) || body.querySelector('a[href]');
      if (link) {
        link.classList.add('cards-grid-link');
        li.classList.add('cards-grid-linked');
      }
      li.append(body);
    }
    ul.append(li);
  });
  return ul;
}

/**
 * Callouts: bordered tiles with a contained image, a centered light title and
 * text; the title link is stretched over the whole tile in CSS (the tile is
 * clickable while the link keeps the title as its accessible name). Below 768px
 * the source shows the title only.
 * @param {Element[]} cardRows
 * @returns {Element}
 */
function buildCallouts(cardRows) {
  const ul = document.createElement('ul');
  cardRows.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const { imgCell, textCell } = splitCells(row);

    const picture = pictureFrom(imgCell, '750');
    if (picture) {
      const img = picture.querySelector('img') || picture;
      img.loading = 'lazy';
      const media = document.createElement('div');
      media.className = 'cards-grid-image';
      moveInstrumentation(imgCell, media);
      media.append(picture);
      li.append(media);
    }

    if (textCell) {
      const body = document.createElement('div');
      body.className = 'cards-grid-body';
      moveInstrumentation(textCell, body);
      while (textCell.firstChild) body.append(textCell.firstChild);
      const heading = body.querySelector('h2, h3, h4, h5, h6');
      const link = (heading && heading.querySelector('a[href]')) || body.querySelector('a[href]');
      if (link) {
        link.classList.add('cards-grid-link');
        li.classList.add('cards-grid-linked');
      }
      li.append(body);
    }
    ul.append(li);
  });
  return ul;
}

/**
 * Returns the Wistia media id of a link to fast.wistia.net/embed/iframe/<id>,
 * fast.wistia.com/medias/<id> or <account>.wistia.com/medias/<id>.
 * @param {HTMLAnchorElement|null} link
 * @returns {string}
 */
function wistiaId(link) {
  if (!link) return '';
  try {
    const url = new URL(link.href, window.location.href);
    if (!/(^|\.)wistia\.(com|net)$/.test(url.hostname)) return '';
    return url.pathname.match(/\/(?:embed\/iframe|embed\/medias|medias)\/([a-z0-9]+)/i)?.[1] || '';
  } catch {
    return '';
  }
}

let videoDialog;

/**
 * Opens the shared full-screen video dialog (dark overlay, close button top
 * right, player with the video title below), like the source's Wistia popover.
 * Closes with the close button, Escape or a click on the overlay; focus returns
 * to the card that opened it.
 * @param {string} id Wistia media id
 * @param {string} title
 */
function openVideo(id, title) {
  if (!videoDialog) {
    videoDialog = document.createElement('dialog');
    videoDialog.className = 'cards-grid-video-dialog';
    videoDialog.innerHTML = `<button type="button" class="cards-grid-video-close" aria-label="Close video"></button>
      <div class="cards-grid-video-player"></div>
      <p class="cards-grid-video-title"></p>`;
    videoDialog.querySelector('.cards-grid-video-close')
      .addEventListener('click', () => videoDialog.close());
    videoDialog.addEventListener('click', (e) => {
      if (e.target === videoDialog) videoDialog.close();
    });
    // stop playback when the dialog closes
    videoDialog.addEventListener('close', () => {
      videoDialog.querySelector('.cards-grid-video-player').replaceChildren();
    });
    document.body.append(videoDialog);
  }
  const iframe = document.createElement('iframe');
  iframe.src = `https://fast.wistia.net/embed/iframe/${id}?autoPlay=true`;
  iframe.title = title ? `Video: ${title}` : 'Video';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
  videoDialog.querySelector('.cards-grid-video-player').replaceChildren(iframe);
  videoDialog.querySelector('.cards-grid-video-title').textContent = title;
  videoDialog.setAttribute('aria-label', title || 'Video');
  videoDialog.showModal();
}

/**
 * Videos: Wistia video gallery - 16:9 thumbnail with a duration badge and the
 * title below; activating a card plays the video in a full-screen dialog.
 * Authored card: image = thumbnail, text = title linked to the Wistia media
 * (https://fast.wistia.net/embed/iframe/<id>) + optional duration paragraph
 * ("4 MIN"). Without a Wistia link the card is a plain link (or plain text).
 * @param {Element[]} cardRows
 * @returns {Element}
 */
function buildVideos(cardRows) {
  const ul = document.createElement('ul');
  cardRows.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const { imgCell, textCell } = splitCells(row);
    const link = textCell && textCell.querySelector('a[href]');
    const id = wistiaId(link);
    const title = (link || textCell?.querySelector('h2, h3, h4, p'))?.textContent.trim() || '';
    const duration = textCell && [...textCell.querySelectorAll('p')]
      .find((p) => !p.querySelector('a') && p.textContent.trim());

    const card = document.createElement(id ? 'button' : 'a');
    card.className = 'cards-grid-video';
    if (id) {
      card.type = 'button';
      card.setAttribute('aria-haspopup', 'dialog');
      const length = duration ? ` (${duration.textContent.trim()})` : '';
      card.setAttribute('aria-label', `Play video: ${title}${length}`);
      card.addEventListener('click', () => openVideo(id, title));
    } else if (link) {
      card.href = link.getAttribute('href');
    }

    const media = document.createElement('span');
    media.className = 'cards-grid-image';
    if (imgCell) moveInstrumentation(imgCell, media);
    const picture = pictureFrom(imgCell, '640');
    if (picture) {
      const img = picture.tagName === 'IMG' ? picture : picture.querySelector('img');
      if (img) {
        img.loading = 'lazy';
        img.alt = '';
      }
      media.append(picture);
    }
    if (duration) {
      const badge = document.createElement('span');
      badge.className = 'cards-grid-duration';
      badge.textContent = duration.textContent.trim();
      media.append(badge);
    }
    card.append(media);

    const label = document.createElement('span');
    label.className = 'cards-grid-label';
    if (textCell) moveInstrumentation(textCell, label);
    label.textContent = title;
    card.append(label);

    li.append(card);
    ul.append(li);
  });
  return ul;
}

/**
 * Related: horizontal product carousel (source: "Related ... Products" on product
 * pages). Cards scroll in a snap container; previous/next buttons move by one
 * card and are disabled at the ends. Image, title and text link to the product.
 * @param {Element[]} cardRows
 * @returns {Element}
 */
function buildRelated(cardRows) {
  const ul = document.createElement('ul');
  ul.className = 'cards-grid-track';
  cardRows.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const { imgCell, textCell } = splitCells(row);
    const link = textCell && textCell.querySelector('a[href]');
    const picture = pictureFrom(imgCell, '400');
    const media = document.createElement('div');
    media.className = 'cards-grid-image';
    if (imgCell) moveInstrumentation(imgCell, media);
    if (picture) {
      const img = picture.tagName === 'IMG' ? picture : picture.querySelector('img');
      if (img) {
        img.loading = 'lazy';
        // the source has a missing product image; keep the card layout without a broken icon
        img.addEventListener('error', () => media.classList.add('is-missing'), { once: true });
      }
      if (link) {
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.tabIndex = -1;
        a.setAttribute('aria-hidden', 'true');
        a.append(picture);
        media.append(a);
      } else {
        media.append(picture);
      }
    }
    li.append(media);
    if (textCell) {
      const body = document.createElement('div');
      body.className = 'cards-grid-body';
      moveInstrumentation(textCell, body);
      while (textCell.firstChild) body.append(textCell.firstChild);
      li.append(body);
    }
    ul.append(li);
  });

  const carousel = document.createElement('div');
  carousel.className = 'cards-grid-carousel';
  const arrow = (dir, label) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `cards-grid-arrow cards-grid-arrow-${dir}`;
    b.setAttribute('aria-label', label);
    b.addEventListener('click', () => {
      const card = ul.querySelector('li');
      const gap = parseFloat(getComputedStyle(ul).columnGap) || 0;
      const step = card ? card.getBoundingClientRect().width + gap : ul.clientWidth;
      ul.scrollBy({ left: dir === 'next' ? step : -step, behavior: 'smooth' });
    });
    return b;
  };
  const prev = arrow('prev', 'Previous products');
  const next = arrow('next', 'Next products');
  const sync = () => {
    prev.disabled = ul.scrollLeft <= 1;
    next.disabled = ul.scrollLeft + ul.clientWidth >= ul.scrollWidth - 1;
  };
  ul.addEventListener('scroll', () => window.requestAnimationFrame(sync), { passive: true });
  window.addEventListener('resize', sync, { passive: true });
  carousel.append(prev, ul, next);
  window.requestAnimationFrame(sync);
  return carousel;
}

/**
 * Decorates the cards-grid block. One block, three styles via the "Style"
 * dropdown (variant class):
 *   - .cards-grid.solutions    heading + 3-up cards (image, category, title, link)
 *   - .cards-grid.productlines heading + 3-up cards (image, title, desc)
 *   - .cards-grid.insights     intro panel + stacked text cards (two-column)
 *   - .cards-grid.products     single column: large product image, H3 title, Read More button
 *   - .cards-grid.contentlist  3-up: bordered 4:3 linked image, light H3, linked text
 *   - .cards-grid.icon-left    2-up: small icon beside bold title, text, red button
 *   - .cards-grid.buttons      red link tiles with a white icon
 *   - .cards-grid.related      horizontal product carousel with previous/next buttons
 *   - .cards-grid.thumblist    2-up: 90px thumb left of uppercase title + text, whole tile links
 *   - .cards-grid.callouts     3-up bordered tiles: image, centered title, text; tile links
 *   - .cards-grid.videos       Wistia gallery: thumbnail + duration + title; plays in a dialog
 * Authored structure: row 0 = heading/intro, rows 1..N = one card each.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const insights = block.classList.contains('insights');
  const features = block.classList.contains('features');

  // Row 0 (no picture) is the heading / intro panel.
  const headingRow = rows[0] && !rows[0].querySelector('picture') ? rows[0] : null;
  const cardRows = rows.filter((r) => r !== headingRow);

  // Support / Training styles: each has its own builder; existing styles are untouched.
  const builders = {
    contentlist: buildContentList,
    'icon-left': buildIconLeft,
    buttons: buildButtons,
    related: buildRelated,
    thumblist: buildThumbList,
    callouts: buildCallouts,
    videos: buildVideos,
  };
  const style = Object.keys(builders).find((cls) => block.classList.contains(cls));
  if (style) {
    block.replaceChildren(...headingFrom(headingRow), builders[style](cardRows));
    return;
  }

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
        if (img && !canOptimize(img)) {
          icon.append(img.closest('picture') || img);
        } else if (img) {
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
      if (!div.querySelector('picture, img, span.icon') && div.textContent.trim() === '') {
        div.remove();
        return;
      }
      if (decorateIconCell(div)) {
        div.className = 'cards-grid-icon';
        block.classList.add('cards-grid-icons');
      } else if (div.children.length === 1 && div.querySelector('picture')) {
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
    if (!canOptimize(img)) return;
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  decorateIcons(ul);

  // Products: a lone link in its own paragraph ("Read More") is the card's button,
  // even when it was authored without bold/italic formatting.
  if (block.classList.contains('products')) {
    ul.querySelectorAll('.cards-grid-body > p').forEach((p) => {
      const a = p.querySelector(':scope > a');
      if (a && p.children.length === 1 && p.textContent.trim() === a.textContent.trim()) {
        a.classList.add('button');
        p.classList.add('button-wrapper', 'cards-grid-action');
      }
    });
  }

  const children = [];
  // an empty heading row (icon-card grids have none) renders nothing
  if (headingRow && headingRow.textContent.trim()) {
    const heading = document.createElement('div');
    heading.className = 'cards-grid-heading';
    while (headingRow.firstElementChild) heading.append(headingRow.firstElementChild);
    children.push(heading);
  }
  children.push(ul);
  block.replaceChildren(...children);
}
