/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion-faq (xwalk items: accordion-faq-item: summary (text), text (richtext)).
 * Source: a .Section holding CSS-only toggles: input#Qn + label (question) + div.Content (answer).
 * The inputs are removed by mybeckman-cleanup; every run of label + .Content becomes one block,
 * other content of the section (e.g. the h2) stays as default content.
 * Output: one row per question: [<!-- field:summary -->question] [<!-- field:text -->answer]
 */
export default function parse(element, { document }) {
  // group consecutive label + .Content pairs into runs
  const runs = [];
  let run = null;
  const kids = [...element.children];
  for (let i = 0; i < kids.length; i += 1) {
    const el = kids[i];
    const next = kids[i + 1];
    if (el.tagName === 'LABEL' && next && next.classList.contains('Content')) {
      if (!run) { run = []; runs.push(run); }
      run.push([el, next]);
      i += 1;
    } else if (el.tagName !== 'INPUT') {
      run = null;
    }
  }
  runs.forEach((pairs) => {
    const cells = pairs.map(([label, content]) => {
      const summary = document.createDocumentFragment();
      summary.appendChild(document.createComment(' field:summary '));
      summary.appendChild(document.createTextNode(label.textContent.replace(/\s+/g, ' ').trim()));
      const text = document.createDocumentFragment();
      text.appendChild(document.createComment(' field:text '));
      [...content.childNodes].forEach((n) => text.appendChild(n));
      return [summary, text];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
    pairs[0][0].replaceWith(block);
    pairs.forEach(([label, content], i) => { if (i) label.remove(); content.remove(); });
  });
}
