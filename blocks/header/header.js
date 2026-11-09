import { siteDocumentPath, rebaseImages } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';

// the source switches between the drawer and the bar navigation at 1120px
const isDesktop = window.matchMedia('(width >= 1120px)');

function el(tag, className, ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.append(...children);
  return node;
}

/** text of a list item without its nested list */
function labelOf(li) {
  return [...li.childNodes]
    .filter((n) => n.nodeType === Node.TEXT_NODE || !['UL', 'OL'].includes(n.tagName))
    .map((n) => n.textContent)
    .join('')
    .trim();
}

const subList = (li) => li.querySelector(':scope > ul');
const isGroup = (li) => !li.querySelector(':scope > a') && subList(li);

/** strong/em links inside lists become buttons, like in default content */
function decorateListButtons(container) {
  container.querySelectorAll('li > strong > a, li > em > a').forEach((a) => {
    const wrapper = a.parentElement;
    a.className = `button ${wrapper.tagName === 'STRONG' ? 'primary' : 'secondary'}`;
    wrapper.replaceWith(a);
  });
}

let panelId = 0;

/**
 * Builds one megamenu panel (column) from list items.
 * Groups (text + list) become a section title followed by their links,
 * links with a nested list open a further panel.
 * @param {Element[]} items list items
 * @param {number} level panel level, 1 = first column
 * @param {object} [owner] back label and link of the item owning a nested panel
 * @returns {Element} the panel
 */
function buildPanel(items, level, owner) {
  const menu = el('ul', 'header-panel-menu');
  const panel = el('section', `header-panel header-panel-level${level}`, menu);
  panelId += 1;
  panel.id = `header-panel-${panelId}`;

  if (owner) {
    // mobile only: back button, title and link to the owning page
    const back = el('button', 'header-panel-back', owner.backLabel);
    back.type = 'button';
    const ownerLink = owner.link.cloneNode(true);
    ownerLink.append(el('span', 'header-arrow-right'));
    menu.append(
      el('li', 'header-panel-mobile header-panel-back-item', back),
      el('li', 'header-panel-mobile header-section-title', owner.link.textContent.trim()),
      el('li', 'header-panel-mobile header-item', ownerLink),
    );
  }

  const addItem = (li, backLabel) => {
    const a = li.querySelector(':scope > a');
    if (!a) return;
    const link = a.cloneNode(true);
    const item = el('li', 'header-item', link);
    const sub = subList(li);
    if (sub) {
      item.classList.add('has-submenu');
      const nested = buildPanel([...sub.children], level + 1, { backLabel, link: a });
      link.setAttribute('aria-expanded', 'false');
      link.setAttribute('aria-controls', nested.id);
      item.append(nested);
    }
    menu.append(item);
  };

  items.forEach((li) => {
    if (isGroup(li)) {
      menu.append(el('li', 'header-section-title', labelOf(li)));
      [...subList(li).children].forEach((child) => addItem(child, owner ? owner.link.textContent.trim() : ''));
    } else {
      addItem(li, owner ? owner.link.textContent.trim() : '');
    }
  });
  return panel;
}

function closeSubmenus(scope) {
  scope.querySelectorAll('.header-item.is-open').forEach((item) => {
    item.classList.remove('is-open');
    item.querySelector(':scope > a').setAttribute('aria-expanded', 'false');
  });
}

function setTopItem(item, open) {
  item.classList.toggle('is-open', open);
  item.querySelector(':scope > button').setAttribute('aria-expanded', open);
  if (!open) closeSubmenus(item);
}

