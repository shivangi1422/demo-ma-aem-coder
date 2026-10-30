// media query match that indicates desktop width
const isDesktop = window.matchMedia('(width >= 1200px)');

// width of one cascading flyout level (matches header.css --nav-flyout-width)
const FLYOUT_WIDTH = 300;

/**
 * Fetches the nav fragment as plain HTML (metadata-independent dual fetch).
 * /content/nav.plain.html serves local preview, /nav.plain.html serves DA/EDS.
 * @returns {Promise<Element|null>} container with the nav sections
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  // resolve relative image paths against the fragment location
  container.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:|\/|data:)/.test(src)) img.src = new URL(src, resp.url).href;
    img.loading = 'eager';
  });
  return container;
}

/**
 * Replaces an SVG image with inline SVG so icons can inherit the text color.
 * @param {Element} img image element
 */
async function inlineSvg(img) {
  if (!img || !/\.svg($|\?)/.test(img.src)) return;
  try {
    const resp = await fetch(img.src);
    if (!resp.ok) return;
    const svg = new DOMParser().parseFromString(await resp.text(), 'image/svg+xml').querySelector('svg');
    if (!svg) return;
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.classList.add('nav-icon');
    img.replaceWith(svg);
  } catch {
    // keep the image when the SVG cannot be inlined
  }
}

/**
 * Returns the text of a list item, excluding nested lists.
 * @param {Element} li list item
 * @returns {string} label text
 */
function ownText(li) {
  return [...li.childNodes]
    .filter((n) => n.nodeType === Node.TEXT_NODE || (n.nodeType === Node.ELEMENT_NODE && n.tagName !== 'UL'))
    .map((n) => n.textContent)
    .join('')
    .trim();
}

function closePanels(nav) {
  nav.querySelectorAll('.nav-drop[aria-expanded="true"], .nav-tool[aria-expanded="true"]').forEach((item) => {
    item.setAttribute('aria-expanded', 'false');
    const trigger = item.querySelector(':scope > button');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    item.querySelectorAll('.nav-has-sub.is-open').forEach((sub) => sub.classList.remove('is-open'));
    const panel = item.querySelector(':scope > .nav-panel-cascade');
    if (panel) panel.style.width = '';
  });
  const overlay = nav.closest('header')?.querySelector('.nav-overlay');
  if (overlay) overlay.classList.remove('is-open');
}

function openPanel(nav, item) {
  closePanels(nav);
  item.setAttribute('aria-expanded', 'true');
  const trigger = item.querySelector(':scope > button');
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
  if (item.querySelector(':scope > .nav-panel-cascade')) {
    const overlay = nav.closest('header')?.querySelector('.nav-overlay');
    if (overlay) overlay.classList.add('is-open');
  }
}

/**
 * Opens a cascading flyout level and widens the cascade panel to fit the open levels.
 * @param {Element} sub list item with a nested list
 */
function openFlyout(sub) {
  [...sub.parentElement.children].forEach((sibling) => {
    if (sibling === sub) return;
    sibling.classList.remove('is-open');
    sibling.querySelectorAll('.is-open').forEach((d) => d.classList.remove('is-open'));
  });
  sub.classList.add('is-open');
  const panel = sub.closest('.nav-panel-cascade');
  if (panel && isDesktop.matches) {
    const depth = panel.querySelectorAll('.nav-has-sub.is-open').length;
    panel.style.width = `${FLYOUT_WIDTH * (depth + 1)}px`;
  }
}

/**
 * Builds a cascading flyout panel from a nested link list.
 * @param {Element} list top-level list of the panel
 * @returns {Element} panel
 */
function buildCascadePanel(list) {
  const panel = document.createElement('div');
  panel.className = 'nav-panel nav-panel-cascade';
  list.classList.add('nav-flyout-list');
  list.querySelectorAll('li').forEach((li) => {
    // a title + link repeating the parent item is a mobile-only "view all" entry
    const parent = li.parentElement.closest('li');
    const parentLink = parent && parent.querySelector(':scope > a');
    const link = li.querySelector(':scope > a');
    if (parentLink && ((link && link.getAttribute('href') === parentLink.getAttribute('href'))
      || (!link && ownText(li) === parentLink.textContent.trim()))) {
      li.classList.add('nav-mobile-only');
    }
    const subList = li.querySelector(':scope > ul');
    if (subList) {
      li.classList.add('nav-has-sub');
      subList.classList.add('nav-flyout-list');
      if (!subList.querySelector('ul')) subList.classList.add('nav-flyout-leaf');
      li.addEventListener('mouseenter', () => { if (isDesktop.matches) openFlyout(li); });
      li.addEventListener('focusin', () => { if (isDesktop.matches) openFlyout(li); });
      if (link) {
        link.addEventListener('click', (e) => {
          if (!isDesktop.matches && !li.classList.contains('is-open')) {
            e.preventDefault();
            openFlyout(li);
          }
        });
      }
    } else if (!li.querySelector(':scope > a')) {
      li.classList.add('nav-flyout-title');
    }
  });
  panel.append(list);
  return panel;
}

