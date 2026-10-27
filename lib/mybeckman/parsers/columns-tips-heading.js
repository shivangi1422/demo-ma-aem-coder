/* eslint-disable */
/* global WebImporter */
/**
 * Parser: columns-tips-heading (mybeckman.in /support/technical-documents)
 * Source: #main .bc-test-layout:has(> .block > .bc-rich-text > .Section)
 *   > .block > .bc-rich-text > .Section > h2 "Helpful Tips..." + hr (+ inline <style>)
 *
 * Emits columns 1x1: the heading as H2 (real text kept) + any intro paragraphs/lists.
 */

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  const root = element.querySelector('.bc-rich-text') || element;
  const cell = document.createElement('div');
  let headingDone = false;

  root.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol').forEach((node) => {
    if (node.parentElement && node.parentElement.closest('h1, h2, h3, h4, h5, h6, p, ul, ol')) return;
    if (!norm(node.textContent)) return;
    const tag = node.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      const h = document.createElement(headingDone ? 'h3' : 'h2');
      h.textContent = norm(node.textContent);
      headingDone = true;
      cell.append(h);
      return;
    }
    const copy = node.cloneNode(true);
    copy.querySelectorAll('style, script, img, picture').forEach((n) => n.remove());
    copy.querySelectorAll('a').forEach((a) => {
      const href = (a.getAttribute('href') || '').trim();
      if (!norm(a.textContent)) a.remove();
      else if (!href) a.replaceWith(...a.childNodes);
    });
    copy.removeAttribute('class');
    if (norm(copy.textContent)) cell.append(copy);
  });

  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [[cell]] }));
}
