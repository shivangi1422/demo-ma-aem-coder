/*
 * Header (mybeckman theme)
 * Used on pages whose metadata sets `theme: theme-mybeckman` (see THEMED_BLOCKS in scripts.js).
 *
 * All copy, links and images come from the nav document (/en-in/nav). It has one section per part:
 *   1 brand    logo link
 *   2 search   link to the search page; its text is the input placeholder
 *   3 tools    links; <strong> link = primary button
 *   4 menu     nested list: top items open a panel. A panel whose items are all
 *              "title + list" groups shows one column per group; otherwise it is a
 *              cascading flyout (items with a nested list open the next level).
 *   5+ utility drop panels: first paragraph = trigger icon (`:icon-name:` or an image),
 *              heading = accessible label, rest = panel content. A paragraph followed by a
 *              list of links becomes a labelled select; the <strong> link then submits it.
 */

const DESKTOP = window.matchMedia('(min-width: 1120px)');
const UTILITY_HOVER = window.matchMedia('(min-width: 1025px)');
const ICON_PATH = `${window.hlx?.codeBasePath || ''}/icons`;

/**
 * Fetches the first available copy of a site document. The site root comes from the current
 * page path, so this works locally (/content/en-in/…), in the authoring environment
 * (/content/<site>/en-in/…) and on the published site (/en-in/…).
 * @returns {Promise<{resp: Response, url: string}|null>}
 */
async function fetchSiteDocument(name) {
  const marker = '/en-in/';
  const { pathname } = window.location;
  const root = pathname.includes(marker) ? pathname.slice(0, pathname.indexOf(marker)) : '';
  const urls = [...new Set([`${root}/en-in/${name}.plain.html`, `/content/en-in/${name}.plain.html`, `/en-in/${name}.plain.html`])];
  const tryNext = async ([url, ...rest]) => {
    if (!url) return null;
    const resp = await fetch(url);
    return resp.ok ? { resp, url } : tryNext(rest);
  };
  return tryNext(urls);
}

/**
 * Fetches the nav document of the /en-in site.
 * @returns {Promise<{doc: Document, base: string}|null>}
 */
async function fetchNav() {
  const found = await fetchSiteDocument('nav');
  if (!found) return null;
  const { resp, url } = found;
  const base = new URL(url, window.location.href).href;
  const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
  // images are referenced relative to the nav document
  doc.querySelectorAll('img[src], source[srcset]').forEach((el) => {
    const attr = el.hasAttribute('src') ? 'src' : 'srcset';
    el.setAttribute(attr, new URL(el.getAttribute(attr), base).href);
  });
  return { doc, base };
}

function icon(name, className = '') {
  const span = document.createElement('span');
  span.className = `header-mybeckman-icon ${className}`.trim();
  span.style.setProperty('--icon', `url("${ICON_PATH}/${name}.svg")`);
  span.setAttribute('aria-hidden', 'true');
  return span;
}

function textOf(li) {
  return [...li.childNodes]
    .filter((n) => n.nodeType === Node.TEXT_NODE || (n.nodeType === Node.ELEMENT_NODE && !['UL', 'OL'].includes(n.tagName)))
    .map((n) => n.textContent).join('').trim();
}

function linkFrom(a) {
  const link = document.createElement('a');
  link.href = a.getAttribute('href');
  link.textContent = a.textContent.trim();
  if (a.title) link.title = a.title;
  return link;
}

/* ---------- row 0: brand, search, tools ---------- */

function buildBrand(section) {
  const a = section?.querySelector('a');
  if (!a) return null;
  const brand = document.createElement('a');
  brand.className = 'header-mybeckman-brand';
  brand.href = a.getAttribute('href');
  const img = section.querySelector('img');
  if (img) {
    brand.setAttribute('aria-label', img.alt || a.textContent.trim());
    const logo = document.createElement('img');
    logo.src = img.src;
    logo.alt = img.alt;
    logo.width = 164;
    logo.height = 44;
    brand.append(logo);
  } else {
    brand.textContent = a.textContent.trim();
  }
  return brand;
}

