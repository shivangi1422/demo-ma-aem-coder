import { getMetadata } from '../../scripts/aem.js';
import { getPagePath } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';

// desktop layout (horizontal menu + dropdown mega menus) from 1120px, as on the live site
const isDesktop = window.matchMedia('(min-width: 1120px)');
const COLUMN_WIDTH = 300;
const UTILITY_ICONS = ['phone', 'user', 'globe'];

/**
 * Creates a decorative icon rendered with a CSS mask, so it can take the text color.
 * @param {string} name icon file name in /icons
 * @returns {HTMLSpanElement}
 */
function maskIcon(name) {
  const span = document.createElement('span');
  span.className = `nav-icon nav-icon-${name}`;
  span.setAttribute('aria-hidden', 'true');
  return span;
}

/**
 * Splits a nav list item into its own label/link and its nested list.
 * @param {HTMLLIElement} li
 * @returns {{ link: HTMLAnchorElement|null, label: string, list: HTMLUListElement|null }}
 */
function readItem(li) {
  const list = li.querySelector(':scope > ul');
  const link = li.querySelector(':scope > a, :scope > p > a, :scope > strong > a');
  let label = '';
  if (link) label = link.textContent.trim();
  else {
    label = [...li.childNodes]
      .filter((n) => n !== list)
      .map((n) => n.textContent)
      .join(' ')
      .trim();
  }
  return { link, label, list };
}

/* ---------------------------------------------------------------------------
 * mega menu
 * ------------------------------------------------------------------------- */

/**
 * Builds one column list. List items without a link are group headings
 * (rendered as small uppercase titles followed by their links); items with a
 * link and a nested list open a further column.
 * @param {HTMLUListElement} source
 * @param {number} level 1-based column level
 * @param {string[]} trail labels from the top-level menu down to this column
 * @returns {HTMLElement}
 */
function buildColumn(source, level, trail) {
  const panel = document.createElement('section');
  panel.className = `nav-mega-panel nav-mega-level-${level}`;
  const ul = document.createElement('ul');
  ul.className = 'nav-mega-list';

  if (level > 1) {
    // mobile drill-down header: back to the parent menu + current category
    const back = document.createElement('li');
    back.className = 'nav-mega-back';
    const button = document.createElement('button');
    button.type = 'button';
    button.append(maskIcon('chevron-right'), document.createTextNode(trail[trail.length - 2]));
    back.append(button);
    const current = document.createElement('li');
    current.className = 'nav-mega-current';
    current.textContent = trail[trail.length - 1];
    ul.append(back, current);
  }

  const addLink = (item, target) => {
    const { link, label, list } = readItem(item);
    const li = document.createElement('li');
    li.className = 'nav-mega-item';
    const a = document.createElement('a');
    a.href = link ? link.getAttribute('href') : '#';
    a.textContent = label;
    li.append(a);
    if (list) {
      li.classList.add('nav-mega-has-sub');
      a.setAttribute('aria-haspopup', 'true');
      a.setAttribute('aria-expanded', 'false');
      li.append(buildColumn(list, level + 1, [...trail, label]));
    }
    target.append(li);
  };

  [...source.children].forEach((item) => {
    const { link, label, list } = readItem(item);
    if (!link && list) {
      const title = document.createElement('li');
      title.className = 'nav-mega-title';
      title.textContent = label;
      ul.append(title);
      [...list.children].forEach((child) => addLink(child, ul));
    } else {
      addLink(item, ul);
    }
  });

  panel.append(ul);
  return panel;
}

/**
 * A top-level menu whose children are all headings is shown as side-by-side
 * columns; otherwise it is a cascading menu that opens a column per level.
 * @param {HTMLUListElement} source
 * @param {string} label
 * @returns {HTMLElement}
 */
function buildMega(source, label) {
  const mega = document.createElement('div');
  mega.className = 'nav-mega';
  const items = [...source.children];
  const isColumns = items.length && items.every((item) => {
    const { link, list } = readItem(item);
    return !link && list;
  });

  if (isColumns) {
    mega.classList.add('nav-mega-columns');
    items.forEach((item) => {
      const fragment = document.createElement('ul');
      fragment.append(item.cloneNode(true));
      mega.append(buildColumn(fragment, 1, [label]));
    });
  } else {
    mega.classList.add('nav-mega-cascade');
    mega.append(buildColumn(source, 1, [label]));
  }
  return mega;
}

