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

export default function decorate(block) {
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
