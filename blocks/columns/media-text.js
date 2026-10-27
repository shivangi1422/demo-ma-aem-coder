import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, rowContentCells } from '../../scripts/scripts.js';

const BUTTON_CLASSES = ['button', 'primary', 'secondary', 'accent'];
const INLINE_TAGS = ['A', 'STRONG', 'EM', 'B', 'I', 'SPAN', 'BR', 'U', 'SUB', 'SUP', 'CODE', 'IMG', 'PICTURE'];
const WISTIA_PATTERNS = [
  /^https?:\/\/fast\.wistia\.(?:net|com)\/embed\/(?:iframe|medias)\/([a-z0-9]+)/i,
  /^https?:\/\/(?:[a-z0-9-]+\.)?wistia\.(?:com|net)\/medias\/([a-z0-9]+)/i,
];

/**
 * @param {string} href
 * @returns {string|null} the Wistia media id
 */
function wistiaId(href) {
  const match = WISTIA_PATTERNS.map((re) => href.match(re)).find(Boolean);
  return match ? match[1] : null;
}

/**
 * Wraps runs of bare text / inline nodes into paragraphs.
 * @param {Element} cell
 */
function wrapInlineRuns(cell) {
  let run = null;
  [...cell.childNodes].forEach((node) => {
    const inline = (node.nodeType === Node.TEXT_NODE)
      || (node.nodeType === Node.ELEMENT_NODE && INLINE_TAGS.includes(node.tagName));
    if (!inline) {
      run = null;
      return;
    }
    if (!run) {
      if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
      run = document.createElement('p');
      node.replaceWith(run);
    }
    run.append(node);
  });
}

/**
 * Paragraphs holding only one link (optionally in strong/em, or already
 * p.button-container > a.button) become blue buttons.
 * @param {Element} root
 */
function decorateButtons(root) {
  root.querySelectorAll(':scope > p').forEach((p) => {
    const links = p.querySelectorAll('a[href]');
    if (links.length !== 1 || p.textContent.trim() !== links[0].textContent.trim()) return;
    const a = links[0];
    let outer = a;
    while (outer.parentElement !== p && ['STRONG', 'EM', 'B', 'I'].includes(outer.parentElement.tagName)) {
      outer = outer.parentElement;
    }
    if (outer !== a) outer.replaceWith(a);
    a.classList.remove(...BUTTON_CLASSES);
    a.classList.add('columns-media-text-button');
    p.classList.remove('button-wrapper', 'button-container');
    p.classList.add('columns-media-text-cta');
  });
  root.querySelectorAll('a.button').forEach((a) => a.classList.remove(...BUTTON_CLASSES));
  root.querySelectorAll('.button-wrapper, .button-container').forEach((el) => el.classList.remove('button-wrapper', 'button-container'));
}

/**
 * Optimised picture for an image; an image on another origin (hot-linked,
 * not served by the media pipeline) keeps its own <picture>/<img>.
 * @param {HTMLImageElement} img
 * @returns {Element}
 */
function optimizedPicture(img) {
  if (new URL(img.src, window.location.href).origin !== window.location.origin) {
    return img.closest('picture') || img;
  }
  const picture = createOptimizedPicture(img.src, img.alt || '', false, [{ media: '(min-width: 600px)', width: '1200' }, { width: '750' }]);
  moveInstrumentation(img, picture.querySelector('img'));
  return picture;
}

/**
 * Click-to-play Wistia video: poster + play button; the iframe is only
 * injected (with autoPlay) when the visitor asks for it.
 * @param {Element} col column element
 * @param {Element} root content root of the column
 * @param {HTMLAnchorElement} link the Wistia link
 * @param {string} id Wistia media id
 */
function decorateVideo(col, root, link, id) {
  const title = link.textContent.trim() || link.title || 'Video';
  const img = root.querySelector('img');

  const player = document.createElement('div');
  player.className = 'columns-media-text-video';
  moveInstrumentation(link, player);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'columns-media-text-play';
  button.setAttribute('aria-label', `Play video: ${title}`);
  if (img) button.append(optimizedPicture(img));
  const icon = document.createElement('span');
  icon.className = 'columns-media-text-play-icon';
  icon.setAttribute('aria-hidden', 'true');
  button.append(icon);
  player.append(button);

  button.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = `https://fast.wistia.net/embed/iframe/${id}?autoPlay=true`;
    iframe.title = title;
    iframe.allow = 'autoplay; fullscreen';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    button.replaceWith(iframe);
    iframe.focus();
  }, { once: true });

  col.classList.add('columns-media-text-video-col');
  root.replaceChildren(player);
}

/**
 * Columns, variant "media" (block class .columns.media, authored as "Columns (media)";
 * xwalk keeps columns variants as classes, not block names; a one-word class survives the
 * markdown round trip, a hyphenated one becomes two words):
 * two columns (image | text, text | video, ...). From
 * 768px the columns sit side by side, vertically centred, the first with 30px
 * right padding; image cells are 350px tall (cover). A cell with a picture and
 * a Wistia link becomes a click-to-play 16:9 player.
 *
 * Authored structure: one row, two cells; each cell holds an image, rich text
 * (headings, paragraphs, lists, a bold link = button) or a poster image plus a
 * link to https://fast.wistia.net/embed/iframe/<id>.
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    // a row whose content is not split into cell divs is one cell
    if (![...row.children].every((el) => el.tagName === 'DIV') || !row.children.length) {
      const cell = document.createElement('div');
      cell.append(...row.childNodes);
      row.append(cell);
    }
    const cols = [...row.children];
    const roots = rowContentCells(row);
    row.classList.add('columns-media-text-row');

    cols.forEach((col, i) => {
      // content delivered inside wrapper elements is lifted into the column itself
      if (roots[i] && roots[i] !== col) col.replaceChildren(...roots[i].childNodes);
      const root = col;
      col.classList.add('columns-media-text-col');
      wrapInlineRuns(root);

      const link = [...root.querySelectorAll('a[href]')].find((a) => wistiaId(a.href));
      if (link) {
        decorateVideo(col, root, link, wistiaId(link.href));
        return;
      }

      const img = root.querySelector('img');
      if (img && !root.textContent.trim()) {
        col.classList.add('columns-media-text-img-col');
        const target = img.closest('picture') || img;
        const picture = optimizedPicture(img);
        if (picture !== target) target.replaceWith(picture);
        return;
      }

      col.classList.add('columns-media-text-text-col');
      root.querySelectorAll('picture').forEach((pic) => {
        const pImg = pic.querySelector('img');
        const optimized = pImg ? optimizedPicture(pImg) : pic;
        if (optimized !== pic) pic.replaceWith(optimized);
      });
      decorateButtons(root);
    });

    block.classList.add(`columns-${cols.length}-cols`);
  });
}
