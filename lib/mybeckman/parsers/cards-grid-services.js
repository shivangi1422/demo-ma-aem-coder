/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-grid-services -> existing block "cards-grid" with NO variant (default).
 * Source (mybeckman.in /service, /service/tech-support): #main .bc-rich-text:has(.ServiceCards | .serviceCards)
 *   .ServiceCard (x6) = span.fa icon (removed by cleanup) + <h4><a/></h4> + <p><a>description</a></p>
 *
 * Library convention: one card per row, cells = image | text (empty cells kept).
 * Project model cards-grid (blocks/cards-grid/_cards-grid.json) differs from the generic
 * library Cards block: the container has a "Heading / Intro" text field, so row 0 exists.
 *   container: text (Heading / Intro), classes (collapsed into the block name, none here)
 *   item cards-grid-item: image (+imageAlt collapsed), text
 *   Row 0: heading/intro row, EMPTY but present (the block JS treats a picture-less
 *          first row as the heading, so it must exist or the first card is lost).
 *   Rows 1..N: [ '' (no image) | field:text -> <h3><a href>Title</a></h3><p>Description</p> ]
 *   Titles are promoted H4 -> H3. Descriptions are plain text (a paragraph holding only
 *   a link would be decorated as a button). Icons are not emitted.
 * Hrefs are kept as on the source; the shared link step rewrites them later.
 */

const HEADINGS = 'h1, h2, h3, h4, h5, h6';

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

function firstHref(root) {
  const a = Array.from(root.querySelectorAll('a[href]'))
    .find((x) => (x.getAttribute('href') || '').trim() && !(x.getAttribute('href') || '').trim().startsWith('javascript'));
  return a ? a.getAttribute('href').trim() : '';
}

function parseCard(document, card) {
  const text = [];
  const heading = Array.from(card.querySelectorAll(HEADINGS)).find((h) => norm(h.textContent));
  if (heading) {
    const h3 = document.createElement('h3');
    const href = firstHref(heading) || firstHref(card);
    if (href) {
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = norm(heading.textContent);
      h3.append(a);
    } else {
      h3.textContent = norm(heading.textContent);
    }
    text.push(h3);
  }
  Array.from(card.querySelectorAll('p'))
    .filter((p) => norm(p.textContent) && !p.closest(HEADINGS))
    .forEach((p) => {
      const para = document.createElement('p');
      para.textContent = norm(p.textContent);
      text.push(para);
    });
  return ['', text.length ? [hint(document, 'text'), ...text] : ''];
}

export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('.ServiceCard, .serviceCard'));

  const cells = [];
  // Row 0: empty heading / intro row (the source section has no heading).
  cells.push(['']);
  cards.forEach((card) => cells.push(parseCard(document, card)));

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid', cells });
  element.replaceWith(block);
}
