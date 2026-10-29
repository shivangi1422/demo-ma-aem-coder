/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-link-tile (mybeckman.in /service/tech-support, 5 support tiles).
 * Source: .serviceCards > .serviceCard (x5)
 *   > h4 > a[href] (title)
 *   > p > a[href] (description, same URL)
 *
 * One row per tile, one cell (xwalk item model cards-link-tile-item has one rich-text field):
 *   cell 1: field:text -> <h4><a href>Title</a></h4><p><a href>Description</a></p>
 */

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function link(document, href, text) {
  if (!href) return document.createTextNode(text);
  const a = document.createElement('a');
  a.setAttribute('href', href);
  a.textContent = text;
  return a;
}

export default function parse(element, { document }) {
  const cells = [];
  let cards = [...element.querySelectorAll('.serviceCard, .ServiceCard')];
  if (!cards.length) cards = [...element.children].filter((c) => c.querySelector('h1, h2, h3, h4, h5, h6'));

  cards.forEach((card) => {
    const titleEl = [...card.querySelectorAll('h1, h2, h3, h4, h5, h6')].find((h) => norm(h.textContent));
    const titleLink = titleEl && titleEl.querySelector('a[href]');
    const href = ((titleLink || card.querySelector('a[href]')) || { getAttribute: () => '' }).getAttribute('href').trim();
    const content = [];
    if (titleEl) {
      const h4 = document.createElement('h4');
      h4.append(link(document, href, norm(titleEl.textContent)));
      content.push(h4);
    }
    [...card.querySelectorAll('p')].forEach((p) => {
      const t = norm(p.textContent);
      if (!t) return;
      const a = p.querySelector('a[href]');
      const out = document.createElement('p');
      out.append(link(document, a ? a.getAttribute('href').trim() : '', t));
      content.push(out);
    });
    if (content.length) cells.push([[document.createComment(' field:text '), ...content]]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-link-tile', cells });
  element.replaceWith(block);
}
