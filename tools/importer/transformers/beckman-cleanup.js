/* eslint-disable */
/* global WebImporter */

/**
 * mybeckman.in (Sitecore) cleanup transformer.
 * beforeTransform: removes site chrome (cookie banner, header, footer, breadcrumb — the EDS
 * breadcrumb block builds its own), wraps loose intro text in <p>, turns disclaimer h5 notes
 * into italic paragraphs and keeps source buttons as EDS button formatting.
 * afterTransform: drops leftover non-authorable elements.
 */
const remove = (root, selectors) => selectors.forEach((sel) => root.querySelectorAll(sel).forEach((el) => el.remove()));
const clean = (s) => (s || '').replace(/ /g, ' ').replace(/[​﻿]/g, '').trim();

// loose text / inline nodes directly inside a container -> paragraphs
function wrapLooseText(container) {
  const doc = container.ownerDocument;
  let para = null;
  [...container.childNodes].forEach((node) => {
    const inline = node.nodeType === 3 || (node.nodeType === 1 && ['A', 'EM', 'STRONG', 'B', 'I', 'SPAN', 'SUP', 'SUB', 'BR'].includes(node.tagName));
    if (!inline) { para = null; return; }
    if (!para) {
      if (!clean(node.textContent)) return;
      para = doc.createElement('p');
      node.before(para);
    }
    para.append(node);
  });
}

// disclaimer notes are authored as h5 but are not headings -> <p><em>…</em></p>
function convertNotes(rt) {
  const doc = rt.ownerDocument;
  rt.querySelectorAll('h5').forEach((h5) => {
    const p = doc.createElement('p');
    const em = h5.querySelector(':scope > em, :scope > i');
    const inner = doc.createElement('em');
    inner.innerHTML = (em && clean(h5.textContent) === clean(em.textContent)) ? em.innerHTML : h5.innerHTML;
    p.append(inner);
    h5.replaceWith(p);
  });
  rt.querySelectorAll('p').forEach((p) => { if (!clean(p.textContent) && !p.querySelector('img, a')) p.remove(); });
}

export default function transform(hookName, element, payload) { // eslint-disable-line no-unused-vars
  if (hookName === 'beforeTransform') {
    // keep the live breadcrumb label for the current page (read by the import script into
    // the "breadcrumb-title" page metadata) before the source breadcrumb is removed
    const current = element.querySelector('.breadcrumbs li.active, .breadcrumbs li:last-child');
    if (current && clean(current.textContent)) element.setAttribute('data-excat-breadcrumb-title', clean(current.textContent));

    remove(element, [
      '#consent_blackbar', '#truste-consent-track', '#teconsent', '#mainNav', 'div.footer2023',
      'a.skip-to-main-content-link', '#ModalPopup', '.flash-message', '.MaskOverlay',
      '[id^="font-resize-frame-"]', 'input[type="hidden"]', '.breadcrumbs',
    ]);
    element.querySelectorAll('#main > .main-holder > .container.custome-container').forEach((c) => {
      if (!clean(c.textContent)) c.remove();
    });
    element.querySelectorAll('.series-category-promotional-wrapper').forEach((el) => {
      if (!clean(el.textContent) && !el.querySelector('img, a')) el.remove();
    });

    // empty anchors left by the source rich-text editor (<a href=""></a>)
    element.querySelectorAll('#main a').forEach((a) => {
      if (!clean(a.textContent) && !a.querySelector('img, picture')) a.remove();
    });

    element.querySelectorAll('.product-heading-wrap').forEach(wrapLooseText);
    element.querySelectorAll('.product-series-selector-wrapper > div > .bc-rich-text').forEach(convertNotes);

    // source buttons -> own paragraph, bold (red, primary) or italic (secondary)
    element.querySelectorAll('#main a.btn').forEach((a) => {
      if (!clean(a.textContent) || a.closest('strong, b, em, i')) return;
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
    remove(element, ['header', 'footer', 'script', 'style', 'noscript', 'link', 'iframe', 'input', 'form']);
  }
}