function buildSearch(section) {
  const a = section?.querySelector('a');
  if (!a) return null;
  const searchPage = a.getAttribute('href');
  const form = document.createElement('form');
  form.className = 'header-mybeckman-search';
  form.setAttribute('role', 'search');
  form.action = searchPage;
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = a.textContent.trim();
  input.setAttribute('aria-label', a.textContent.trim());
  input.autocomplete = 'off';
  const button = document.createElement('button');
  button.type = 'submit';
  button.setAttribute('aria-label', 'Search');
  button.append(icon('fa-search'));
  form.append(button, input);
  // the search page reads the query from the hash (#q=...)
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    window.location.href = q ? `${searchPage}#q=${encodeURIComponent(q)}` : searchPage;
  });
  return form;
}

function buildTools(section) {
  if (!section) return null;
  const tools = document.createElement('div');
  tools.className = 'header-mybeckman-tools';
  section.querySelectorAll('a').forEach((a) => {
    const link = linkFrom(a);
    link.className = a.closest('strong') ? 'header-mybeckman-cta' : 'header-mybeckman-tool';
    tools.append(link);
  });
  return tools;
}

/* ---------- row 1: menu panels ---------- */

const ITEM_LINK = ':scope > a, :scope > p > a, :scope > strong > a';

function isGroup(li) {
  return !li.querySelector(ITEM_LINK) && li.querySelector(':scope > ul') && textOf(li);
}

/**
 * The link of a "button" paragraph: <p><strong><a> (primary), <p><em><a> (secondary),
 * or an authoring-environment button (<p class="button-container"><a class="button …">).
 * @returns {{a: Element, secondary: boolean}|null}
 */
function buttonOf(el) {
  if (!el.matches('p')) return null;
  const a = el.querySelector(':scope > strong > a, :scope > em > a, :scope > a.button, :scope > strong > a.button');
  if (!a || el.textContent.trim() !== a.textContent.trim()) return null;
  return { a, secondary: !!el.querySelector(':scope > em') || a.classList.contains('secondary') };
}

/**
 * Renders one level of a panel: links (optionally opening a deeper level) and group titles.
 * @param {Element} ul source list
 * @param {number} depth 1-based level
 * @param {string} owner label of the item this level belongs to
 * @param {Element} [parentLink] link of that item, for deeper levels
 * @param {string} [backLabel] label of the level above, for deeper levels
 * @returns {Element}
 */
function buildLevel(ul, depth, owner, parentLink, backLabel) {
  const level = document.createElement('div');
  level.className = `header-mybeckman-level header-mybeckman-level-${depth}`;
  const list = document.createElement('ul');
  if (parentLink) {
    // mobile only: back row, parent title and "view all" link (as on the source site)
    const back = document.createElement('li');
    back.className = 'header-mybeckman-back';
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.textContent = backLabel;
    back.append(backBtn);
    const title = document.createElement('li');
    title.className = 'header-mybeckman-title header-mybeckman-mobile-only';
    title.textContent = owner;
    const all = document.createElement('li');
    all.className = 'header-mybeckman-link header-mybeckman-mobile-only';
    const allLink = linkFrom(parentLink);
    allLink.append(icon('fa-long-arrow-alt-right'));
    all.append(allLink);
    list.append(back, title, all);
  }
  const addItem = (li) => {
    const a = li.querySelector(ITEM_LINK);
    if (!a) return;
    const item = document.createElement('li');
    item.className = 'header-mybeckman-link';
    const link = linkFrom(a);
    item.append(link);
    const sub = li.querySelector(':scope > ul');
    if (sub) {
      item.classList.add('header-mybeckman-has-sub');
      link.setAttribute('aria-haspopup', 'true');
      link.setAttribute('aria-expanded', 'false');
      item.append(buildLevel(sub, depth + 1, a.textContent.trim(), a, owner));
    }
    list.append(item);
  };
  [...ul.children].forEach((li) => {
    if (isGroup(li)) {
      const title = document.createElement('li');
      title.className = 'header-mybeckman-title';
      title.textContent = textOf(li);
      list.append(title);
      li.querySelectorAll(':scope > ul > li').forEach(addItem);
      return;
    }
    addItem(li);
  });
  level.append(list);
  return level;
}

function buildPanel(ul, label) {
  const panel = document.createElement('div');
  panel.className = 'header-mybeckman-panel';
  const items = [...ul.children];
  if (items.length && items.every(isGroup)) {
    panel.classList.add('header-mybeckman-columns');
    items.forEach((group) => {
      // one column per titled group
      const holder = document.createElement('ul');
      holder.append(group.cloneNode(true));
      const col = buildLevel(holder, 1, label);
      col.classList.add('header-mybeckman-column');
      panel.append(col);
    });
  } else {
    panel.classList.add('header-mybeckman-cascade');
    panel.append(buildLevel(ul, 1, label));
  }
  panel.setAttribute('aria-label', label);
  return panel;
}

