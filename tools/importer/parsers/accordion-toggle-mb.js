/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion-toggle-mb (block: accordion-toggle, closed by default).
 * Sources on mybeckman.in:
 *   1. div.wrap-collabsible > input.toggle + label.lbl-toggle (title)
 *        + div.collapsible-content > div.content-inner (panel)
 *      clinical-trials: 2 single toggles "Related products" whose panel is a
 *        div.product-series-callouts (product cards: a > img + h4 + description)
 *      leukemia-and-lymphoma: a run of 5 sibling toggles (paragraphs + a.btn link).
 *        The instance is the first of the run (X:not(X + X)); the following
 *        sibling div.wrap-collabsible elements are taken in and removed.
 *   2. synthetic-biology div.row > div.col-sm-6 > div.accordion > div.accordion-item ×2 per column:
 *        div.accordion-header (title + span.accordion-icon "+", stripped)
 *        + div.accordion-content > div.apps ×N (decorative icon img + resource link);
 *        items in document order (column 1 item 1, item 2, column 2 item 1, item 2)
 *   3. protein-production details.references-details > summary + div.references-content > ol (28 li)
 *
 * Library convention (Accordion): one row per item, title | content.
 * xwalk: container model `accordion-toggle` (classes only); item model
 * `accordion-toggle-item`: title (text), content (richtext).
 *
 * Rows: <!-- field:title --> plain title | <!-- field:content --> rich text
 *   - paragraphs / lists / links kept (a link-only paragraph with a .btn link
 *     becomes a button: italic = secondary, as the source btn-default)
 *   - product cards -> per product: a paragraph that only links to the image
 *     file (link text = alt, else the product name), the product name as an
 *     H3 linked to the product, the description paragraph
 *   - div.apps resource rows -> one bulleted link list (icons, hr dropped)
 *   - relative -/media/<guid>.ashx links -> https://www.mybeckman.in/-/media/<guid>.ashx
 *   - images elsewhere -> link-only paragraph to the image file (richtext
 *     cannot hold images)
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

const isButton = (a) => /\b(btn|primary-btn|redbtn|button)\b/i.test(a.className || '') || !!a.querySelector('button');
const isPrimary = (a) => /\b(btn-primary|btn-red|primary-btn|redbtn)\b/i.test(`${a.className} ${[...a.querySelectorAll('button')].map((b) => b.className).join(' ')}`);

function matchesSafe(el, selector) {
  try {
    return el.matches(selector);
  } catch (e) {
    return false;
  }
}

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
        a.href = absolutize(href);
        copyInline(node, a, document);
        dest.append(a);
      } else {
        copyInline(node, dest, document);
      }
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

function linkParagraph(href, text, document, wrapTag) {
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = absolutize(href);
  a.textContent = text;
  if (wrapTag) {
    const w = document.createElement(wrapTag);
    w.append(a);
    p.append(w);
  } else {
    p.append(a);
  }
  return p;
}

const IMAGE_EXT = /\.(?:png|jpe?g|webp|gif|avif|svg)$/i;

/**
 * image file URL the block recognises as an image (path must end in an image
 * extension): extensionless Sitecore media URLs get ".jpg" (Sitecore resolves
 * media items regardless of the extension)
 */
