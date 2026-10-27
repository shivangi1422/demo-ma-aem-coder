/*
 * Footer (mybeckman theme)
 * Used on pages whose metadata sets `theme: theme-mybeckman` (see THEMED_BLOCKS in scripts.js).
 *
 * All copy, links and images come from the footer document (/en-in/footer). Sections are
 * recognised by their content:
 *   - heading + <strong> link            newsletter: <em> paragraph = required email field,
 *                                        other paragraphs = notes, <strong> link = submit
 *                                        (hands off to the live sign-up form)
 *   - list of text links                 link columns (first = primary, red)
 *   - list of image links, before legal  social icons (added under the last link column)
 *   - single short paragraph             "back to top" button
 *   - paragraphs + image link            legal: copyright + logo, then fine print
 *   - list of images, after legal        company logos band
 */

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
 * Fetches the footer document of the /en-in site.
 * @returns {Promise<Document|null>}
 */
async function fetchFooter() {
  const found = await fetchSiteDocument('footer');
  if (!found) return null;
  const { resp, url } = found;
  const base = new URL(url, window.location.href).href;
  const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
  // images are referenced relative to the footer document
  doc.querySelectorAll('img[src]').forEach((img) => {
    img.setAttribute('src', new URL(img.getAttribute('src'), base).href);
  });
  return doc;
}

function icon(name, className) {
  const span = document.createElement('span');
  span.className = `footer-mybeckman-icon ${className}`;
  span.style.setProperty('--icon', `url("${ICON_PATH}/${name}.svg")`);
  span.setAttribute('aria-hidden', 'true');
  return span;
}

function cloneLink(a, content) {
  const link = document.createElement('a');
  link.href = a.getAttribute('href');
  if (!link.href.startsWith(window.location.origin)) {
    link.target = '_blank';
    link.rel = 'noopener';
  }
  link.append(...(content || [document.createTextNode(a.textContent.trim())]));
  return link;
}

const isImageList = (el) => el.matches('ul') && [...el.children].every((li) => li.querySelector('img'));
const isTextLinkList = (el) => el.matches('ul') && [...el.children].every((li) => li.querySelector('a') && !li.querySelector('img'));

/* ---------- builders ---------- */

function buildNewsletter(section) {
  const wrap = document.createElement('section');
  wrap.className = 'footer-mybeckman-form';
  const form = document.createElement('form');
  form.noValidate = false;
  let submitHref = '';
  [...section.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName)) {
      const h = document.createElement(el.tagName.toLowerCase());
      h.className = 'footer-mybeckman-heading';
      h.textContent = el.textContent.trim();
      wrap.append(h);
    } else if (el.matches('p') && el.querySelector(':scope > strong > a')) {
      const a = el.querySelector('a');
      submitHref = a.getAttribute('href');
      const button = document.createElement('button');
      button.type = 'submit';
      button.textContent = a.textContent.trim();
      form.append(button);
    } else if (el.matches('p') && el.children.length === 1 && el.firstElementChild.tagName === 'EM'
      && el.textContent.trim() === el.firstElementChild.textContent.trim()) {
      // <em> paragraph = required email field with its label
      const id = 'footer-mybeckman-email';
      const label = document.createElement('label');
      label.htmlFor = id;
      const star = document.createElement('span');
      star.className = 'footer-mybeckman-required';
      star.textContent = '*';
      label.append(star, document.createTextNode(el.textContent.trim()));
      const input = document.createElement('input');
      input.type = 'email';
      input.id = id;
      input.name = 'Email';
      input.required = true;
      input.autocomplete = 'email';
      const field = document.createElement('div');
      field.className = 'footer-mybeckman-field';
      field.append(label, input);
      form.append(field);
    } else if (el.matches('p')) {
      const p = el.cloneNode(true);
      // notes inside the form (consent, privacy) vs the intro above it
      if (form.children.length) {
        p.className = 'footer-mybeckman-note';
        p.querySelectorAll('a').forEach((a) => { a.target = '_blank'; a.rel = 'noopener'; });
        form.append(p);
      } else {
        wrap.append(p);
      }
    }
  });
  // look-alike form: valid submissions continue on the live sign-up form
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (form.reportValidity() && submitHref) window.open(submitHref, '_blank', 'noopener');
  });
  wrap.append(form);
  return wrap;
}

function buildLinkColumn(ul, primary) {
  const col = document.createElement('section');
  col.className = `footer-mybeckman-column footer-mybeckman-column-${primary ? 'primary' : 'secondary'}`;
  const list = document.createElement('ul');
  list.className = 'footer-mybeckman-links';
  ul.querySelectorAll(':scope > li > a').forEach((a) => {
    const li = document.createElement('li');
    li.append(cloneLink(a));
    list.append(li);
  });
  col.append(list);
  return col;
}

/**
 * Fetches an SVG and returns it as an inline element (keeps currentColor), or null.
 * @param {string} src
 * @returns {Promise<SVGElement|null>}
 */
