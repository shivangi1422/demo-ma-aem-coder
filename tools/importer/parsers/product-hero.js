/* eslint-disable */
/* global WebImporter */

/**
 * Parser for product-hero.
 * Source: https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise
 * Selector: .product-spotlight-wrapper .product-intro-wrapper
 *   image     -> .lt-holder .product-gallery-carousel img (first slide)
 *   text      -> .rt-holder h1, p, ul + button-row links (.twobuttons / .threebuttons)
 *                (btn-default -> italic link = outline button, btn-primary -> bold link = solid button)
 *   resources -> .resource-tool-table-wrapper (label + links)
 *
 * XWalk model (blocks/product-hero/_product-hero.json): image (+ imageAlt) | text | resources
 * A gallery with several slides (e.g. Kaluza) leaves the hero image empty and adds a
 * product-gallery block right after the hero, which the hero places in its image column.
 * Without a .twobuttons/.threebuttons row, the visible jump link (.product-table-link-btn)
 * becomes a plain in-page link and its quote button a bold (solid) link.
 * In-page links (#product-table-wrapper) are rewritten to the id of the heading they
 * point to, the same id the page tabs use.
 */

const clean = (text) => text.replace(/\s+/g, ' ').trim();
const slug = (text) => clean(text).toLowerCase().replace(/[^0-9a-z]+/g, '-').replace(/^-+|-+$/g, '');

/** "#source-id" -> "#heading-slug" for the heading inside (or at) the source target. */
function anchorFor(href, document) {
  if (!href || !href.startsWith('#') || href.length < 2) return href;
  const target = document.getElementById(href.slice(1));
  const heading = target && (target.matches('h1, h2, h3, h4') ? target : target.querySelector('h1, h2, h3, h4'));
  return heading ? `#${slug(heading.textContent)}` : href;
}

/** Copies text and links of a rich-text node, dropping inline styles and stray attributes. */
function copyInline(source, target, document) {
  [...source.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      // keep &nbsp; (it holds words together on the live page)
      target.appendChild(document.createTextNode(node.textContent.replace(/[ \t\r\n\f]+/g, ' ')));
    } else if (node.nodeType === 1 && node.tagName === 'A') {
      const a = document.createElement('a');
      a.setAttribute('href', node.getAttribute('href'));
      a.textContent = clean(node.textContent);
      target.appendChild(a);
    } else if (node.nodeType === 1 && /^(STRONG|B|EM|I|SUP|SUB)$/.test(node.tagName)) {
      const el = document.createElement(node.tagName.toLowerCase());
      copyInline(node, el, document);
      target.appendChild(el);
    } else if (node.nodeType === 1 && node.tagName !== 'BR') {
      copyInline(node, target, document);
    }
  });
  // trim leading/trailing whitespace inside the element
  if (target.firstChild && target.firstChild.nodeType === 3) {
    target.firstChild.textContent = target.firstChild.textContent.replace(/^[ \t\r\n\f]+/, '');
  }
  if (target.lastChild && target.lastChild.nodeType === 3) {
    target.lastChild.textContent = target.lastChild.textContent.replace(/[ \t\r\n\f]+$/, '');
  }
  return target;
}

