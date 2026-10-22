import { moveInstrumentation } from '../../scripts/scripts.js';

const VIDYARD_RE = /(?:play|embed|share)\.vidyard\.com\/(?:watch\/)?([A-Za-z0-9_-]+)/i;

/**
 * Turns a column holding a Vidyard link (optionally with a poster image above
 * it) into a poster with a play overlay; clicking swaps in the inline player.
 * Columns without a Vidyard link are left untouched.
 * @param {Element} col
 */
function decorateVideo(col) {
  const link = [...col.querySelectorAll('a[href]')].find((a) => VIDYARD_RE.test(a.href));
  if (!link) return;
  const [, uuid] = link.href.match(VIDYARD_RE);
  const title = link.textContent.trim() && link.textContent.trim() !== link.href
    ? link.textContent.trim() : '';

  const poster = document.createElement('a');
  poster.className = 'columns-video-poster';
  poster.href = link.href;
  poster.setAttribute('aria-label', title ? `Play video: ${title}` : 'Play video');
  moveInstrumentation(link, poster);

  const picture = col.querySelector('picture');
  if (picture) {
    const wrapper = picture.parentElement;
    poster.append(picture);
    if (wrapper !== col && wrapper.textContent.trim() === '' && !wrapper.children.length) wrapper.remove();
  } else {
    const img = document.createElement('img');
    img.src = `https://play.vidyard.com/${uuid}.jpg`;
    img.alt = title;
    img.loading = 'lazy';
    poster.append(img);
  }

  const play = document.createElement('span');
  play.className = 'columns-video-play';
  play.setAttribute('aria-hidden', 'true');
  poster.append(play);

  // Replace the link (or its link-only paragraph) with the poster.
  const linkPara = link.parentElement;
  if (linkPara !== col && linkPara.tagName === 'P' && linkPara.textContent.trim() === link.textContent.trim()) {
    linkPara.replaceWith(poster);
  } else {
    link.replaceWith(poster);
  }

  poster.addEventListener('click', (e) => {
    e.preventDefault();
    const iframe = document.createElement('iframe');
    iframe.src = `https://play.vidyard.com/${uuid}?autoplay=1&type=inline&disable_popouts=1`;
    iframe.title = title || 'Video player';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.className = 'columns-video-frame';
    poster.replaceWith(iframe);
    iframe.focus();
  });

  col.classList.add('columns-video-col');
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      decorateVideo(col);
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
