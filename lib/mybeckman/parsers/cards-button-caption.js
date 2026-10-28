/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-button-caption (mybeckman.in /service, "Get in Touch" band).
 * Source: #getInTouch .Contact__body
 *   > div (x3) > a.btn.btn-primary[href] (button), p (caption)
 * The "Get in Touch" heading and intro above it stay default content.
 *
 * Library convention (Cards): one row per card, image | text. Deviation on
 * purpose: the xwalk item model (cards-button-caption-item) has one rich-text
 * field, so each row has exactly 1 cell.
 *   cell 1: field:text -> <p><a href>Button label</a></p><p>caption</p>
 * The live button id (contactServiceBtn) is not authorable and is dropped.
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
    [...item.children].forEach((el) => {
      const t = norm(el.textContent);
      if (!t) return;
      const src = el.matches('a[href]') ? el : el.querySelector('a[href]');
      const p = document.createElement('p');
      if (src && norm(src.textContent) === t) {
        const a = document.createElement('a');
        a.setAttribute('href', (src.getAttribute('href') || '').trim());
        a.textContent = t;
        p.append(a);
      } else {
        p.textContent = t;
      }
      content.push(p);
    });
    if (content.length) cells.push([[hint(document, 'text'), ...content]]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-button-caption', cells });
  element.replaceWith(block);
}