/* ---------- row 1: utility drop panels ---------- */

/**
 * A labelled select built from a list of links; the option whose link equals
 * the panel's submit link is the current choice.
 */
function buildSelect(labelText, list, id, currentHref) {
  const field = document.createElement('div');
  field.className = 'header-mybeckman-field';
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = labelText;
  const select = document.createElement('select');
  select.id = id;
  list.querySelectorAll(':scope > li > a').forEach((a) => {
    const option = document.createElement('option');
    option.value = a.getAttribute('href');
    option.textContent = a.textContent.trim();
    option.selected = option.value === currentHref;
    select.append(option);
  });
  field.append(label, select, icon('fa-caret-down', 'header-mybeckman-caret'));
  return { field, select };
}

function buildDrop(section, index) {
  const children = [...section.children];
  const triggerSource = children.shift();
  const heading = children[0]?.matches('h1, h2, h3, h4, h5, h6') ? children.shift() : null;
  const label = heading?.textContent.trim() || '';

  const li = document.createElement('li');
  li.className = 'header-mybeckman-utility-item';
  const trigger = document.createElement('a');
  trigger.href = '#';
  trigger.className = 'header-mybeckman-utility-trigger';
  trigger.setAttribute('role', 'button');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', label);
  const img = triggerSource?.querySelector('img');
  const iconSpan = triggerSource?.querySelector('span.icon');
  const iconName = iconSpan
    ? [...iconSpan.classList].find((c) => c.startsWith('icon-'))?.slice(5)
    : triggerSource?.textContent.trim().match(/^:([a-z0-9-]+):$/)?.[1];
  if (img) {
    const flag = document.createElement('img');
    flag.src = img.src;
    flag.alt = '';
    flag.className = 'header-mybeckman-flag';
    flag.width = 14;
    flag.height = 14;
    trigger.append(flag);
  } else if (iconName) {
    trigger.append(icon(iconName));
  }

  const drop = document.createElement('div');
  drop.className = 'header-mybeckman-drop';
  drop.id = `header-mybeckman-drop-${index}`;
  trigger.setAttribute('aria-controls', drop.id);
  const body = document.createElement('div');
  body.className = 'header-mybeckman-drop-body';
  const selects = [];
  const submit = children.find((c) => buttonOf(c) && !buttonOf(c).secondary);
  const submitHref = submit && buttonOf(submit).a.getAttribute('href');
  for (let i = 0; i < children.length; i += 1) {
    const el = children[i];
    const next = children[i + 1];
    const isChoiceList = next?.tagName === 'UL' && next.children.length
      && [...next.children].every((x) => x.querySelector(':scope > a'));
    if (el.tagName === 'P' && !el.querySelector('a, img') && isChoiceList && submit) {
      const { field, select } = buildSelect(el.textContent.trim(), next, `${drop.id}-select-${selects.length}`, submitHref);
      selects.push(select);
      body.append(field);
      i += 1;
    } else if (buttonOf(el)) {
      const { a, secondary } = buttonOf(el);
      const btn = linkFrom(a);
      btn.className = secondary ? 'header-mybeckman-button header-mybeckman-button-secondary' : 'header-mybeckman-button';
      if (selects.length) {
        // submit: combine the chosen country and language (language from the second select)
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const country = new URL(selects[0].value, window.location.href);
          const language = selects[1] ? new URL(selects[1].value, window.location.href).searchParams.get('language') : null;
          if (language) country.searchParams.set('language', language);
          window.location.href = country.href;
        });
      }
      body.append(btn);
    } else if (el.tagName === 'STRONG' || (el.tagName === 'P' && el.children.length === 1 && el.firstElementChild.tagName === 'STRONG' && el.textContent.trim() === el.firstElementChild.textContent.trim())) {
      const title = document.createElement('p');
      title.className = 'header-mybeckman-drop-title';
      title.textContent = el.textContent.trim();
      body.append(title);
    } else {
      const clone = el.cloneNode(true);
      if (clone.tagName === 'UL') clone.className = 'header-mybeckman-drop-list';
      body.append(clone);
    }
  }
  drop.append(body);
  li.append(trigger, drop);
  return li;
}

/* ---------- behaviour ---------- */