/**
 * Opens a cascading sub column and sizes the mega menu to the open depth.
 * @param {HTMLLIElement} li
 */
function openSubItem(li) {
  const list = li.parentElement;
  list.querySelectorAll(':scope > .nav-mega-has-sub.is-open').forEach((sibling) => {
    if (sibling === li) return;
    sibling.classList.remove('is-open');
    sibling.querySelectorAll('.is-open').forEach((open) => open.classList.remove('is-open'));
    sibling.querySelectorAll('[aria-expanded]').forEach((a) => a.setAttribute('aria-expanded', 'false'));
    sibling.querySelector(':scope > a').setAttribute('aria-expanded', 'false');
  });
  li.classList.add('is-open');
  li.querySelector(':scope > a').setAttribute('aria-expanded', 'true');
  const mega = li.closest('.nav-mega');
  if (mega && mega.classList.contains('nav-mega-cascade') && isDesktop.matches) {
    const depth = mega.querySelectorAll('.nav-mega-has-sub.is-open').length + 1;
    mega.style.width = `${depth * COLUMN_WIDTH}px`;
  }
}

/**
 * Closes the open sub column of a cascading item (mobile back button).
 * @param {HTMLLIElement} li
 */
function closeSubItem(li) {
  li.classList.remove('is-open');
  li.querySelectorAll('.is-open').forEach((open) => open.classList.remove('is-open'));
  li.querySelector(':scope > a').setAttribute('aria-expanded', 'false');
}

function resetMega(mega) {
  mega.querySelectorAll('.is-open').forEach((open) => open.classList.remove('is-open'));
  mega.querySelectorAll('[aria-expanded="true"]').forEach((a) => a.setAttribute('aria-expanded', 'false'));
  mega.style.width = '';
}

/* ---------------------------------------------------------------------------
 * open / close state
 * ------------------------------------------------------------------------- */

function closeSections(nav, except) {
  nav.querySelectorAll('.nav-section.is-open').forEach((section) => {
    if (section === except) return;
    section.classList.remove('is-open');
    section.querySelector(':scope > button').setAttribute('aria-expanded', 'false');
    const mega = section.querySelector('.nav-mega');
    if (mega) resetMega(mega);
  });
}

function closeUtilities(nav, except) {
  nav.querySelectorAll('.nav-utility-item.is-open').forEach((item) => {
    if (item === except) return;
    item.classList.remove('is-open');
    item.querySelector(':scope > button').setAttribute('aria-expanded', 'false');
  });
}

function updateOverlay(nav) {
  const wrapper = nav.closest('.nav-wrapper');
  const drawerOpen = nav.classList.contains('is-drawer-open');
  const sectionOpen = !!nav.querySelector('.nav-section.is-open');
  wrapper.classList.toggle('is-masked', drawerOpen || (isDesktop.matches && sectionOpen));
  document.body.classList.toggle('nav-drawer-open', drawerOpen && !isDesktop.matches);
}

function toggleSection(nav, section, force) {
  const open = force ?? !section.classList.contains('is-open');
  closeSections(nav, section);
  closeUtilities(nav);
  section.classList.toggle('is-open', open);
  section.querySelector(':scope > button').setAttribute('aria-expanded', String(open));
  if (!open) {
    const mega = section.querySelector('.nav-mega');
    if (mega) resetMega(mega);
  }
  updateOverlay(nav);
}

function toggleDrawer(nav, force) {
  const open = force ?? !nav.classList.contains('is-drawer-open');
  nav.classList.toggle('is-drawer-open', open);
  nav.querySelector('.nav-menu-toggle').setAttribute('aria-expanded', String(open));
  if (!open) closeSections(nav);
  updateOverlay(nav);
}

function closeAll(nav) {
  closeSections(nav);
  closeUtilities(nav);
  if (nav.classList.contains('is-drawer-open')) toggleDrawer(nav, false);
  updateOverlay(nav);
}

/* ---------------------------------------------------------------------------
 * builders for the header rows
 * ------------------------------------------------------------------------- */

function buildBrand(section) {
  const link = section.querySelector('a');
  const brand = document.createElement('a');
  brand.className = 'nav-brand';
  brand.href = link ? link.getAttribute('href') : '/';
  brand.setAttribute('aria-label', link?.getAttribute('title') || link?.textContent.trim() || 'Home');
  const logo = section.querySelector('.icon, img, picture');
  if (logo) brand.append(logo);
  return brand;
}

