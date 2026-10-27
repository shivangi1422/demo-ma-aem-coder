/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-gallery (block: carousel, Style option: gallery).
 * Source: #main-container > div.sublayout-two-column-dynamic (product hero of
 * beckmancoulter.com automation product pages, e.g. DxA 5000 Fit):
 *   .column-1 .product-media-slideshow .owl-item > .item   (main slides:
 *       Vidyard players or product images)
 *   .column-1 .slider-nav .thumbs                          (thumbnail rail - NOT
 *       authored, the block builds it from the slides)
 *   .column-2 .content-container                           (product text; the
 *       product cleanup merges notice + CTA containers into the first one)
 *
 * Follows the library carousel convention (one row per slide: image | text)
 * with the local model's heading row first (blocks/carousel/README.md, gallery).
 * xwalk container model `carousel`: text (richtext), classes.
 * Item model `carousel-item`: image (reference, imageAlt collapsed), text (richtext).
 *
 * Row 1: product text - H1, intro, product variant paragraph, availability
 *        notice, CTA (kept <strong><a> = primary button), jump-link list.
 * Rows 2..N, in slide order:
 *   video slide: poster image (alt "{title} video") | <p><a play.vidyard.com/{uuid}>{title}</a></p>
 *   image slide: main slide image                   | (empty)
 * Video titles come from the player iframe title (leading job codes such as
 * "2023-11204 " removed). Image alts that are filename-style or shared by
 * several slides are made specific from the file name
 * ("1-dxa-5000-fit-input-output-563x450.jpg" -> "DxA 5000 Fit input output").
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

/** escape stray '%' so URI decoding in html2md does not throw */
const safeUrl = (url) => (url || '').trim().replace(/%(?![0-9a-fA-F]{2})/g, '%25');

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

const INLINE_KEEP = /^(STRONG|B|EM|I|U|SUP|SUB|A|BR|SMALL|CODE)$/;
const BLOCK_KEEP = /^(H1|H2|H3|H4|H5|H6|P|UL|OL|LI|BLOCKQUOTE)$/;
const SKIP = /^(SCRIPT|STYLE|NOSCRIPT|IFRAME|IMG|PICTURE|SVG|BUTTON|INPUT|SELECT|TEXTAREA|FORM|LABEL)$/;

/** deep copy keeping text structure, inline formatting and links */
function sanitize(node, document) {
  if (node.nodeType === 3) return document.createTextNode(node.textContent.replace(/ /g, ' '));
  if (node.nodeType !== 1 || SKIP.test(node.tagName)) return null;
  const tag = node.tagName;
  let out;
  if (tag === 'A') {
    const href = node.getAttribute('href');
    if (isUsableHref(href) || (href && href.startsWith('#') && href.length > 1)) {
      out = document.createElement('a');
      out.setAttribute('href', safeUrl(href));
    } else {
      out = document.createDocumentFragment();
    }
  } else if (INLINE_KEEP.test(tag) || BLOCK_KEEP.test(tag)) {
    out = document.createElement(tag.toLowerCase());
  } else {
    out = document.createDocumentFragment();
  }
  const structural = /^(UL|OL)$/.test(tag);
  [...node.childNodes].forEach((child) => {
    if (structural && child.nodeType === 3 && !clean(child.textContent)) return;
    const c = sanitize(child, document);
    if (c) out.append(c);
  });
  return out;
}

function trimEdges(el) {
  while (el.firstChild && el.firstChild.nodeType === 3 && !clean(el.firstChild.textContent)) el.firstChild.remove();
  while (el.lastChild && el.lastChild.nodeType === 3 && !clean(el.lastChild.textContent)) el.lastChild.remove();
  if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.textContent = el.firstChild.textContent.replace(/^\s+/, '');
  if (el.lastChild && el.lastChild.nodeType === 3) el.lastChild.textContent = el.lastChild.textContent.replace(/\s+$/, '');
  [...el.children].forEach((child) => {
    if (/^(P|H[1-6]|LI|A|STRONG)$/.test(child.tagName)) trimEdges(child);
  });
  return el;
}

/** product text panel: block-level children of the content container(s) */
function productText(col, document) {
  const out = [];
  const containers = [...col.querySelectorAll('.content-container')]
    .filter((c) => !c.parentElement.closest('.content-container'));
  const roots = containers.length ? containers : [col];
  const visit = (root) => {
    [...root.children].forEach((child) => {
      const tag = child.tagName;
      if (SKIP.test(tag)) return;
      if (/^(H[1-6]|P|UL|OL|BLOCKQUOTE)$/.test(tag)) {
        if (!clean(child.textContent)) return;
        const c = sanitize(child, document);
        if (c && clean(c.textContent)) out.push(trimEdges(c));
        return;
      }
      if (tag === 'A') {
        if (!clean(child.textContent)) return;
        const p = document.createElement('p');
        p.append(sanitize(child, document));
        out.push(trimEdges(p));
        return;
      }
      const hasBlocks = child.querySelector('h1, h2, h3, h4, h5, h6, p, ul, ol, div, blockquote');
      if (!hasBlocks && clean(child.textContent)) {
        // inline-only wrapper (e.g. notice <span> / .subhead-regular div)
        const p = document.createElement('p');
        const c = sanitize(child, document);
        if (c) p.append(c);
        out.push(trimEdges(p));
        return;
      }
      visit(child);
    });
  };
  roots.forEach(visit);
  return out;
}

