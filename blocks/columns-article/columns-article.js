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
 * FAQ article body: small image beside a wide text column.
 * Cells: image, text. A video link alone in a paragraph is embedded as a player.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // authored as one row with two cells, or (Universal Editor) one row per field
  const cells = [...block.querySelectorAll(':scope > div > div')];
  if (!cells.length) return;
  const row = document.createElement('div');
  const imageCell = cells.find((cell) => cell.querySelector('picture') && !cell.textContent.trim());
  const textCell = cells.find((cell) => cell !== imageCell) || document.createElement('div');

  const media = document.createElement('div');
  media.className = 'columns-article-image';
  const img = imageCell && imageCell.querySelector('img');
  if (img) {
    const pic = createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 900px)', width: '600' }, { width: '750' }]);
    moveInstrumentation(img, pic.querySelector('img'));
    media.append(pic);
  }

  textCell.className = 'columns-article-text';
  textCell.querySelectorAll('p').forEach((p) => {
    const a = p.querySelector('a[href]');
    if (!a || p.textContent.trim() !== a.textContent.trim() || !VIDEO_HOSTS.test(a.href)) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'columns-article-video';
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl(a.href);
    iframe.title = a.title || a.textContent.trim() || 'Video player';
    iframe.loading = 'lazy';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    wrapper.append(iframe);
    p.replaceWith(wrapper);
  });

  if (img) row.append(media);
  row.append(textCell);
  block.replaceChildren(row);
}
