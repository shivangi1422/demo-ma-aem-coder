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
 */

const MARKETO_DEFAULT = { host: 'pages.beckman.com', munchkinId: '682-XWP-826' };

function marketoUrl(container) {
  const scripts = [...container.querySelectorAll('script')].map((s) => s.textContent).join('\n');
  const form = container.querySelector('form[id^="mktoForm_"]');
  const formId = (scripts.match(/formId:\s*(\d+)/) || [])[1] || (form && form.id.replace('mktoForm_', ''));
  if (!formId) return null;
  const munchkinId = (scripts.match(/munchkinId:\s*"([^"]+)"/) || [])[1] || MARKETO_DEFAULT.munchkinId;
  const host = (scripts.match(/instanceURLProtoRelative:\s*"\/\/([^"]+)"/) || [])[1] || MARKETO_DEFAULT.host;
  return `https://${host}/index.php/form/getForm?munchkinId=${munchkinId}&form=${formId}`;
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
}
