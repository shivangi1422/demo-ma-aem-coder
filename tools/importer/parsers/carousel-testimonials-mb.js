/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-testimonials-mb (block: carousel, Style option: testimonials).
 * Source: next-generation-sequencing div.slideshow-container
 *   div.mySlides ×6 (slides 2-6 are display:none on the source but real content: all kept)
 *     > div.Section__testimonials > h4 (name) + p > em (role) + p (quote; the
 *       decorative em.fa-quote-left icon is removed by the cleanup)
 *     slide 6: div.row > div.col-sm-10 (name, role, quote, a > button CTA
 *       "Download Customer Spotlight Story") + div.col-sm-2 > p > a > img (cover)
 *   a.prev / a.next arrows and the sibling div.dot-container are dropped.
 *
 * Library convention (Carousel): one row per slide, image | text, preceded by
 * the local carousel container row (heading, left empty).
 * xwalk container model `carousel`: text (richtext), classes.
 * Item model `carousel-item`: image (reference, imageAlt collapsed), text (richtext).
 *
 * Row 1: heading row - empty
 * Rows 2..N: optional cover image | <p><strong>name</strong></p> <p><em>role</em></p>
 *            <p>quote</p> [<p><strong><a href>CTA</a></strong></p>]
 *   Relative -/media/<guid>.ashx links -> https://www.mybeckman.in/-/media/<guid>.ashx.
 */

const ORIGIN = 'https://www.mybeckman.in';

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

function absolutize(href) {
  const v = (href || '').trim();
  if (/^\/?[-~]\/media\//i.test(v)) return `${ORIGIN}/-/media/${v.replace(/^\/?[-~]\/media\//i, '')}`;
  return v;
}

/** copies inline content (text, links, bold, italics, sup/sub) */
function copyInline(src, dest, document) {
  src.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      dest.append(document.createTextNode(node.textContent.replace(/[\s ]+/g, ' ')));
      return;
    }
    if (node.nodeType !== 1 || !clean(node.textContent)) return;
    const tag = node.tagName;
    if (/^(SCRIPT|STYLE|IMG|SVG|BUTTON)$/.test(tag)) return;
    if (tag === 'A' && isUsableHref(node.getAttribute('href'))) {
      const a = document.createElement('a');
      a.href = absolutize(node.getAttribute('href'));
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

function slideCells(slide, document) {
  const body = slide.querySelector('.Section__testimonials') || slide;
  const nameEl = body.querySelector('h1, h2, h3, h4, h5, h6');
  const name = clean(nameEl && nameEl.textContent);
  const text = [];
  if (name) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = name;
    p.append(strong);
    text.push(p);
  }

  // role (italic-only paragraph) and quote paragraphs, outside the cover column
  const ctaLinks = [];
  [...body.querySelectorAll('p, a[href]')].forEach((el) => {
    if (el.closest('.col-sm-2')) return;
    if (el.tagName === 'A') {
      if (el.closest('p')) return;
      if (clean(el.textContent)) ctaLinks.push(el);
      return;
    }
    const value = clean(el.textContent);
    if (!value) return;
    const em = el.querySelector(':scope > em, :scope > i');
    const p = document.createElement('p');
    if (em && clean(em.textContent) === value) {
      const out = document.createElement('em');
      out.textContent = value;
      p.append(out);
    } else {
      copyInline(el, p, document);
      trimEdges(p);
    }
    if (clean(p.textContent)) text.push(p);
  });

  // CTA: a > button (bold link = red button)
  ctaLinks.forEach((a) => {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    const link = document.createElement('a');
    link.href = absolutize(a.getAttribute('href'));
    link.textContent = clean(a.textContent);
    strong.append(link);
    p.append(strong);
    text.push(p);
  });

  // optional cover image (slide 6)
  const imageCell = [];
  const cover = body.querySelector('.col-sm-2 img[src], img.resources[src]');
  if (cover) {
    const img = document.createElement('img');
    img.src = cover.getAttribute('src');
    img.alt = clean(cover.getAttribute('alt')) || (name ? `${name} customer spotlight story` : 'Customer spotlight story');
    imageCell.push(document.createComment(' field:image '), img);
  }

  if (!text.length && !imageCell.length) return null;
  return [
    imageCell.length ? imageCell : '',
    text.length ? [document.createComment(' field:text '), ...text] : '',
  ];
}

export default function parse(element, { document }) {
  const cells = [];

  // ---- row 1: heading row (empty) -----------------------------------------
  cells.push(['']);

  let slides = [...element.querySelectorAll('.mySlides')];
  if (!slides.length) slides = [...element.querySelectorAll('.Section__testimonials')];
  slides.forEach((slide) => {
    const row = slideCells(slide, document);
    if (row) cells.push(row);
  });

  // slideshow dots next to the container
  const dots = element.nextElementSibling;
  if (dots && dots.matches('.dot-container')) dots.remove();

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel (testimonials)', cells });
  element.replaceWith(block);
}
