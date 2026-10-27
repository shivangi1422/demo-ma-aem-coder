/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-mb (block: columns, 1 row x 2 columns).
 * Sources on mybeckman.in (column order = DOM order = visual order):
 *   clinical-trials       div.width90cta > div.row > div.col-md-3 (cover) | div.col-md-9 (H2 with
 *                         an inline a.btn, p, p > strong, ul)
 *                         div.two-columns-holder: __left | __right, one of them a Wistia player
 *                         (div.wistia-video__wrapper[data-video-id]), the other div.bc-rich-text
 *   leukemia-and-lymphoma div.row > div.col-md-6 (2 p) | div.col-md-6 (infographic img)
 *   biomanufacturing      div.row > div.col-md-8 (H2, p, ul, a > button CTA) | div.col-md-4 (cover)
 *   synthetic-biology     div.intro > div.intro-text (3 p, a > button CTA) | div.intro-image (img)
 *                         div.row > div.col-md-8 (wistia-player[media-id]) | div.col-md-3
 *                         (linked cover img + a > button CTA); the empty div.col-md-1 spacer is
 *                         removed by the cleanup (and skipped here)
 *   cell-line-development div.row > div.column2 (a > img, animated GIF) | div.column2 (2 p, a.btn)
 *   protein-production    div.bcls-aeo-author__card > __card-photo (img) | __card-meta (name, role)
 *   analytical-ultracent. #benefits / #methods > div.copy.row > div | div.copy-img (picked by position)
 *   next-generation-seq.  div.row > div.col-md-6 (2 p) | div.col-md-6 > p.introimg > img
 *
 * Library convention (Columns): block name row, then rows whose cells are the
 * columns (same number of cells in every row); cells hold default content.
 * xwalk: core columns component (columns=2, rows=1); column children are
 * default content (text, image, button, title), so no field hints are emitted.
 *
 * Row 1: [column 1] | [column 2]
 *   text  : headings (h1 -> h2), paragraphs (a paragraph split at <br><br>),
 *           lists, links; a link inside a heading is moved after it into its
 *           own paragraph; CTA buttons (a.btn / a.primary-btn / a > button)
 *           become a link-only paragraph: red primary buttons bold, other
 *           buttons italic; target=_blank dropped
 *   image : <p><img></p>; a link around an image is dropped (on these pages it
 *           always repeats the CTA link of the same row, and the image
 *           component has no link field); alt typo 'Biuld' fixed
 *   video : Wistia player -> poster image (Wistia oEmbed thumbnail for the
 *           known ids) + <p><a href="https://fast.wistia.net/embed/iframe/{id}">{title}</a></p>
 *           - columns.js renders it as a poster + inline player. Title = first
 *           heading of the other column, else the Wistia video title.
 *           The player chrome text ("Press O for more options", ...) is dropped.
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

const WISTIA_RE = /wistia\.(?:net|com)\/(?:embed\/(?:iframe|medias)|medias)\/([A-Za-z0-9]+)/i;

// Wistia oEmbed (https://fast.wistia.com/oembed?url=https://fast.wistia.net/embed/iframe/{id})
const WISTIA = {
  y4ridq7qlo: { poster: 'https://embed-ssl.wistia.com/deliveries/c8c2e5649c0cfa1f9611c505461c2801.jpg?image_crop_resized=960x480' },
  lm6gb0wei1: { poster: 'https://embed-ssl.wistia.com/deliveries/3209e680127f6a5d15ce62a55bfc6498.jpg?image_crop_resized=960x480' },
  '14y6u3fqdf': { poster: 'https://embed-ssl.wistia.com/deliveries/224144afcbc9d6ca19521b03e49533d5.jpg?image_crop_resized=960x480' },
  fdbmwymdzr: {
    title: 'Biomanufacturing: Lesaffre Testimonial',
    poster: 'https://embed-ssl.wistia.com/deliveries/4995dc25d6fa8976480ea4c9558f75dd.jpg?image_crop_resized=960x540',
  },
};

const PLAYER_SELECTOR = '[data-video-id], wistia-player[media-id], iframe[src*="wistia"], .wistia_embed';

const ALT_FIXES = [[/\bBiuld\b/g, 'Build']];

const fixAlt = (alt) => ALT_FIXES.reduce((a, [re, to]) => a.replace(re, to), clean(alt));

function videoId(root) {
  const holder = root.matches && root.matches('[data-video-id]') ? root : root.querySelector('[data-video-id]');
  if (holder && clean(holder.getAttribute('data-video-id'))) return clean(holder.getAttribute('data-video-id'));
  const player = root.querySelector('wistia-player[media-id]');
  if (player && /^[a-z0-9]+$/i.test(clean(player.getAttribute('media-id')))) return clean(player.getAttribute('media-id'));
  const iframe = [...root.querySelectorAll('iframe[src]')].find((f) => WISTIA_RE.test(f.getAttribute('src')));
  if (iframe) return iframe.getAttribute('src').match(WISTIA_RE)[1];
  const async = root.querySelector('[class*="wistia_async_"]');
  const m = async && async.className.match(/wistia_async_([a-z0-9]+)/i);
  return m ? m[1] : '';
}

