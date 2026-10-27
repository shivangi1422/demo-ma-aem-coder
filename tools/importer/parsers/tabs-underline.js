/* eslint-disable */
/* global WebImporter */

/**
 * Parser for tabs-underline (block: tabs-underline).
 * Source: div.product-tabs (beckmancoulter.com product detail pages), e.g.
 *   .tabbed-content > .tabs > .ui.menu > a.item[data-tab]          (tab labels)
 *   .tabbed-content > .tabs > .ui.tab.segment[data-tab]           (tab panels)
 * The mobile "Filter By" dropdown (.tabs-mobile-dropdown) and tab chrome are skipped.
 *
 * xwalk: container `tabs-underline` has no fields; item model `tabs-underline-item`:
 *   title (text) | image (reference, imageAlt collapsed) | text (richtext)
 * One row per tab, labels paired with panels by data-tab (document order fallback).
 *
 * Panel content (ALL content blocks of the panel: several .wysiwyg-content /
 * .richText-mobile wrappers and nested sublayouts on DxA) is flattened into
 * rich text in source order:
 *  - Vidyard players -> <p><a href="https://play.vidyard.com/{uuid}">title</a></p>
 *    (the block builds the poster from the uuid and plays the video inline)
 *  - filename-style alts ("Workflow-diagram-pre-analytical") become words
 *  - headings / paragraphs / lists are kept (inline formatting + links kept,
 *    style/class attributes dropped)
 *  - bare text runs (text nodes between headings, separated by <br>) become <p>s
 *  - layout tables (tables holding an image / video) are NOT emitted: their
 *    first image becomes the item's image, their text cells are flattened
 *    into the rich text in order (REMISOL monitor + numbered H4/P list)
 *  - data tables (specifications, connections) are kept as tables in the rich
 *    text, spacer rows and indentation dropped
 *  - images: xwalk/md2jcr cannot keep an <img> inside a rich-text field (the
 *    rich text stops at the first image and the page fails to convert), so
 *    the FIRST image of the panel goes to the item's image field (REMISOL
 *    monitor, DxA pre-analytical diagram) and any further image is kept in
 *    source order as a link paragraph <p><a href="{src}">{alt}</a></p>
 *  - stray '%' in URLs (source "w=100%") is escaped so html2md can decode them
 * Validated with html2md + md2jcr on REMISOL Advance and DxA 5000 Fit.
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

const BLOCK_TAGS = /^(H1|H2|H3|H4|H5|H6|P|UL|OL|BLOCKQUOTE|TABLE|DIV|SECTION|ARTICLE|FIGURE|HR|DL|PRE)$/;
const INLINE_KEEP = /^(STRONG|B|EM|I|U|SUP|SUB|A|BR|CODE|SMALL)$/;
const SKIP_TAGS = /^(SCRIPT|STYLE|NOSCRIPT|LINK|IFRAME|INPUT|SELECT|TEXTAREA|BUTTON|FORM|SVG|LABEL)$/;

/** escape stray '%' (e.g. "w=100%") so URI decoding in html2md does not throw */
const safeUrl = (url) => (url || '').trim().replace(/%(?![0-9a-fA-F]{2})/g, '%25');

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

