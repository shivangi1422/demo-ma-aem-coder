/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion-faq (xwalk items: accordion-faq-item: summary (text), text (richtext)).
 * Source: a .Section holding CSS-only toggles: input#Qn + label (question) + div.Content (answer).
 * The inputs are removed by mybeckman-cleanup; every run of label + .Content becomes one block,
 * other content of the section (e.g. the h2) stays as default content.
 * Also: a .faq-section of details.faq-item (summary + .faq-answer with loose text and <br><br>
 * paragraph breaks, /support/ecommerce): every run of details becomes one block, variant plain.
 * Output: one row per question: [<!-- field:summary -->question] [<!-- field:text -->answer]
 */
function answerNodes(document, answer) {
  // loose text / inline runs split at <br><br> into paragraphs; block children stay
  const out = [];
  let p = null;
  const nodes = [...answer.childNodes];
  nodes.forEach((n, i) => {
    if (n.nodeType === 1 && /^(P|UL|OL|TABLE|H[1-6]|DIV)$/.test(n.tagName)) { p = null; out.push(n); return; }
    if (n.nodeType === 1 && n.tagName === 'BR') {
      const next = nodes.slice(i + 1).find((m) => m.nodeType !== 3 || m.textContent.trim());
      if (next && next.nodeType === 1 && next.tagName === 'BR') { p = null; return; }
      if (!p) return;
    }
    if (n.nodeType === 3 && !n.textContent.trim() && !p) return;
    if (n.nodeType === 8) return;
    if (!p) { p = document.createElement('p'); out.push(p); }
    p.append(n);
  });
  out.forEach((el) => {
    if (el.tagName !== 'P') return;
    while (el.lastChild && (el.lastChild.nodeName === 'BR' || (el.lastChild.nodeType === 3 && !el.lastChild.textContent.trim()))) el.lastChild.remove();
  });
  const kept = out.filter((el) => el.textContent.trim() || el.querySelector('img, picture'));
  // XWalk: a rich text field ends at the first paragraph holding an image (md2jcr), so an answer
  // with an image after its first paragraph stays one paragraph with <br><br> breaks, as the source
  const imageAt = kept.findIndex((el) => el.querySelector('img, picture'));
  if (imageAt > 0 && kept.every((el) => el.tagName === 'P')) {
    const one = document.createElement('p');
    kept.forEach((el, i) => {
      if (i) one.append(document.createElement('br'), document.createElement('br'));
      one.append(...el.childNodes);
    });
    return [one];
  }
  return kept;
}

function parseDetails(element, document) {
  const runs = [];
  let run = null;
  [...element.children].forEach((el) => {
    if (el.tagName === 'DETAILS') {
      if (!run) { run = []; runs.push(run); }
      run.push(el);
    } else run = null;
  });
  runs.forEach((items) => {
    const cells = items.map((d) => {
      const summary = document.createDocumentFragment();
      summary.appendChild(document.createComment(' field:summary '));
      const q = d.querySelector(':scope > summary');
      summary.appendChild(document.createTextNode(q ? q.textContent.replace(/\s+/g, ' ').trim() : ''));
      if (q) q.remove();
      const text = document.createDocumentFragment();
      text.appendChild(document.createComment(' field:text '));
      answerNodes(document, d.querySelector(':scope > .faq-answer') || d).forEach((n) => text.appendChild(n));
      return [summary, text];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: 'Accordion Faq (plain)', cells });
    items[0].replaceWith(block);
    items.slice(1).forEach((d) => d.remove());
  });
}

// www.beckman.com product page FAQs: .bcls-aeo-faqs (h2 + div.bcls-aeo-faq: h6 question, answer
// p/ul, empty p and comments): every run of items becomes one block, variant open; the h2 stays
// default content before it
function parseAeo(element, document) {
  const runs = [];
  let run = null;
  [...element.children].forEach((el) => {
    if (el.classList.contains('bcls-aeo-faq')) {
      if (!run) { run = []; runs.push(run); }
      run.push(el);
    } else run = null;
  });
  runs.forEach((items) => {
    const cells = items.map((item) => {
      const summary = document.createDocumentFragment();
      summary.appendChild(document.createComment(' field:summary '));
      const q = item.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');
      summary.appendChild(document.createTextNode(q ? q.textContent.replace(/\s+/g, ' ').trim() : ''));
      if (q) q.remove();
      const text = document.createDocumentFragment();
      text.appendChild(document.createComment(' field:text '));
      answerNodes(document, item).forEach((n) => text.appendChild(n));
      return [summary, text];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: 'Accordion Faq (open)', cells });
    items[0].replaceWith(block);
    items.slice(1).forEach((d) => d.remove());
  });
}

export default function parse(element, { document }) {
  if (element.querySelector(':scope > .bcls-aeo-faq')) { parseAeo(element, document); return; }
  if (element.querySelector(':scope > details')) { parseDetails(element, document); return; }
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
