/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-products-mb (block: cards-grid, Style option: products).
 * Sources on mybeckman.in resource pages:
 *   1. div.cards-row > a.card / a.card-resources (whole card is a link):
 *        div.card-image > div.badge-resources > p (tag) + img
 *        div.text-container > h4 (title)
 *      monoclonal-antibodies (3 rows) and cell-line-development (2 rows): the
 *      instance is the first div.cards-row; the following sibling
 *      div.cards-row elements are taken in and removed. The cleanup wraps the
 *      sibling cards in <p> and unwraps the broken Cydem VT card link
 *      (notfound.aspx), so cards are paired by document order: each
 *      div.card-image with the next div.text-container; href = the link
 *      around the card (none -> unlinked title).
 *      analytical-ultracentrifugation: a single div.cards-row.
 *   2. div.featres > div.featresitem (next-generation-sequencing):
 *        p.itemtitle > strong (type label) + a > img.resources + p > a.redbtn (CTA)
 *
 * Library cards convention (one row per card: image | text) preceded by the
 * local cards-grid container row (heading / intro, left empty).
 * xwalk container model `cards-grid`: text (richtext), classes.
 * Item model `cards-grid-item`: image (reference, imageAlt collapsed), text (richtext).
 *
 * Row 1: heading row - empty (the section heading stays default content)
 * Rows 2..N: image (alt = source alt, else the title)
 *   | [<p>tag</p>] <h3><a href>title</a></h3> [<p><a href>CTA</a></p>]
 *   next-generation-sequencing: the type label is the only title -> H3 (no
 *   tag), CTA = the a.redbtn text. Relative -/media/<guid>.ashx links become
 *   https://www.mybeckman.in/-/media/<guid>.ashx. Broken source links
 *   (notfound.aspx, ~/link.aspx) are kept as plain text. target=_blank dropped.
 */

const ORIGIN = 'https://www.mybeckman.in';

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

/** escape stray '%' so URI decoding in html2md does not throw */
const safeUrl = (url) => (url || '').trim().replace(/%(?![0-9a-fA-F]{2})/g, '%25');

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

const isBroken = (href) => /\/sitecore\/service\/notfound\.aspx|link\.aspx\?_id=/i.test(href || '');

function absolutize(href) {
  const v = (href || '').trim();
  if (/^\/?[-~]\/media\//i.test(v)) return `${ORIGIN}/-/media/${v.replace(/^\/?[-~]\/media\//i, '')}`;
  return v;
}

function linkOrText(text, href, document) {
  if (isUsableHref(href) && !isBroken(href)) {
    const a = document.createElement('a');
    a.href = safeUrl(absolutize(href));
    a.textContent = text;
    return a;
  }
  return document.createTextNode(text);
}

function matchesSafe(el, selector) {
  try {
    return el.matches(selector);
  } catch (e) {
    return false;
  }
}

function makeImage(srcImg, title, document) {
  const img = document.createElement('img');
  img.src = safeUrl(absolutize(srcImg.getAttribute('src')));
  img.alt = clean(srcImg.getAttribute('alt')) || title;
  return [document.createComment(' field:image '), img];
}

/** variant 1: image + badge + title cards (document-order pairing) */
function badgeCards(roots) {
  const cards = [];
  roots.forEach((root) => {
    const parts = [...root.querySelectorAll('.card-image, .text-container')];
    parts.forEach((part, i) => {
      if (!part.matches('.card-image')) return;
      const next = parts[i + 1];
      const text = next && next.matches('.text-container') ? next : null;
      const link = part.closest('a[href]') || (text && text.closest('a[href]'));
      cards.push({
        image: part.querySelector('img[src]'),
        tag: clean(part.querySelector('.badge-resources') && part.querySelector('.badge-resources').textContent),
        title: clean(text && (text.querySelector('h1, h2, h3, h4, h5, h6') || text).textContent),
        href: link ? link.getAttribute('href') : '',
        cta: '',
      });
    });
  });
  return cards;
}

/** variant 2: next-generation-sequencing featured resources */
function featuredResources(element) {
  return [...element.querySelectorAll('.featresitem')].map((item) => {
    const cta = item.querySelector('a.redbtn, p > a[href]:not(:has(img))');
    const imgLink = item.querySelector('a[href]:has(img)');
    return {
      image: item.querySelector('img[src]'),
      tag: '',
      title: clean(item.querySelector('.itemtitle') && item.querySelector('.itemtitle').textContent),
      href: (cta && cta.getAttribute('href')) || (imgLink && imgLink.getAttribute('href')) || '',
      cta: clean(cta && cta.textContent),
    };
  });
}

export default function parse(element, { document }) {
  // ---- sibling card rows of the same grid -----------------------------------
  const roots = [element];
  if (matchesSafe(element, 'div.cards-row')) {
    let next = element.nextElementSibling;
    // only rows of cards (AUC: the next div.cards-row holds the "All ..." pill links)
    while (next && matchesSafe(next, 'div.cards-row') && next.querySelector('.card-image, .badge-resources')) {
      roots.push(next);
      next = next.nextElementSibling;
    }
  }

  const cards = element.querySelector('.featresitem') ? featuredResources(element) : badgeCards(roots);

  const cells = [];

  // ---- row 1: heading row (empty) -----------------------------------------
  cells.push(['']);

  cards.forEach((card) => {
    const imageCell = card.image ? makeImage(card.image, card.title, document) : [];
    const textCell = [];
    if (card.tag) {
      const p = document.createElement('p');
      p.textContent = card.tag;
      textCell.push(p);
    }
    if (card.title) {
      const h3 = document.createElement('h3');
      h3.append(linkOrText(card.title, card.href, document));
      textCell.push(h3);
    }
    if (card.cta) {
      const p = document.createElement('p');
      p.append(linkOrText(card.cta, card.href, document));
      textCell.push(p);
    }
    if (textCell.length) textCell.unshift(document.createComment(' field:text '));
    if (!imageCell.length && !textCell.length) return;
    cells.push([imageCell.length ? imageCell : '', textCell.length ? textCell : '']);
  });

  roots.slice(1).forEach((root) => root.remove());

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid (products)', cells });
  element.replaceWith(block);
}
