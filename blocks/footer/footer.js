import { fetchSiteFragment } from '../../scripts/scripts.js';

/**
 * Fetches the footer fragment as plain HTML (nearest to the page, see fetchSiteFragment).
 * @returns {Promise<Element|null>} container with the footer sections
 */
async function fetchFooter() {
  const resp = await fetchSiteFragment('footer');
  if (!resp) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  // resolve relative image paths against the fragment location
  container.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:|\/|data:)/.test(src)) img.src = new URL(src, resp.url).href;
    img.loading = 'lazy';
  });
  return container;
}

function iconImg(name, alt = '', ext = 'svg') {
  const img = document.createElement('img');
  img.src = `${window.hlx?.codeBasePath || ''}/icons/${name}.${ext}`;
  img.alt = alt;
  img.loading = 'lazy';
  return img;
}

// "opco-leica-microsystems" -> "Leica Microsystems"
function iconLabel(name) {
  return name.replace(/^[a-z]+-/, '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Converts the Universal Editor footer (newsletter, links, legal links + social,
 * copyright + logo, fine print + brand logos) into the three sections the footer
 * decorates: main, legal and brands.
 * @param {Element} fragment footer sections container
 */
function normalizeFooter(fragment) {
  // icons rendered as spans by the authoring pipeline become images
  fragment.querySelectorAll('span.icon').forEach((span) => {
    const name = [...span.classList].find((c) => c.startsWith('icon-'))?.slice(5);
    if (!name) return;
    const link = span.closest('a');
    span.replaceWith(iconImg(name, link?.title || iconLabel(name)));
    link?.removeAttribute('title');
  });
  // a logo link left without its image gets the trustmark
  fragment.querySelectorAll('p > a').forEach((a) => {
    if (a.textContent.trim() || a.children.length) return;
    a.append(iconImg('danaher-trustmark', a.title || '', 'png'));
    a.removeAttribute('title');
  });
  // a short plain paragraph after the newsletter intro is the input field label
  const submit = fragment.querySelector(':scope > div > p > strong > a');
  if (submit) {
    const plain = [...submit.closest('div').querySelectorAll(':scope > p')]
      .filter((p) => !p.children.length && p.textContent.trim().split(/\s+/).length <= 3);
    plain.forEach((p) => {
      const em = document.createElement('em');
      em.append(...p.childNodes);
      p.append(em);
    });
  }

  const sections = [...fragment.children];
  if (sections.length <= 3) return;
  // the legal section is the first one without lists or the form; everything before it is main
  const legalIndex = sections.findIndex((s) => !s.querySelector(':scope > ul, :scope > p > strong > a'));
  if (legalIndex <= 0) return;
  const [main, ...rest] = sections.slice(0, legalIndex);
  rest.forEach((s) => { main.append(...s.children); s.remove(); });
  if (!main.querySelector('a[href="#top"]')) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = '#top';
    a.append(iconImg('back-to-top'), 'Back to top');
    p.append(a);
    main.append(p);
  }
  // fine print authored with the brand logos moves to the legal section
  const legal = sections[legalIndex];
  sections.slice(legalIndex + 1).forEach((s) => {
    const lists = s.querySelectorAll(':scope > ul');
    if (!lists.length) return;
    [...s.children].filter((el) => el.tagName !== 'UL').forEach((el) => legal.append(el));
  });
}

/**
 * Replaces an SVG image with inline SVG so icons can inherit the text color.
 * @param {HTMLImageElement} img
 */