async function inlineSvg(src) {
  try {
    const resp = await fetch(src);
    const svg = resp.ok && new DOMParser().parseFromString(await resp.text(), 'image/svg+xml').querySelector('svg');
    if (!svg) return null;
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    return document.importNode(svg, true);
  } catch (e) {
    return null;
  }
}

/**
 * Social icons are inlined (they use currentColor, so they follow the link colour:
 * grey, red on hover); if an icon cannot be inlined the image is kept.
 */
async function buildSocial(ul) {
  const list = document.createElement('ul');
  list.className = 'footer-mybeckman-social';
  const items = await Promise.all([...ul.querySelectorAll(':scope > li')].map(async (item) => {
    const a = item.querySelector('a');
    const img = item.querySelector('img');
    const glyph = (await inlineSvg(img.src)) || img.cloneNode(true);
    const link = cloneLink(a, [glyph]);
    link.setAttribute('aria-label', img.alt);
    const li = document.createElement('li');
    li.append(link);
    return li;
  }));
  list.append(...items);
  return list;
}

async function buildBackToTop(section) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'footer-mybeckman-top';
  const name = 'heroicons-chevron-double-up';
  const svg = await inlineSvg(`${ICON_PATH}/${name}.svg`);
  if (svg) svg.classList.add('footer-mybeckman-top-icon');
  button.append(svg || icon(name, 'footer-mybeckman-top-icon'), document.createTextNode(section.textContent.trim()));
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  return button;
}

function buildLegal(section) {
  const legal = document.createElement('div');
  legal.className = 'footer-mybeckman-legal';
  const inner = document.createElement('div');
  inner.className = 'footer-mybeckman-legal-inner';
  const paragraphs = [...section.children];
  const logoIndex = paragraphs.findIndex((p) => p.querySelector('a img'));
  // row 1: text before the logo + the logo; row 2: the rest (fine print)
  const row1 = document.createElement('div');
  row1.className = 'footer-mybeckman-legal-row';
  paragraphs.slice(0, logoIndex).forEach((p) => row1.append(p.cloneNode(true)));
  if (logoIndex >= 0) {
    const a = paragraphs[logoIndex].querySelector('a');
    const img = a.querySelector('img').cloneNode(true);
    img.className = 'footer-mybeckman-legal-logo';
    img.loading = 'lazy';
    const link = cloneLink(a, [img]);
    link.className = 'footer-mybeckman-legal-logo-link';
    row1.append(link);
  }
  inner.append(row1);
  const rest = paragraphs.slice(logoIndex + 1);
  if (rest.length) {
    const row2 = document.createElement('div');
    row2.className = 'footer-mybeckman-legal-row';
    rest.forEach((p) => {
      const clone = p.cloneNode(true);
      clone.className = 'footer-mybeckman-fineprint';
      row2.append(clone);
    });
    inner.append(row2);
  }
  legal.append(inner);
  return legal;
}

function buildLogos(ul) {
  const band = document.createElement('div');
  band.className = 'footer-mybeckman-logos';
  const list = document.createElement('ul');
  ul.querySelectorAll(':scope > li').forEach((item) => {
    const img = item.querySelector('img').cloneNode(true);
    img.loading = 'lazy';
    const a = item.querySelector('a');
    const holder = a ? cloneLink(a, [img]) : document.createElement('span');
    if (!a) holder.append(img);
    holder.setAttribute('aria-label', img.alt);
    const li = document.createElement('li');
    li.append(holder);
    list.append(li);
  });
  band.append(list);
  return band;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const doc = await fetchFooter();
  if (!doc) return;
  const sections = [...doc.body.children].filter((el) => el.tagName === 'DIV');

  const inner = document.createElement('div');
  inner.className = 'footer-mybeckman-inner';
  const columns = document.createElement('div');
  columns.className = 'footer-mybeckman-columns';
  const after = [];
  let newsletter;
  let backToTop;
  let legalSeen = false;

  const pending = [];
  sections.forEach((section) => {
    const first = section.firstElementChild;
    if (!first) return;
    if (section.querySelector('h1, h2, h3, h4, h5, h6') && section.querySelector('strong > a')) {
      newsletter = buildNewsletter(section);
    } else if (section.children.length === 1 && isTextLinkList(first)) {
      columns.append(buildLinkColumn(first, !columns.children.length));
    } else if (section.children.length === 1 && isImageList(first)) {
      if (legalSeen) {
        after.push(buildLogos(first));
      } else {
        const column = columns.lastElementChild;
        pending.push(buildSocial(first).then((social) => column?.append(social)));
      }
    } else if (section.children.length === 1 && first.matches('p') && !first.querySelector('a, img')) {
      pending.push(buildBackToTop(first).then((button) => { backToTop = button; }));
    } else if (section.querySelector('p a img')) {
      legalSeen = true;
      after.push(buildLegal(section));
    }
  });

  await Promise.all(pending);
  if (newsletter) inner.append(newsletter);
  inner.append(columns);
  if (backToTop) inner.append(backToTop);
  block.replaceChildren(inner, ...after);
}
