import { siteDocumentPath, rebaseImages } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';

function el(tag, className, ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.append(...children);
  return node;
}

/**
 * Embeds the Marketo newsletter form once the footer comes close to the viewport.
 * @param {Element} container element to render the form into
 * @param {string} href Marketo getForm URL (munchkinId and form parameters)
 */
function embedMarketoForm(container, href) {
  const url = new URL(href);
  const munchkinId = url.searchParams.get('munchkinId');
  const formId = url.searchParams.get('form');
  if (!munchkinId || !formId) return;
  const form = el('form');
  form.id = `mktoForm_${formId}`;
  container.append(form);

  const load = () => {
    const script = document.createElement('script');
    script.src = `${url.origin}/js/forms2/js/forms2.min.js`;
    script.onload = () => {
      window.MktoForms2.loadForm(url.origin, munchkinId, Number(formId), (mkto) => {
        // let the footer styles own the layout instead of Marketo's inline widths
        mkto.getFormElem()[0].querySelectorAll('[style]').forEach((node) => node.removeAttribute('style'));
        mkto.getFormElem()[0].removeAttribute('style');
        container.classList.add('is-loaded');
      });
    };
    document.head.append(script);
  };
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      load();
    }
  }, { rootMargin: '300px' });
  observer.observe(container);
}

function backToTopButton() {
  const button = el('button', 'footer-back-to-top');
  button.type = 'button';
  button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 7.5-7.5 7.5 7.5m-15 6 7.5-7.5 7.5 7.5"/></svg>Back to top`;
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  return button;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerPath = siteDocumentPath('footer');
  const fragment = await loadFragment(footerPath);
  block.textContent = '';
  if (!fragment) return;
  rebaseImages(fragment, footerPath);

  const [newsletter, primary, secondary, legal, fineprint, opcos] = [...fragment.children]
    .map((s) => s.querySelector('.default-content-wrapper') || s);

  // newsletter: heading, intro and the Marketo form
  const news = el('section', 'footer-newsletter');
  if (newsletter) {
    const formLink = newsletter.querySelector('a[href*="munchkinId"]');
    const formHolder = el('div', 'footer-form');
    if (formLink) {
      formLink.closest('p').remove();
      embedMarketoForm(formHolder, formLink.href);
    }
    news.append(...newsletter.childNodes, formHolder);
  }

  const columns = el('div', 'footer-columns');
  [primary, secondary].forEach((part, i) => {
    if (!part) return;
    const column = el('section', `footer-links footer-links-${i ? 'secondary' : 'primary'}`, ...part.childNodes);
    columns.append(column);
  });
  const social = columns.querySelector('.footer-links-secondary ul:nth-of-type(2)');
  if (social) {
    social.className = 'footer-social';
    social.querySelectorAll('a').forEach((a) => {
      const icon = a.querySelector('.icon');
      const img = icon && icon.querySelector('img');
      if (img) {
        // a masked icon follows the link colour on hover
        icon.style.setProperty('--icon', `url('${img.src}')`);
        img.remove();
      }
      a.setAttribute('aria-label', a.textContent.trim());
      const label = [...a.childNodes]
        .find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
      if (label) label.replaceWith(el('span', 'footer-sr-only', label.textContent.trim()));
    });
  }
  columns.querySelectorAll('.footer-links > ul:not(.footer-social)')
    .forEach((ul) => ul.classList.add('footer-link-list'));

  const main = el('div', 'footer-main', news, columns, backToTopButton());

  const legalWrap = el('div', 'footer-legal');
  if (legal) {
    const logo = legal.querySelector('a img')?.closest('a');
    if (logo) {
      logo.className = 'footer-legal-logo';
      logo.closest('p').replaceWith(logo);
    }
    legalWrap.append(el('div', 'footer-legal-row', ...legal.childNodes));
  }
  if (fineprint) {
    const row = el('div', 'footer-legal-row footer-fineprint', ...fineprint.childNodes);
    legalWrap.append(row);
  }

  const parts = [main, legalWrap];
  if (opcos) {
    const list = opcos.querySelector('ul');
    if (list) {
      list.className = 'footer-opco-list';
      parts.push(el('div', 'footer-opcos', list));
    }
  }

  const footer = el('div', 'footer-content', ...parts);
  block.append(footer);
}