function buildMenu(source, nav) {
  const menu = el('ul', 'header-menu nav-list');
  const topItems = source ? [...source.querySelectorAll(':scope > ul > li')] : [];
  topItems.forEach((li, index) => {
    const label = labelOf(li);
    const button = el('button', 'nav-trigger', el('span', 'header-menu-label', label), el('span', 'header-chevron'));
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    const item = el('li', 'header-menu-item', button);
    const children = subList(li) ? [...subList(li).children] : [];
    if (children.length) {
      const megamenu = el('div', 'header-megamenu');
      if (children.every(isGroup)) {
        children.forEach((group) => megamenu.append(buildPanel([group], 1)));
      } else {
        megamenu.classList.add('has-levels');
        megamenu.append(buildPanel(children, 1));
      }
      // nested panels on mobile show the top item as back label
      megamenu.querySelectorAll('.header-panel-level2 > ul > .header-panel-back-item button').forEach((b) => {
        b.textContent = label;
      });
      megamenu.id = `header-megamenu-${index + 1}`;
      button.setAttribute('aria-controls', megamenu.id);
      item.append(el('div', 'header-flyout', megamenu));
    }
    menu.append(item);
  });

  const items = [...menu.children];
  const closeAll = (except) => items
    .filter((i) => i !== except)
    .forEach((i) => setTopItem(i, false));

  items.forEach((item) => {
    const button = item.querySelector(':scope > button');
    button.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      if (!isDesktop.matches && !open) return; // the drawer always shows one item
      closeAll(item);
      setTopItem(item, open);
    });
    item.addEventListener('mouseenter', () => {
      if (!isDesktop.matches) return;
      closeAll(item);
      setTopItem(item, true);
    });
    item.addEventListener('mouseleave', () => {
      if (isDesktop.matches) setTopItem(item, false);
    });
  });

  // nested panels: hover on desktop, slide in on tap in the drawer
  menu.querySelectorAll('.header-item.has-submenu').forEach((sub) => {
    const link = sub.querySelector(':scope > a');
    const open = () => {
      closeSubmenus(sub.parentElement);
      sub.classList.add('is-open');
      link.setAttribute('aria-expanded', 'true');
    };
    sub.addEventListener('mouseenter', () => { if (isDesktop.matches) open(); });
    link.addEventListener('click', (e) => {
      if (isDesktop.matches) return;
      e.preventDefault();
      open();
      sub.closest('.header-flyout').scrollTop = 0;
    });
    link.addEventListener('focus', () => { if (isDesktop.matches) open(); });
  });
  menu.querySelectorAll('.header-panel-back').forEach((back) => {
    back.addEventListener('click', () => {
      const owner = back.closest('.header-item.has-submenu');
      owner.classList.remove('is-open');
      owner.querySelector(':scope > a').setAttribute('aria-expanded', 'false');
    });
  });

  nav.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    const open = items.find((i) => i.classList.contains('is-open'));
    if (open && isDesktop.matches) {
      setTopItem(open, false);
      open.querySelector(':scope > button').focus();
    }
  });
  nav.addEventListener('focusout', (e) => {
    if (isDesktop.matches && !menu.contains(e.relatedTarget)) closeAll();
  });

  return { menu, items, closeAll };
}

function buildSearch(source) {
  const link = source && source.querySelector('a');
  if (!link) return null;
  const form = el('form', 'header-search');
  form.setAttribute('role', 'search');
  form.action = link.getAttribute('href');
  const input = el('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = link.textContent.trim();
  input.setAttribute('aria-label', link.textContent.trim());
  const submit = el('button', 'header-search-submit', el('span', 'icon icon-search'));
  submit.type = 'submit';
  submit.setAttribute('aria-label', 'Search');
  const img = document.createElement('img');
  img.src = `${window.hlx.codeBasePath}/icons/search.svg`;
  img.alt = '';
  img.loading = 'lazy';
  submit.firstElementChild.append(img);
  form.append(submit, input);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    window.location.href = q ? `${form.action}#q=${encodeURIComponent(q)}` : form.action;
  });
  return form;
}

