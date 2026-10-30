/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for www.mybeckman.in.
 * Removes non-authorable chrome (header, footer, consent banner, modals,
 * Marketo/Coveo widgets, empty spacers, hidden inputs) captured in
 * migration-work/cleaned.html.
 */

const removeAll = (root, selectors) => {
  selectors.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => el.remove());
  });
};

const isEmpty = (el) => !el.textContent.trim()
  && !el.querySelector('img, picture, video, iframe, svg, a[href], h1, h2, h3, h4, h5, h6');

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // Overlays / modals / consent banners that may interfere with block matching
    removeAll(element, [
      '#consent_blackbar',
      '#teconsent',
      '[id^="truste-"]',
      '[class*="truste"]',
      '#trustarc-banner-overlay',
      '#ModalPopup',
      '.MaskOverlay',
      '.flash-message',
      '#mktoStyleLoaded',
      'form.mktoForm',
      '#MktoForms2XDIframe',
      '#external_search_box_section',
      '.skip-to-main-content-link',
    ]);

    // Hidden / csrf inputs
    removeAll(element, [
      'input#userId',
      'input#contextItemId',
      'input#csrfToken',
      'input[type="hidden"]',
    ]);

    // Empty layout spacers
    element.querySelectorAll('div.container.custome-container').forEach((el) => {
      if (isEmpty(el)) el.remove();
    });
    element.querySelectorAll('div.row.js-component').forEach((el) => {
      if (isEmpty(el)) el.remove();
    });
    element.querySelectorAll('#content-holder').forEach((el) => {
      if (isEmpty(el)) el.remove();
    });
    element.querySelectorAll('.bc-rich-text').forEach((el) => {
      if (isEmpty(el)) el.remove();
    });
  }

  if (hookName === 'afterTransform') {
    // Site chrome
    removeAll(element, [
      'header#mainNav',
      'header',
      'div.footer2023',
      'footer',
      'nav',
    ]);

    // Non-content elements
    removeAll(element, [
      'script',
      'style',
      'noscript',
      'link',
      'iframe',
      'input',
      'form',
      'button',
    ]);

    // Tracking / data attributes (keep data-excat-* markers for the sections transformer)
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        if (
          (attr.name.startsWith('data-') && !attr.name.startsWith('data-excat-'))
          || attr.name.startsWith('on')
          || attr.name === 'aria-hidden'
        ) {
          el.removeAttribute(attr.name);
        }
      });
    });
  }
}
