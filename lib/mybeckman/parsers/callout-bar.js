/* eslint-disable */
/* global WebImporter */
/**
 * Parser: callout-bar (mybeckman.in /service/tech-support, "In need of immediate assistance?").
 * Source: .Section__header > .callout
 *   > p (prompt)
 *   > a.btn.btn-primary (button; the cleanup transformer may already have wrapped it as <p><strong><a>)
 *
 * One row, one cell (xwalk model callout-bar has one rich-text field):
 *   cell 1: field:text -> <p>Prompt</p><p><strong><a href>Label</a></strong></p>
 */

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  const content = [];
  [...element.querySelectorAll('p')].forEach((p) => {
    if (p.querySelector('a[href]') && norm(p.textContent) === norm(p.querySelector('a[href]').textContent)) return;
    const t = norm(p.textContent);
    if (!t) return;
    const out = document.createElement('p');
    out.textContent = t;
    content.push(out);
  });
  [...element.querySelectorAll('a[href]')].forEach((a) => {
    const label = norm(a.textContent);
    if (!label) return;
    const out = document.createElement('p');
    const strong = document.createElement('strong');
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href').trim());
    link.textContent = label;
    strong.append(link);
    out.append(strong);
    content.push(out);
  });

  const cells = [[[document.createComment(' field:text '), ...content]]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'callout-bar', cells });
  element.replaceWith(block);
}
