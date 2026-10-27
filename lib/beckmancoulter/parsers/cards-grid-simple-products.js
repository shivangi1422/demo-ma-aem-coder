/* eslint-disable */
/* global WebImporter */
/**
 * Parser: cards-grid-simple -> existing block "cards-grid" with class "simple".
 * Source: div.product-list (hematology "Hematology Analyzers for All Labs").
 *
 * Model cards-grid (container): text (classes -> variant)
 *   Row 0: field:text -> H2 section heading
 * Model cards-grid-item: image (+imageAlt collapsed), text
 *   Rows 1..N (one per div.product-card, document order):
 *     field:image -> product thumb (absolute src + alt)
 *     field:text  -> [<p><strong>NEW</strong></p> only when the card has a tag],
 *                    volume pill <p>, H3 title, description <p>, "Learn more" link,
 *                    <p><strong>Throughput</strong></p>, spec <ul>
 * The DxH 560 title wraps its text in a div with an inline <style>: the title is
 * the first heading with text, read with style/script stripped.
 */

const SITE = 'https://www.beckmancoulter.com/';
const HEADINGS = 'h1, h2, h3, h4, h5, h6';
const INLINE_TAGS = {
  STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', SUP: 'sup', SUB: 'sub', U: 'u', BR: 'br', A: 'a',
};
const SKIP_TAGS = new Set(['STYLE', 'SCRIPT', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'SVG', 'IFRAME', 'BUTTON']);

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

/** Text of a node without inline <style>/<script> content. */
function cleanText(node) {
  if (!node) return '';
  const clone = node.cloneNode(true);
  clone.querySelectorAll('style, script, noscript, template').forEach((n) => n.remove());
  return norm(clone.textContent);
}

function absUrl(src) {
  const s = (src || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  try {
    return new URL(s, SITE).href;
  } catch (e) {
    return s;
  }
}

function inlineCopy(document, node, target) {
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      target.append(document.createTextNode(child.nodeValue.replace(/ /g, ' ').replace(/\s+/g, ' ')));
      return;
    }
    if (child.nodeType !== 1 || SKIP_TAGS.has(child.tagName.toUpperCase())) return;
    const tag = INLINE_TAGS[child.tagName.toUpperCase()];
    if (!tag) {
      inlineCopy(document, child, target);
      return;
    }
    if (tag === 'a') {
      const href = (child.getAttribute('href') || '').trim();
      if (!href || norm(child.textContent) === '') {
        inlineCopy(document, child, target);
        return;
      }
      const a = document.createElement('a');
      a.setAttribute('href', href);
      inlineCopy(document, child, a);
      target.append(a);
      return;
    }
    const el = document.createElement(tag);
    if (tag !== 'br') inlineCopy(document, child, el);
    target.append(el);
  });
  return target;
}

function trimEdges(el) {
  while (el.firstChild && el.firstChild.nodeType === 3 && norm(el.firstChild.nodeValue) === '') el.firstChild.remove();
  while (el.lastChild && el.lastChild.nodeType === 3 && norm(el.lastChild.nodeValue) === '') el.lastChild.remove();
  if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.nodeValue = el.firstChild.nodeValue.replace(/^\s+/, '');
  if (el.lastChild && el.lastChild.nodeType === 3) el.lastChild.nodeValue = el.lastChild.nodeValue.replace(/\s+$/, '');
  return el;
}

function textBlock(document, tag, src) {
  const el = trimEdges(inlineCopy(document, src, document.createElement(tag)));
  return norm(el.textContent) ? el : null;
}

function plainEl(document, tag, text) {
  const t = norm(text);
  if (!t) return null;
  const el = document.createElement(tag);
  el.textContent = t;
  return el;
}

function strongP(document, text) {
  const t = norm(text);
  if (!t) return null;
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = t;
  p.append(strong);
  return p;
}

function listCopy(document, list) {
  const out = document.createElement(list.tagName.toLowerCase() === 'ol' ? 'ol' : 'ul');
  list.querySelectorAll(':scope > li').forEach((li) => {
    const item = textBlock(document, 'li', li);
    if (item) out.append(item);
  });
  return out.children.length ? out : null;
}

function parseCard(document, card) {
  const desc = card.querySelector('.product-description') || card;

  // image
  const img = card.querySelector('img.product-thumb') || card.querySelector('img');
  let imageCell = '';
  const src = img ? (img.getAttribute('src') || img.getAttribute('data-src') || '') : '';
  if (src) {
    const out = document.createElement('img');
    out.setAttribute('src', absUrl(src));
    out.setAttribute('alt', norm(img.getAttribute('alt')));
    imageCell = [hint(document, 'image'), out];
  }

  const text = [];

  // NEW tag (only cards that carry one)
  const tag = cleanText(card.querySelector('.card-tag'));
  if (tag) text.push(strongP(document, tag));

  // volume pill
  const volume = cleanText(desc.querySelector('.label')) || norm(card.getAttribute('data-volume-title'));
  const volumeP = plainEl(document, 'p', volume);
  if (volumeP) text.push(volumeP);

  // title: first heading with text (DxH 560 nests it in a div with an inline style)
  const titleSrc = [...desc.querySelectorAll(HEADINGS)].find((h) => cleanText(h) !== '');
  const title = titleSrc ? cleanText(titleSrc) : '';
  const h3 = plainEl(document, 'h3', title);
  if (h3) text.push(h3);

  // description paragraph(s)
  desc.querySelectorAll(':scope > p').forEach((p) => {
    const out = textBlock(document, 'p', p);
    if (out) text.push(out);
  });

  // Learn more
  const link = [...desc.querySelectorAll('a')].find((a) => norm(a.textContent) !== '');
  if (link) {
    const label = norm(link.textContent);
    const href = (link.getAttribute('href') || '').trim();
    const p = document.createElement('p');
    if (href) {
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = label;
      p.append(a);
    } else {
      p.textContent = label;
    }
    text.push(p);
  }

  // specs: label -> bold paragraph, list -> ul
  const specs = card.querySelector('.product-specs');
  if (specs) {
    [...specs.children].forEach((child) => {
      const t = child.tagName.toLowerCase();
      if (t === 'label' || /^h[1-6]$/.test(t)) {
        const p = strongP(document, cleanText(child));
        if (p) text.push(p);
      } else if (t === 'ul' || t === 'ol') {
        const list = listCopy(document, child);
        if (list) text.push(list);
      } else if (t === 'p') {
        const p = textBlock(document, 'p', child);
        if (p) text.push(p);
      }
    });
  }

  return [imageCell, text.length ? [hint(document, 'text'), ...text] : ''];
}

export default function parse(element, { document }) {
  const cells = [];

  // Row 0: section heading
  const headingSrc = [...element.querySelectorAll('.heading h1, .heading h2, .heading h3, .heading h4')]
    .find((h) => cleanText(h) !== '')
    || [...element.querySelectorAll(HEADINGS)].find((h) => !h.closest('.product-card') && cleanText(h) !== '');
  const heading = headingSrc ? plainEl(document, 'h2', cleanText(headingSrc)) : null;
  cells.push([heading ? [hint(document, 'text'), heading] : '']);

  // Rows 1..N: product cards
  element.querySelectorAll('.product-card').forEach((card) => {
    cells.push(parseCard(document, card));
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid', variants: ['simple'], cells });
  element.replaceWith(block);
}