function setupMenu(nav, overlay) {
  const items = [...nav.querySelectorAll('.header-mybeckman-menu > li')];
  let timer;

  const close = (item) => {
    item.classList.remove('is-open');
    item.querySelector(':scope > button').setAttribute('aria-expanded', 'false');
    item.querySelectorAll('.header-mybeckman-has-sub.is-open').forEach((sub) => {
      sub.classList.remove('is-open');
      sub.querySelector(':scope > a').setAttribute('aria-expanded', 'false');
    });
    const panel = item.querySelector('.header-mybeckman-panel');
    if (panel) panel.dataset.depth = '1';
    if (!items.some((i) => i.classList.contains('is-open'))) overlay.classList.remove('is-open');
  };
  const open = (item) => {
    items.filter((i) => i !== item).forEach(close);
    item.classList.add('is-open');
    item.querySelector(':scope > button').setAttribute('aria-expanded', 'true');
    // the page overlay only accompanies the first (cascading) menu, as on the source site
    overlay.classList.toggle('is-open', items.indexOf(item) === 0);
  };

  items.forEach((item) => {
    const button = item.querySelector(':scope > button');
    item.addEventListener('mouseenter', () => {
      if (!DESKTOP.matches) return;
      clearTimeout(timer);
      timer = setTimeout(() => open(item), 100);
    });
    item.addEventListener('mouseleave', () => {
      if (!DESKTOP.matches) return;
      clearTimeout(timer);
      timer = setTimeout(() => close(item), 100);
    });
    button.addEventListener('click', () => {
      clearTimeout(timer);
      if (DESKTOP.matches) {
        if (item.classList.contains('is-open')) close(item); else open(item);
        return;
      }
      // mobile: the top items act as tabs
      items.forEach((i) => {
        i.classList.toggle('is-active', i === item);
        i.querySelectorAll('.is-visible, .is-moved').forEach((el) => el.classList.remove('is-visible', 'is-moved'));
      });
    });
    item.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && item.classList.contains('is-open')) {
        close(item);
        button.focus();
      }
    });

    // cascading levels: hover (desktop) or tap (mobile) opens the next level
    item.querySelectorAll('.header-mybeckman-has-sub').forEach((sub) => {
      const link = sub.querySelector(':scope > a');
      const activate = () => {
        [...sub.parentElement.children].filter((s) => s !== sub).forEach((s) => {
          s.classList.remove('is-open');
          s.querySelectorAll('.is-open').forEach((x) => x.classList.remove('is-open'));
          s.querySelector(':scope > a')?.setAttribute('aria-expanded', 'false');
        });
        sub.classList.add('is-open');
        link.setAttribute('aria-expanded', 'true');
        const depth = sub.closest('.header-mybeckman-level').classList.contains('header-mybeckman-level-2') ? 3 : 2;
        const panel = sub.closest('.header-mybeckman-panel');
        panel.dataset.depth = String(depth);
      };
      let subTimer;
      sub.addEventListener('mouseenter', () => {
        if (!DESKTOP.matches) return;
        clearTimeout(subTimer);
        subTimer = setTimeout(activate, 50);
      });
      sub.addEventListener('mouseleave', () => clearTimeout(subTimer));
      link.addEventListener('click', (e) => {
        if (DESKTOP.matches) return;
        e.preventDefault();
        sub.querySelector(':scope > .header-mybeckman-level').classList.add('is-visible');
        sub.closest('.header-mybeckman-level').classList.add('is-moved');
      });
      link.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' && DESKTOP.matches) {
          activate();
          sub.querySelector(':scope > .header-mybeckman-level a')?.focus();
        }
      });
    });
    item.querySelectorAll('.header-mybeckman-back > button').forEach((back) => {
      const level = back.closest('.header-mybeckman-level');
      back.addEventListener('click', () => {
        const parent = level.parentElement.closest('.header-mybeckman-level');
        parent?.classList.remove('is-moved');
        setTimeout(() => level.classList.remove('is-visible'), 250);
      });
    });
  });
  return { items, close };
}

