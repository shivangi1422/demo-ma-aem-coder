/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Beckman Coulter site-wide cleanup.
 * Removes non-authorable site chrome (accessibility widget, global nav,
 * global search, footer, cookie banner) and leftover non-content elements.
 * All selectors verified against migration-work/cleaned.html.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // UserWay accessibility overlay / widget (body-level chrome) — captured DOM:
    //   <div class="uw-sl">, <div class="uwy userway_p5 uts">, ruler/reading guides
    // OneTrust cookie consent — captured DOM: <div id="onetrust-consent-sdk">
    WebImporter.DOMUtils.remove(element, [
      '.uw-sl',
      '.uwy',
      '#userwayLstIcon',
      '#userwayAccessibilityIcon',
      '.uw-s10-bottom-ruler-guide',
      '.uw-s10-right-ruler-guide',
      '.uw-s10-left-ruler-guide',
      '.uw-s10-reading-guide',
      '.uw-s12-tooltip',
      '#onetrust-consent-sdk',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome — captured DOM:
    //   <div class="nav-container"> (universal-navigation, global search, movetop back-to-top)
    //   <div class="footer-container"> / <div class="universal-footer"> (site footer)
    WebImporter.DOMUtils.remove(element, [
      '.nav-container',
      '#universal-navigation',
      '#movetop',
      '.global-search',
      '.global-search-spacer',
      '#mobile-search-btn',
      '.footer-container',
      '.universal-footer',
      '.universal-footer-text',
      '.mob-footer-div',
    ]);

    // Leftover non-content elements — captured DOM: <iframe>, <link>, <noscript>, <script>, <style>
    WebImporter.DOMUtils.remove(element, [
      'iframe',
      'link',
      'noscript',
      'script',
      'style',
    ]);

    // Strip non-authorable inline event/tracking attributes where present.
    element.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('onclick');
      el.removeAttribute('data-uw-rm-skl');
      el.removeAttribute('data-uw-rm-autofix-hide');
    });

    // Remove empty headings and the UserWay accessibility widget's "Empty heading"
    // placeholder (injected into a hollow <h2> wrapper before the article body).
    element.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      const text = h.textContent.trim();
      const hasMedia = h.querySelector('img, picture, svg');
      if ((!text || /^empty heading$/i.test(text)) && !hasMedia) {
        h.remove();
      }
    });
  }
}