export default function parse(element, { document }) {
  const rt = element.querySelector('.rt-holder') || element;
  // gallery slides (not the thumbnail strip); several slides become a product-gallery block
  const slides = [...element.querySelectorAll('.product-gallery-carousel .slide img')];
  const img = slides[0] || element.querySelector('.lt-holder img');
  const hasButtonRow = !!rt.querySelector(':scope > .twobuttons, :scope > .threebuttons');

  const imageCell = document.createDocumentFragment();
  imageCell.appendChild(document.createComment(' field:image '));
  if (img && slides.length < 2) {
    const image = document.createElement('img');
    image.setAttribute('src', img.getAttribute('src'));
    image.setAttribute('alt', img.getAttribute('alt') || '');
    imageCell.appendChild(image);
  }

  const textCell = document.createDocumentFragment();
  textCell.appendChild(document.createComment(' field:text '));
  [...rt.children].forEach((child) => {
    if (/^H[1-6]$/.test(child.tagName)) {
      textCell.appendChild(copyInline(child, document.createElement(child.tagName.toLowerCase()), document));
    } else if (child.tagName === 'P' && clean(child.textContent)) {
      textCell.appendChild(copyInline(child, document.createElement('p'), document));
    } else if (child.tagName === 'UL' || child.tagName === 'OL') {
      const list = document.createElement(child.tagName.toLowerCase());
      child.querySelectorAll(':scope > li').forEach((li) => {
        list.appendChild(copyInline(li, document.createElement('li'), document));
      });
      textCell.appendChild(list);
    } else if (child.classList.contains('twobuttons') || child.classList.contains('threebuttons')) {
      child.querySelectorAll('a.btn[href]').forEach((btn) => {
        const p = document.createElement('p');
        const wrapper = document.createElement(btn.classList.contains('btn-primary') ? 'strong' : 'em');
        const a = document.createElement('a');
        a.setAttribute('href', anchorFor(btn.getAttribute('href'), document));
        a.textContent = clean(btn.textContent);
        wrapper.appendChild(a);
        p.appendChild(wrapper);
        textCell.appendChild(p);
      });
    } else if (!hasButtonRow && child.tagName === 'DIV' && child.querySelector(':scope > .product-table-link-btn')) {
      // no button row (e.g. Kaluza): the boxed in-page jump link (plain link) and the quote button
      const jump = child.querySelector(':scope > .product-table-link-btn');
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', anchorFor(jump.getAttribute('href'), document));
      a.textContent = clean(jump.textContent);
      p.appendChild(a);
      textCell.appendChild(p);
      child.querySelectorAll(':scope > a.btn-primary[href]').forEach((btn) => {
        const q = document.createElement('p');
        const strong = document.createElement('strong');
        const link = document.createElement('a');
        link.setAttribute('href', btn.getAttribute('href'));
        link.textContent = clean(btn.textContent);
        strong.appendChild(link);
        q.appendChild(strong);
        textCell.appendChild(q);
      });
    }
  });

  const resourcesCell = document.createDocumentFragment();
  resourcesCell.appendChild(document.createComment(' field:resources '));
  const tools = element.querySelector('.resource-tool-table-wrapper');
  if (tools) {
    const label = tools.querySelector('.resource-tool-table-links-heading');
    if (label && clean(label.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(label.textContent);
      resourcesCell.appendChild(p);
    }
    const ul = document.createElement('ul');
    tools.querySelectorAll('.resource-tool-table-links-wrapper a[href]').forEach((link) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.setAttribute('href', link.getAttribute('href'));
      a.textContent = clean(link.textContent);
      li.appendChild(a);
      ul.appendChild(li);
    });
    if (ul.children.length) resourcesCell.appendChild(ul);
  }

  // Cytobank lists space their items 10px apart (inline styles); Kaluza's have no gap
  const items = [...rt.querySelectorAll(':scope > ul > li')];
  const compact = items.length > 1 && !items.some((li) => /margin-bottom/i.test(li.getAttribute('style') || ''));
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'product-hero',
    variants: compact ? ['compact-list'] : [],
    cells: [[imageCell], [textCell], [resourcesCell]],
  });
  if (slides.length < 2) {
    element.replaceWith(block);
    return;
  }

  // XWalk model (blocks/product-gallery/_product-gallery.json), item: image (+ imageAlt)
  const galleryCells = slides.map((slide) => {
    const cell = document.createDocumentFragment();
    cell.appendChild(document.createComment(' field:image '));
    const image = document.createElement('img');
    image.setAttribute('src', slide.getAttribute('src'));
    image.setAttribute('alt', slide.getAttribute('alt') || '');
    cell.appendChild(image);
    return [cell];
  });
  const gallery = WebImporter.Blocks.createBlock(document, { name: 'product-gallery', cells: galleryCells });
  element.replaceWith(block, gallery);
}
