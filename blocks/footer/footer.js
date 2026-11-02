import { getMetadata, loadScript } from '../../scripts/aem.js';
import { getPagePath } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Reads the Marketo munchkin id and form id from the authored submit link,
 * e.g. https://pages.beckman.com/index.php/form/getForm?munchkinId=682-XWP-826&form=3594
 * @param {string} href
 */
function readMarketo(href) {
  try {
    const url = new URL(href, window.location.href);
    return {
      base: url.origin,
      munchkinId: url.searchParams.get('munchkinId'),
      formId: Number(url.searchParams.get('form')),
    };
  } catch (e) {
    return null;
  }
}

/**
 * Submits the newsletter sign-up through the Marketo forms API, loaded on demand.
 * @param {{ base: string, munchkinId: string, formId: number }} config
 * @param {string} email
 * @returns {Promise<void>}
 */
async function submitToMarketo(config, email) {
  await loadScript(`${config.base}/js/forms2/js/forms2.min.js`);
  const holder = document.createElement('form');
  holder.id = `mktoForm_${config.formId}`;
  holder.hidden = true;
  document.body.append(holder);
  return new Promise((resolve, reject) => {
    window.MktoForms2.loadForm(config.base, config.munchkinId, config.formId, (form) => {
      if (!form) { reject(new Error('form unavailable')); return; }
      form.addHiddenFields({ Email: email });
      form.onSuccess(() => { resolve(); return false; });
      form.submit();
    });
  });
}

/**
 * Turns the newsletter section (heading, intro, field label, consent texts,
 * submit link) into the sign-up form.
 * @param {Element} section
 */
function buildNewsletter(section) {
  section.classList.add('footer-newsletter');
  const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) heading.classList.add('footer-newsletter-heading');
  const paragraphs = [...section.querySelectorAll(':scope > p')];
  const submitLink = section.querySelector('strong > a, a.button');
  const submitP = submitLink?.closest('p');
  const [intro, labelP, ...consents] = paragraphs.filter((p) => p !== submitP);
  if (intro) intro.classList.add('footer-newsletter-intro');
  if (!labelP || !submitLink) return;

  const form = document.createElement('form');
  form.className = 'footer-newsletter-form';
  form.noValidate = false;
  const field = document.createElement('div');
  field.className = 'footer-newsletter-field';
  const label = document.createElement('label');
  label.htmlFor = 'footer-newsletter-email';
  label.textContent = labelP.textContent.trim();
  const input = document.createElement('input');
  input.type = 'email';
  input.id = 'footer-newsletter-email';
  input.name = 'Email';
  input.required = true;
  input.autocomplete = 'email';
  field.append(label, input);
  form.append(field);

  consents.forEach((p) => {
    const text = document.createElement('div');
    text.className = 'footer-newsletter-consent';
    while (p.firstChild) text.append(p.firstChild);
    form.append(text);
    p.remove();
  });

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'footer-newsletter-submit';
  button.textContent = submitLink.textContent.trim();
  const status = document.createElement('p');
  status.className = 'footer-newsletter-status';
  status.setAttribute('role', 'status');
  form.append(button, status);

  const config = readMarketo(submitLink.getAttribute('href'));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity() || !config) return;
    button.disabled = true;
    try {
      await submitToMarketo(config, input.value.trim());
      form.reset();
      status.textContent = 'Thank you for subscribing.';
    } catch (err) {
      status.textContent = 'Sorry, something went wrong. Please try again later.';
    } finally {
      button.disabled = false;
    }
  });

  labelP.replaceWith(form);
  submitP.remove();
}

/**
 * Link icons (social, partner logos) get their link title as accessible text;
 * social icons are drawn as masks so they can change color on hover.
 * @param {Element} footer
 */
function decorateIconLinks(footer) {
  footer.querySelectorAll('a .icon').forEach((icon) => {
    const a = icon.closest('a');
    const label = a.getAttribute('title') || '';
    a.setAttribute('aria-label', label);
    const img = icon.querySelector('img');
    if (img) img.alt = '';
    const name = [...icon.classList].find((c) => c.startsWith('icon-'))?.slice(5) || '';
    if (name.startsWith('social-')) {
      icon.classList.add('footer-mask-icon');
      icon.style.setProperty('--icon-url', `url('${window.hlx.codeBasePath}/icons/${name}.svg')`);
      icon.replaceChildren();
    }
  });
  footer.querySelectorAll('li > .icon').forEach((icon) => {
    const img = icon.querySelector('img');
    if (img) img.alt = 'Beckman Coulter Life Sciences';
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : `${getPagePath().root}/footer`;
  const fragment = await loadFragment(footerPath);
  if (!fragment) return;

  const sections = [...fragment.children]
    .map((section) => section.querySelector('.default-content-wrapper') || section);
  const [newsletter, primary, secondary, legal, fineprint] = sections;

  block.textContent = '';
  const inner = document.createElement('div');
  inner.className = 'footer-inner';

  if (newsletter) {
    buildNewsletter(newsletter);
    inner.append(newsletter);
  }

  const columns = document.createElement('div');
  columns.className = 'footer-columns';
  if (primary) {
    primary.classList.add('footer-column', 'footer-column-primary');
    columns.append(primary);
  }
  if (secondary) {
    secondary.classList.add('footer-column', 'footer-column-secondary');
    const lists = secondary.querySelectorAll(':scope > ul');
    if (lists[1]) lists[1].classList.add('footer-social');
    columns.append(secondary);
  }
  inner.append(columns);

  const top = document.createElement('button');
  top.type = 'button';
  top.className = 'footer-back-to-top';
  const arrow = document.createElement('span');
  arrow.className = 'footer-mask-icon footer-back-to-top-icon';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.style.setProperty('--icon-url', `url('${window.hlx.codeBasePath}/icons/back-to-top.svg')`);
  top.append(arrow, document.createTextNode('Back to top'));
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  inner.append(top);

  const legalWrap = document.createElement('div');
  legalWrap.className = 'footer-legal';
  if (legal) {
    legal.classList.add('footer-legal-row', 'footer-copyright');
    const logo = legal.querySelector('a:has(img), p:has(img)');
    if (logo) logo.closest('p')?.classList.add('footer-trustmark');
    legalWrap.append(legal);
  }
  if (fineprint) {
    fineprint.classList.add('footer-legal-row', 'footer-fineprint');
    const logos = fineprint.querySelector(':scope > ul');
    if (logos) {
      logos.classList.add('footer-opco');
      legalWrap.append(fineprint, logos);
    } else legalWrap.append(fineprint);
  }

  // Cookie Preferences opens the consent manager when it is present on the page
  block.addEventListener('click', (e) => {
    const link = e.target.closest('a[href="#cookie-preferences"]');
    if (!link) return;
    e.preventDefault();
    window.truste?.eu?.clickListener?.();
  });

  decorateIconLinks(inner);
  decorateIconLinks(legalWrap);
  block.append(inner, legalWrap);
}
