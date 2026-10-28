/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-icon-border (mybeckman.in /service, 6 service cards).
 * Source: .ServiceCards > .ServiceCard (x6)
 *   > span.fa.fa-3x.fa-<name> (Font Awesome icon; holds an empty link)
 *   > h4 > a[href] (title)
 *   > p > a[href] (description, same URL)
 *
 * Library convention (Cards): one row per card, image | text. Deviation on
 * purpose: the xwalk item model (cards-icon-border-item) has one rich-text
 * field, so each row has exactly 1 cell and the icon is an icon token.
 *   cell 1: field:text -> <p>:fa-<name>:</p>
 *                         <h4><a href>Title</a></h4>
 *                         <p><a href>Description</a></p>
 *
 * Icons are the Font Awesome Free 5.15.4 SVGs in /icons (fa-user-plus,
 * fa-cloud, fa-desktop, fa-toolbox, fa-question-circle, fa-cog). The live
 * page writes the v4 name "fa-gear" (shimmed to cog) for one of them.
 */

const ICON_ALIASES = { gear: 'cog' };
const NOT_ICON = /^fa-(\dx|lg|fw|spin|pulse|border|inverse|stack.*|rotate.*|flip.*|pull-.*|li|ul|solid|regular|brands)$/;

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

function iconName(card) {
  const el = card.querySelector('[class*="fa-"]');
  if (!el) return '';
  const cls = [...el.classList].find((c) => /^fa-/.test(c) && !NOT_ICON.test(c));
  if (!cls) return '';
  const name = cls.slice(3);
  return `fa-${ICON_ALIASES[name] || name}`;
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
  let cards = [...element.children].filter((c) => c.querySelector('h1, h2, h3, h4, h5, h6'));
  if (!cards.length) cards = [...element.querySelectorAll('.ServiceCard, .serviceCard')];

  cards.forEach((card) => {
    const titleEl = [...card.querySelectorAll('h1, h2, h3, h4, h5, h6')].find((h) => norm(h.textContent));
    const titleLink = titleEl && titleEl.querySelector('a[href]');
    const href = ((titleLink || card.querySelector('a[href]')) || { getAttribute: () => '' }).getAttribute('href').trim();
    const content = [];

    const icon = iconName(card);
    if (icon) {
      const p = document.createElement('p');
      p.textContent = `:${icon}:`;
      content.push(p);
    }
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
    if (content.length) cells.push([[hint(document, 'text'), ...content]]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-icon-border', cells });
  element.replaceWith(block);
}
