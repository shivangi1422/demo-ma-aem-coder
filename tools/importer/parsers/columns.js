/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns (Columns block, no option).
 * Sources: https://www.mybeckman.in/service/plans, /service/plans/<product-line>
 * Selectors: .Section > .Section__two-column, .Section > .row:has(> .col-md-6)
 * Model: columns (no field hints for Columns blocks).
 * One row, one cell per column. Text columns keep headings, paragraphs, lists
 * and images; "Learn More" button links become <p><strong><a></a></strong></p>
 * (bold = primary button, see decorateButtons). A Wistia embed column becomes a lone
 * https://fast.wistia.net/embed/iframe/<id> link (decorated into an iframe).
 */

const COLUMN_SELECTOR = ':scope > .Section__two-column-left, :scope > .Section__two-column-right, '
  + ':scope > .Section__two-column-item, :scope > [class*="col-md-6"]';

const KEEP_TAGS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'UL', 'OL', 'IMG', 'PICTURE', 'TABLE', 'BLOCKQUOTE'];

function buttonParagraph(a, document) {
  const link = document.createElement('a');
  link.setAttribute('href', a.getAttribute('href'));
  link.textContent = a.textContent.trim();
  const strong = document.createElement('strong');
  strong.appendChild(link);
  const p = document.createElement('p');
  p.appendChild(strong);
  return p;
}

function collect(container, out, document) {
  Array.from(container.children).forEach((child) => {
    const tag = child.tagName;
    if (tag === 'BR') return;
    if (tag === 'A') {
      if (!child.getAttribute('href') || !child.textContent.trim()) return;
      out.push(buttonParagraph(child, document));
      return;
    }
    if (tag === 'P') {
      const links = child.querySelectorAll('a[href]');
      // paragraph holding only a button link
      if (links.length === 1 && links[0].classList.contains('btn')
        && child.textContent.trim() === links[0].textContent.trim()) {
        out.push(buttonParagraph(links[0], document));
        return;
      }
      if (!child.textContent.trim() && !child.querySelector('img, picture')) return;
      out.push(child);
      return;
    }
    if (KEEP_TAGS.includes(tag)) {
      if (tag !== 'IMG' && tag !== 'PICTURE' && !child.textContent.trim() && !child.querySelector('img, picture')) return;
      out.push(child);
      return;
    }
    if (tag === 'DIV' || tag === 'SECTION' || tag === 'ARTICLE' || tag === 'SPAN') {
      collect(child, out, document);
    }
  });
}

function videoParagraph(col, document) {
  const embed = col.querySelector('[class*="wistia_async_"]');
  if (!embed) return null;
  const match = (embed.getAttribute('class') || '').match(/wistia_async_([a-z0-9]+)/i);
  if (!match) return null;
  const src = `https://fast.wistia.net/embed/iframe/${match[1]}`;
  const a = document.createElement('a');
  a.setAttribute('href', src);
  a.textContent = src;
  const p = document.createElement('p');
  p.appendChild(a);
  return p;
}

export default function parse(element, { document }) {
  let columns = Array.from(element.querySelectorAll(COLUMN_SELECTOR));
  if (!columns.length) columns = Array.from(element.querySelectorAll(':scope > div'));

  const row = columns.map((col) => {
    const video = videoParagraph(col, document);
    if (video) return [video];
    const content = [];
    collect(col, content, document);
    return content.length ? content : '';
  });

  // Images without alt text (e.g. the Training photo): use the row's first heading.
  const rowHeading = element.querySelector('h1, h2, h3, h4, h5, h6');
  row.forEach((cell) => {
    if (!Array.isArray(cell)) return;
    cell.forEach((node) => {
      const imgs = node.tagName === 'IMG' ? [node] : Array.from(node.querySelectorAll('img'));
      imgs.forEach((img) => {
        if (!img.getAttribute('alt') && rowHeading) img.setAttribute('alt', rowHeading.textContent.trim());
      });
    });
  });

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', cells });
  element.replaceWith(block);
}
