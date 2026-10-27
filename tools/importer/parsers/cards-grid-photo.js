/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-photo (block: cards-grid, Style option: photo).
 * Source: div.col-3-default-padding (beckmancoulter.com product category pages,
 * "Explore Our Diagnostic Disciplines"): .column > .photo-card with
 *   .image-card-box img | .card-header-text (title) | .card-content-text
 *   | .explore-link a.btn-cta ("Explore", no href).
 * Same source component as cards-grid-solutions.js (remote-services), which
 * stays unchanged; this parser emits the `photo` option instead.
 *
 * Library cards convention (one row per card: image | text) preceded by the
 * local cards-grid container row (heading / intro, left empty here).
 * xwalk container model `cards-grid`: text (richtext), classes.
 * Item model `cards-grid-item`: image (reference, imageAlt collapsed), text (richtext).
 *
 * Row 1: heading row - empty (the section H2 is default content above)
 * Rows 2..N: image | <h3>title</h3> <p>description</p> <p><a>Explore</a></p>
 * Titles are authored as the DOM text ("HEMATOLOGY" is uppercase in the DOM).
 * CTA href: usable CTA href, else card data-href (recorded by the product
 * cleanup from onclick), else onclick target. The Automation card's "#" is no
 * destination (the analysis recommends no replacement), so its "Explore" stays
 * plain text.
 * Filename-style alts ("Automation-PowerExpress-web") become words.
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

/** escape stray '%' so URI decoding in html2md does not throw */
const safeUrl = (url) => (url || '').trim().replace(/%(?![0-9a-fA-F]{2})/g, '%25');

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

function onclickUrl(el) {
  const holder = el && (el.matches('[onclick]') ? el : el.querySelector('[onclick]'));
  const onclick = (holder && holder.getAttribute('onclick')) || '';
  const m = onclick.match(/location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i)
    || onclick.match(/window\.open\(\s*['"]([^'"]+)['"]/i);
  return m ? m[1].trim() : '';
}

function fixAlt(alt) {
  const a = clean(alt);
  if (/^[^\s]+$/.test(a) && /[-_]/.test(a)) {
    return a.replace(/\.(jpe?g|png|gif|webp|svg)$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+(web|img|image|thumb|\d+x\d+)$/i, '')
      .trim();
  }
  return a;
}

/** title keeping inline emphasis (PRO<em>Service</em>) */
function buildTitle(titleEl, document) {
  const h3 = document.createElement('h3');
  [...titleEl.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      h3.append(document.createTextNode(node.textContent.replace(/\s+/g, ' ')));
    } else if (node.nodeType === 1 && /^(EM|I|STRONG|B|SUP|SUB)$/.test(node.tagName)) {
      const tag = /^(EM|I)$/.test(node.tagName) ? 'em' : node.tagName.toLowerCase().replace(/^b$/, 'strong');
      const inline = document.createElement(tag);
      inline.textContent = clean(node.textContent);
      if (inline.textContent) h3.append(inline);
    } else if (node.nodeType === 1) {
      h3.append(document.createTextNode(node.textContent.replace(/\s+/g, ' ')));
    }
  });
  const first = h3.firstChild;
  if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
  const last = h3.lastChild;
  if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
  return clean(h3.textContent) ? h3 : null;
}

export default function parse(element, { document }) {
  const cells = [];

  // ---- row 1: heading row (empty) -----------------------------------------
  cells.push(['']);

  // ---- items ---------------------------------------------------------------
  let cards = [...element.querySelectorAll(':scope > .column .card')];
  if (!cards.length) cards = [...element.querySelectorAll('.photo-card, .card')];
  cards = cards.filter((c, i, arr) => arr.indexOf(c) === i && !c.parentElement.closest('.card'));

  cards.forEach((card) => {
    const titleEl = card.querySelector('.card-header-text, .content .header, h1, h2, h3, h4');
    const titleText = clean(titleEl ? titleEl.textContent : '');

    // image
    const imageCell = [];
    const srcImg = card.querySelector('.image-card-box img[src], img[src]');
    if (srcImg) {
      const img = document.createElement('img');
      img.src = safeUrl(srcImg.getAttribute('src'));
      img.alt = fixAlt(srcImg.getAttribute('alt')) || titleText;
      imageCell.push(document.createComment(' field:image '), img);
    }

    // text
    const textCell = [];
    if (titleEl) {
      const h3 = buildTitle(titleEl, document);
      if (h3) textCell.push(h3);
    }
    const desc = card.querySelector('.card-content-text');
    const descText = clean(desc ? desc.textContent : '');
    if (descText) {
      const p = document.createElement('p');
      p.textContent = descText;
      textCell.push(p);
    }

    const cta = card.querySelector('.explore-link a, .explore-link .button, .btn-cta');
    const ctaText = clean(cta ? cta.textContent : '');
    const href = [
      cta && cta.getAttribute('href'),
      card.getAttribute('data-href'),
      card.closest('[data-href]') && card.closest('[data-href]').getAttribute('data-href'),
      onclickUrl(card),
      titleEl && titleEl.getAttribute('href'),
    ].find(isUsableHref) || '';
    if (ctaText) {
      const p = document.createElement('p');
      if (href) {
        const a = document.createElement('a');
        a.href = safeUrl(href);
        a.textContent = ctaText;
        p.append(a);
      } else {
        p.textContent = ctaText;
      }
      textCell.push(p);
    }

    if (textCell.length) textCell.unshift(document.createComment(' field:text '));
    if (!imageCell.length && !textCell.length) return;
    cells.push([imageCell.length ? imageCell : '', textCell.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid (photo)', cells });
  element.replaceWith(block);
}