/**
 * Builds a multi-column panel from a list of titled link groups.
 * @param {Element} list list whose items are a title followed by a link list
 * @returns {Element} panel
 */
function buildColumnsPanel(list) {
  const panel = document.createElement('div');
  panel.className = 'nav-panel nav-panel-columns';
  [...list.children].forEach((li) => {
    const col = document.createElement('div');
    col.className = 'nav-panel-column';
    const title = document.createElement('p');
    title.className = 'nav-panel-title';
    title.textContent = ownText(li);
    col.append(title);
    const links = li.querySelector(':scope > ul');
    if (links) col.append(links);
    panel.append(col);
  });
  return panel;
}

/**
 * Turns the main navigation list into megamenu triggers and panels.
 * @param {Element} section nav sections element
 * @param {Element} nav nav element
 */
function decorateSections(section, nav) {
  const list = section.querySelector(':scope > ul');
  if (!list) return;
  list.classList.add('nav-sections-list', 'nav-list');
  [...list.children].forEach((li, i) => {
    const subList = li.querySelector(':scope > ul');
    const label = ownText(li);
    li.textContent = '';
    li.className = 'nav-drop nav-megamenu-trigger';
    li.setAttribute('aria-expanded', 'false');
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'nav-drop-trigger nav-trigger';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', `nav-panel-${i}`);
    trigger.innerHTML = `<span>${label}</span><span class="nav-chevron" aria-hidden="true"></span>`;
    li.append(trigger);
    if (!subList) return;
    // link lists open as a cascade, titled groups render as columns
    const isCascade = [...subList.children].some((item) => item.querySelector(':scope > a'));
    const panel = isCascade ? buildCascadePanel(subList) : buildColumnsPanel(subList);
    panel.id = `nav-panel-${i}`;
    li.append(panel);

    li.addEventListener('mouseenter', () => { if (isDesktop.matches) openPanel(nav, li); });
    li.addEventListener('mouseleave', () => { if (isDesktop.matches) closePanels(nav); });
    trigger.addEventListener('click', () => {
      if (li.getAttribute('aria-expanded') === 'true') closePanels(nav);
      else openPanel(nav, li);
    });
  });
}

/**
 * Builds the contents of a utility dropdown from a plain list.
 * strong > a = primary button, em > a = secondary button, strong-only = heading,
 * nested list = select (strong marks the selected option), plain links = link list.
 * @param {Element} list utility item list
 * @returns {Element} panel
 */
function buildToolPanel(list) {
  const panel = document.createElement('div');
  panel.className = 'nav-tool-panel';
  const selects = [];
  let actionLink = null;
  let linkList = null;
  [...list.children].forEach((li) => {
    const options = li.querySelector(':scope > ul');
    const strongLink = li.querySelector(':scope > strong > a');
    const emLink = li.querySelector(':scope > em > a');
    const onlyLink = li.children.length === 1 && li.firstElementChild.tagName === 'A' && ownText(li) === li.firstElementChild.textContent.trim();
    if (!onlyLink) linkList = null;
    if (options) {
      const field = document.createElement('label');
      field.className = 'nav-tool-field';
      const text = document.createElement('span');
      text.textContent = ownText(li);
      const select = document.createElement('select');
      [...options.querySelectorAll(':scope > li > a')].forEach((a) => {
        const [key, value] = new URL(a.getAttribute('href'), window.location).search.slice(1).split('=');
        select.name = key;
        const option = new Option(a.textContent.trim(), decodeURIComponent(value || ''));
        option.selected = !!a.querySelector('strong');
        select.append(option);
      });
      selects.push(select);
      field.append(text, select);
      panel.append(field);
    } else if (strongLink || emLink) {
      const link = strongLink || emLink;
      link.className = `button ${strongLink ? 'primary' : 'secondary'}`;
      panel.append(link);
      actionLink = link;
    } else if (li.children.length === 1 && li.firstElementChild.tagName === 'STRONG') {
      const heading = document.createElement('p');
      heading.className = 'nav-tool-heading';
      heading.textContent = li.textContent.trim();
      panel.append(heading);
    } else if (onlyLink) {
      if (!linkList) {
        linkList = document.createElement('ul');
        linkList.className = 'nav-tool-links';
        panel.append(linkList);
      }
      linkList.append(li);
    } else {
      const p = document.createElement('p');
      p.append(...li.childNodes);
      panel.append(p);
    }
  });
  if (selects.length && actionLink) {
    const updateHref = () => {
      actionLink.href = `?${selects.map((s) => `${s.name}=${encodeURIComponent(s.value)}`).join('&')}`;
    };
    selects.forEach((s) => s.addEventListener('change', updateHref));
    updateHref();
  }
  return panel;
}