const isButton = (a) => /\b(btn|primary-btn|redbtn|button)\b/i.test(a.className || '') || !!a.querySelector('button');
const isPrimary = (a) => /\b(btn-primary|btn-red|primary-btn|redbtn)\b/i.test(`${a.className} ${[...a.querySelectorAll('button')].map((b) => b.className).join(' ')}`);

/** copies inline content (text, links, bold, italics, sup/sub, br) */
function copyInline(src, dest, document) {
  src.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      dest.append(document.createTextNode(node.textContent.replace(/\s+/g, ' ')));
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = node.tagName;
    if (tag === 'BR') {
      dest.append(document.createElement('br'));
      return;
    }
    if (/^(SCRIPT|STYLE|NOSCRIPT|IFRAME|VIDEO|IMG|PICTURE|SVG|INPUT|SELECT|TEXTAREA)$/.test(tag)) return;
    if (!clean(node.textContent)) return;
    if (tag === 'A') {
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
    if (/^(STRONG|B|EM|I|SUP|SUB|U)$/.test(tag)) {
      const name = { B: 'strong', I: 'em', U: 'span' }[tag] || tag.toLowerCase();
      if (name === 'span') {
        copyInline(node, dest, document);
        return;
      }
      const el = document.createElement(name);
      copyInline(node, el, document);
      dest.append(el);
      return;
    }
    copyInline(node, dest, document);
  });
}

/** trims edge whitespace / <br>s; returns null when nothing is left */
function tidy(el) {
  const trim = (side) => {
    let n = side === 'start' ? el.firstChild : el.lastChild;
    while (n && ((n.nodeType === 3 && !n.textContent.trim()) || n.nodeName === 'BR')) {
      const next = side === 'start' ? n.nextSibling : n.previousSibling;
      n.remove();
      n = next;
    }
    if (n && n.nodeType === 3) {
      n.textContent = side === 'start' ? n.textContent.replace(/^\s+/, '') : n.textContent.replace(/\s+$/, '');
    }
  };
  trim('start');
  trim('end');
  return clean(el.textContent) ? el : null;
}

/** splits a built paragraph at runs of 2+ <br> */
function splitParagraph(p, document) {
  const parts = [document.createElement('p')];
  const nodes = [...p.childNodes];
  for (let i = 0; i < nodes.length; i += 1) {
    const n = nodes[i];
    if (n.nodeName === 'BR') {
      let j = i;
      while (j + 1 < nodes.length && (nodes[j + 1].nodeName === 'BR'
        || (nodes[j + 1].nodeType === 3 && !nodes[j + 1].textContent.trim()))) j += 1;
      const brs = nodes.slice(i, j + 1).filter((x) => x.nodeName === 'BR').length;
      if (brs >= 2) {
        parts.push(document.createElement('p'));
        i = j;
        continue;
      }
    }
    parts[parts.length - 1].append(n);
  }
  return parts.map(tidy).filter(Boolean);
}

function makeImage(srcImg, document) {
  const img = document.createElement('img');
  img.src = srcImg.getAttribute('src');
  img.alt = fixAlt(srcImg.getAttribute('alt'));
  const p = document.createElement('p');
  p.append(img);
  return p;
}

function makeCta(a, document) {
  const text = clean(a.textContent);
  const href = a.getAttribute('href');
  const p = document.createElement('p');
  if (!text) return null;
  if (!isUsableHref(href)) {
    p.textContent = text;
    return p;
  }
  const link = document.createElement('a');
  link.href = href.trim();
  link.textContent = text;
  const wrap = document.createElement(isPrimary(a) ? 'strong' : 'em');
  wrap.append(link);
  p.append(wrap);
  return p;
}

