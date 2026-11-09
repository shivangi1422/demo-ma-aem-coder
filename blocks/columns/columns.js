import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const VIDEO_HOSTS = /(fast\.wistia\.(net|com)|youtube\.com|youtu\.be|player\.vimeo\.com)/;

function embedUrl(href) {
  const url = new URL(href);
  if (url.hostname.includes('wistia')) {
    const id = url.pathname.split('/').filter(Boolean).pop();
    return `https://fast.wistia.net/embed/iframe/${id}?videoFoam=true`;
  }
  if (url.hostname === 'youtu.be') return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
  if (url.hostname.includes('youtube.com') && url.searchParams.get('v')) return `https://www.youtube.com/embed/${url.searchParams.get('v')}`;
  return href;
}

/**
 * A video link alone in its paragraph (or alone in the column) becomes a 16:9 player.
 * @param {Element} col column cell
 */
function embedVideos(col) {
  [...col.querySelectorAll('a[href]')].forEach((a) => {
    const holder = a.parentElement.tagName === 'P' ? a.parentElement : a;
    if (holder.textContent.trim() !== a.textContent.trim() || !VIDEO_HOSTS.test(a.href)) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'columns-video';
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl(a.href);
    iframe.title = a.title || a.textContent.trim() || 'Video player';
    iframe.loading = 'lazy';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    wrapper.append(iframe);
    holder.replaceWith(wrapper);
  });
}

/**
 * Article (style "article", FAQ article body): small image beside a wide text column.
 * Cells: image, text (one row with two cells; Universal Editor columns hold text, image and
 * title components, so the text column may mix paragraphs and images).
 * @param {Element} block The block element
 */
function decorateArticle(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  if (!cells.length) return;
  const imageCell = cells.find((cell) => cell.querySelector('picture') && !cell.textContent.trim());
  const textCell = cells.find((cell) => cell !== imageCell) || document.createElement('div');
  const row = document.createElement('div');

  const img = imageCell && imageCell.querySelector('img');
  if (img) {
    const media = document.createElement('div');
    media.className = 'columns-article-image';
    const pic = createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 900px)', width: '600' }, { width: '750' }]);
    moveInstrumentation(img, pic.querySelector('img'));
    media.append(pic);
    row.append(media);
  }

  textCell.classList.add('columns-article-text');
  embedVideos(textCell);
  row.append(textCell);
  block.replaceChildren(row);
}

export default function decorate(block) {
  if (block.classList.contains('article')) {
    decorateArticle(block);
    return;
  }
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      embedVideos(col);
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
