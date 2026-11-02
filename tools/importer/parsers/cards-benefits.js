/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-benefits. Base: cards (no images).
 * Source: https://www.mybeckman.in/service/plans
 * Selectors: .Section--blue .Intro, .Intro
 * Model: block "cards-benefits" (text = intro richtext),
 *        items "cards-benefits-item" (text richtext) - one cell per row.
 * Row 1: intro - H2 + paragraph from .Intro__title.
 * Rows 2..N: one per benefit, one cell:
 *   <p>:check-circle: <strong>Title</strong></p><p>Description</p>
 */

// Font Awesome modifier classes that are not icon names.
const FA_MODIFIERS = /^fa-(\d+x|lg|xs|sm|fw|spin|pulse|border|pull-left|pull-right|inverse|flip-.*|rotate-.*|stack.*|solid|regular|light|thin|duotone|brands)$/;

function getIconName(item) {
  const iconEl = item.querySelector('[class*="fa-"]');
  if (!iconEl) return 'check-circle';
  const cls = Array.from(iconEl.classList).find((c) => c.startsWith('fa-') && !FA_MODIFIERS.test(c));
  return cls ? cls.replace(/^fa-/, '') : 'check-circle';
}

export default function parse(element, { document }) {
  const cells = [];

  // Row 1: intro (heading + paragraph)
  const intro = element.querySelector(':scope > .Intro__title');
  const introFrag = document.createDocumentFragment();
  if (intro) {
    const parts = Array.from(intro.querySelectorAll(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > p'))
      .filter((el) => el.textContent.trim());
    if (parts.length) {
      introFrag.appendChild(document.createComment(' field:text '));
      parts.forEach((el) => introFrag.appendChild(el));
    }
  }
  cells.push([introFrag]);

  // Rows 2..N: benefits (each a direct child div of .Intro__body-item)
  const items = Array.from(element.querySelectorAll('.Intro__body > .Intro__body-item > div'));
  items.forEach((item) => {
    const strong = item.querySelector('strong, b');
    const titleWrap = item.querySelector(':scope > div');
    const titleText = (strong || titleWrap) ? (strong || titleWrap).textContent.trim() : '';
    const descriptions = Array.from(item.querySelectorAll(':scope > p'))
      .map((p) => p.textContent.trim())
      .filter(Boolean);
    if (!titleText && !descriptions.length) return;

    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:text '));

    if (titleText) {
      const titleP = document.createElement('p');
      titleP.appendChild(document.createTextNode(`:${getIconName(item)}: `));
      const s = document.createElement('strong');
      s.textContent = titleText;
      titleP.appendChild(s);
      frag.appendChild(titleP);
    }
    descriptions.forEach((text) => {
      const p = document.createElement('p');
      p.textContent = text;
      frag.appendChild(p);
    });

    cells.push([frag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-benefits', cells });
  element.replaceWith(block);
}