/** deep copy keeping only content tags / attributes (href, src, alt, colspan, rowspan) */
function sanitize(node, document) {
  if (node.nodeType === 3) return document.createTextNode(node.textContent.replace(/ /g, ' '));
  if (node.nodeType !== 1 || SKIP_TAGS.test(node.tagName)) return null;
  const tag = node.tagName;
  if (tag === 'IMG') {
    const src = node.getAttribute('src');
    if (!src) return null;
    const img = document.createElement('img');
    img.src = safeUrl(src);
    img.alt = clean(node.getAttribute('alt'));
    return img;
  }
  // unwrap presentational wrappers (span, font, ...)
  const keep = INLINE_KEEP.test(tag) || BLOCK_TAGS.test(tag)
    || /^(LI|TBODY|THEAD|TFOOT|TR|TD|TH|DT|DD|CAPTION)$/.test(tag);
  let out;
  if (keep && !/^(DIV|SECTION|ARTICLE|FIGURE)$/.test(tag)) {
    out = document.createElement(tag.toLowerCase());
    if (tag === 'A') {
      const href = node.getAttribute('href');
      if (!isUsableHref(href)) out = document.createDocumentFragment();
      else out.setAttribute('href', safeUrl(href));
    }
    ['colspan', 'rowspan'].forEach((attr) => {
      if (node.getAttribute(attr) && out.setAttribute) {
        out.setAttribute(attr, node.getAttribute(attr));
        out.setAttribute('data-keep-span', '');
      }
    });
  } else {
    out = document.createDocumentFragment();
  }
  const structural = /^(TABLE|TBODY|THEAD|TFOOT|TR|UL|OL|DL)$/.test(tag);
  [...node.childNodes].forEach((child) => {
    // indentation between table rows / list items is not content
    if (structural && child.nodeType === 3 && !clean(child.textContent)) return;
    const c = sanitize(child, document);
    if (c) out.append(c);
  });
  return out;
}

function trimParagraph(p) {
  while (p.firstChild && ((p.firstChild.nodeType === 3 && !clean(p.firstChild.textContent))
    || (p.firstChild.nodeType === 1 && p.firstChild.tagName === 'BR'))) p.firstChild.remove();
  while (p.lastChild && ((p.lastChild.nodeType === 3 && !clean(p.lastChild.textContent))
    || (p.lastChild.nodeType === 1 && p.lastChild.tagName === 'BR'))) p.lastChild.remove();
  if (p.firstChild && p.firstChild.nodeType === 3) p.firstChild.textContent = p.firstChild.textContent.replace(/^\s+/, '');
  if (p.lastChild && p.lastChild.nodeType === 3) p.lastChild.textContent = p.lastChild.textContent.replace(/\s+$/, '');
}

/** tables that only position media beside text (REMISOL monitor + numbered list) */
function isLayoutTable(table) {
  return !!table.querySelector('img, picture, iframe, .vidyard-player-container');
}

/** "Workflow-diagram-pre-analytical" -> "Workflow diagram pre analytical" */
function fixAlt(alt) {
  const a = clean(alt);
  if (/^[^\s]+$/.test(a) && /[-_]/.test(a) && !/^https?:/i.test(a)) {
    return a.replace(/\.(jpe?g|png|gif|webp|svg)$/i, '').replace(/[-_]+/g, ' ').trim();
  }
  return a;
}

const VIDEO_CONTAINER = '.vidyard-player-container, [class*="vidyard-div-"], .video-container, .embed-container';

/** Vidyard / YouTube / Vimeo player -> { href, poster, title } */
function videoInfo(node) {
  const iframe = node.tagName === 'IFRAME' ? node : node.querySelector('iframe');
  const iframeSrc = iframe ? iframe.getAttribute('src') || '' : '';
  const posterImg = node.tagName === 'IMG' ? node : node.querySelector('img.vidyard-player-embed, img[data-uuid], img');
  let uuid = node.getAttribute('uuid') || node.getAttribute('data-uuid')
    || (posterImg && posterImg.getAttribute('data-uuid')) || '';
  if (!uuid) {
    const m = iframeSrc.match(/play\.vidyard\.com\/(?:embed\/v4\/)?([A-Za-z0-9_-]+)/)
      || ((posterImg && posterImg.getAttribute('src')) || '').match(/play\.vidyard\.com\/([A-Za-z0-9_-]+)\.jpg/)
      || (node.outerHTML.match(/vidyard-(?:div|inner-container|iframe|lightbox)-([A-Za-z0-9_-]{10,})/));
    uuid = m ? m[1] : '';
  }
  const rawTitle = clean((iframe && iframe.getAttribute('title')) || '');
  const title = rawTitle.replace(/\s+v\d+$/i, '');
  if (uuid) {
    const poster = (posterImg && /vidyard/.test(posterImg.getAttribute('src') || '') && posterImg.getAttribute('src'))
      || `https://play.vidyard.com/${uuid}.jpg`;
    const posterAlt = clean(posterImg && posterImg.getAttribute('alt'));
    return {
      href: `https://play.vidyard.com/${uuid}`,
      poster,
      title: title || (/^watch video$/i.test(posterAlt) ? '' : posterAlt) || 'Video',
    };
  }
  if (iframeSrc && /youtube|youtu\.be|vimeo/i.test(iframeSrc)) {
    return { href: iframeSrc.split('?')[0], poster: '', title: title || 'Video' };
  }
  return null;
}