async function inlineSvg(img) {
  if (!img || !/\.svg($|\?)/.test(img.src)) return;
  try {
    const resp = await fetch(img.src);
    if (!resp.ok) return;
    const svg = new DOMParser().parseFromString(await resp.text(), 'image/svg+xml').querySelector('svg');
    if (!svg) return;
    svg.removeAttribute('height');
    svg.removeAttribute('class');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.classList.add('footer-glyph');
    img.replaceWith(svg);
  } catch {
    // keep the image when the SVG cannot be inlined
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

/**
 * Submits form values through a Marketo form (config from the submit link URL).
 * @param {URL} endpoint e.g. https://pages.example.com/index.php/form/getForm?munchkinId=..&form=..
 * @param {Object} values field name -> value
 */
async function submitToMarketo(endpoint, values) {
  const munchkinId = endpoint.searchParams.get('munchkinId');
  const formId = endpoint.searchParams.get('form');
  await loadScript(`${endpoint.origin}/js/forms2/js/forms2.min.js`);
  let host = document.getElementById(`mktoForm_${formId}`);
  if (!host) {
    host = document.createElement('form');
    host.id = `mktoForm_${formId}`;
    host.hidden = true;
    document.body.append(host);
  }
  return new Promise((resolve) => {
    window.MktoForms2.loadForm(endpoint.origin, munchkinId, formId, (form) => {
      form.vals(values);
      form.onSuccess(() => { resolve(true); return false; });
      form.submit();
    });
  });
}

/**
 * Builds the newsletter form from section content:
 * heading + intro, <p><em>Label</em></p> = input field, text paragraphs = consent copy,
 * <p><strong><a href="{marketo form url}">Label</a></strong></p> = submit button.
 * @param {Element} section
 * @returns {Element|null}
 */
function buildNewsletter(section) {
  const submitLink = section.querySelector(':scope > p > strong > a');
  const heading = section.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');
  if (!submitLink || !heading) return null;
  const wrapper = document.createElement('div');
  wrapper.className = 'footer-newsletter';
  const form = document.createElement('form');
  form.className = 'footer-newsletter-form';
  form.noValidate = true;
  const inputs = [];
  const nodes = [...section.children];
  const end = nodes.indexOf(submitLink.closest('p'));
  nodes.slice(nodes.indexOf(heading), end + 1).forEach((node) => {
    if (node === heading) { wrapper.append(node); return; }
    const em = node.querySelector(':scope > em');
    if (em && node.textContent.trim() === em.textContent.trim()) {
      const name = em.textContent.trim();
      const label = document.createElement('label');
      label.className = 'footer-newsletter-field';
      const text = document.createElement('span');
      text.className = 'footer-newsletter-label';
      text.textContent = name;
      const input = document.createElement('input');
      input.name = name;
      input.type = /e-?mail/i.test(name) ? 'email' : 'text';
      input.required = true;
      input.autocomplete = input.type === 'email' ? 'email' : 'on';
      label.append(text, input);
      form.append(label);
      inputs.push(input);
      node.remove();
    } else if (node.contains(submitLink)) {
      const button = document.createElement('button');
      button.type = 'submit';
      button.className = 'footer-newsletter-submit';
      button.textContent = submitLink.textContent.trim();
      form.append(button);
      node.remove();
    } else if (!form.children.length) {
      node.classList.add('footer-newsletter-intro');
      wrapper.append(node);
    } else {
      node.classList.add('footer-newsletter-consent');
      form.append(node);
    }
  });
  const button = form.querySelector('button[type="submit"]');
  if (button) form.append(button);
  const endpoint = new URL(submitLink.href);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const invalid = inputs.find((input) => !input.checkValidity() || !input.value.trim());
    if (invalid) {
      invalid.setAttribute('aria-invalid', 'true');
      invalid.reportValidity();
      return;
    }
    inputs.forEach((input) => input.removeAttribute('aria-invalid'));
    button.disabled = true;
    try {
      const values = Object.fromEntries(inputs.map((i) => [i.name, i.value.trim()]));
      await submitToMarketo(endpoint, values);
      form.reset();
    } finally {
      button.disabled = false;
    }
  });
  wrapper.append(form);
  return wrapper;
}

/**
 * Turns a list into a link list, an icon list (every item an image link) or a logo list.
 * @param {HTMLUListElement} ul
 * @returns {string} list kind
 */
function listKind(ul) {
  const items = [...ul.children];
  const imageOnly = items.every((li) => li.querySelector('img') && !li.textContent.trim());
  if (!imageOnly) return 'links';
  return items.some((li) => !li.querySelector('a')) || items.length > 6 ? 'logos' : 'icons';
}

