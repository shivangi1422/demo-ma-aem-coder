/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion-two-column (Accordion block, two-column option).
 * Source: https://www.mybeckman.in/resources/industries/synthetic-biology
 *   ("Featured Resources": .row > .col-sm-6 x2 > .accordion > .accordion-item x2;
 *    .accordion-header title + "+" icon, .accordion-content holding .apps rows of
 *    icon <img> + link, separated by <hr>)
 * Selector: .row:has(> [class*="col-sm-6"] > .accordion)
 * Model: block "accordion" (classes), items "accordion-item" (summary text, text richtext).
 * Library convention: 2 columns, one row per item - [title cell, content cell].
 * Item order = left column top to bottom, then right column; the block puts the
 * first half (rounded up) in the left column, so the source columns are kept.
 * Content cell: one paragraph per resource - <p><img> <a>link</a></p> (icons stay
 * absolute media.beckman.com URLs). Relative Sitecore media links
 * (-/media/<id>.ashx) are made absolute on https://www.mybeckman.in.
 */

const absHref = (href) => {
  if (!href) return href;
  if (/^-\/media\//i.test(href)) return `https://www.mybeckman.in/${href}`;
  if (/^\/-\/media\//i.test(href)) return `https://www.mybeckman.in${href}`;
  return href;
};

export default function parse(element, { document }) {
  const cols = Array.from(element.querySelectorAll(':scope > [class*="col-"]'));
  const items = (cols.length ? cols : [element])
    .flatMap((col) => Array.from(col.querySelectorAll('.accordion-item')));

  const cells = [];
  items.forEach((item) => {
    const header = item.querySelector('.accordion-header');
    const titleEl = header ? header.cloneNode(true) : null;
    if (titleEl) titleEl.querySelectorAll('.accordion-icon').forEach((i) => i.remove());
    const title = (titleEl ? titleEl.textContent : '').replace(/\s+/g, ' ').trim();

    const titleFrag = document.createDocumentFragment();
    titleFrag.appendChild(document.createComment(' field:summary '));
    titleFrag.appendChild(document.createTextNode(title));

    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    const content = item.querySelector('.accordion-content') || item;
    const rows = Array.from(content.querySelectorAll('.apps'));
    (rows.length ? rows : Array.from(content.querySelectorAll('p'))).forEach((row) => {
      const link = row.querySelector('a[href]');
      if (!link) return;
      const p = document.createElement('p');
      // icon: project icon token (:pdf-download: / :webpage-view:) chosen from the
      // source icon image; an <img> per row would break the JCR conversion
      // (md2jcr rejects a richtext cell holding more than one image)
      const icon = row.querySelector('img');
      const src = icon ? icon.getAttribute('src') || '' : '';
      if (src) {
        // text token (an empty <span class="icon"> is dropped by the importer)
        p.appendChild(document.createTextNode(`:${/webpage/i.test(src) ? 'webpage-view' : 'pdf-download'}: `));
      }
      const a = document.createElement('a');
      a.setAttribute('href', absHref(link.getAttribute('href')));
      a.textContent = link.textContent.replace(/\s+/g, ' ').trim();
      p.appendChild(a);
      textFrag.appendChild(p);
    });
    cells.push([titleFrag, textFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Accordion (two-column)', cells });
  element.replaceWith(block);
}