/** walks panel content, pushing rich text nodes to out[] and images to images[] */
function flatten(root, document, out, images, ctx = {}) {
  let run = null; // current bare-text paragraph

  const flush = () => {
    if (run) {
      trimParagraph(run);
      if (clean(run.textContent) || run.querySelector('img')) out.push(run);
    }
    run = null;
  };

  // the item image field takes the first image; md2jcr cannot keep further
  // images in the rich text, so they become link paragraphs (in order)
  const pushImage = (srcImg) => {
    const img = sanitize(srcImg, document);
    if (!img) return;
    img.alt = fixAlt(img.alt);
    if (!img.alt) {
      // no source alt: describe the image by the heading it illustrates
      const lastHeading = [...out].reverse()
        .find((n) => n.nodeType === 1 && /^H[1-6]$/.test(n.tagName));
      if (lastHeading) img.alt = clean(lastHeading.textContent);
    }
    if (!images.length && !ctx.imageTaken) {
      images.push(img);
    } else {
      const a = document.createElement('a');
      a.href = img.getAttribute('src');
      a.textContent = img.alt || a.href;
      const p = document.createElement('p');
      p.append(a);
      out.push(p);
    }
  };

  // link paragraph only: the block derives the poster (play.vidyard.com/{uuid}.jpg);
  // a poster <img> in the rich text would break md2jcr (see above)
  const pushVideo = (node) => {
    const info = videoInfo(node);
    if (!info) return false;
    const a = document.createElement('a');
    a.href = safeUrl(info.href);
    a.textContent = info.title;
    const p = document.createElement('p');
    p.append(a);
    out.push(p);
    return true;
  };

  [...root.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      if (!clean(node.textContent) && !run) return;
      if (!run) run = document.createElement('p');
      run.append(document.createTextNode(node.textContent.replace(/\u00a0/g, ' ')));
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = node.tagName;

    // video players (before SKIP_TAGS: iframes are skipped otherwise)
    if (node.matches(VIDEO_CONTAINER) || (tag === 'IFRAME' && videoInfo(node))) {
      flush();
      if (pushVideo(node)) return;
    }
    if (SKIP_TAGS.test(tag)) return;

    if (tag === 'BR') {
      flush();
      return;
    }
    if (tag === 'IMG' || tag === 'PICTURE') {
      flush();
      const img = tag === 'IMG' ? node : node.querySelector('img');
      if (img) pushImage(img);
      return;
    }
    if (!BLOCK_TAGS.test(tag) && tag !== 'LI') {
      // inline element: part of a bare-text run (images inside are lifted out)
      if (node.querySelector('img, iframe')) {
        flush();
        flatten(node, document, out, images, ctx);
        return;
      }
      if (!clean(node.textContent)) return;
      if (!run) run = document.createElement('p');
      const c = sanitize(node, document);
      if (c) run.append(c);
      return;
    }

    flush();
    if (/^(DIV|SECTION|ARTICLE|FIGURE)$/.test(tag)) {
      flatten(node, document, out, images, ctx);
      return;
    }
    if (tag === 'TABLE') {
      if (isLayoutTable(node)) {
        const cellCtx = { ...ctx, inLayoutTable: true };
        node.querySelectorAll('td, th').forEach((cell) => {
          // nested table cells are handled by their outer cell
          const outer = cell.parentElement && cell.parentElement.closest('td, th');
          if (outer && node.contains(outer)) return;
          flatten(cell, document, out, images, cellCtx);
          // only the first layout image goes to the image field
          if (images.length) cellCtx.imageTaken = true;
        });
      } else if (clean(node.textContent)) {
        // data table (specifications, connections): kept, spacer rows dropped
        const table = sanitize(node, document);
        table.querySelectorAll('tr').forEach((tr) => {
          if (!clean(tr.textContent) && !tr.querySelector('img')) tr.remove();
        });
        table.querySelectorAll('a, p, li, td, th, strong').forEach((el) => trimParagraph(el));
        out.push(table);
      }
      return;
    }
    if (tag === 'HR') return;
    if (/^(UL|OL|DL)$/.test(tag) && !clean(node.textContent)) return;
    if (/^(H[1-6]|P|BLOCKQUOTE|PRE)$/.test(tag)) {
      // lift images out of headings / paragraphs
      [...node.querySelectorAll('img')].forEach((img) => {
        pushImage(img);
        img.remove();
      });
      if (!clean(node.textContent)) return;
    }
    const c = sanitize(node, document);
    if (c && clean(c.textContent)) {
      if (c.nodeType === 1 && /^(P|H[1-6])$/.test(c.tagName)) trimParagraph(c);
      if (c.nodeType === 1) c.querySelectorAll('li').forEach((li) => trimParagraph(li));
      out.push(c);
    }
  });
  flush();
}

