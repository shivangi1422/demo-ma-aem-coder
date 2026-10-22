/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-split-left (block: hero, Style option: split-left).
 * Source: div.sublayout-two-column-dynamic (beckmancoulter.com dxs-service-and-supports pages).
 *
 * xwalk model `hero`: image (reference, imageAlt collapsed), text (richtext), classes.
 * Row 1: image from .column-1 (product-media-slideshow, owl clones skipped)
 * Row 2: h1 + bold subtitle (.subhead-regular) + paragraphs + CTA link(s)
 */

const clean = (str) => (str || '').replace(/\s+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

// source alts like "next" / "prev" come from the slider and are not meaningful
const isMeaningfulAlt = (alt) => !!alt && !/^(next|prev|previous|image|img)$/i.test(alt);

export default function parse(element, { document }) {
  const cells = [];
  const col1 = element.querySelector('.column-1') || element;
  const col2 = element.querySelector('.column-2') || element;

  // ---- row 1: image -------------------------------------------------------
  const srcImg = [...col1.querySelectorAll('img')]
    .find((i) => i.getAttribute('src') && !i.closest('.cloned'));
  const titleEl = col2.querySelector('h1') || col2.querySelector('h2');
  const title = clean(titleEl ? titleEl.textContent : '');
  if (srcImg) {
    const img = document.createElement('img');
    img.src = srcImg.getAttribute('src');
    const alt = clean(srcImg.getAttribute('alt'));
    img.alt = isMeaningfulAlt(alt) ? alt : 'Remote connectivity';
    cells.push([[document.createComment(' field:image '), img]]);
  } else {
    cells.push(['']);
  }

  // ---- row 2: text --------------------------------------------------------
  const textCell = [];
  if (title) {
    const h1 = document.createElement('h1');
    h1.textContent = title;
    textCell.push(h1);
  }
  const content = col2.querySelector('.content-container') || col2;
  content.querySelectorAll('.subhead-regular, p').forEach((el) => {
    if (el === titleEl) return;
    const text = clean(el.textContent);
    if (!text) return;
    const p = document.createElement('p');
    if (el.classList.contains('subhead-regular')) {
      const strong = document.createElement('strong');
      strong.textContent = text;
      p.append(strong);
      textCell.push(p);
      return;
    }
    const link = el.querySelector('a');
    if (link && clean(link.textContent) === text) {
      // CTA paragraph
      const href = link.getAttribute('href');
      if (isUsableHref(href) || (href && href.startsWith('#') && href.length > 1)) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = text;
        // source CTA is a red primary button: <strong> makes EDS decorate it as a.button.primary
        const strong = document.createElement('strong');
        strong.append(a);
        p.append(strong);
      } else {
        p.textContent = text;
      }
      textCell.push(p);
      return;
    }
    p.textContent = text;
    textCell.push(p);
  });

  if (textCell.length) {
    textCell.unshift(document.createComment(' field:text '));
    cells.push([textCell]);
  } else {
    cells.push(['']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero (split-left)', cells });
  element.replaceWith(block);
}
