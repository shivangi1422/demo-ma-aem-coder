/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-stats (mybeckman.in /service, blue stats band).
 * Source: .Section--blue .Section__intro
 *   > div (x4) > p > strong (value), p (label)
 *
 * Library convention (Cards): one row per card, image | text. Deviation on
 * purpose: the xwalk item model (cards-stats-item) has one rich-text field,
 * so each row has exactly 1 cell (md2jcr needs cells == fields).
 *   cell 1: field:text -> <p><strong>value</strong></p><p>label</p>
 */

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

export default function parse(element, { document }) {
  const cells = [];
  [...element.children].forEach((item) => {
    const content = [];
    const paras = item.querySelectorAll('p').length ? [...item.querySelectorAll('p')] : [item];
    paras.forEach((p) => {
      const t = norm(p.textContent);
      if (!t) return;
      const out = document.createElement('p');
      const strong = p.querySelector('strong, b');
      if (strong && norm(strong.textContent) === t) {
        const s = document.createElement('strong');
        s.textContent = t;
        out.append(s);
      } else {
        out.textContent = t;
      }
      content.push(out);
    });
    if (content.length) cells.push([[hint(document, 'text'), ...content]]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-stats', cells });
  element.replaceWith(block);
}
