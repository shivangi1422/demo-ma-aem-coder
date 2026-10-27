/* eslint-disable */
/* global WebImporter */

/**
 * Parser for quote-photo-carousel (block: quote, Style option: testimonial).
 * Source: div.photo-hero-carousel (beckmancoulter.com /en/solutions/hematology-solution) -
 * an Owl slider of testimonial slides over a background photo:
 *   .owl-item(:not(.cloned)) > .item > .item-container > .banner-heading >
 *     p.adjustfont (quote in curly quotes) + p > strong(name <br> title <br> org)
 * Owl duplicates the slides as .owl-item.cloned for its infinite loop; those
 * are skipped (without Owl, the plain .item children are used).
 *
 * The slider is migrated as one quote block PER SLIDE (author decision: no
 * existing slider fits a testimonial with a full-bleed photo), so the element
 * is replaced by several blocks. The slide photo is not migrated.
 *
 * Library convention (Quote): block name row + quote row + optional
 * attribution row.
 * xwalk model `quote`: quote (richtext), attribution (text), classes.
 * Row 1: <p>quote text</p> (wrapping quote characters removed)
 * Row 2: attribution "name, title, organization" - the testimonial option
 *        splits it into lines on the commas.
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

const OPEN_RE = /^[“”"„«‘’']+\s*/;
const CLOSE_RE = /\s*[“”"„»‘’']+$/;

/** text lines of an element, split on <br> */
function lines(el) {
  const out = [''];
  const walk = (node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeName === 'BR') out.push('');
      else if (child.nodeType === 3) out[out.length - 1] += child.textContent;
      else if (child.nodeType === 1) walk(child);
    });
  };
  walk(el);
  return out.map(clean).filter(Boolean);
}

function slideBlock(slide, document) {
  const heading = slide.querySelector('.banner-heading') || slide;
  const paras = [...heading.querySelectorAll('p')].filter((p) => clean(p.textContent));
  const attributionEl = paras.find((p) => p.querySelector('strong'));
  const quoteParas = paras.filter((p) => p !== attributionEl);
  if (!quoteParas.length) return null;

  const cells = [];
  const quoteNodes = quoteParas.map((para, i) => {
    let t = clean(para.textContent);
    if (i === 0) t = t.replace(OPEN_RE, '');
    if (i === quoteParas.length - 1) t = t.replace(CLOSE_RE, '');
    const p = document.createElement('p');
    p.textContent = t;
    return p;
  }).filter((p) => p.textContent);
  cells.push([[document.createComment(' field:quote '), ...quoteNodes]]);

  const parts = attributionEl ? lines(attributionEl) : [];
  if (parts.length) {
    cells.push([[document.createComment(' field:attribution '), document.createTextNode(parts.join(', '))]]);
  } else {
    cells.push(['']);
  }
  return WebImporter.Blocks.createBlock(document, { name: 'quote (testimonial)', cells });
}

export default function parse(element, { document }) {
  let slides = [...element.querySelectorAll('.owl-item:not(.cloned)')];
  if (!slides.length) slides = [...element.querySelectorAll('.item')];

  const blocks = slides.map((slide) => slideBlock(slide, document)).filter(Boolean);
  if (!blocks.length) {
    element.remove();
    return;
  }
  element.replaceWith(...blocks);
}