function buildTools(section) {
  const links = [...section.querySelectorAll('a')];
  const searchLink = links.find((a) => /search/i.test(a.getAttribute('href')));
  const fragment = document.createDocumentFragment();

  if (searchLink) {
    const form = document.createElement('form');
    form.className = 'nav-search';
    form.setAttribute('role', 'search');
    form.action = searchLink.getAttribute('href');
    const button = document.createElement('button');
    button.type = 'submit';
    button.className = 'nav-search-button';
    button.setAttribute('aria-label', 'Search');
    button.append(maskIcon('search'));
    const input = document.createElement('input');
    input.type = 'search';
    input.name = 'q';
    input.placeholder = searchLink.textContent.trim();
    input.setAttribute('aria-label', searchLink.textContent.trim());
    input.autocomplete = 'off';
    form.append(button, input);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = input.value.trim();
      window.location.href = `${form.getAttribute('action')}${query ? `#q=${encodeURIComponent(query)}` : ''}`;
    });
    fragment.append(form);
  }

  const buttons = document.createElement('div');
  buttons.className = 'nav-tools';
  links.filter((a) => a !== searchLink).forEach((a) => {
    // bold links (decorated into buttons by the page decoration) are the red quote button
    const isQuote = !!a.closest('strong') || a.classList.contains('button');
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = a.textContent.trim();
    link.className = isQuote ? 'nav-quote' : 'nav-store';
    buttons.append(link);
  });
  fragment.append(buttons);
  return fragment;
}

function buildSections(section, nav) {
  const ul = document.createElement('ul');
  ul.className = 'nav-sections';
  const source = section.querySelector('ul');
  if (!source) return ul;

  [...source.children].forEach((item) => {
    const { label, list } = readItem(item);
    const li = document.createElement('li');
    li.className = 'nav-section';
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    const text = document.createElement('span');
    text.className = 'nav-section-label';
    text.textContent = label;
    button.append(text, maskIcon('angle-down'));
    li.append(button);

    if (list) {
      const flyout = document.createElement('div');
      flyout.className = 'nav-flyout';
      flyout.append(buildMega(list, label));
      li.append(flyout);
    }

    button.addEventListener('click', () => toggleSection(nav, li));
    ul.append(li);
  });

  // cascading items: hover/focus opens the next column on desktop, tap drills down on mobile
  ul.querySelectorAll('.nav-mega-has-sub').forEach((li) => {
    const a = li.querySelector(':scope > a');
    li.addEventListener('mouseenter', () => { if (isDesktop.matches) openSubItem(li); });
    a.addEventListener('focus', () => { if (isDesktop.matches) openSubItem(li); });
    a.addEventListener('click', (e) => {
      if (isDesktop.matches) return;
      e.preventDefault();
      openSubItem(li);
    });
    const back = li.querySelector(':scope > .nav-mega-panel > ul > .nav-mega-back > button');
    if (back) back.addEventListener('click', () => closeSubItem(li));
  });
  // leaving an item for a non-cascading sibling closes the open column
  ul.querySelectorAll('.nav-mega-item:not(.nav-mega-has-sub)').forEach((li) => {
    li.addEventListener('mouseenter', () => {
      if (!isDesktop.matches) return;
      const openSibling = li.parentElement.querySelector(':scope > .nav-mega-has-sub.is-open');
      if (!openSibling) return;
      closeSubItem(openSibling);
      const mega = li.closest('.nav-mega-cascade');
      if (mega) mega.style.width = `${(mega.querySelectorAll('.nav-mega-has-sub.is-open').length + 1) * COLUMN_WIDTH}px`;
    });
  });
  return ul;
}

/**
 * Utility drop panels (contact, account, language/location): each h3 in the
 * section starts one panel; the h3 text becomes the button's accessible name.
 */