function buildUtility(source) {
  const list = el('ul', 'header-utility');
  const items = source ? [...source.querySelectorAll(':scope > ul > li')] : [];
  items.forEach((li, index) => {
    const label = labelOf(li).replace(/\s+/g, ' ');
    const icon = li.querySelector(':scope > .icon, :scope > img, :scope > picture');
    const button = el('button', 'header-utility-trigger');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-expanded', 'false');
    if (icon) button.append(icon);
    const item = el('li', 'header-utility-item', button);
    const sub = subList(li);
    if (sub) {
      const panel = el('div', 'header-drop-panel');
      panel.id = `header-drop-panel-${index + 1}`;
      button.setAttribute('aria-controls', panel.id);
      decorateListButtons(sub);
      [...sub.children].forEach((row) => {
        // bold rows are labels, rows holding only a button get button spacing
        let className = '';
        const only = row.children.length === 1 ? row.firstElementChild : null;
        if (only && row.textContent.trim() === only.textContent.trim()) {
          if (only.tagName === 'STRONG') className = 'header-drop-panel-label';
          if (only.classList.contains('button')) className = 'header-drop-panel-button';
        }
        const p = el('p', className);
        p.append(...row.childNodes);
        panel.append(p);
      });
      item.append(panel);
    }
    list.append(item);
  });

  const all = [...list.children];
  all.forEach((item) => {
    const button = item.querySelector(':scope > button');
    button.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      all.forEach((i) => {
        i.classList.remove('is-open');
        i.querySelector(':scope > button').setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', open);
    });
  });
  document.addEventListener('click', (e) => {
    if (list.contains(e.target)) return;
    all.forEach((i) => {
      i.classList.remove('is-open');
      i.querySelector(':scope > button').setAttribute('aria-expanded', 'false');
    });
  });
  return list;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navPath = siteDocumentPath('nav');
  const fragment = await loadFragment(navPath);
  block.textContent = '';
  if (!fragment) return;
  rebaseImages(fragment, navPath);

  const parts = [...fragment.children].map((s) => s.querySelector('.default-content-wrapper') || s);
  const [brandSrc, menuSrc, toolsSrc, utilitySrc] = parts;

  const nav = el('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');
  nav.setAttribute('aria-expanded', 'false');

  // row 1: logo, search, eStore and Request a Quote
  const brand = el('div', 'header-brand');
  const brandLink = brandSrc && brandSrc.querySelector('a');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-wrapper')?.classList.remove('button-wrapper');
    brand.append(brandLink);
  }
  const actions = el('div', 'header-actions');
  const toolsLinks = toolsSrc ? [...toolsSrc.querySelectorAll('p')] : [];
  const search = buildSearch(toolsLinks[0]);
  toolsLinks.slice(1).forEach((p) => {
    const a = p.querySelector('a');
    if (!a) return;
    if (a.classList.contains('button')) a.classList.add('header-quote');
    else a.classList.add('header-estore');
    actions.append(a);
  });
  const top = el('div', 'header-top', brand);
  if (search) top.append(search);
  top.append(actions);

  // row 2: menu (drawer below 1120px) and utility icons
  const { menu, items, closeAll } = buildMenu(menuSrc, nav);
  const toggle = el('button', 'header-menu-toggle', el('span', 'header-menu-toggle-icon'), 'Menu');
  toggle.type = 'button';
  toggle.setAttribute('aria-controls', 'nav-drawer');
  toggle.setAttribute('aria-label', 'Open navigation');
  const drawer = el('div', 'header-drawer', menu);
  drawer.id = 'nav-drawer';
  const overlay = el('div', 'header-overlay', el('span', 'header-overlay-close', 'Close'));
  const bar = el('div', 'header-bar', toggle, drawer, buildUtility(utilitySrc));

  const setDrawer = (open) => {
    nav.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    document.body.style.overflowY = open ? 'hidden' : '';
    overlay.classList.toggle('is-open', open);
    if (open && items[0] && !items.some((i) => i.classList.contains('is-open'))) setTopItem(items[0], true);
    if (!open) closeAll();
  };
  toggle.addEventListener('click', () => setDrawer(nav.getAttribute('aria-expanded') !== 'true'));
  overlay.addEventListener('click', () => setDrawer(false));
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && nav.getAttribute('aria-expanded') === 'true') {
      setDrawer(false);
      toggle.focus();
    }
  });
  isDesktop.addEventListener('change', () => setDrawer(false));

  nav.append(top, bar);
  const wrapper = el('div', 'nav-wrapper', nav, overlay);
  block.append(wrapper);
}
