/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-centered-left, emitted as the Hero Centered block with the
 * left option. Base: hero.
 * Source: https://www.mybeckman.in/service/training
 * Selectors: .bc-rich-text > .outimg, .outimg
 * Model: "hero-centered" (image/imageAlt, text richtext, classes = style).
 * Row 1: field:image = .largebanner img (descriptive alt; source alt is empty).
 * Row 2: field:text = <p>title graphic</p><p><a>Sign Up</a></p><p><a>Courses</a></p>.
 * "#Courses" is remapped to "#course-catalog" (the id EDS gives the
 * "Course Catalog" H2).
 */

// drop Sitecore params (h, w, iar, hash, sc_lang) but keep rev
const cleanImageSrc = (src) => {
  if (!src || !/^https?:/i.test(src)) return src;
  try {
    const url = new URL(src);
    ['h', 'w', 'iar', 'hash', 'sc_lang'].forEach((p) => url.searchParams.delete(p));
    return url.toString();
  } catch (e) {
    return src;
  }
};

const norm = (s) => (s || '').replace(/[\s ]+/g, ' ').trim();

const ANCHOR_MAP = { '#courses': '#course-catalog' };

export default function parse(element, { document }) {
  const bgImg = element.querySelector('.largebanner img')
    || element.querySelector(':scope > div:not(#innertext1) img');
  const inner = element.querySelector('#innertext1') || element;
  const titleImg = Array.from(inner.querySelectorAll('img')).find((img) => img !== bgImg
    && !img.closest('.largebanner, .smallbanner'));
  const ctas = Array.from(inner.querySelectorAll('a[href]'))
    .map((a) => ({ href: a.getAttribute('href'), label: norm(a.textContent) }))
    .filter((c) => c.label);

  const cells = [];

  // Row 1: background image
  const imageFrag = document.createDocumentFragment();
  if (bgImg) {
    const img = document.createElement('img');
    img.setAttribute('src', cleanImageSrc(bgImg.getAttribute('src')));
    img.setAttribute('alt', bgImg.getAttribute('alt') || 'MyBeckman Learning training classroom');
    imageFrag.appendChild(document.createComment(' field:image '));
    imageFrag.appendChild(img);
  }
  cells.push([imageFrag]);

  // Row 2: title graphic + CTA links
  const textFrag = document.createDocumentFragment();
  if (titleImg || ctas.length) textFrag.appendChild(document.createComment(' field:text '));
  if (titleImg) {
    const p = document.createElement('p');
    const img = document.createElement('img');
    img.setAttribute('src', cleanImageSrc(titleImg.getAttribute('src')));
    img.setAttribute('alt', titleImg.getAttribute('alt') || 'MyBeckman Learning - Knowledge Awaits');
    p.appendChild(img);
    textFrag.appendChild(p);
  }
  ctas.forEach(({ href, label }) => {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', ANCHOR_MAP[(href || '').toLowerCase()] || href);
    a.textContent = label;
    p.appendChild(a);
    textFrag.appendChild(p);
  });
  cells.push([textFrag]);

  // Row 3: optional square mobile background (the source shows it below 768px);
  // last in the model so existing two-row heroes stay valid
  const mobileImg = element.querySelector('.smallbanner img');
  const mobileFrag = document.createDocumentFragment();
  if (mobileImg) {
    const img = document.createElement('img');
    img.setAttribute('src', cleanImageSrc(mobileImg.getAttribute('src')));
    img.setAttribute('alt', mobileImg.getAttribute('alt') || 'MyBeckman Learning training classroom');
    mobileFrag.appendChild(document.createComment(' field:mobileImage '));
    mobileFrag.appendChild(img);
  }
  cells.push([mobileFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero Centered (left)', cells });
  element.replaceWith(block);
}
