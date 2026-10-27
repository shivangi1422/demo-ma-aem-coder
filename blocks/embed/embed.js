/**
 * Maps a pasted URL to the URL to load in the iframe. YouTube, Vimeo,
 * Vidyard and Wistia page URLs are converted to their player URLs; anything else
 * (e.g. Genially view.genially.com / view.genial.ly) is embedded as is.
 * @param {URL} url
 * @returns {{src: string, provider: string}}
 */
function getEmbed(url) {
  const host = url.hostname.replace(/^www\./, '');
  if (host === 'youtu.be' || host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    const id = host === 'youtu.be'
      ? url.pathname.slice(1)
      : url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
    return { src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`, provider: 'youtube' };
  }
  if (host.endsWith('vimeo.com')) {
    const id = url.pathname.split('/').filter(Boolean).pop();
    const src = host === 'player.vimeo.com' ? url.href : `https://player.vimeo.com/video/${encodeURIComponent(id)}`;
    return { src, provider: 'vimeo' };
  }
  if (host.endsWith('vidyard.com')) {
    const id = url.pathname.split('/').filter(Boolean).pop().replace(/\.html$/, '');
    return { src: `https://play.vidyard.com/${encodeURIComponent(id)}?type=inline&disable_popouts=1`, provider: 'vidyard' };
  }
  if (host.endsWith('wistia.net') || host.endsWith('wistia.com')) {
    // fast.wistia.net/embed/iframe/{id}, {account}.wistia.com/medias/{id}
    const id = url.pathname.split('/').filter(Boolean).pop();
    return { src: `https://fast.wistia.net/embed/iframe/${encodeURIComponent(id)}?videoFoam=true`, provider: 'wistia' };
  }
  if (host.endsWith('genial.ly') || host.endsWith('genially.com')) {
    return { src: url.href, provider: 'genially' };
  }
  return { src: url.href, provider: 'generic' };
}

/**
 * Decorates the embed block: a responsive iframe for external content.
 * Authored structure: row 1 = URL (link or plain text), row 2 = optional
 * title (accessible name of the iframe). The iframe is created only when the
 * block nears the viewport.
 * @param {Element} block
 */
export default function decorate(block) {
  const link = block.querySelector('a[href]');
  let href = link ? link.href : '';
  const cells = [...block.querySelectorAll(':scope > div > div')];
  if (!href) {
    const urlCell = cells.find((c) => /^https?:\/\//i.test(c.textContent.trim()));
    href = urlCell ? urlCell.textContent.trim() : '';
  }

  // title = first cell text that is not the URL / link text
  const titleCell = cells.find((c) => {
    const text = c.textContent.trim();
    return text && !c.querySelector('a[href]') && !/^https?:\/\//i.test(text);
  });
  const linkText = link ? link.textContent.trim() : '';
  const linkTitle = linkText && !/^https?:\/\//i.test(linkText) ? linkText : '';

  let url;
  try {
    url = new URL(href, window.location.href);
  } catch {
    url = null;
  }
  if (!url || !/^https?:$/.test(url.protocol)) {
    block.replaceChildren();
    return;
  }

  const { src, provider } = getEmbed(url);
  const title = (titleCell && titleCell.textContent.trim()) || linkTitle || 'Embedded content';
  block.classList.add(`embed-${provider}`);

  const frameWrap = document.createElement('div');
  frameWrap.className = 'embed-frame';

  // fallback link until (or if) the iframe loads
  const fallback = document.createElement('a');
  fallback.className = 'embed-fallback';
  fallback.href = url.href;
  fallback.textContent = title;
  frameWrap.append(fallback);
  block.replaceChildren(frameWrap);

  const load = () => {
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = title;
    iframe.loading = 'lazy';
    iframe.allow = 'autoplay; picture-in-picture; encrypted-media';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    frameWrap.replaceChildren(iframe);
  };

  if (!('IntersectionObserver' in window)) {
    load();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      load();
    }
  }, { rootMargin: '200px' });
  observer.observe(block);
}
