/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-benefit-check (mybeckman.in /service/plans, blue benefits band).
 * Source: #main .Intro__body > .Intro__body-item (x2 columns) > div (x3) >
 *   div > p > span.far.fa-check-circle + strong (title)
 *   p (description)
 * The .Intro__title h2/p beside it stays default content (section style split).
 * Items are emitted column by column (1-3 left, 4-6 right): the reading order, which the
 * block splits back into two columns.
 * Library convention (Cards): one card per row, image | text. Deviation on purpose: the
 * xwalk item model (cards-benefit-check-item) has one rich-text field, so each row has
 * exactly 1 cell and the check icon is an icon token in the title paragraph.
 *   cell 1: field:text -> <p>:fa-check-circle-regular: <strong>Title</strong></p><p>Description</p>
 */

function norm(s) {
  return (s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

export default function parse(element, { document }) {
  const columns = Array.from(element.children).filter((c) => c.querySelector('strong, b, p'));
  const items = columns.length
    ? columns.flatMap((col) => Array.from(col.children).filter((i) => norm(i.textContent)))
    : Array.from(element.children);

  const cells = [];
  items.forEach((item) => {
    const strong = item.querySelector('strong, b');
    const title = strong ? norm(strong.textContent) : '';
    const desc = Array.from(item.querySelectorAll('p'))
      .filter((p) => !p.contains(strong))
      .map((p) => norm(p.textContent))
      .filter(Boolean);
    if (!title && !desc.length) return;
    const content = [];
    if (title) {
      const p = document.createElement('p');
      p.append(document.createTextNode(':fa-check-circle-regular: '));
      const s = document.createElement('strong');
      s.textContent = title;
      p.append(s);
      content.push(p);
    }
    desc.forEach((t) => {
      const p = document.createElement('p');
      p.textContent = t;
      content.push(p);
    });
    cells.push([[hint(document, 'text'), ...content]]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-benefit-check', cells });
  element.replaceWith(block);
}
