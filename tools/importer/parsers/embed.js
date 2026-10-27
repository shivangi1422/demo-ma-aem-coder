/* eslint-disable */
/* global WebImporter */

/**
 * Parser for embed (block: embed).
 * Source: an embedded <iframe> (e.g. iframe[src*="genial.ly"] on the DxA 5000 Fit
 * page); the instance element is the iframe itself.
 *
 * Library convention: one cell with the URL of the external content. The local
 * block (blocks/embed/README.md) adds an optional title row.
 * xwalk model `embed`: url (aem-content), title (text).
 * Row 1: <a href="{iframe src}">{iframe src}</a>
 * Row 2: accessible frame title - the iframe title unless it is a generic
 *        placeholder ("view-genial", "iframe", ...), else the nearest heading
 *        before the iframe (e.g. "Explore DxA 5000 Fit Features"); empty when
 *        nothing meaningful exists (the block then falls back itself).
 * The iframe's sizing wrappers (padding-bottom ratio boxes) are replaced too
 * when they hold nothing else.
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

/** escape stray '%' so URI decoding in html2md does not throw */
const safeUrl = (url) => (url || '').trim().replace(/%(?![0-9a-fA-F]{2})/g, '%25');

const isGenericTitle = (title) => !title
  || /^(view[-\s]?genial(ly)?|genially|iframe|embed|frame|video|player|untitled|content)$/i.test(title)
  || /^https?:\/\//i.test(title);

const isUsableHeading = (h) => {
  const t = clean(h.textContent);
  return t && !/^empty heading$/i.test(t) && h.getAttribute('aria-hidden') !== 'true';
};

/** closest preceding heading, walking up at most a few wrapper levels */
function headingBefore(element) {
  let node = element;
  for (let depth = 0; node && depth < 6; depth += 1) {
    let prev = node.previousElementSibling;
    while (prev) {
      const headings = /^H[1-6]$/.test(prev.tagName) ? [prev] : [...prev.querySelectorAll('h1, h2, h3, h4, h5, h6')];
      const h = headings.reverse().find(isUsableHeading);
      if (h) return clean(h.textContent);
      prev = prev.previousElementSibling;
    }
    node = node.parentElement;
    if (!node || node.matches('#main-container, body, .sublayout, .page-content')) break;
  }
  return '';
}

export default function parse(element, { document }) {
  const iframe = element.tagName === 'IFRAME' ? element : element.querySelector('iframe');
  const src = iframe
    ? (iframe.getAttribute('src') || iframe.getAttribute('data-src') || '').trim()
    : '';
  const url = src.startsWith('//') ? `https:${src}` : src;

  const cells = [];

  // ---- row 1: url ----------------------------------------------------------
  if (url) {
    const a = document.createElement('a');
    a.href = safeUrl(url);
    a.textContent = safeUrl(url);
    cells.push([[document.createComment(' field:url '), a]]);
  } else {
    cells.push(['']);
  }

  // ---- row 2: title --------------------------------------------------------
  const iframeTitle = clean(iframe ? iframe.getAttribute('title') : '');
  const title = !isGenericTitle(iframeTitle) ? iframeTitle : headingBefore(iframe || element);
  if (title) {
    cells.push([[document.createComment(' field:title '), document.createTextNode(title)]]);
  } else {
    cells.push(['']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'embed', cells });
  element.replaceWith(block);
}
