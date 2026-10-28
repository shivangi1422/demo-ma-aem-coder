/**
 * Breadcrumbs (auto-block, see buildBreadcrumbs in scripts.js).
 * Builds Home › ancestor pages › current page from the URL path, as on mybeckman.in.
 * Labels come from each page's metadata: "breadcrumb-title" if set, otherwise the page
 * title without the site suffix (" - Beckman Coulter Life Sciences").
 * Works on AEM author (/content/<site>/... .html), EDS preview/live and the local preview.
 */

const SITE_SUFFIX = /\s+[-|–]\s+Beckman Coulter.*$/i;

function labelFrom(doc) {
  const meta = (name) => doc.querySelector(`meta[name="${name}"], meta[property="${name}"]`)?.content;
  const label = meta('breadcrumb-title') || meta('og:title') || doc.title || '';
  return label.replace(SITE_SUFFIX, '').trim();
}

function toTitle(segment) {
  return segment.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Splits the current URL into the site root, page path segments and the URL extension.
 */
function resolvePath() {
  const { hostname, pathname } = window.location;
  const path = pathname.replace(/\.html$/, '').replace(/\/$/, '');
  if (hostname.includes('adobeaemcloud.com')) {
    const root = (path.match(/^\/content\/[^/]+/) || [''])[0];
    return {
      root, ext: '.html', home: `${root}/index.html`, segments: path.slice(root.length).split('/').filter(Boolean),
    };
  }
  // local preview serves the content folder under /content
  const root = path.startsWith('/content/') ? '/content' : '';
  return {
    root, ext: '', home: '/', segments: path.slice(root.length).split('/').filter(Boolean),
  };
}

async function fetchLabel(url, fallback) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return fallback;
    const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
    return labelFrom(doc) || fallback;
  } catch (e) {
    return fallback;
  }
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const {
    root, ext, home, segments,
  } = resolvePath();
  if (!segments.length || (segments.length === 1 && segments[0] === 'index')) {
    // no trail on the home page
    block.closest('.section')?.remove();
    return;
  }

  const ancestors = await Promise.all(segments.slice(0, -1).map(async (segment, i) => {
    const href = `${root}/${segments.slice(0, i + 1).join('/')}${ext}`;
    return { href, label: await fetchLabel(href, toTitle(segment)) };
  }));
  const crumbs = [
    { href: home, label: 'Home' },
    ...ancestors,
    { label: labelFrom(document) || toTitle(segments[segments.length - 1]) },
  ];

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ul = document.createElement('ul');
  crumbs.forEach(({ href, label }, i) => {
    const li = document.createElement('li');
    if (i === crumbs.length - 1) {
      li.setAttribute('aria-current', 'page');
      li.textContent = label;
    } else {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      li.append(a);
    }
    ul.append(li);
  });
  nav.append(ul);
  block.replaceChildren(nav);
}