/**
 * Turns the utility list (icon + dropdown list) into icon dropdowns.
 * @param {Element} section nav tools element
 * @param {Element} nav nav element
 */
function decorateTools(section, nav) {
  const list = section.querySelector(':scope > ul');
  if (!list) return;
  list.classList.add('nav-tools-list');
  [...list.children].forEach((li, i) => {
    const icon = li.querySelector(':scope > img, :scope > picture');
    const subList = li.querySelector(':scope > ul');
    li.className = 'nav-tool';
    li.setAttribute('aria-expanded', 'false');
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'nav-tool-trigger';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', `nav-tool-panel-${i}`);
    const img = icon && (icon.tagName === 'IMG' ? icon : icon.querySelector('img'));
    trigger.setAttribute('aria-label', img ? img.alt : ownText(li));
    if (icon) {
      if (img) img.alt = '';
      trigger.append(icon);
      inlineSvg(img);
    }
    const panel = subList ? buildToolPanel(subList) : null;
    li.textContent = '';
    li.append(trigger);
    if (!panel) return;
    panel.id = `nav-tool-panel-${i}`;
    li.append(panel);
    li.addEventListener('mouseenter', () => { if (isDesktop.matches) openPanel(nav, li); });
    li.addEventListener('mouseleave', () => { if (isDesktop.matches) closePanels(nav); });
    trigger.addEventListener('click', () => {
      if (li.getAttribute('aria-expanded') === 'true') closePanels(nav);
      else openPanel(nav, li);
    });
  });
}

/**
 * Replaces the search link with a search form (submits to the link target).
 * @param {Element} section nav search element
 */
function decorateSearch(section) {
  const link = section.querySelector('a');
  if (!link) return;
  const action = link.getAttribute('href');
  const icon = link.querySelector('img');
  const placeholder = link.textContent.trim();
  const form = document.createElement('form');
  form.className = 'nav-search-form';
  form.setAttribute('role', 'search');
  form.action = action;
  const button = document.createElement('button');
  button.type = 'submit';
  button.setAttribute('aria-label', icon ? icon.alt : 'Search');
  if (icon) {
    icon.alt = '';
    button.append(icon);
    inlineSvg(icon);
  }
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder);
  form.append(button, input);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const term = input.value.trim();
    window.location.href = term ? `${action}#q=${encodeURIComponent(term)}` : action;
  });
  section.textContent = '';
  section.append(form);
}

/**
 * Marks the call-to-action links in the header actions.
 * @param {Element} section nav actions element
 */
function decorateActions(section) {
  section.querySelectorAll('strong > a').forEach((a) => {
    a.className = 'button primary';
    a.parentElement.replaceWith(a);
  });
}

/**
 * Toggles the entire nav (mobile)
 * @param {Element} nav The container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (button) button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  closePanels(nav);
}

function closeOnEscape(e) {
  if (e.code !== 'Escape') return;
  const nav = document.getElementById('nav');
  if (!nav) return;
  const open = nav.querySelector('.nav-drop[aria-expanded="true"], .nav-tool[aria-expanded="true"]');
  if (open) {
    closePanels(nav);
    open.querySelector(':scope > button')?.focus();
  } else if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') {
    toggleMenu(nav, false);
    nav.querySelector('.nav-hamburger button').focus();
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget) && isDesktop.matches) closePanels(nav);
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');
  const sections = [...fragment.children];
  const classes = ['brand', 'search', 'actions', 'sections', 'tools'];
  const named = {};
  classes.forEach((c, i) => {
    if (sections[i]) {
      sections[i].className = `nav-${c}`;
      named[c] = sections[i];
    }
  });

  if (named.search) decorateSearch(named.search);
  if (named.actions) decorateActions(named.actions);
  if (named.sections) decorateSections(named.sections, nav);
  if (named.tools) decorateTools(named.tools, nav);

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav));

  const top = document.createElement('div');
  top.className = 'nav-top';
  top.append(hamburger, ...['brand', 'search', 'actions'].map((c) => named[c]).filter(Boolean));
  const bottom = document.createElement('div');
  bottom.className = 'nav-bottom';
  bottom.append(...['sections', 'tools'].map((c) => named[c]).filter(Boolean));
  nav.append(top, bottom);

  nav.setAttribute('aria-expanded', 'false');
  window.addEventListener('keydown', closeOnEscape);
  nav.addEventListener('focusout', closeOnFocusLost);
  // reset menu state when crossing the desktop breakpoint
  toggleMenu(nav, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, false));

  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  overlay.addEventListener('click', () => closePanels(nav));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper, overlay);
}
