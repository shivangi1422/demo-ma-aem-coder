import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * Adds the mobile hamburger and keeps the menu state in sync with the viewport.
 * @param {Element} nav The nav element
 * @param {Element} navSections The nav sections within the nav
 */
function addHamburger(nav, navSections) {
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));
}

/**
 * Pages of a site with its own header carry nav metadata pointing at a nav in
 * a site folder ("/content/<folder>/nav" locally, "/<folder>/nav" on DA/EDS).
 * @param {string} navMeta The nav metadata value
 * @returns {string|null} The site-relative nav path ("/<folder>/nav") or null
 */
function getSiteNavPath(navMeta) {
  if (!navMeta) return null;
  const { pathname } = new URL(navMeta, window.location);
  const sitePath = pathname.replace(/^\/content(?=\/)/, '').replace(/(\.plain)?\.html$/, '');
  return /^\/[^/]+\/nav$/.test(sitePath) ? sitePath : null;
}

/**
 * Fetches a site-folder nav: the /content copy first (local aem up),
 * then the site root copy (DA/EDS production).
 * Relative media paths are resolved against the fragment, not the page.
 * @param {string} sitePath The site-relative nav path, e.g. "/<folder>/nav"
 * @returns {Promise<HTMLElement|null>} The fragment body
 */
async function fetchSiteNav(sitePath) {
  const urls = [`/content${sitePath}.plain.html`, `${sitePath}.plain.html`];
  for (let i = 0; i < urls.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const resp = await fetch(urls[i]);
    if (resp.ok) {
      // eslint-disable-next-line no-await-in-loop
      const html = await resp.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const base = new URL(urls[i], window.location);
      doc.querySelectorAll('img[src]').forEach((img) => {
        img.setAttribute('src', new URL(img.getAttribute('src'), base).pathname);
      });
      return doc.body;
    }
  }
  return null;
}

const SEARCH_ICON = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.5-4.5"></path></svg>`;

// link columns per mega menu panel
const PANEL_COLUMNS = 2;

/**
 * Sets the open state of a dropdown item: the trigger link exposes it, the
 * item keeps it for the shared keyboard/escape handlers.
 * @param {Element} item The dropdown list item
 * @param {boolean} expanded Whether the panel is open
 */
function setDropExpanded(item, expanded) {
  item.setAttribute('aria-expanded', expanded);
  const link = item.querySelector(':scope > .nav-link');
  if (link) link.setAttribute('aria-expanded', expanded);
}

/**
 * Collapses every dropdown item of a list.
 * @param {Element} list The top-level nav list
 */
function collapseDrops(list) {
  list.querySelectorAll(':scope > .nav-drop').forEach((item) => setDropExpanded(item, false));
}

/**
 * Marks the link to the current page (aria-current) and its dropdown item.
 * Site-folder pages are served under /content locally, links are site paths.
 * @param {Element} list The top-level nav list
 */
function markCurrentPage(list) {
  const here = window.location.pathname.replace(/^\/content(?=\/)/, '').replace(/\.html$/, '');
  list.querySelectorAll('a[href]').forEach((a) => {
    if (a.origin !== window.location.origin || a.pathname.replace(/\.html$/, '') !== here) return;
    a.setAttribute('aria-current', 'page');
    const item = a.closest('.nav-drop');
    if (item) item.classList.add('is-active');
  });
}

/**
 * Builds the top-level nav list: each item with a nested list becomes a
 * hover dropdown panel on desktop and a single-open accordion on mobile;
 * links to other sites open in a new tab.
 * @param {Element} list The top-level list from the nav fragment
 */
