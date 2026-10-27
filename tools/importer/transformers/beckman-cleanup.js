/* eslint-disable */
/* global WebImporter */

/**
 * Beckman Coulter (mybeckman.in, Sitecore) cleanup transformer.
 * Removes non-authorable site chrome and normalises disclaimer markup.
 * Safe for all templates (reagents, reagent-product): every selector is optional.
 * reagent-product specific rules are scoped to .product-spotlight-wrapper, which does not
 * exist on reagents category pages.
 */

const remove = (root, selectors) => {
  selectors.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => el.remove());
  });
};

const MEDIA = 'img, picture, video, iframe, svg';

// No visible text (nbsp-only counts as blank) and no media
const isBlank = (el) => !el.textContent.replace(/ /g, ' ').trim() && !el.querySelector(MEDIA);

// Disclaimer notes authored as h5 are not headings -> <p><em>...</em></p>
function convertDisclaimer(rt) {
  const doc = rt.ownerDocument;
  rt.querySelectorAll('h5').forEach((h5) => {
    const p = doc.createElement('p');
    const children = [...h5.childNodes].filter((n) => n.nodeType !== 3 || n.textContent.trim());
    const onlyEm = children.length === 1 && children[0].nodeType === 1
      && ['EM', 'I'].includes(children[0].tagName);
    const em = doc.createElement('em');
    em.innerHTML = onlyEm ? children[0].innerHTML : h5.innerHTML;
    p.append(em);
    h5.replaceWith(p);
  });
  // Drop spacer paragraphs (e.g. <p><em>&nbsp;</em></p>)
  rt.querySelectorAll('p').forEach((p) => {
    if (!p.textContent.replace(/ /g, '').trim() && !p.querySelector('img, picture, a')) p.remove();
  });
}

// reagent-product: product detail page cleanup
function cleanupProductPage(product) {
  // Sticky in-page anchor nav
  remove(product, [
    '#intrenal-page-link-wrapper',
    '.feature-holder > .sticky',
  ]);

  // Inline <style> authored inside rich text, hidden/context inputs
  remove(product, [
    '.bc-rich-text style',
    'input[type="hidden"]',
    'input[id^="context-"]',
  ]);

  // Coveo chrome (keep .techdocs-table result rows and #coveo-techdocs-more-results)
  remove(product, [
    '.coveo-search-interface-mandatory-section',
    '#resource-table-pagination',
    '.coveo-visible-to-screen-reader-only',
    '#coveo-techdocs-error',
    '.CoveoLogo',
    '.CoveoPager',
    '.coveo-footer',
    '.coveo-header',
    '.CoveoForSitecoreContext',
  ]);
  // Empty Coveo product table body (results are not rendered in the snapshot); keep the header H3
  product.querySelectorAll('#product-table-wrapper .product-table__container').forEach((c) => {
    if (isBlank(c)) c.remove();
  });

  // Empty heading / caption in embedded video
  product.querySelectorAll('.embeded-video > h2, .embeded-video p.embeded-video__caption').forEach((el) => {
    if (isBlank(el)) el.remove();
  });

  // Empty anchors (links that only wrapped injected inputs, carousel prev/next arrows)
  product.querySelectorAll('a').forEach((a) => {
    if (isBlank(a)) a.remove();
  });

  // Empty <p> spacers
  product.querySelectorAll('p').forEach((p) => {
    if (isBlank(p)) p.remove();
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // Global chrome: cookie banner, header, footer
    remove(element, [
      '#consent_blackbar',
      '#truste-consent-track',
      '#teconsent',
      '#mainNav',
      'div.footer2023',
      'a.skip-to-main-content-link',
      '#ModalPopup',
      '.flash-message',
      '.MaskOverlay',
      '#mktoStyleLoaded',
      '#MktoForms2XDIframe',
      '[id^="font-resize-frame-"]',
      '#hippowiz-ass-injected',
      '#hvmessage-toextension-listener',
      '#userId',
      '#contextItemId',
      '#csrfToken',
    ]);

    // Stray Marketo form appended to body (outside #wrapper)
    element.querySelectorAll('form.mktoForm').forEach((form) => {
      if (!form.closest('#main')) form.remove();
    });

    // Breadcrumb wrapper: only the custome-container that holds the breadcrumbs.
    // Do NOT touch .custome-container.product-spotlight-wrapper (product page main content).
    element.querySelectorAll('#main > .main-holder > .container.custome-container').forEach((c) => {
      if (c.classList.contains('product-spotlight-wrapper')) return;
      if (c.querySelector('.breadcrumbs')) c.remove();
    });
    remove(element, ['.breadcrumbs']);

    // Empty promotional wrapper
    element.querySelectorAll('.series-category-promotional-wrapper').forEach((el) => {
      if (!el.textContent.trim() && !el.querySelector('img, picture, video, iframe, a')) el.remove();
    });

    // reagents disclaimer (h5 -> <p><em>)
    element.querySelectorAll('.product-series-selector-wrapper > div > .bc-rich-text').forEach(convertDisclaimer);

    // reagent-product page cleanup
    element.querySelectorAll('.product-spotlight-wrapper').forEach(cleanupProductPage);

    // Source buttons (a.btn) -> formatted link in its own paragraph, which EDS decorates as a button:
    // red .btn-red -> bold (primary), other .btn (blue) -> italic (secondary)
    element.querySelectorAll('#main a.btn').forEach((a) => {
      if (isBlank(a) || a.closest('strong, b, em, i')) return;
      const doc = a.ownerDocument;
      const wrap = doc.createElement(a.classList.contains('btn-red') ? 'strong' : 'em');
      a.replaceWith(wrap);
      wrap.append(a);
      if (wrap.parentElement.tagName !== 'P') {
        const p = doc.createElement('p');
        wrap.replaceWith(p);
        p.append(wrap);
      }
    });
  }

  if (hookName === 'afterTransform') {
    // reagent-product disclaimer: h5 -> <p><em>...</em></p>. Done after parsing because the
    // section transformer locates this section via `.bc-rich-text:has(> h5)` in beforeTransform.
    element.querySelectorAll('.product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text').forEach((rt) => {
      if ([...rt.children].some((c) => c.tagName === 'H5')) convertDisclaimer(rt);
    });

    // Final cleanup of non-authorable elements (do not touch HTML comments: xwalk field hints)
    remove(element, [
      'header',
      'footer',
      'script',
      'style',
      'noscript',
      'link',
      'iframe',
      'input',
      '#consent_blackbar',
      '#mainNav',
      'div.footer2023',
      '.breadcrumbs',
      '[id^="font-resize-frame-"]',
    ]);

    element.querySelectorAll('[onclick], [onload], [onerror]').forEach((el) => {
      el.removeAttribute('onclick');
      el.removeAttribute('onload');
      el.removeAttribute('onerror');
    });
  }
}
