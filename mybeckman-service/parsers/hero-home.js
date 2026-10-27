/* eslint-disable */
/* global WebImporter */
/**
 * Parser: hero-home -> existing block "hero" with class "home".
 * Source (mybeckman.in /service): #main .bc-rich-text:has(> .hero)
 *   <div class="hero"><img><div><h1/><p/><a class="btn btn-primary" href="#getInTouch"/></div></div>
 *
 * Library convention: 1 column; row 1 = background image, row 2 = title, subheading, CTA.
 * Model hero (blocks/hero/_hero.json): image, imageAlt, text, classes.
 *   imageAlt collapses into the <img alt>, classes into the block variant "Hero (home)".
 *   Row 1: field:image -> the hero <img> (original absolute URL, query string dropped)
 *   Row 2: field:text  -> H1, intro paragraph(s), CTA as <p><strong><a href>label</a></strong></p>
 * Hrefs are kept as on the source; the shared link step rewrites them later.
 */

const IMAGE_ALTS = {
  'https://media.beckman.com/-/media/service/media/service_hub_home-2022-09.jpg':
    'Beckman Coulter field service engineer in a laboratory',
};

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

function cleanSrc(src) {
  const s = (src || '').trim();
  if (!s) return '';
  try {
    const u = new URL(s, 'https://www.mybeckman.in/');
    return `${u.origin}${u.pathname}`;
  } catch (e) {
    return s.split('?')[0];
  }
}

/** Clean inline copy: text, a[href], strong/b, em/i, br only. */
function cleanInline(document, node) {
  if (node.nodeType === 3) return document.createTextNode(node.nodeValue);
  if (node.nodeType !== 1) return null;
  const frag = document.createDocumentFragment();
  node.childNodes.forEach((c) => {
    const cc = cleanInline(document, c);
    if (cc) frag.append(cc);
  });
  const tag = { A: 'a', STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', BR: 'br' }[node.tagName];
  if (!tag) return frag;
  if (tag === 'br') return document.createElement('br');
  const el = document.createElement(tag);
  if (tag === 'a') {
    const href = (node.getAttribute('href') || '').trim();
    if (!href || !norm(node.textContent)) return frag;
    el.setAttribute('href', href);
  }
  el.append(frag);
  return el;
}

function cleanBlock(document, src, tag) {
  const el = document.createElement(tag);
  src.childNodes.forEach((c) => {
    const cc = cleanInline(document, c);
    if (cc) el.append(cc);
  });
  if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.nodeValue = el.firstChild.nodeValue.replace(/^\s+/, '');
  if (el.lastChild && el.lastChild.nodeType === 3) el.lastChild.nodeValue = el.lastChild.nodeValue.replace(/\s+$/, '');
  return el;
}

function buttonPara(document, label, href) {
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  const a = document.createElement('a');
  a.setAttribute('href', href);
  a.textContent = label;
  strong.append(a);
  p.append(strong);
  return p;
}

export default function parse(element, { document }) {
  const hero = element.querySelector('.hero') || element;

  // Row 1: background image
  const srcImg = Array.from(hero.querySelectorAll('img'))
    .find((i) => (i.getAttribute('src') || i.getAttribute('data-src') || '').trim());
  let imageCell = '';
  if (srcImg) {
    const src = cleanSrc(srcImg.getAttribute('src') || srcImg.getAttribute('data-src'));
    const img = document.createElement('img');
    img.setAttribute('src', src);
    img.setAttribute('alt', IMAGE_ALTS[src] || norm(srcImg.getAttribute('alt')));
    imageCell = [hint(document, 'image'), img];
  }

  // Row 2: title, subheading, call-to-action (document order)
  const text = [];
  const heading = Array.from(hero.querySelectorAll('h1, h2, h3')).find((h) => norm(h.textContent));
  if (heading) text.push(cleanBlock(document, heading, 'h1'));
  Array.from(hero.querySelectorAll('p')).forEach((p) => {
    if (!norm(p.textContent)) return;
    const links = p.querySelectorAll('a[href]');
    if (links.length === 1 && norm(links[0].textContent) === norm(p.textContent)) {
      text.push(buttonPara(document, norm(links[0].textContent), links[0].getAttribute('href').trim()));
    } else {
      text.push(cleanBlock(document, p, 'p'));
    }
  });
  Array.from(hero.querySelectorAll('a.btn[href], a.button[href]'))
    .filter((a) => !a.closest('p') && norm(a.textContent))
    .forEach((a) => text.push(buttonPara(document, norm(a.textContent), a.getAttribute('href').trim())));

  const cells = [
    [imageCell],
    [text.length ? [hint(document, 'text'), ...text] : ''],
  ];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', variants: ['home'], cells });
  element.replaceWith(block);
}
