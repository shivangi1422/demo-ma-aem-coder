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
} from './aem.js';

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

/** page templates with their own stylesheet in /styles/{template}.css */
const TEMPLATE_STYLES = ['mybeckman', 'gspann'];

const GENERIC_LINK_TEXT = /^(learn more|read more|explore|explore now|download|watch video|watch now|read blog|read article|read case study)$/i;

/**
 * Gives generic links ("Learn more", "Download"…) a screen-reader-only suffix
 * naming what they point to: the nearest heading of their card or section.
 * Runs after blocks are decorated; the visible text is unchanged.
 * @param {Element} main The main element
 */
export function describeGenericLinks(main) {
  main.querySelectorAll('a[href]').forEach((a) => {
    const text = a.textContent.replace(/[→›]/g, '').trim();
    if (!GENERIC_LINK_TEXT.test(text) || a.hasAttribute('aria-label') || a.querySelector('.visually-hidden')) return;
    let scope = a.parentElement;
    let heading = null;
    for (let i = 0; scope && scope !== main && i < 6 && !heading; i += 1) {
      heading = [...scope.querySelectorAll('h1, h2, h3, h4, h5, h6')].find((h) => !h.contains(a));
      scope = scope.parentElement;
    }
    const context = heading?.textContent.trim();
    if (!context) return;
    const hint = document.createElement('span');
    hint.className = 'visually-hidden';
    hint.textContent = `: ${context}`;
    a.append(hint);
  });
}

/**
 * Image-panel and spectrum-gradient sections: exposes the section's "Background Image" property
 * (section metadata "background", read into section.dataset.background) as
 * the --section-background-image custom property used by styles.css.
 * Other sections (e.g. cards-grid showcase) read dataset.background
 * themselves and are left untouched.
 * @param {Element} main The main element
 */
export function decorateSectionBackgrounds(main) {
  main.querySelectorAll(':scope > .section:is(.image-panel, .spectrum-gradient)[data-background]').forEach((section) => {
    const { background } = section.dataset;
    let url;
    try {
      url = new URL(background, window.location.href);
    } catch {
      return;
    }
    if (!/^https?:$/.test(url.protocol)) return;
    section.style.setProperty('--section-background-image', `url("${url.href.replace(/"/g, '%22')}")`);
  });
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
  decorateSectionBackgrounds(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  // template stylesheets (page metadata "template", e.g. mybeckman)
  const templateStyles = TEMPLATE_STYLES.filter((name) => document.body.classList.contains(name))
    .map((name) => loadCSS(`${window.hlx.codeBasePath}/styles/${name}.css`));
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    await Promise.allSettled(templateStyles);
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
  describeGenericLinks(main);

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