/** structured content (headings, paragraphs, lists, images, CTAs) from loose markup */
function richContent(container, document) {
  const out = [];
  let run = null;
  const flush = () => {
    if (run) out.push(...splitParagraph(run, document));
    run = null;
  };
  const addInline = (node) => {
    if (!run) run = document.createElement('p');
    const holder = document.createElement('span');
    holder.append(node.cloneNode(true));
    copyInline(holder, run, document);
  };
  const pushImages = (node) => {
    const imgs = node.tagName === 'IMG' ? [node] : [...node.querySelectorAll('img[src]')];
    imgs.forEach((img) => out.push(makeImage(img, document)));
  };
  const visit = (parent) => {
    parent.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        if (clean(node.textContent) || run) addInline(node);
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName;
      if (/^(SCRIPT|STYLE|NOSCRIPT|IFRAME|VIDEO|SVG|HR|INPUT|BUTTON)$/.test(tag)) {
        if (tag === 'BUTTON' && clean(node.textContent)) addInline(document.createTextNode(clean(node.textContent)));
        return;
      }
      if (node.matches(PLAYER_SELECTOR)) return;
      if (tag === 'BR') {
        if (run) run.append(document.createElement('br'));
        return;
      }
      if (tag === 'IMG') {
        flush();
        if (node.getAttribute('src')) pushImages(node);
        return;
      }
      if (/^H[1-6]$/.test(tag)) {
        flush();
        const h = document.createElement(tag === 'H1' ? 'h2' : tag.toLowerCase());
        const links = [...node.querySelectorAll('a[href]')].filter((a) => clean(a.textContent)
          && clean(a.textContent) !== clean(node.textContent));
        const copy = node.cloneNode(true);
        copy.querySelectorAll('a[href]').forEach((a) => {
          if (links.some((l) => l.isEqualNode(a))) a.remove();
        });
        h.textContent = clean(copy.textContent);
        if (h.textContent) out.push(h);
        links.forEach((a) => {
          const cta = makeCta(a, document);
          if (cta) out.push(cta);
        });
        return;
      }
      if (tag === 'UL' || tag === 'OL') {
        flush();
        const list = document.createElement(tag.toLowerCase());
        node.querySelectorAll(':scope > li').forEach((li) => {
          if (!clean(li.textContent)) return;
          const item = document.createElement('li');
          copyInline(li, item, document);
          if (tidy(item)) list.append(item);
        });
        if (list.children.length) out.push(list);
        return;
      }
      if (tag === 'A' && (isButton(node) || node.parentElement.matches('div, section'))
        && !node.querySelector('img') && clean(node.textContent)) {
        flush();
        const cta = makeCta(node, document);
        if (cta) out.push(cta);
        return;
      }
      if (tag === 'A' && node.querySelector('img') && !clean(node.textContent)) {
        // linked image: the link repeats the row CTA; the image component has no link
        flush();
        pushImages(node);
        return;
      }
      if (tag === 'P') {
        flush();
        if (node.querySelector('img[src]')) {
          // images first-class, any text around them as its own paragraph
          const copy = node.cloneNode(true);
          copy.querySelectorAll('img').forEach((i) => i.remove());
          pushImages(node);
          if (clean(copy.textContent)) {
            const p = document.createElement('p');
            copyInline(copy, p, document);
            out.push(...splitParagraph(p, document));
          }
          return;
        }
        if (!clean(node.textContent)) return;
        const p = document.createElement('p');
        if (node.matches('[class*="meta-name"]') && !node.querySelector('strong, b')) {
          // author card: the name is rendered bold on the source
          const strong = document.createElement('strong');
          copyInline(node, strong, document);
          tidy(strong);
          p.append(strong);
          out.push(p);
          return;
        }
        copyInline(node, p, document);
        out.push(...splitParagraph(p, document));
        return;
      }
      if (/^(DIV|SECTION|ARTICLE|ASIDE|FIGURE|FIGCAPTION|HEADER|FOOTER|BLOCKQUOTE|TABLE|TBODY|TR|TD|TH|DL|DT|DD)$/.test(tag)
        || node.querySelector('div, p, h1, h2, h3, h4, h5, h6, ul, ol, img')) {
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
  return out;
}

/** the two (or more) column elements of an instance, in DOM order */
function columnsOf(element) {
  const left = element.querySelector('.two-columns-holder__left');
  const right = element.querySelector('.two-columns-holder__right');
  if (left && right) return [left, right];
  let row = element;
  // wrapper with a single .row child (div.width90cta)
  const kids = [...element.children];
  if (kids.length === 1 && kids[0].matches('.row')) [row] = kids;
  return [...row.children].filter((col) => clean(col.textContent) || col.querySelector('img, picture, ' + PLAYER_SELECTOR));
}

export default function parse(element, { document }) {
  const cols = columnsOf(element);
  const ids = cols.map((col) => videoId(col));
  const texts = cols.map((col) => richContent(col, document));

  const row = cols.map((col, i) => {
    const id = ids[i];
    if (!id) return texts[i].length ? texts[i] : '';
    // video column: poster + link-only paragraph (+ any other content of the column)
    const other = texts.find((t, j) => j !== i && !ids[j]) || [];
    const heading = other.find((n) => /^H[1-6]$/.test(n.tagName));
    const known = WISTIA[id] || {};
    const holder = col.querySelector('[data-video-id]');
    const dataTitle = clean(holder && holder.getAttribute('data-title'));
    const title = (heading && clean(heading.textContent)) || known.title || dataTitle || 'Watch video';
    const nodes = [];
    if (known.poster) {
      const img = document.createElement('img');
      img.src = known.poster;
      img.alt = title;
      const pp = document.createElement('p');
      pp.append(img);
      nodes.push(pp);
    }
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = `https://fast.wistia.net/embed/iframe/${id}`;
    a.textContent = title;
    p.append(a);
    nodes.push(p);
    return [...nodes, ...texts[i]];
  });

  // pad to 2 columns
  while (row.length < 2) row.push('');

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [row] });
  element.replaceWith(block);
}