function imageFileUrl(src) {
  const raw = (src || '').trim();
  if (!raw || /^data:/i.test(raw)) return '';
  const m = raw.match(/^([^?#]*)(.*)$/);
  return IMAGE_EXT.test(m[1]) ? raw : `${m[1]}.jpg${m[2]}`;
}

/** image -> paragraph that only links to the image file (link text = alt) */
function imageLink(img, fallbackAlt, document) {
  const src = imageFileUrl(img.getAttribute('src'));
  if (!src) return null;
  return linkParagraph(src, clean(img.getAttribute('alt')) || fallbackAlt || 'Image', document);
}

/** product card -> image-file link, linked H3 name, description */
function productNodes(item, document) {
  const out = [];
  const nameEl = item.querySelector('h1, h2, h3, h4, h5, h6');
  const name = clean(nameEl && nameEl.textContent);
  const link = item.matches('a[href]') ? item : item.querySelector('a[href]');
  const href = link && link.getAttribute('href');
  const img = [...item.querySelectorAll('img[src]')]
    .find((i) => !/display:\s*none/i.test(i.getAttribute('style') || ''));
  if (img) {
    const p = imageLink(img, name, document);
    if (p) out.push(p);
  }
  if (name) {
    const h3 = document.createElement('h3');
    if (isUsableHref(href)) {
      const a = document.createElement('a');
      a.href = absolutize(href);
      a.textContent = name;
      h3.append(a);
    } else {
      h3.textContent = name;
    }
    out.push(h3);
  }
  const descEl = item.querySelector('.product-series-callouts__description > div, .product-series-callouts__description > p');
  const desc = clean(descEl && descEl.textContent);
  if (desc) {
    const p = document.createElement('p');
    p.textContent = desc;
    out.push(p);
  }
  return out;
}

/** rich text panel content from loose markup */
function richContent(container, document) {
  const out = [];
  let run = null;
  let list = null;
  const flush = () => {
    if (run && tidy(run)) out.push(run);
    run = null;
  };
  const endList = () => {
    list = null;
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
      if (/^(SCRIPT|STYLE|NOSCRIPT|IFRAME|VIDEO|SVG|HR|INPUT|BUTTON|LABEL)$/.test(tag)) return;
      if (node.matches('.product-series-callouts__item')) {
        flush();
        endList();
        out.push(...productNodes(node, document));
        return;
      }
      if (node.matches('.apps')) {
        // resource row: decorative icon + link -> bulleted link list
        flush();
        const li = document.createElement('li');
        copyInline(node, li, document);
        if (!tidy(li)) return;
        if (!list) {
          list = document.createElement('ul');
          out.push(list);
        }
        list.append(li);
        return;
      }
      if (tag === 'BR') {
        if (run) run.append(document.createElement('br'));
        return;
      }
      endList();
      if (tag === 'IMG') {
        flush();
        const p = imageLink(node, '', document);
        if (p) out.push(p);
        return;
      }
      if (/^H[1-6]$/.test(tag)) {
        flush();
        const h = document.createElement(tag === 'H1' || tag === 'H2' ? 'h3' : tag.toLowerCase());
        h.textContent = clean(node.textContent);
        if (h.textContent) out.push(h);
        return;
      }
      if (tag === 'UL' || tag === 'OL') {
        flush();
        const l = document.createElement(tag.toLowerCase());
        node.querySelectorAll(':scope > li').forEach((li) => {
          if (!clean(li.textContent)) return;
          const item = document.createElement('li');
          copyInline(li, item, document);
          if (tidy(item)) l.append(item);
        });
        if (l.children.length) out.push(l);
        return;
      }
      if (tag === 'P') {
        flush();
        if (!clean(node.textContent) && !node.querySelector('img')) return;
        node.querySelectorAll('img[src]').forEach((img) => {
          const p = imageLink(img, '', document);
          if (p) out.push(p);
        });
        if (!clean(node.textContent)) return;
        // link-only paragraph with a button link -> button
        const links = [...node.querySelectorAll('a[href]')];
        if (links.length === 1 && clean(links[0].textContent) === clean(node.textContent) && isButton(links[0])) {
          out.push(linkParagraph(links[0].getAttribute('href'), clean(links[0].textContent), document, isPrimary(links[0]) ? 'strong' : 'em'));
          return;
        }
        const p = document.createElement('p');
        copyInline(node, p, document);
        if (tidy(p)) out.push(p);
        return;
      }
      if (tag === 'A' && isButton(node) && clean(node.textContent)) {
        flush();
        out.push(linkParagraph(node.getAttribute('href'), clean(node.textContent), document, isPrimary(node) ? 'strong' : 'em'));
        return;
      }
      if (/^(DIV|SECTION|ARTICLE|ASIDE|FIGURE|HEADER|FOOTER|BLOCKQUOTE|DETAILS)$/.test(tag)
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

/** title text without decorative icons */
function titleText(el) {
  if (!el) return '';
  const copy = el.cloneNode(true);
  copy.querySelectorAll('.accordion-icon, [class*="icon"], i, svg, img').forEach((n) => n.remove());
  return clean(copy.textContent);
}

/** {title, content element} for every toggle of the instance */
function itemsOf(element, roots) {
  const items = [];
  roots.forEach((root) => {
    if (root.matches('details')) {
      const summary = root.querySelector(':scope > summary');
      const body = root.cloneNode(true);
      const s = body.querySelector(':scope > summary');
      if (s) s.remove();
      items.push({ title: titleText(summary), content: body });
      return;
    }
    if (root.matches('.wrap-collabsible')) {
      items.push({
        title: titleText(root.querySelector('label, .lbl-toggle')),
        content: root.querySelector('.content-inner') || root.querySelector('.collapsible-content') || root,
      });
      return;
    }
    root.querySelectorAll('.accordion-item').forEach((item) => {
      items.push({
        title: titleText(item.querySelector('.accordion-header')),
        content: item.querySelector('.accordion-content') || item,
      });
    });
  });
  return items;
}

export default function parse(element, { document }) {
  // ---- run of sibling toggles (leukemia-and-lymphoma) ----------------------
  const roots = [element];
  if (matchesSafe(element, 'div.wrap-collabsible')) {
    let next = element.nextElementSibling;
    while (next && matchesSafe(next, 'div.wrap-collabsible')) {
      roots.push(next);
      next = next.nextElementSibling;
    }
  }

  const cells = [];
  itemsOf(element, roots).forEach(({ title, content }) => {
    const nodes = richContent(content, document);
    if (!title && !nodes.length) return;
    cells.push([
      title ? [document.createComment(' field:title '), document.createTextNode(title)] : '',
      nodes.length ? [document.createComment(' field:content '), ...nodes] : '',
    ]);
  });

  roots.slice(1).forEach((root) => root.remove());

  // synthetic-biology grey bar accordion in two columns: Style "boxed"
  const boxed = !!element.querySelector('.accordion-item');
  const block = WebImporter.Blocks.createBlock(document, { name: boxed ? 'accordion-toggle (boxed)' : 'accordion-toggle', cells });
  element.replaceWith(block);
}