function vidyardInfo(slide) {
  const iframe = slide.querySelector('iframe[src*="vidyard"]');
  const poster = slide.querySelector('img.vidyard-player-embed, img[data-uuid], img[src*="play.vidyard.com"]');
  const container = slide.querySelector('.vidyard-player-container, [class*="vidyard-div-"]');
  if (!iframe && !poster && !container) return null;
  let uuid = (container && container.getAttribute('uuid'))
    || (poster && poster.getAttribute('data-uuid')) || '';
  if (!uuid && iframe) {
    const m = (iframe.getAttribute('src') || '').match(/play\.vidyard\.com\/(?:embed\/v4\/)?([A-Za-z0-9_-]+)/);
    uuid = m ? m[1] : '';
  }
  if (!uuid && poster) {
    const m = (poster.getAttribute('src') || '').match(/play\.vidyard\.com\/([A-Za-z0-9_-]+)\.jpg/);
    uuid = m ? m[1] : '';
  }
  if (!uuid) {
    const m = slide.innerHTML.match(/vidyard-(?:div|inner-container|iframe)-([A-Za-z0-9_-]{10,})/);
    uuid = m ? m[1] : '';
  }
  if (!uuid) return null;
  const link = slide.querySelector('a[data-mss-title], a[title]');
  const title = clean((iframe && iframe.getAttribute('title'))
    || (link && (link.getAttribute('data-mss-title') || link.getAttribute('title'))) || '')
    .replace(/^\d{4}-\d{3,}\s+/, '') // leading job code
    .replace(/\s+v\d+$/i, '');
  const posterSrc = (poster && /play\.vidyard\.com/.test(poster.getAttribute('src') || '') && poster.getAttribute('src'))
    || `https://play.vidyard.com/${uuid}.jpg`;
  return { uuid, title, poster: posterSrc };
}

const isFilenameAlt = (alt) => /^[^\s]+$/.test(alt) && /[-_]/.test(alt);

/** descriptor words in the file name that the alt does not already contain */
function altFromFilename(src, baseAlt) {
  let name = '';
  try {
    name = decodeURIComponent((src.split('?')[0].split('/').pop() || ''));
  } catch (e) {
    name = src.split('?')[0].split('/').pop() || '';
  }
  name = name.replace(/\.(jpe?g|png|gif|webp|svg)$/i, '')
    .replace(/^\d+[-_]/, '') // leading slide index
    .replace(/[-_]\d+x\d+$/i, ''); // dimensions
  const have = new Set(clean(baseAlt).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const extra = name.split(/[-_\s]+/).filter((w) => w && !have.has(w.toLowerCase()));
  if (!baseAlt) return extra.join(' ');
  return extra.length ? `${baseAlt} ${extra.join(' ')}` : baseAlt;
}

export default function parse(element, { document }) {
  const cells = [];
  const col1 = element.querySelector('.column-1') || element;
  const col2 = element.querySelector('.column-2');

  // ---- row 1: product text ---------------------------------------------------
  const text = col2 ? productText(col2, document) : [];
  if (text.length) {
    cells.push([[document.createComment(' field:text '), ...text]]);
  } else {
    cells.push(['']);
  }

  // ---- slides (main slideshow, not the thumbnail rail) -----------------------
  const slideshow = col1.querySelector('.product-media-slideshow') || col1;
  let slides = [...slideshow.querySelectorAll('.owl-item:not(.cloned) > .item')];
  if (!slides.length) {
    slides = [...slideshow.querySelectorAll('.item')]
      .filter((s) => !s.closest('.cloned, .slider-nav, .thumbs') && !s.parentElement.closest('.item'));
  }
  if (!slides.length) {
    // no slideshow markup: fall back to the thumbnail rail
    slides = [...col1.querySelectorAll('.thumbs .thumb')];
  }

  const rows = [];
  slides.forEach((slide) => {
    const video = vidyardInfo(slide);
    if (video) {
      const img = document.createElement('img');
      img.src = safeUrl(video.poster);
      img.alt = video.title ? `${video.title} video` : 'Video';
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = `https://play.vidyard.com/${video.uuid}`;
      a.textContent = video.title || a.href;
      p.append(a);
      rows.push({ img, text: [p] });
      return;
    }
    const srcImg = [...slide.querySelectorAll('img')]
      .find((i) => i.getAttribute('src') && !/^data:/i.test(i.getAttribute('src')));
    if (!srcImg) return;
    const img = document.createElement('img');
    img.src = safeUrl(srcImg.getAttribute('src'));
    img.alt = clean(srcImg.getAttribute('alt'));
    rows.push({ img, text: [], image: true });
  });

  // make generic / duplicated / filename-style image alts specific
  const altCount = {};
  rows.filter((r) => r.image).forEach((r) => { altCount[r.img.alt] = (altCount[r.img.alt] || 0) + 1; });
  rows.filter((r) => r.image).forEach((r) => {
    const alt = r.img.alt;
    if (!alt || isFilenameAlt(alt)) {
      r.img.alt = altFromFilename(r.img.getAttribute('src'), '') || alt.replace(/[-_]+/g, ' ');
    } else if (altCount[alt] > 1) {
      r.img.alt = altFromFilename(r.img.getAttribute('src'), alt);
    }
  });

  rows.forEach((r) => {
    const imageCell = [document.createComment(' field:image '), r.img];
    const textCell = r.text.length ? [document.createComment(' field:text '), ...r.text] : '';
    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel (gallery)', cells });
  element.replaceWith(block);
}
