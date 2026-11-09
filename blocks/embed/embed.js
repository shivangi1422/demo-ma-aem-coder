function embedUrl(href) {
  const url = new URL(href);
  if (url.hostname.includes('wistia')) {
    const id = url.pathname.split('/').filter(Boolean).pop();
    return `https://fast.wistia.net/embed/iframe/${id}?videoFoam=true`;
  }
  if (url.hostname === 'youtu.be') return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
  const v = url.searchParams.get('v');
  if (url.hostname.includes('youtube.com') && v) return `https://www.youtube.com/embed/${v}`;
  const last = url.pathname.split('/').filter(Boolean).pop();
  if (url.hostname === 'vimeo.com') return `https://player.vimeo.com/video/${last}`;
  return href;
}

/**
 * Embed: a Wistia, YouTube or Vimeo link becomes a 16:9 player,
 * loaded when it comes near the viewport.
 * Rows: one cell with the link (an optional poster image above it is ignored).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const link = block.querySelector('a[href]');
  if (!link) return;
  const src = embedUrl(link.href);
  const title = link.title || link.textContent.trim() || 'Video player';
  const player = document.createElement('div');
  player.className = 'embed-player';
  block.replaceChildren(player);

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    observer.disconnect();
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = title;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    player.append(iframe);
  }, { rootMargin: '300px' });
  observer.observe(block);
}
