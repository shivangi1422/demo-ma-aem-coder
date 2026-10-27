import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Resolves an authored video URL to an embeddable player URL.
 * Supports Wistia, YouTube and Vimeo; any other https URL is embedded as-is.
 * @param {URL} url
 * @param {boolean} autoplay
 * @returns {{ src: string, provider: string }|null}
 */
function getEmbed(url, autoplay) {
  const { hostname, pathname, searchParams } = url;
  const ap = autoplay ? '1' : '0';

  if (hostname.endsWith('wistia.net') || hostname.endsWith('wistia.com')) {
    const id = pathname.match(/\/(?:embed\/iframe|medias|embed\/medias)\/([a-z0-9]+)/i)?.[1];
    if (id) {
      return {
        provider: 'wistia',
        src: `https://fast.wistia.net/embed/iframe/${id}?videoFoam=true${autoplay ? '&autoPlay=true' : ''}`,
      };
    }
  }

  if (hostname.includes('youtube.com') || hostname === 'youtu.be') {
    const id = hostname === 'youtu.be'
      ? pathname.slice(1)
      : searchParams.get('v') || pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1];
    if (id) {
      return {
        provider: 'youtube',
        src: `https://www.youtube.com/embed/${id}?rel=0&autoplay=${ap}`,
      };
    }
  }

  if (hostname.endsWith('vimeo.com')) {
    const id = pathname.match(/\/(?:video\/)?(\d+)/)?.[1];
    if (id) {
      return {
        provider: 'vimeo',
        src: `https://player.vimeo.com/video/${id}?autoplay=${ap}`,
      };
    }
  }

  if (url.protocol === 'https:') return { provider: 'generic', src: url.href };
  return null;
}

function createIframe(embed, title) {
  const iframe = document.createElement('iframe');
  iframe.src = embed.src;
  iframe.title = title;
  iframe.loading = 'lazy';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
  iframe.setAttribute('frameborder', '0');
  return iframe;
}

/**
 * Decorates the embed-video block.
 * Authored structure: one row with an optional poster image and a link to the
 * video (e.g. https://fast.wistia.net/embed/iframe/<mediaId>).
 * The iframe is only created when the block approaches the viewport, or on
 * click of the poster when one is authored.
 * @param {Element} block
 */
export default function decorate(block) {
  const link = block.querySelector('a[href]');
  const rawUrl = (link ? link.href : block.textContent).trim();
  const img = block.querySelector('picture > img');

  let url;
  try {
    url = new URL(rawUrl, window.location.href);
  } catch {
    return;
  }

  const title = (link && link.title && link.title !== link.href ? link.title : '')
    || (img && img.alt)
    || 'Embedded video';

  const wrapper = document.createElement('div');
  wrapper.className = 'embed-video-player';
  moveInstrumentation(block.firstElementChild || block, wrapper);

  const embed = getEmbed(url, Boolean(img));
  if (!embed) return;
  block.classList.add(`embed-video-${embed.provider}`);

  if (img) {
    // Poster + play button: load the player only on user intent.
    const poster = createOptimizedPicture(img.src, img.alt, false, [{ width: '1200' }]);
    moveInstrumentation(img, poster.querySelector('img'));
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'embed-video-play';
    button.setAttribute('aria-label', `Play video: ${title}`);
    button.append(poster);
    button.addEventListener('click', () => {
      wrapper.replaceChildren(createIframe(embed, title));
      block.classList.add('embed-video-is-loaded');
    }, { once: true });
    wrapper.append(button);
    block.replaceChildren(wrapper);
    return;
  }

  block.replaceChildren(wrapper);
  const load = () => {
    if (wrapper.querySelector('iframe')) return;
    wrapper.append(createIframe(embed, title));
    block.classList.add('embed-video-is-loaded');
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        load();
      }
    }, { rootMargin: '200px' });
    observer.observe(block);
  } else {
    load();
  }
}
