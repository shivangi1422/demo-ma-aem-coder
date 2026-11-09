/* eslint-disable */
/* global WebImporter */

/**
 * Prepare transformer for www.mybeckman.in service / support content pages.
 * Runs first (before mybeckman-cleanup removes scripts, styles and forms) and keeps
 * what cleanup would lose:
 *  - Marketo / FormAssembly forms (.formassembly-container) are reduced to a placeholder
 *    carrying the form link (data-form-url), parsed into the contact-form block
 *  - the page title holder (#content-holder) is removed when the page's own CSS hides it
 *    (`#content-holder { display: none }`, the title is then repeated in the page body)
 *  - lowercase .productCards lists become product tiles (cards-tile) when the page's own CSS styles
 *    them as tiles (biomek, vi-cell-metaflex); unstyled ones (/service/plans) stay default content
 *  - circles in plan tables (and their legend) become text marks before cleanup drops empty elements
 *  - extensionless Sitecore media images get a file extension (the media CDN refuses them without)
 */

// extensionless media that are JPEG (the others found on the template are PNG)
const MEDIA_JPEG = ['notifications_01-2023-04', 'notifications_02-2023-04', 'notifications_03-2023-04'];

const MARKETO_DEFAULT ={ host: 'pages.beckman.com', munchkinId: '682-XWP-826' };

function marketoUrl(container) {
  const scripts = [...container.querySelectorAll('script')].map((s) => s.textContent).join('\n');
  const form = container.querySelector('form[id^="mktoForm_"]');
  const formId = (scripts.match(/formId:\s*(\d+)/) || [])[1] || (form && form.id.replace('mktoForm_', ''));
  if (!formId) return null;
  const munchkinId = (scripts.match(/munchkinId:\s*"([^"]+)"/) || [])[1] || MARKETO_DEFAULT.munchkinId;
  const host = (scripts.match(/instanceURLProtoRelative:\s*"\/\/([^"]+)"/) || [])[1] || MARKETO_DEFAULT.host;
  // munchkinId after '#': the AEM content converter does not escape a second query parameter (&)
  return `https://${host}/index.php/form/getForm?form=${formId}#munchkinId=${munchkinId}`;
}

function formAssemblyUrl(container) {
  const form = container.querySelector('form[action*="tfaforms"]');
  if (!form || !form.id) return null;
  const host = new URL(form.getAttribute('action')).host;
  return `https://${host}/${form.id}`;
}

export default function transform(hookName, element, payload) {
  const document = element.ownerDocument || (payload && payload.document);
  if (hookName !== 'beforeTransform') return;

  element.querySelectorAll('.formassembly-container').forEach((container) => {
    // the footer newsletter form is site chrome
    if (container.closest('footer, .footer2023')) return;
    const url = marketoUrl(container) || formAssemblyUrl(container);
    if (!url) return;
    const placeholder = document.createElement('div');
    placeholder.className = 'contact-form-source';
    placeholder.setAttribute('data-form-url', url);
    container.replaceWith(placeholder);
  });

  const styles = [...element.querySelectorAll('style')].map((s) => s.textContent).join('\n');
  if (/#content-holder\s*\{[^}]*display:\s*none/.test(styles)) {
    const holder = element.querySelector('#content-holder');
    if (holder) holder.remove();
  }

  if (/\.productCard\s*\{/.test(styles)) {
    element.querySelectorAll('div.productCards').forEach((list) => list.setAttribute('data-tiles', 'styled'));
  }

  // plan comparison tables: included (filled circle) / optional (white circle)
  element.querySelectorAll('table .circle, table .whiteCircle, .footnotes .circle, .footnotes .whiteCircle').forEach((c) => {
    c.replaceWith(document.createTextNode(c.classList.contains('whiteCircle') ? '○' : '●'));
  });

  // Sitecore media links without a file extension are refused by the media CDN (403) outside the
  // site; with any extension it serves the image. Add the extension of the real format.
  element.querySelectorAll('img[src*="media.beckman.com/-/media/"]').forEach((img) => {
    const [path, query] = img.getAttribute('src').split('?');
    if (/\.[a-z0-9]{2,5}$/i.test(path.split('/').pop())) return;
    const ext = MEDIA_JPEG.some((name) => path.endsWith(`/${name}`)) ? 'jpg' : 'png';
    img.setAttribute('src', `${path}.${ext}${query ? `?${query}` : ''}`);
  });
}