export default function parse(element, { document }) {
  const cells = [];

  // ---- tab labels ----------------------------------------------------------
  // data-* attributes may be stripped (cleaned snapshots): fall back to the
  // label id ("tab-overview" -> "overview") and to document order
  const labelKey = (el) => el.getAttribute('data-tab')
    || (el.id ? el.id.replace(/^tab-/, '') : '');
  const labelEls = [...element.querySelectorAll('.menu > .item, .menu > a.item, [role="tab"]')]
    .filter((el, i, all) => all.indexOf(el) === i
      && !el.closest('.tabs-mobile-dropdown, .dropdown, select')
      && clean(el.textContent));
  const labelFor = new Map();
  labelEls.forEach((el) => {
    const key = labelKey(el);
    if (key && !labelFor.has(key)) labelFor.set(key, clean(el.textContent));
  });

  // ---- panels --------------------------------------------------------------
  let panels = [...element.querySelectorAll('.tab.segment, .tab[data-tab], [role="tabpanel"]')]
    .filter((el) => !el.matches('.item') && !el.closest('.menu, .tabs-mobile-dropdown'));
  panels = panels.filter((p) => !panels.some((o) => o !== p && o.contains(p)));
  if (!panels.length) {
    const fallback = element.querySelector('.wysiwyg-content') || null;
    if (fallback) panels = [fallback];
  }

  panels.forEach((panel, i) => {
    const key = panel.getAttribute('data-tab')
      || (panel.id ? panel.id.replace(/^(tab-)?panel-|^tab-/, '') : '');
    const title = (key && labelFor.get(key))
      || (labelEls[i] && clean(labelEls[i].textContent))
      || clean(key ? key.replace(/[-_]+/g, ' ') : '')
      || `Tab ${i + 1}`;

    // all content blocks of the panel (several .wysiwyg-content /
    // .richText-mobile / nested sublayouts on DxA), in source order
    const root = panel;
    const out = [];
    const images = [];
    flatten(root, document, out, images);

    const titleCell = [document.createComment(' field:title '), document.createTextNode(title)];
    const imageCell = images.length ? [document.createComment(' field:image '), images[0]] : '';
    const textCell = out.length ? [document.createComment(' field:text '), ...out] : '';
    cells.push([titleCell, imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-underline', cells });
  // createBlock pads short rows with colspan - also inside the rich-text data
  // tables; keep only spans copied from the source
  block.querySelectorAll('table td[colspan], table th[colspan]').forEach((cell) => {
    if (cell.closest('table') !== block && !cell.hasAttribute('data-keep-span')) cell.removeAttribute('colspan');
  });
  block.querySelectorAll('[data-keep-span]').forEach((el) => el.removeAttribute('data-keep-span'));
  element.replaceWith(block);
}
