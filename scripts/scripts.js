import {
  buildBlock,
  decorateBlock,
  loadBlock,
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  getMetadata,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  toClassName,
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
 * Returns the content elements of a block row's cells, the same whichever way the
 * row is delivered: <div><div>…</div></div> (preview), the rich text wrapped in an
 * extra element, or the content placed on the row itself (authoring). Also undoes
 * what the browser makes of stored <p><h4>…</h4></p>: the heading loses its
 * paragraph and the empty paragraphs around it are removed.
 * @param {Element} row A block row
 * @returns {Element[]} One element per cell whose children are the cell content
 */
export function rowContentCells(row) {
  const children = [...row.children];
  const cells = children.length && children.every((el) => el.tagName === 'DIV') ? children : [row];
  // a lone <div>, or a <p> that only holds block content (aem.js wraps cells that do not
  // start with a paragraph into one), is a wrapper around the real content
  const isWrapper = (el) => el.tagName === 'DIV'
    || (el.tagName === 'P' && el.querySelector(':scope > :is(div, p, h1, h2, h3, h4, h5, h6, ul, ol)'));
  return cells.map((cell) => {
    let root = cell;
    while (root.children.length === 1 && isWrapper(root.firstElementChild)
      && ![...root.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())) {
      root = root.firstElementChild;
    }
    root.querySelectorAll(':scope > p').forEach((p) => {
      const only = p.children.length === 1 ? p.firstElementChild : null;
      if (only && /^H[1-6]$/.test(only.tagName) && p.textContent.trim() === only.textContent.trim()) {
        p.replaceWith(only);
      } else if (!p.textContent.trim() && !p.querySelector('img, picture, svg, .icon')) {
        p.remove();
      }
    });
    return root;
  });
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
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  // Section "Anchor ID" (section metadata `anchor`) becomes the section's id for in-page links.
  main.querySelectorAll('.section[data-anchor]').forEach((section) => {
    section.id = toClassName(section.dataset.anchor);
  });
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Site themes given by page location, for pages that don't set `theme` metadata themselves:
 * [path pattern, theme class]. Paths match locally (/content/…), in the authoring
 * environment (/content/<site>/…) and on the published site.
 */
const PATH_THEMES = [
  // mybeckman.in home page
  [/^(\/content(\/[^/]+)?)?\/en-in(\.html|\/(index(\.html)?)?)?$/, 'theme-mybeckman'],
  // mybeckman.in service hub (inner-page design)
  [/^(\/content(\/[^/]+)?)?\/en-in\/service(\.html)?\/?$/, 'theme-mybeckman mybeckman-inner'],
];

function applyPathTheme() {
  if (getMetadata('theme')) return;
  const match = PATH_THEMES.find(([pattern]) => pattern.test(window.location.pathname));
  if (match) document.body.classList.add(...match[1].split(' '));
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  applyPathTheme();
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
 * Site themes (page metadata `theme`) that bring their own header/footer block,
 * named `<part>-<theme>`, e.g. theme-mybeckman -> header-mybeckman.
 * Pages without one of these themes keep the default header and footer.
 */
const THEMED_BLOCKS = {
  header: ['mybeckman'],
  footer: ['mybeckman'],
};

/**
 * Loads the header or footer block for the page's theme.
 * @param {Element} el header or footer element
 * @param {string} part 'header' or 'footer'
 * @param {Function} loadDefault default loader from aem.js
 * @returns {Promise}
 */
function loadThemedBlock(el, part, loadDefault) {
  const theme = THEMED_BLOCKS[part].find((t) => document.body.classList.contains(`theme-${t}`));
  if (!theme) return loadDefault(el);
  const block = buildBlock(`${part}-${theme}`, '');
  el.append(block);
  decorateBlock(block);
  return loadBlock(block);
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadThemedBlock(doc.querySelector('header'), 'header', loadHeader);

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadThemedBlock(doc.querySelector('footer'), 'footer', loadFooter);

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
