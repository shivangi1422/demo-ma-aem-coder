/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-accent-mb (block: cards-grid, Style option: accent).
 * Sources on mybeckman.in protein-production (2 instances):
 *   div.benefits-grid > div.benefit-card ×5: h4 (title) + p
 *   section.related-cleanroom-topics > ... > article.related-cleanroom-topic-card ×5:
 *     h3 (title) + p + a.related-topic-button (pill CTA, relative sub-path of the page)
 * The section headings / intro paragraphs stay default content outside the block.
 *
 * Library cards convention (one row per card: image | text) preceded by the
 * local cards-grid container row (heading / intro, left empty).
 * xwalk container model `cards-grid`: text (richtext), classes.
 * Item model `cards-grid-item`: image (reference, imageAlt collapsed), text (richtext).
 *
 * Row 1: heading row - empty
 * Rows 2..N: (empty image) | <h3>title</h3> <p>text</p> [<p><a href>CTA</a></p>]
 *   The trailing link-only paragraph renders as the outlined pill link.
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

/** copies inline content (text, links, bold, italics, sup/sub) */
function copyInline(src, dest, document) {
  src.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      dest.append(document.createTextNode(node.textContent.replace(/\s+/g, ' ')));
      return;
    }
    if (node.nodeType !== 1 || !clean(node.textContent)) return;
    const tag = node.tagName;
    if (/^(SCRIPT|STYLE|IMG|SVG|BUTTON)$/.test(tag)) return;
    if (tag === 'A' && isUsableHref(node.getAttribute('href'))) {
      const a = document.createElement('a');
      a.href = node.getAttribute('href').trim();
      copyInline(node, a, document);
      dest.append(a);
      return;
    }
    if (/^(STRONG|B|EM|I|SUP|SUB)$/.test(tag)) {
      const el = document.createElement({ B: 'strong', I: 'em' }[tag] || tag.toLowerCase());
      copyInline(node, el, document);
      dest.append(el);
      return;
    }
    copyInline(node, dest, document);
  });
}

function trimEdges(el) {
  const first = el.firstChild;
  if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
  const last = el.lastChild;
  if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
  return el;
}

export default function parse(element, { document }) {
  const cells = [];

  // ---- row 1: heading row (empty) -----------------------------------------
  cells.push(['']);

  let cards = [...element.querySelectorAll('.benefit-card, .related-cleanroom-topic-card')];
  if (!cards.length) cards = [...element.querySelectorAll('article, :scope > div')];

  cards.forEach((card) => {
    const text = [];
    const titleEl = card.querySelector('h1, h2, h3, h4, h5, h6');
    if (titleEl && clean(titleEl.textContent)) {
      const h3 = document.createElement('h3');
      h3.textContent = clean(titleEl.textContent);
      text.push(h3);
    }
    card.querySelectorAll('p').forEach((p) => {
      if (!clean(p.textContent)) return;
      const out = document.createElement('p');
      copyInline(p, out, document);
      text.push(trimEdges(out));
    });
    const cta = card.querySelector('a.related-topic-button, :scope > a[href]');
    if (cta && clean(cta.textContent) && !cta.closest('p')) {
      const p = document.createElement('p');
      if (isUsableHref(cta.getAttribute('href'))) {
        const a = document.createElement('a');
        a.href = cta.getAttribute('href').trim();
        a.textContent = clean(cta.textContent);
        p.append(a);
      } else {
        p.textContent = clean(cta.textContent);
      }
      text.push(p);
    }
    if (!text.length) return;
    cells.push(['', [document.createComment(' field:text '), ...text]]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid (accent)', cells });
  element.replaceWith(block);
}
