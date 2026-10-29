/* eslint-disable */
/* global WebImporter */

/**
 * Parser for `cards-vertical` (GSPANN "Verticals" industry columns), a Cards variant.
 * Source: div.verticals-grid > div.vertical-column
 *   h3.vertical-title, p.vertical-positioning, ul.vertical-items (li > strong lead-in + text),
 *   p.vertical-channels (span.vertical-channels-label + span.vertical-channel...)
 * Output follows the library Cards convention (xwalk model cards-vertical-item:
 * image, imageAlt, text) — one row per card, two cells per row:
 *   [ image cell (empty, but present) | <!-- field:text --> H3 title, p description, ul, p(<strong>Channels:</strong> A, B, C) ]
 */
const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

export default function parse(element, { document }) {
  const cells = [];

  element.querySelectorAll('.vertical-column').forEach((col) => {
    const text = [];

    const title = col.querySelector('.vertical-title, h3, h4');
    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = norm(title.textContent);
      text.push(h3);
    }

    const positioning = col.querySelector('.vertical-positioning');
    if (positioning && norm(positioning.textContent)) {
      const p = document.createElement('p');
      p.textContent = norm(positioning.textContent);
      text.push(p);
    }

    const items = [...col.querySelectorAll('.vertical-items > li')];
    if (items.length) {
      const ul = document.createElement('ul');
      items.forEach((item) => {
        const li = document.createElement('li');
        const lead = item.querySelector('strong');
        if (lead) {
          const strong = document.createElement('strong');
          strong.textContent = norm(lead.textContent);
          li.append(strong);
          const rest = norm([...item.childNodes].filter((n) => n !== lead).map((n) => n.textContent).join(''));
          if (rest) li.append(document.createTextNode(` ${rest}`));
        } else {
          li.textContent = norm(item.textContent);
        }
        ul.append(li);
      });
      text.push(ul);
    }

    const channels = col.querySelector('.vertical-channels');
    if (channels) {
      const names = [...channels.querySelectorAll('.vertical-channel')].map((c) => norm(c.textContent)).filter(Boolean);
      if (names.length) {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = norm(channels.querySelector('.vertical-channels-label')?.textContent) || 'Channels:';
        p.append(strong, document.createTextNode(` ${names.join(', ')}`));
        text.push(p);
      }
    }

    if (!text.length) return;
    // image cell is kept (empty) so every row has the two Cards cells
    cells.push(['', [document.createComment(' field:text '), ...text]]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-vertical', cells });
  element.replaceWith(block);
}
