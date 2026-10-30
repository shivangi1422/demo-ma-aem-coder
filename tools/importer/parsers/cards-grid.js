/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid. Base: cards.
 * Source: https://www.mybeckman.in/service
 * Selectors: .Section .ServiceCards, .ServiceCards
 * Model: block "cards-grid" (text = optional heading/intro, classes = style)
 *        items "cards-grid-item" (image/imageAlt, text).
 * Row 1: heading/intro (empty here - the decorator treats a leading row without
 *        a picture as the heading row, so it must be present to keep card 1).
 * Rows 2..N: one per card - [icon as :icon-name:, H4 linked title + description].
 */

// Font Awesome modifier classes that are not icon names.
const FA_MODIFIERS = /^fa-(\d+x|lg|xs|sm|fw|spin|pulse|border|pull-left|pull-right|inverse|flip-.*|rotate-.*|stack.*|solid|regular|light|thin|duotone|brands)$/;

function getIconName(card) {
  const iconEl = card.querySelector('[class*="fa-"]');
  if (!iconEl) return null;
  const cls = Array.from(iconEl.classList).find((c) => c.startsWith('fa-') && !FA_MODIFIERS.test(c));
  return cls ? cls.replace(/^fa-/, '') : null;
}

export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll(':scope > .ServiceCard'));
  const cells = [];

  // Row 1: block-level heading/intro (none in source) - keep the row, no hint.
  cells.push(['']);

  cards.forEach((card) => {
    const heading = card.querySelector('h1, h2, h3, h4, h5, h6');
    const titleLink = heading ? heading.querySelector('a[href]') : null;
    const anyLink = card.querySelector('a[href]');
    const href = (titleLink || anyLink) ? (titleLink || anyLink).getAttribute('href') : null;

    // Cell 1: icon
    const iconName = getIconName(card);
    const iconFrag = document.createDocumentFragment();
    if (iconName) {
      iconFrag.appendChild(document.createComment(' field:image '));
      iconFrag.appendChild(document.createTextNode(`:${iconName}:`));
    }

    // Cell 2: linked title + description
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));

    if (heading) {
      const h = document.createElement(heading.tagName.toLowerCase());
      const title = heading.textContent.trim();
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = title;
        h.appendChild(a);
      } else {
        h.textContent = title;
      }
      textFrag.appendChild(h);
    }

    // Description: keep the text, drop the wrapping link.
    Array.from(card.querySelectorAll(':scope > p')).forEach((p) => {
      const text = p.textContent.trim();
      if (!text) return;
      const out = document.createElement('p');
      out.textContent = text;
      textFrag.appendChild(out);
    });

    cells.push([iconFrag, textFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid', cells });
  element.replaceWith(block);
}
