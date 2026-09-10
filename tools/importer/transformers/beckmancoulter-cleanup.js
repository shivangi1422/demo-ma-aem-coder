/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Beckman Coulter site-wide cleanup.
 * Removes non-authorable global chrome (UserWay accessibility widget, universal
 * navigation, search, breadcrumbs, footer, cookie banner) and leftover
 * non-authorable elements. All selectors verified against migration-work/cleaned.html.
 *
 * ⚠️ IMPORTANT: In this snapshot the whole page is malformed-nested INSIDE the
 * UserWay wrappers: body > .uwy (l.37) > .diagnostics-container (l.76) >
 * #main-container (l.912). Removing .uwy or .diagnostics-container would delete
 * ALL authorable content. So we target the widget's OWN child elements only, and
 * remove nav via .nav-container (verified sibling of #main-container, l.78, not
 * an ancestor).
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    WebImporter.DOMUtils.remove(element, [
      // OneTrust cookie consent banner/dialog (cleaned.html:2185 #onetrust-consent-sdk)
      '#onetrust-consent-sdk',
      // UserWay accessibility skip-links bar (cleaned.html:2 .uw-sl — closed before .uwy)
      '.uw-sl',
      // UserWay widget's own children only — NOT the .uwy wrapper (see header note)
      '.userway_buttons_wrapper',        // cleaned.html:38
      '.uwaw-dictionary-tooltip',        // cleaned.html:58
      '.uw-s10-bottom-ruler-guide',      // cleaned.html:64
      '.uw-s10-right-ruler-guide',       // cleaned.html:66
      '.uw-s10-left-ruler-guide',        // cleaned.html:68
      '.uw-s10-reading-guide',           // cleaned.html:70
      '.uw-s12-tooltip',                 // cleaned.html:74
      // Hidden Marketo confirmation message ("Thank you for your request…") —
      // a display:hidden sibling of the form, not authorable page content.
      '#confirmform',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    WebImporter.DOMUtils.remove(element, [
      // Universal navigation + scroll-to-top + mobile nav + global search
      // (cleaned.html:78 .nav-container — sibling of #main-container, wraps all nav chrome)
      '.nav-container',
      // Breadcrumb trail inside main-container (cleaned.html:915 .breadcrumbs.breadcrumb-ui)
      '.breadcrumbs.breadcrumb-ui',
      // Global footer (cleaned.html:1787/1790 .footer-container / .universal-footer)
      '.universal-footer',
      '.universal-footer-text',
      '.footer-container',
      // Non-authorable / non-rendering elements
      'iframe',
      'link',
      'noscript',
      'script',
    ]);

    // JS-injected "Feedback" widget label — rendered at runtime as a bare
    // element, not authorable content. Remove any leaf element whose only text
    // is "Feedback".
    element.querySelectorAll('p, div, span, a, button').forEach((el) => {
      if (el.children.length === 0 && /^\s*feedback\s*$/i.test(el.textContent || '')) {
        el.remove();
      }
    });
  }
}
