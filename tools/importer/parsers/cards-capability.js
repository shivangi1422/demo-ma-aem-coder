/* eslint-disable */
/* global WebImporter */

/**
 * Parser for `cards-capability` (GSPANN "Our Capabilities" flat grid).
 * Source: div.capabilities-flat-grid > div.capability-flat-item
 *   h3.capability-flat-title + p.capability-flat-desc + button.capability-flat-link
 * Output (xwalk model cards-capability-item: image, imageAlt, text), one row per card:
 *   [ empty image cell | <!-- field:text --> H3, p, p>a "Learn More" ]
 * The source "Learn More" is a JS button that scrolls to the detail carousel, so the
 * link is rebuilt pointing at the #services section.
 */
export default function parse(element, { document }) {
  const cells = [];

  element.querySelectorAll('.capability-flat-item').forEach((item) => {
    const text = [];
    const titleEl = item.querySelector('.capability-flat-title');
    if (titleEl) {
      const h3 = document.createElement('h3');
      h3.textContent = titleEl.textContent.trim();
      text.push(h3);
    }
    const descEl = item.querySelector('.capability-flat-desc');
    if (descEl) {
      const p = document.createElement('p');
      p.textContent = descEl.textContent.trim();
      text.push(p);
    }
    const cta = item.querySelector('.capability-flat-link');
    if (cta) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = cta.getAttribute('href') || '#services';
      a.textContent = cta.textContent.replace(/[→›]/g, '').trim() || 'Learn More';
      p.append(a);
      text.push(p);
    }
    if (!text.length) return;
    cells.push(['', [document.createComment(' field:text '), ...text]]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-capability', cells });
  element.replaceWith(block);
}