function decorateMegaList(list) {
  [...list.children].forEach((item) => {
    const link = item.querySelector(':scope > a');
    if (link) {
      link.classList.add('nav-link');
      if (link.origin !== window.location.origin && !link.getAttribute('href').startsWith('#')) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    }
    const subList = item.querySelector(':scope > ul');
    if (!subList) return;
    item.classList.add('nav-drop');
    const panel = document.createElement('div');
    panel.className = 'nav-dropdown';
    const content = document.createElement('div');
    content.className = 'nav-dropdown-content';
    // balanced columns, filled top to bottom
    const entries = [...subList.children];
    const perColumn = Math.ceil(entries.length / PANEL_COLUMNS);
    for (let i = 0; i < entries.length; i += perColumn) {
      const column = document.createElement('div');
      column.className = 'nav-dropdown-column';
      const columnList = document.createElement('ul');
      columnList.append(...entries.slice(i, i + perColumn));
      column.append(columnList);
      content.append(column);
    }
    subList.remove();
    panel.append(content);
    item.append(panel);
    setDropExpanded(item, false);
    item.addEventListener('mouseenter', () => {
      if (isDesktop.matches) setDropExpanded(item, true);
    });
    item.addEventListener('mouseleave', () => {
      if (isDesktop.matches) setDropExpanded(item, false);
    });
    // mobile: the whole trigger row toggles its section, one open at a time
    if (link) {
      link.addEventListener('click', (e) => {
        if (isDesktop.matches) return;
        e.preventDefault();
        const open = link.getAttribute('aria-expanded') === 'true';
        collapseDrops(list);
        if (!open) setDropExpanded(item, true);
      });
    }
  });
  markCurrentPage(list);
}

/**
 * Builds the search dialog from the tools section of the nav fragment:
 * leading paragraph = input placeholder, heading + list + next paragraph =
 * hint body, remaining paragraphs = footer. Typing filters the header links.
 * @param {Element} source The tools section from the nav fragment
 * @param {Element} nav The nav element (links to search)
 * @returns {{dialog: Element, open: Function}} The dialog and its opener
 */
function buildSearch(source, nav) {
  const dialog = document.createElement('div');
  dialog.className = 'nav-search';
  dialog.hidden = true;
  const modal = document.createElement('div');
  modal.className = 'nav-search-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Search');

  const children = [...source.children];
  const headingIndex = children.findIndex((el) => /^H\d$/.test(el.tagName));
  const placeholder = children.find((el, i) => el.tagName === 'P' && i < headingIndex);
  const listIndex = children.findIndex((el, i) => el.tagName === 'UL' && i > headingIndex);
  const hintEnd = listIndex >= 0 && children[listIndex + 1]?.tagName === 'P' ? listIndex + 2 : listIndex + 1;
  const hintNodes = headingIndex >= 0 ? children.slice(headingIndex, hintEnd) : [];
  const footerNodes = children.slice(Math.max(hintEnd, 0)).filter((el) => el.tagName === 'P');

  const header = document.createElement('div');
  header.className = 'nav-search-header';
  header.innerHTML = `${SEARCH_ICON}<input class="nav-search-input" type="text" autocomplete="off" aria-label="Search query">
    <button type="button" class="nav-search-close" aria-label="Close search">ESC</button>`;
  const input = header.querySelector('input');
  if (placeholder) input.placeholder = placeholder.textContent.trim();

  const body = document.createElement('div');
  body.className = 'nav-search-body';
  const hint = document.createElement('div');
  hint.className = 'nav-search-hint';
  hintNodes.forEach((el) => {
    if (/^H\d$/.test(el.tagName)) el.classList.add('nav-search-title');
    else if (el.tagName === 'UL') el.classList.add('nav-search-quick');
    else el.classList.add('nav-search-tip');
    hint.append(el);
  });
  const results = document.createElement('div');
  results.className = 'nav-search-results';
  results.hidden = true;
  body.append(hint, results);

  const footer = document.createElement('div');
  footer.className = 'nav-search-footer';
  footerNodes.forEach((p) => {
    p.querySelectorAll('code').forEach((code) => {
      const kbd = document.createElement('kbd');
      kbd.textContent = code.textContent;
      code.replaceWith(kbd);
    });
    footer.append(p);
  });
  modal.append(header, body);
  if (footer.children.length) modal.append(footer);
  dialog.append(modal);

  let active = -1;
  const resultLinks = () => [...results.querySelectorAll('a')];
  const setActive = (index) => {
    const links = resultLinks();
    active = links.length ? (index + links.length) % links.length : -1;
    links.forEach((a, i) => a.classList.toggle('is-active', i === active));
  };
  const search = () => {
    const query = input.value.trim().toLowerCase();
    hint.hidden = query.length >= 2;
    results.hidden = query.length < 2;
    results.textContent = '';
    active = -1;
    if (query.length < 2) return;
    const seen = new Set();
    const matches = [...nav.querySelectorAll('.nav-sections a[href]'), ...hint.querySelectorAll('a[href]')]
      .filter((a) => {
        const key = a.getAttribute('href');
        if (seen.has(key) || key.startsWith('#') || !a.textContent.toLowerCase().includes(query)) return false;
        seen.add(key);
        return true;
      });
    const count = document.createElement('p');
    count.className = 'nav-search-count';
    count.textContent = `${matches.length} results found`;
    const list = document.createElement('ul');
    matches.forEach((a) => {
      const li = document.createElement('li');
      const link = a.cloneNode(true);
      link.className = '';
      li.append(link);
      list.append(li);
    });
    results.append(count, list);
  };

  let opener = null;
  const close = () => {
    dialog.hidden = true;
    if (opener) opener.focus();
  };
  const open = (trigger) => {
    opener = trigger || null;
    dialog.hidden = false;
    input.focus();
  };
  input.addEventListener('input', search);
  header.querySelector('.nav-search-close').addEventListener('click', close);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(active + (e.key === 'ArrowDown' ? 1 : -1));
    } else if (e.key === 'Enter' && e.target === input && active >= 0) {
      resultLinks()[active].click();
    }
  });
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      open(document.activeElement);
    }
  });
  return { dialog, open };
}

