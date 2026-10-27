/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-hematology (block: columns, two columns, one row).
 * Sources on /en/solutions/hematology-solution (column order = DOM order =
 * visual order):
 *   div.social-proof-section  : .social-proof-card > .image (Vidyard player,
 *                               a[videoid]) | .content (loose rich text: h2,
 *                               bare text nodes, h3/h4, links)
 *   div.sublayout-two-column-dynamic : .column-1 | .column-2, each a
 *                               .wysiwyg-content holding either rich text or a
 *                               .vidyard-player-container[uuid]
 *
 * Library convention (Columns): block name row, then one row whose cells are
 * the columns (same number of cells in every row); cells hold text, images or
 * inline elements, never nested blocks.
 * xwalk: core columns component (columns=2, rows=1); column children are
 * default content, so no field hints are emitted.
 *
 * Row 1: [column 1] | [column 2]
 *   text column : headings (levels kept unless they skip one - h2 -> h4 becomes
 *                 h2 -> h3; "Empty heading" placeholders dropped),
 *                 paragraphs (bare text runs wrapped in <p>), lists; links are
 *                 kept exactly as on the live page, link-less anchors become text
 *   video column: <p><a href="https://play.vidyard.com/{uuid}">{title}</a></p> -
 *                 columns.js renders it as a poster + inline player; the title
 *                 (play button label) is the first heading of the other column,
 *                 because the source iframe titles are placeholders or wrong.
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

const VIDYARD_RE = /(?:play|embed|share)\.vidyard\.com\/(?:watch\/)?([A-Za-z0-9_-]+)/i;

const isEmptyHeading = (text) => !text || /^empty heading$/i.test(text);

function vidyardUuid(root) {
  const withId = root.querySelector('[videoid], [uuid], [data-uuid]');
  if (withId) {
    const id = withId.getAttribute('videoid') || withId.getAttribute('uuid') || withId.getAttribute('data-uuid');
    if (clean(id)) return clean(id);
  }
  const src = [...root.querySelectorAll('iframe[src]')]
    .map((el) => el.getAttribute('src'))
    .find((u) => VIDYARD_RE.test(u || ''));
  return src ? src.match(VIDYARD_RE)[1] : '';
}

/** copies inline content, keeping links / bold / italics only */
function copyInline(src, dest, document) {
  src.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      dest.append(document.createTextNode(node.textContent));
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = node.tagName;
    if (/^(SCRIPT|STYLE|NOSCRIPT|IFRAME|VIDEO|IMG|SVG|BR)$/.test(tag)) return;
    if (tag === 'A') {
      if (!clean(node.textContent)) return;
      const href = node.getAttribute('href');
      if (isUsableHref(href)) {
        const a = document.createElement('a');
        a.href = href.trim();
        copyInline(node, a, document);
        dest.append(a);
      } else {
        copyInline(node, dest, document);
      }
      return;
    }
    if (/^(STRONG|B|EM|I)$/.test(tag)) {
      if (!clean(node.textContent)) return; // icon-font glyphs
      const el = document.createElement(/^(STRONG|B)$/.test(tag) ? 'strong' : 'em');
      copyInline(node, el, document);
      dest.append(el);
      return;
    }
    copyInline(node, dest, document);
  });
}

/** structured rich text (headings, paragraphs, lists) from loose markup */
function richText(container, document) {
  const out = [];
  let run = null;
  const flush = () => {
    if (run && clean(run.textContent)) out.push(run);
    run = null;
  };
  const addInline = (node) => {
    if (!run) run = document.createElement('p');
    const holder = document.createElement('span');
    holder.append(node.cloneNode(true));
    copyInline(holder, run, document);
  };
  const visit = (parent) => {
    parent.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        if (clean(node.textContent) || run) addInline(node);
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName;
      if (/^(SCRIPT|STYLE|NOSCRIPT|IFRAME|VIDEO|IMG|SVG)$/.test(tag)) return;
      if (node.matches('.vidyard-player-container')) return;
      if (tag === 'BR') {
        flush();
        return;
      }
      if (/^H[1-6]$/.test(tag)) {
        flush();
        const text = clean(node.textContent);
        if (isEmptyHeading(text)) return;
        const h = document.createElement(tag === 'H1' ? 'h2' : tag.toLowerCase());
        h.textContent = text;
        out.push(h);
        return;
      }
      if (tag === 'UL' || tag === 'OL') {
        flush();
        const list = document.createElement(tag.toLowerCase());
        node.querySelectorAll(':scope > li').forEach((li) => {
          if (!clean(li.textContent)) return;
          const item = document.createElement('li');
          copyInline(li, item, document);
          list.append(item);
        });
        if (list.children.length) out.push(list);
        return;
      }
      if (tag === 'P') {
        flush();
        if (!clean(node.textContent)) return;
        const p = document.createElement('p');
        copyInline(node, p, document);
        out.push(p);
        return;
      }
      // block wrappers, and links wrapping (placeholder) headings
      if (tag === 'DIV' || node.querySelector('h1, h2, h3, h4, h5, h6, p, ul, ol, div')) {
        flush();
        visit(node);
        flush();
        return;
      }
      addInline(node);
    });
  };
  visit(container);
  flush();

  // no skipped heading levels (source h2 -> h4 becomes h2 -> h3)
  // (siblings keep a common level: h2, h4, h4 -> h2, h3, h3)
  let prevSource = 2;
  let prev = 2;
  return out.map((node) => {
    if (!/^H[1-6]$/.test(node.tagName)) return node;
    const source = Number(node.tagName[1]);
    let level = source;
    if (source === prevSource) level = prev;
    else if (source > prevSource) level = Math.min(source, prev + 1);
    prevSource = source;
    prev = level;
    if (`H${level}` === node.tagName) return node;
    const h = document.createElement(`h${level}`);
    h.textContent = node.textContent;
    return h;
  });
}

export default function parse(element, { document }) {
  let segments;
  if (element.matches('.social-proof-section')) {
    const card = element.querySelector('.social-proof-card') || element;
    segments = [card.querySelector('.image'), card.querySelector('.content')];
  } else {
    segments = [element.querySelector('.column-1'), element.querySelector('.column-2')];
  }
  segments = segments.map((seg) => seg || document.createElement('div'));

  // a column is the video column when it holds a player and no headings
  const texts = segments.map((seg) => richText(seg, document));
  const isVideo = segments.map((seg, i) => !!vidyardUuid(seg)
    && !texts[i].some((n) => /^H[1-6]$/.test(n.tagName)));

  const row = segments.map((seg, i) => {
    if (isVideo[i]) {
      const other = texts.find((t, j) => j !== i && !isVideo[j]) || [];
      const heading = other.find((n) => /^H[1-6]$/.test(n.tagName));
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = `https://play.vidyard.com/${vidyardUuid(seg)}`;
      a.textContent = heading ? clean(heading.textContent) : a.href;
      p.append(a);
      return [p];
    }
    return texts[i].length ? texts[i] : '';
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [row] });
  element.replaceWith(block);
}
