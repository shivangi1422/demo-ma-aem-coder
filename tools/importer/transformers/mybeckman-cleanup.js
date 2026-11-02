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
    // Marketo form config (support / service-training): stamp form id, munchkin id
    // and forms origin on the in-page container before form.mktoForm and hidden
    // inputs are removed below. The footer newsletter form is not stamped.
    const doc = element.ownerDocument || document;
    let mktoOrigin = 'https://pages.beckman.com';
    const mktoStyle = doc.querySelector('link#mktoForms2BaseStyle[href]');
    if (mktoStyle) {
      try {
        mktoOrigin = new URL(mktoStyle.getAttribute('href'), 'https://pages.beckman.com').origin;
      } catch (e) {
        // keep default origin
      }
    }
    element.querySelectorAll('#main .formassembly-container').forEach((container) => {
      if (container.closest('.footer2023')) return;
      const form = container.querySelector('form.mktoForm[id^="mktoForm_"]');
      if (!form) return;
      const formId = form.id.replace('mktoForm_', '');
      if (!formId) return;
      const munchkinInput = container.querySelector('input[name="munchkinId"]');
      const munchkin = (munchkinInput && munchkinInput.value) || '682-XWP-826';
      container.setAttribute('data-excat-mkto-form', formId);
      container.setAttribute('data-excat-mkto-munchkin', munchkin);
      container.setAttribute('data-excat-mkto-origin', mktoOrigin);
    });

    // Training: empty in-page anchor target (no href) for the "Courses" CTA
    removeAll(element, ['a[name="Courses"]:not([href])']);

    // Support: <br> spacer and empty AEO placeholder next to the H1 in #content-holder
    element.querySelectorAll('#content-holder > br').forEach((br) => br.remove());
    element.querySelectorAll('#content-holder .bcls-aeo-published').forEach((el) => {
      if (isEmpty(el)) el.remove();
    });

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

    // Breadcrumb container (breadcrumbs are rebuilt from the URL via page metadata)
    element.querySelectorAll('div.container.custome-container').forEach((el) => {
      if (el.querySelector('nav.breadcrumbs')) el.remove();
    });
    removeAll(element, ['nav.breadcrumbs']);

    // Wistia player chrome: keep the .wistia_embed element (and its
    // wistia_async_<id> class) so the columns parser can read the media id.
    element.querySelectorAll('.wistia_embed, [class*="wistia_async_"]').forEach((embed) => {
      const thumb = embed.querySelector('.w-chrome img[src*="wistia"], img[alt="Video Thumbnail"]');
      embed.querySelectorAll('.w-chrome, [id^="wistia_chrome_"], [id^="wistia_grid_"], video, .w-vulcan-v2')
        .forEach((el) => el.remove());
      // Preserve the poster thumbnail as a direct child for optional use by the parser
      if (thumb && !embed.contains(thumb)) embed.appendChild(thumb);
    });
    removeAll(element, ['.wistia_video_foam_dummy', 'wistia-tag-manager']);

    // Plan table footnote spacer: <p><span>&nbsp;</span></p>
    element.querySelectorAll('.footnotes > p').forEach((p) => {
      if (!p.textContent.replace(/ /g, ' ').trim() && !p.querySelector('img, a[href]')) p.remove();
    });

    // <br> spacers in two-column .col-md-6 cells (centrifuge additional services)
    element.querySelectorAll('.col-md-6 br').forEach((br) => br.remove());

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
    // Empty .bc-rich-text spacers (liquid-handling / particle-analysis) must not
    // become empty sections
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

    // Default-content buttons (e.g. "Get Help Now"): parsers have already turned
    // block content into tables, so remaining .btn links are default content.
    // Bold = primary button, italic = secondary (project decorateButtons).
    element.querySelectorAll('a.btn-primary, a.btn-secondary').forEach((a) => {
      if (a.closest('table, strong, em')) return;
      const wrap = element.ownerDocument.createElement(a.classList.contains('btn-secondary') ? 'em' : 'strong');
      a.replaceWith(wrap);
      wrap.append(a);
      if (!wrap.parentElement || wrap.parentElement.tagName !== 'P') {
        const p = element.ownerDocument.createElement('p');
        wrap.replaceWith(p);
        p.append(wrap);
      }
    });

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
