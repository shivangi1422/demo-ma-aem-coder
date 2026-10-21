/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns (block: columns, two-column layout).
 * Source: div.adjustable-two-column-display (beckmancoulter.com solutions pages).
 *
 * xwalk: core columns component (columns=2, rows=1); column children are
 * default content (text, title, button, image), so no field hints are emitted.
 *
 * Row 1: [text column: h2 + paragraphs + CTA link] | [image column]
 * Column order follows the source document order of the two segments.
 */

const clean = (str) => (str || '').replace(/\s+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#';

function buildTextColumn(segment, document) {
  const out = [];
  segment.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, a.button, a.ui.button').forEach((el) => {
    // skip nodes nested in an already-collected element
    if (el.parentElement && el.parentElement.closest('p, ul, ol, h1, h2, h3, h4, h5, h6')
      && segment.contains(el.parentElement.closest('p, ul, ol, h1, h2, h3, h4, h5, h6'))) return;
    const tag = el.tagName;
    if (/^H[1-6]$/.test(tag)) {
      const text = clean(el.textContent);
      if (!text || /^empty heading$/i.test(text)) return;
      const h = document.createElement(tag === 'H1' ? 'h2' : tag.toLowerCase());
      h.textContent = text;
      out.push(h);
      return;
    }
    if (tag === 'A') {
      const text = clean(el.textContent);
      if (!text) return;
      const p = document.createElement('p');
      const href = el.getAttribute('href');
      if (isUsableHref(href)) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = text;
        p.append(a);
      } else {
        p.textContent = text;
      }
      out.push(p);
      return;
    }
    if (tag === 'UL' || tag === 'OL') {
      const list = document.createElement(tag.toLowerCase());
      el.querySelectorAll(':scope > li').forEach((li) => {
        const item = document.createElement('li');
        item.innerHTML = li.innerHTML;
        list.append(item);
      });
      if (list.children.length) out.push(list);
      return;
    }
    // paragraph
    if (!clean(el.textContent)) return;
    const p = document.createElement('p');
    p.innerHTML = el.innerHTML.trim();
    p.querySelectorAll('a').forEach((a) => {
      if (!isUsableHref(a.getAttribute('href'))) a.replaceWith(document.createTextNode(a.textContent));
    });
    out.push(p);
  });
  return out;
}

function buildImageColumn(segment, document) {
  const out = [];
  segment.querySelectorAll('img').forEach((srcImg) => {
    if (!srcImg.getAttribute('src')) return;
    const img = document.createElement('img');
    img.src = srcImg.getAttribute('src');
    img.alt = clean(srcImg.getAttribute('alt'));
    out.push(img);
  });
  return out;
}

export default function parse(element, { document }) {
  const container = element.querySelector('.content-container') || element;
  let segments = [...container.querySelectorAll(':scope > .segment, :scope > div')];
  if (!segments.length) {
    segments = [
      element.querySelector('.adjustable-two-column-display-content'),
      element.querySelector('.adjustable-two-column-display-image'),
    ].filter(Boolean);
  }

  const row = segments.slice(0, 2).map((segment) => {
    const isImage = segment.classList.contains('adjustable-two-column-display-image')
      || (!clean(segment.textContent) && !!segment.querySelector('img'));
    const content = isImage ? buildImageColumn(segment, document) : buildTextColumn(segment, document);
    return content.length ? content : '';
  });
  while (row.length < 2) row.push('');

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
