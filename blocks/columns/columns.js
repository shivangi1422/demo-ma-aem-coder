import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Call-to-action variant: each column is a button above a short description.
 * A lone link in its own paragraph becomes the button, even when the global
 * button decoration skipped it (e.g. tel:/mailto: links).
 * @param {Element} block
 */
function decorateCta(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-cta-row');
    [...row.children].forEach((col) => {
      col.classList.add('columns-cta-col');
      const linkPara = [...col.querySelectorAll(':scope > p')].find((p) => {
        const a = p.querySelector(':scope > a');
        return a && p.children.length === 1 && p.textContent.trim() === a.textContent.trim();
      });
      if (linkPara) {
        linkPara.querySelector('a').classList.add('button');
        linkPara.classList.add('button-wrapper', 'columns-cta-action');
      }
    });
  });
}

/**
 * Maps a link to an embeddable player URL; only known video hosts are embedded.
 * @param {string} href
 * @returns {string|null}
 */
function getEmbedUrl(href) {
  let url;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.replace(/^www\./, '');
  const path = url.pathname;
  if (host === 'fast.wistia.net' || host === 'fast.wistia.com') {
    const id = path.match(/\/embed\/(?:iframe|medias)\/([a-z0-9]+)/i)?.[1];
    return id ? `https://fast.wistia.net/embed/iframe/${id}` : null;
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const id = url.searchParams.get('v') || path.match(/^\/(?:embed|shorts)\/([\w-]+)/)?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === 'youtu.be') {
    const id = path.match(/^\/([\w-]+)/)?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === 'player.vimeo.com') {
    const id = path.match(/^\/video\/(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}

/**
 * A column whose only content is a link to a supported video host becomes a
 * responsive, lazy-loaded 16:9 iframe.
 * @param {Element} col
 * @returns {boolean} true when the column was turned into a video
 */
function decorateVideoCol(col) {
  const links = col.querySelectorAll('a[href]');
  if (links.length !== 1) return false;
  const a = links[0];
  if (col.querySelector('picture, img') || col.textContent.trim() !== a.textContent.trim()) return false;
  const src = getEmbedUrl(a.getAttribute('href'));
  if (!src) return false;

  const text = a.textContent.trim();
  const isUrl = (value) => /^https?:\/\//i.test(value);
  const video = document.createElement('div');
  video.className = 'columns-video';
  const iframe = document.createElement('iframe');
  iframe.src = src;
  // fall back to the row's heading so the frame has a meaningful accessible name
  const rowHeading = [...(col.parentElement?.querySelectorAll('h1, h2, h3, h4, h5, h6') || [])].pop();
  iframe.title = [text, a.title].find((value) => value && !isUrl(value))
    || (rowHeading && `Video: ${rowHeading.textContent.trim()}`)
    || 'Embedded video';
  iframe.setAttribute('loading', 'lazy');
  iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  video.append(iframe);

  // keep Universal Editor instrumentation of the authored link/paragraph
  [...col.children].forEach((child) => moveInstrumentation(child, video));
  moveInstrumentation(a, video);
  col.replaceChildren(video);
  col.classList.add('columns-video-col');
  return true;
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  if (block.classList.contains('cta')) {
    decorateCta(block);
    return;
  }

  // setup image and video columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      if (decorateVideoCol(col)) return;
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