function setupUtility(utility) {
  const lis = [...utility.children];
  const setOpen = (li, state) => {
    li.classList.toggle('is-open', state);
    li.querySelector('.header-mybeckman-utility-trigger').setAttribute('aria-expanded', String(state));
  };
  lis.forEach((li) => {
    const trigger = li.querySelector('.header-mybeckman-utility-trigger');
    li.addEventListener('mouseenter', () => { if (UTILITY_HOVER.matches) setOpen(li, true); });
    li.addEventListener('mouseleave', (e) => {
      // keep the panel while a native <select> list is open
      if (UTILITY_HOVER.matches && e.target.tagName !== 'SELECT') setOpen(li, false);
    });
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const state = !li.classList.contains('is-open');
      lis.forEach((other) => setOpen(other, false));
      setOpen(li, state);
    });
    li.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && li.classList.contains('is-open')) {
        setOpen(li, false);
        trigger.focus();
      }
    });
  });
  document.addEventListener('click', (e) => {
    if (!utility.contains(e.target)) lis.forEach((li) => setOpen(li, false));
  });
  return () => lis.forEach((li) => setOpen(li, false));
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navDoc = await fetchNav();
  if (!navDoc) return;
  const sections = [...navDoc.doc.body.children].filter((el) => el.tagName === 'DIV');
  const [brandSec, searchSec, toolsSec, menuSec, ...utilitySecs] = sections;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');

  // row 0
  const bar = document.createElement('div');
  bar.className = 'header-mybeckman-bar';
  [buildBrand(brandSec), buildSearch(searchSec), buildTools(toolsSec)]
    .filter(Boolean)
    .forEach((el) => bar.append(el));

  // row 1
  const menubar = document.createElement('div');
  menubar.className = 'header-mybeckman-menubar';
  const hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.className = 'header-mybeckman-hamburger';
  hamburger.setAttribute('aria-label', 'Toggle navigation');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-controls', 'header-mybeckman-sections');
  hamburger.append(icon('fa-bars'), document.createTextNode('Menu'));

  const sectionsEl = document.createElement('div');
  sectionsEl.className = 'header-mybeckman-sections';
  sectionsEl.id = 'header-mybeckman-sections';
  const menu = document.createElement('ul');
  // nav-list / nav-trigger: the boilerplate header's names for the top-level list and its buttons
  menu.className = 'header-mybeckman-menu nav-list';
  menuSec?.querySelectorAll(':scope > ul > li').forEach((li) => {
    const item = document.createElement('li');
    const label = textOf(li);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-trigger';
    button.setAttribute('aria-expanded', 'false');
    const span = document.createElement('span');
    span.textContent = label;
    button.append(span, icon('fa-angle-down', 'header-mybeckman-chevron'));
    item.append(button);
    const sub = li.querySelector(':scope > ul');
    if (sub) item.append(buildPanel(sub, label));
    menu.append(item);
  });
  sectionsEl.append(menu);

  const utility = document.createElement('ul');
  utility.className = 'header-mybeckman-utility';
  utilitySecs.forEach((sec, i) => utility.append(buildDrop(sec, i)));

  menubar.append(hamburger, sectionsEl, utility);
  nav.append(bar, menubar);

  // page overlays: desktop (first menu) and mobile menu
  const overlay = document.createElement('div');
  overlay.className = 'header-mybeckman-overlay';
  const mobileOverlay = document.createElement('div');
  mobileOverlay.className = 'header-mybeckman-overlay header-mybeckman-overlay-mobile';

  block.textContent = '';
  block.append(nav, overlay, mobileOverlay);

  const { items, close } = setupMenu(nav, overlay);
  const closeUtility = setupUtility(utility);

  const toggleMobile = (state) => {
    nav.classList.toggle('is-mobile-open', state);
    mobileOverlay.classList.toggle('is-open', state);
    hamburger.setAttribute('aria-expanded', String(state));
    document.body.classList.toggle('header-mybeckman-scroll-lock', state);
    if (state && !items.some((i) => i.classList.contains('is-active'))) items[0]?.classList.add('is-active');
  };
  hamburger.addEventListener('click', () => toggleMobile(!nav.classList.contains('is-mobile-open')));
  mobileOverlay.addEventListener('click', () => toggleMobile(false));
  nav.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && nav.classList.contains('is-mobile-open')) {
      toggleMobile(false);
      hamburger.focus();
    }
  });

  // crossing the breakpoint resets both menus
  DESKTOP.addEventListener('change', () => {
    toggleMobile(false);
    items.forEach((i) => {
      close(i);
      i.classList.remove('is-active');
      i.querySelectorAll('.is-visible, .is-moved').forEach((el) => el.classList.remove('is-visible', 'is-moved'));
    });
    overlay.classList.remove('is-open');
  });
  UTILITY_HOVER.addEventListener('change', closeUtility);
}
