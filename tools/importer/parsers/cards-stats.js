/* eslint-disable */
/* global WebImporter */

/**
 * Parser for `cards-stats` (GSPANN "Our Impact" metrics).
 * Source: div.impact-metrics-grid > div.impact-metric-item
 *   .impact-metric-value (span.impact-number + span.impact-suffix) + p.impact-label
 * Output (xwalk model cards-stats-item: image, imageAlt, text), one row per metric:
 *   [ empty image cell | <!-- field:text --> <p><strong>400+</strong></p><p>Label</p> ]
 */
export default function parse(element, { document }) {
  const cells = [];

  element.querySelectorAll('.impact-metric-item').forEach((item) => {
    const valueEl = item.querySelector('.impact-metric-value');
    // number + suffix are separate spans; join without the whitespace between them
    const value = valueEl
      ? [...valueEl.querySelectorAll('span')].map((s) => s.textContent.trim()).join('')
        || valueEl.textContent.replace(/\s+/g, '')
      : '';
    const label = item.querySelector('.impact-label')?.textContent.trim() || '';

    const text = [];
    if (value) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = value;
      p.append(strong);
      text.push(p);
    }
    if (label) {
      const p = document.createElement('p');
      p.textContent = label;
      text.push(p);
    }
    if (!text.length) return;
    cells.push(['', [document.createComment(' field:text '), ...text]]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-stats', cells });
  element.replaceWith(block);
}
