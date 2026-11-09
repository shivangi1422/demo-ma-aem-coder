/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-banner (xwalk model: hero-banner).
 * Fields: image (reference), mobileImage (reference, optional), text (richtext).
 * Source: div.hero > img + div (h1, h2 / p, buttons; buttons already authorable via
 * the mybeckman-service-sections transformer).
 */
function img(document, src) {
  const out = document.createElement('img');
  out.src = src.getAttribute('src');
  out.alt = src.getAttribute('alt') || '';
  return out;
}

// /service/training: .outimg > .largebanner img, .smallbanner img (mobile), #innertext1 (title image + buttons)
function parseOutimg(element, document) {
  const cell = (name, node) => {
    const frag = document.createDocumentFragment();
    if (node) { frag.appendChild(document.createComment(` field:${name} `)); frag.appendChild(node); }
    return frag;
  };
  const large = element.querySelector('.largebanner img');
  const small = element.querySelector('.smallbanner img');
  const inner = element.querySelector('[id^="innertext"]');
  const text = document.createDocumentFragment();
  if (inner) {
    text.appendChild(document.createComment(' field:text '));
    [...inner.children].forEach((n) => {
      if (n.tagName === 'IMG') { const p = document.createElement('p'); p.append(img(document, n)); text.appendChild(p); } else if (n.tagName !== 'BR') text.appendChild(n);
    });
  }
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Hero Banner (left-aligned)',
    cells: [[cell('image', large && img(document, large))], [cell('mobileImage', small && img(document, small))], [text]],
  });
  element.replaceWith(block);
}

export default function parse(element, { document }) {
  if (element.classList.contains('outimg')) { parseOutimg(element, document); return; }
  const imageCell = document.createDocumentFragment();
  const srcImg = element.querySelector(':scope > img, :scope > picture img, :scope > p > img');
  if (srcImg && srcImg.getAttribute('src')) {
    const img = document.createElement('img');
    img.src = srcImg.getAttribute('src');
    img.alt = srcImg.getAttribute('alt') || '';
    imageCell.appendChild(document.createComment(' field:image '));
    imageCell.appendChild(img);
  }
  const mobileCell = document.createDocumentFragment();

  const textCell = document.createDocumentFragment();
  const body = element.querySelector(':scope > div') || element;
  const nodes = [...body.children].filter((n) => n.tagName !== 'IMG' && !(n.tagName === 'P' && n.querySelector(':scope > img') && !n.textContent.trim()));
  if (nodes.length) {
    textCell.appendChild(document.createComment(' field:text '));
    nodes.forEach((n) => textCell.appendChild(n));
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'hero-banner',
    cells: [[imageCell], [mobileCell], [textCell]],
  });
  element.replaceWith(block);
}