function buildUtility(section, nav) {
  const ul = document.createElement('ul');
  ul.className = 'nav-utility';
  const headings = [...section.querySelectorAll('h3')];
  headings.forEach((heading, i) => {
    const li = document.createElement('li');
    li.className = `nav-utility-item nav-utility-${UTILITY_ICONS[i] || 'item'}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', heading.textContent.trim());
    button.setAttribute('aria-expanded', 'false');
    button.append(maskIcon(UTILITY_ICONS[i] || 'phone'));
    const panel = document.createElement('div');
    panel.className = 'nav-dropdown';
    let next = heading.nextElementSibling;
    while (next && next.tagName !== 'H3') {
      const current = next;
      next = next.nextElementSibling;
      panel.append(current);
    }
    li.append(button, panel);
    button.addEventListener('click', () => {
      const open = !li.classList.contains('is-open');
      closeSections(nav);
      closeUtilities(nav, li);
      li.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
      updateOverlay(nav);
    });
    ul.append(li);
  });
  return ul;
}

/** Decorates the utility panel contents (buttons, phone line, selects). */
function decoratePanels(utility) {
  utility.querySelectorAll('.nav-dropdown').forEach((panel) => {
    panel.querySelectorAll('strong > a, em > a, a.button').forEach((a) => {
      const primary = a.closest('strong') || a.classList.contains('primary');
      a.className = primary ? 'nav-button nav-button-primary' : 'nav-button nav-button-secondary';
      const p = a.closest('p');
      if (p) p.className = 'nav-button-wrapper';
    });
    const first = panel.querySelector(':scope > p:first-child > strong:only-child:not(:has(a))');
    if (first) first.closest('p').className = 'nav-dropdown-title';
    panel.querySelectorAll('a[href^="tel:"]').forEach((a) => {
      const p = a.closest('p');
      if (!p) return;
      p.className = 'nav-dropdown-phone';
      const labelText = p.firstChild;
      if (labelText && labelText.nodeType === Node.TEXT_NODE) {
        const span = document.createElement('span');
        span.textContent = labelText.textContent.trim();
        labelText.replaceWith(span, ' ');
      }
    });

    // "label" paragraph followed by a plain list of options becomes a select
    panel.querySelectorAll(':scope > ul').forEach((list) => {
      const options = [...list.children];
      if (!options.length || options.some((li) => li.querySelector('a'))) {
        list.className = 'nav-dropdown-links';
        return;
      }
      const label = list.previousElementSibling;
      const field = document.createElement('div');
      field.className = 'nav-dropdown-field';
      const id = `nav-select-${Math.random().toString(36).slice(2, 8)}`;
      const select = document.createElement('select');
      select.id = id;
      options.forEach((li) => {
        const option = document.createElement('option');
        option.textContent = li.textContent.trim();
        select.append(option);
      });
      if (label && label.tagName === 'P') {
        const lab = document.createElement('label');
        lab.htmlFor = id;
        lab.textContent = label.textContent.trim();
        label.replaceWith(field);
        field.append(lab);
      } else {
        list.before(field);
      }
      const wrap = document.createElement('div');
      wrap.className = 'nav-select';
      wrap.append(select, maskIcon('caret-down'));
      field.append(wrap);
      list.remove();
    });
  });
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : `${getPagePath().root}/nav`;
  const fragment = await loadFragment(navPath);
  if (!fragment) return;

  const [brandSection, toolsSection, menuSection, utilitySection] = [...fragment.children]
    .map((section) => section.querySelector('.default-content-wrapper') || section);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  const top = document.createElement('div');
  top.className = 'nav-top';
  if (brandSection) top.append(buildBrand(brandSection));
  if (toolsSection) top.append(buildTools(toolsSection));

  const bar = document.createElement('div');
  bar.className = 'nav-bar';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-menu-toggle';
  toggle.setAttribute('aria-controls', 'nav-drawer');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.append(maskIcon('bars'), document.createTextNode('Menu'));
  toggle.addEventListener('click', () => toggleDrawer(nav));

  const drawer = document.createElement('div');
  drawer.className = 'nav-drawer';
  drawer.id = 'nav-drawer';
  if (menuSection) drawer.append(buildSections(menuSection, nav));

  bar.append(toggle, drawer);
  if (utilitySection) {
    const utility = buildUtility(utilitySection, nav);
    decoratePanels(utility);
    bar.append(utility);
  }

  nav.append(top, bar);

  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  overlay.addEventListener('click', () => closeAll(nav));

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(nav, overlay);
  block.append(wrapper);

  // close on escape / outside click, reset when switching layouts
  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    const openSection = nav.querySelector('.nav-section.is-open > button');
    closeAll(nav);
    if (openSection) openSection.focus();
  });
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      closeSections(nav);
      closeUtilities(nav);
      updateOverlay(nav);
    }
  });
  isDesktop.addEventListener('change', () => closeAll(nav));
}
