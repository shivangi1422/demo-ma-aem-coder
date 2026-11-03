/* eslint-disable */
/* global WebImporter */

/**
 * Prepare transformer for www.mybeckman.in FAQ listing pages (/support/faq/*).
 * Runs first (before mybeckman-cleanup removes inputs and inline styles) and keeps
 * what cleanup would lose:
 *  - the search box + category checkboxes become a placeholder carrying the filter labels
 *    (div.faq-search-source[data-categories]), parsed into the faq-search block
 *  - each question row's hidden span (question text + category GUIDs, display:none) is
 *    replaced by the row's category labels (tr[data-categories]); cleanup would otherwise
 *    unwrap the span and show its text
 *  - category tile images are CSS backgrounds (.faq-item--image style) and become <img>
 */

const GUID = /\{[0-9a-f-]+\}/gi;

export default function transform(hookName, element, payload) {
  const document = element.ownerDocument || (payload && payload.document);
  if (hookName !== 'beforeTransform') return;
  const holder = element.querySelector('#content-holder');
  if (!holder) return;

  // category filters: label per GUID (one checkbox can stand for many GUIDs)
  const labels = [];
  const byGuid = {};
  holder.querySelectorAll('input[type="checkbox"][name^="filter-group"]').forEach((box) => {
    const label = box.id ? holder.querySelector(`label[for="${box.id}"]`) : null;
    const text = label ? label.textContent.replace(/\s+/g, ' ').trim() : '';
    if (text) {
      if (!labels.includes(text)) labels.push(text);
      (box.value.match(GUID) || []).forEach((g) => { byGuid[g.toLowerCase()] = text; });
    }
    if (label) label.remove();
    box.remove();
  });

  const keyword = holder.querySelector('input[id^="txt-keyword"]');
  if (keyword) {
    const bar = keyword.closest('#content-holder > div') || keyword.parentElement;
    const placeholder = document.createElement('div');
    placeholder.className = 'faq-search-source';
    placeholder.setAttribute('data-categories', labels.join(', '));
    bar.replaceWith(placeholder);
  }

  holder.querySelectorAll('.table-block tbody tr').forEach((tr) => {
    const hidden = [...tr.querySelectorAll('span')].find((s) => /display:\s*none/i.test(s.getAttribute('style') || ''));
    if (!hidden) return;
    const cats = [];
    (hidden.textContent.match(GUID) || []).forEach((g) => {
      const label = byGuid[g.toLowerCase()];
      if (label && !cats.includes(label)) cats.push(label);
    });
    cats.sort((a, b) => labels.indexOf(a) - labels.indexOf(b));
    tr.setAttribute('data-categories', cats.join(', '));
    hidden.remove();
  });

  holder.querySelectorAll('a.faq-item').forEach((item) => {
    const bg = item.querySelector('.faq-item--image');
    const wrap = item.querySelector('.faq-item--image-wrap') || bg;
    if (!wrap) return;
    const m = bg && (bg.getAttribute('style') || '').match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/);
    if (!m) { wrap.remove(); return; }
    const img = document.createElement('img');
    img.src = m[1];
    img.alt = '';
    wrap.replaceWith(img);
  });
}
