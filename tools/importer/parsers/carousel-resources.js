/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-resources (block: carousel, Style option: resources).
 * Source: div.education-filter-carousel (beckmancoulter.com solutions pages).
 *
 * xwalk container model `carousel`: text (richtext), classes.
 * Item model `carousel-item`: image (reference, imageAlt collapsed), text (richtext).
 *
 * The "Educational Resources" h2 stays default content directly above the block.
 * Row 1: filter labels as a bulleted list (Blogs, Articles, ...), in display order
 * Rows 2..N: one per card (.owl-item .item, owl clones skipped) ->
 *   background image (CSS background-image url) | <p>category</p> <h3>title</h3> <p>CTA link</p>
 * CTAs pointing to "#" (or with no href) keep their text without a link.
 */

const clean = (str) => (str || '').replace(/\s+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

function bgUrl(el) {
  if (!el) return '';
  const style = el.getAttribute('style') || '';
  const re = /url\(\s*['"]?([^'")]*)['"]?\s*\)/gi;
  let m;
  while ((m = re.exec(style))) {
    const url = m[1].replace(/&amp;/g, '&').trim();
    if (url) return url;
  }
  return '';
}

export default function parse(element, { document }) {
  const cells = [];

  // ---- section heading as default content above the block --------------
  const headingEl = element.querySelector(':scope > h2, .carousel-heading');
  const headingText = clean(headingEl ? headingEl.textContent : '');
  let heading = null;
  if (headingText && !/^empty heading$/i.test(headingText)) {
    heading = document.createElement('h2');
    heading.textContent = headingText;
  }

  // ---- row 1: filter labels ----------------------------------------------
  const ul = document.createElement('ul');
  const seenLabels = new Set();
  element.querySelectorAll('.filter-header .filter-button, .owl-filter-bar a, .filter-button').forEach((btn) => {
    const label = clean(btn.textContent);
    if (!label || seenLabels.has(label.toLowerCase())) return;
    seenLabels.add(label.toLowerCase());
    const li = document.createElement('li');
    li.textContent = label;
    ul.append(li);
  });
  if (ul.children.length) {
    cells.push([[document.createComment(' field:text '), ul]]);
  } else {
    cells.push(['']);
  }

  // ---- items ---------------------------------------------------------------
  let items = [...element.querySelectorAll('.owl-item:not(.cloned) > .item')];
  if (!items.length) {
    items = [...element.querySelectorAll('#education-filter-carousel .item, .owl-carousel .item')]
      .filter((it) => !it.closest('.cloned'));
  }

  items.forEach((item) => {
    // image
    const imageCell = [];
    const inlineImg = item.querySelector('img');
    const src = bgUrl(item) || (inlineImg && inlineImg.getAttribute('src')) || '';
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = clean(inlineImg ? inlineImg.getAttribute('alt') : '');
      imageCell.push(document.createComment(' field:image '), img);
    }

    // text
    const textCell = [];
    const sub = item.querySelector('.subheading');
    const category = clean(sub ? sub.textContent : '');
    if (category) {
      const p = document.createElement('p');
      p.textContent = category;
      textCell.push(p);
    }

    const titleEl = [...item.querySelectorAll('h1, h2, h3, h4, h5, h6')]
      .find((h) => {
        const t = clean(h.textContent);
        return t && !/^empty heading$/i.test(t);
      });
    if (titleEl) {
      const h3 = document.createElement('h3');
      h3.textContent = clean(titleEl.textContent);
      textCell.push(h3);
    }

    item.querySelectorAll('.item-action a, .item-action .button').forEach((cta) => {
      const text = clean(cta.textContent);
      if (!text) return;
      const p = document.createElement('p');
      const href = cta.getAttribute('href');
      if (isUsableHref(href)) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = text;
        p.append(a);
      } else {
        p.textContent = text;
      }
      textCell.push(p);
    });

    if (textCell.length) textCell.unshift(document.createComment(' field:text '));
    if (!imageCell.length && !textCell.length) return;
    cells.push([imageCell.length ? imageCell : '', textCell.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel (resources)', cells });
  if (heading) element.before(heading);
  element.replaceWith(block);
}