/**
 * Converts an in-page "#top" link into a back-to-top button.
 * @param {Element} section
 * @returns {Element|null}
 */
function buildBackToTop(section) {
  const link = section.querySelector('a[href="#top"]');
  if (!link) return null;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'footer-back-to-top';
  button.append(...link.childNodes);
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  link.closest('p').remove();
  const icon = button.querySelector('img');
  if (icon) inlineSvg(icon);
  return button;
}

/**
 * Wires a "#cookie-preferences" link to the consent manager when one is present.
 * @param {Element} root
 */
function decorateConsentLink(root) {
  root.querySelectorAll('a[href="#cookie-preferences"]').forEach((a) => {
    a.setAttribute('role', 'button');
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const truste = window.truste && window.truste.eu;
      if (truste && typeof truste.clickListener === 'function') truste.clickListener();
    });
  });
}

/**
 * Lays out the main footer section: newsletter, link columns, icon list, back to top.
 * @param {Element} section
 */
function decorateMain(section) {
  section.classList.add('footer-main');
  const backToTop = buildBackToTop(section);
  const newsletter = buildNewsletter(section);
  const lists = [...section.querySelectorAll(':scope > ul')];
  const columns = document.createElement('div');
  columns.className = 'footer-columns';
  let current = null;
  let linkIndex = 0;
  lists.forEach((ul) => {
    const kind = listKind(ul);
    if (kind === 'links') {
      current = document.createElement('div');
      current.className = 'footer-col';
      ul.classList.add('footer-links', linkIndex === 0 ? 'footer-links-primary' : 'footer-links-legal');
      linkIndex += 1;
      current.append(ul);
      columns.append(current);
    } else {
      ul.classList.add('footer-follow');
      ul.querySelectorAll('a').forEach((a) => {
        const img = a.querySelector('img');
        a.setAttribute('aria-label', img.alt);
        a.target = '_blank';
        a.rel = 'noopener';
        img.alt = '';
        inlineSvg(img);
      });
      // icon lists sit under the preceding link column
      (current || columns).append(ul);
    }
  });
  section.replaceChildren(...[newsletter, columns, backToTop].filter(Boolean), ...section.children);
}

/**
 * Lays out the legal section: copyright + logo row, then the fine print.
 * @param {Element} section
 */
function decorateLegal(section) {
  section.classList.add('footer-legal');
  const paragraphs = [...section.querySelectorAll(':scope > p')];
  const logo = paragraphs.find((p) => p.querySelector('img') && !p.textContent.trim());
  const texts = paragraphs.filter((p) => p !== logo);
  const row = document.createElement('div');
  row.className = 'footer-legal-row';
  if (texts[0]) {
    texts[0].classList.add('footer-copyright');
    row.append(texts[0]);
  }
  if (logo) {
    logo.classList.add('footer-legal-logo');
    const a = logo.querySelector('a');
    if (a) { a.target = '_blank'; a.rel = 'noopener'; }
    row.append(logo);
  }
  texts.slice(1).forEach((p) => p.classList.add('footer-fineprint'));
  section.prepend(row);
}

/**
 * Lays out a section that is only a logo list.
 * @param {Element} section
 */
function decorateBrands(section) {
  section.classList.add('footer-brands');
  section.querySelectorAll('a').forEach((a) => {
    const img = a.querySelector('img');
    if (img) a.setAttribute('aria-label', img.alt);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;
  normalizeFooter(fragment);

  const footer = document.createElement('div');
  footer.className = 'footer-wrapper-inner';
  [...fragment.children].forEach((section) => {
    section.classList.add('footer-section');
    const lists = [...section.querySelectorAll(':scope > ul')];
    if (section.querySelector(':scope > p > strong > a') || lists.length > 1) {
      decorateMain(section);
    } else if (lists.length === 1 && section.children.length === 1 && listKind(lists[0]) === 'logos') {
      decorateBrands(section);
    } else {
      decorateLegal(section);
    }
    footer.append(section);
  });
  decorateConsentLink(footer);
  block.append(footer);
}
