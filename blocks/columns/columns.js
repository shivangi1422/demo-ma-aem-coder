import { moveInstrumentation } from '../../scripts/scripts.js';

/** inline video players: link pattern -> player / fallback poster URLs */
const VIDEO_PROVIDERS = [
  {
    re: /(?:play|embed|share)\.vidyard\.com\/(?:watch\/)?([A-Za-z0-9_-]+)/i,
    player: (id) => `https://play.vidyard.com/${id}?autoplay=1&type=inline&disable_popouts=1`,
    poster: (id) => `https://play.vidyard.com/${id}.jpg`,
  },
  {
    // fast.wistia.net/embed/iframe/{id}, {account}.wistia.com/medias/{id}
    re: /wistia\.(?:net|com)\/(?:embed\/(?:iframe|medias)|medias)\/([A-Za-z0-9]+)/i,
    player: (id) => `https://fast.wistia.net/embed/iframe/${id}?autoPlay=true&videoFoam=true`,
    poster: (id) => `https://fast.wistia.com/embed/medias/${id}/swatch`,
  },
];

function matchVideo(href) {
  const provider = VIDEO_PROVIDERS.find((p) => p.re.test(href));
  return provider ? { provider, id: href.match(provider.re)[1] } : null;
}

/**
 * Turns a column holding a Vidyard or Wistia link (optionally with a poster
 * image above it) into a poster with a play overlay; clicking swaps in the
 * inline player. Columns without a video link are left untouched.
 * @param {Element} col
 */
function decorateVideo(col) {
  const link = [...col.querySelectorAll('a[href]')].find((a) => matchVideo(a.href));
  if (!link) return;
  const { provider, id } = matchVideo(link.href);
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
    img.src = provider.poster(id);
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
    iframe.src = provider.player(id);
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