// scroll distance after which the fixed header shows its scrolled shadow
const SCROLLED_OFFSET = 100;

/**
 * Hides the fixed header while scrolling down and shows it again on scroll up;
 * flags the scrolled state once the page has moved past the header.
 * @param {Element} navWrapper The fixed nav wrapper
 * @param {Element} nav The nav element
 */
function watchScroll(navWrapper, nav) {
  let lastY = window.scrollY;
  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    const height = navWrapper.offsetHeight;
    const menuOpen = !isDesktop.matches && nav.getAttribute('aria-expanded') === 'true';
    navWrapper.classList.toggle('scrolled', y > SCROLLED_OFFSET);
    if (y <= 0 || menuOpen) navWrapper.classList.remove('nav-hidden');
    else if (y > lastY && y > height) navWrapper.classList.add('nav-hidden');
    else if (y < lastY) navWrapper.classList.remove('nav-hidden');
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });
}

/**
 * Decorates a site-folder header: logo, hover mega menu panels, search
 * dialog and hide-on-scroll fixed bar, all read from the nav fragment
 * (brand, sections and tools sections, in that order).
 * @param {Element} block The header block element
 * @param {Element} fragment The nav fragment body
 */
function decorateSiteHeader(block, fragment) {
  const [brandSource, sectionsSource, toolsSource] = [...fragment.children];
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.className = 'nav-mega';

  const navBrand = document.createElement('div');
  navBrand.className = 'nav-brand';
  if (brandSource) navBrand.append(...brandSource.childNodes);
  nav.append(navBrand);

  const navSections = document.createElement('div');
  navSections.className = 'nav-sections';
  // taps on empty space in the full-screen mobile menu keep focus inside the nav
  // (otherwise the focus-lost handler closes the menu)
  navSections.tabIndex = -1;
  const wrapper = document.createElement('div');
  wrapper.className = 'default-content-wrapper';
  if (sectionsSource) wrapper.append(...sectionsSource.childNodes);
  const list = wrapper.querySelector(':scope > ul');
  if (list) decorateMegaList(list);
  navSections.append(wrapper);
  nav.append(navSections);

  const navTools = document.createElement('div');
  navTools.className = 'nav-tools';
  nav.append(navTools);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  if (toolsSource) {
    const { dialog, open } = buildSearch(toolsSource, nav);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-search-button';
    button.setAttribute('aria-label', 'Search');
    button.title = 'Search (Ctrl+K)';
    button.innerHTML = SEARCH_ICON;
    button.addEventListener('click', () => open(button));
    navTools.append(button);
    block.append(dialog);
  }

  addHamburger(nav, navSections);
  if (list) {
    // sections start collapsed every time the mobile menu opens or closes
    nav.querySelector('.nav-hamburger').addEventListener('click', () => collapseDrops(list));
    // no panel stays open when the viewport crosses the desktop breakpoint
    isDesktop.addEventListener('change', () => collapseDrops(list));
  }
  watchScroll(navWrapper, nav);
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const siteNavPath = getSiteNavPath(navMeta);
  const siteFragment = siteNavPath ? await fetchSiteNav(siteNavPath) : null;
  if (siteFragment) {
    decorateSiteHeader(block, siteFragment);
    return;
  }

  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // hamburger for mobile
  addHamburger(nav, navSections);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
