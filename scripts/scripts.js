import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  getMetadata,
} from './aem.js';

/**
 * Fetches a site fragment (nav, footer) as plain HTML. Uses the page metadata
 * path when set, otherwise the nearest one walking up from the page's folder,
 * so pages under a sub-site (e.g. /vishal/service) get that sub-site's fragment.
 * @param {string} name fragment name, also the metadata key
 * @returns {Promise<Response|null>} the first successful response
 */
export async function fetchSiteFragment(name) {
  const candidates = [];
  const meta = getMetadata(name);
  if (meta) candidates.push(new URL(meta, window.location).pathname.replace(/(\.plain)?\.html$/, ''));
  const { pathname } = window.location;
  const folders = pathname.slice(0, pathname.lastIndexOf('/') + 1).split('/').filter(Boolean);
  for (let i = folders.length; i >= 0; i -= 1) {
    candidates.push(`/${[...folders.slice(0, i), name].join('/')}`);
  }
  const tryNext = async ([path, ...rest]) => {
    if (!path) return null;
    const resp = await fetch(`${path}.plain.html`);
    return resp.ok ? resp : tryNext(rest);
  };
  return tryNext([...new Set(candidates)]);
}

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
export function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Gives sections an id from their "anchor" section metadata, so in-page links
 * (e.g. a hero CTA pointing at #getInTouch) can target them.
 * @param {Element} main The main element
 */
function decorateSectionAnchors(main) {
  main.querySelectorAll(':scope > .section[data-anchor]').forEach((section) => {
    const id = section.dataset.anchor.trim().replace(/^#/, '');
    if (id) section.id = id;
  });
}

/**
 * Prepends a breadcrumb trail built from the URL path (Home > Service > Plans)
 * when the page metadata "breadcrumbs" is true. Built eagerly from the path
 * alone, so it needs no fetch and causes no layout shift.
 * @param {Element} main The main element
 */
function buildBreadcrumbs(main) {
  if (getMetadata('breadcrumbs').toLowerCase() !== 'true') return;
  const segments = window.location.pathname.replace(/(\.plain)?\.html$/, '').split('/').filter(Boolean);
  if (!segments.length) return;

  const label = (segment) => decodeURIComponent(segment)
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  // optional "breadcrumb-titles" metadata: one label per path level, "A | B | C"
  // (the last levels of the path when there are fewer labels than levels)
  const titles = getMetadata('breadcrumb-titles').split('|').map((t) => t.trim()).filter(Boolean);
  const offset = segments.length - titles.length;
  const crumbs = [{ text: 'Home', href: '/' }, ...segments.map((segment, i) => ({
    text: (i >= offset && titles[i - offset]) || label(segment),
    href: `/${segments.slice(0, i + 1).join('/')}`,
  }))];

  const nav = document.createElement('nav');
  nav.className = 'breadcrumbs';
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');
  crumbs.forEach((crumb, i) => {
    const li = document.createElement('li');
    if (i === crumbs.length - 1) {
      li.textContent = crumb.text;
      li.setAttribute('aria-current', 'page');
    } else {
      const a = document.createElement('a');
      a.href = crumb.href;
      a.textContent = crumb.text;
      li.append(a);
    }
    ol.append(li);
  });
  nav.append(ol);
  main.prepend(nav);
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateSectionAnchors(main);
  decorateBlocks(main);
  decorateButtons(main);
  buildBreadcrumbs(main);
}

function addStructuredData() {
  const rawData = getMetadata('structuredData').trim();
  if (!rawData) return;

  let structuredData;
  try {
    structuredData = JSON.parse(rawData);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Invalid structuredData page metadata; expected JSON-LD.', error);
    return;
  }

  if (!structuredData || typeof structuredData !== 'object') {
    // eslint-disable-next-line no-console
    console.error('Invalid structuredData page metadata; expected a JSON-LD object or array.');
    return;
  }

  let script = document.querySelector('script[data-page-structured-data]');
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.pageStructuredData = '';
    document.head.append(script);
  }
  script.textContent = JSON.stringify(structuredData).replace(/</g, '\\u003c');
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = getMetadata('lang').trim() || 'en';
  const canonical = getMetadata('canonical').trim();
  if (canonical) {
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.append(canonicalLink);
    }
    canonicalLink.href = canonical;
  }
  addStructuredData();
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();