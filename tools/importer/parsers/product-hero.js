/* eslint-disable */
/* global WebImporter */

/**
 * Parser for product-hero.
 * Source: https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise
 * Selector: .product-spotlight-wrapper .product-intro-wrapper
 *   image     -> .lt-holder .product-gallery-carousel img (first slide)
 *   text      -> .rt-holder h1, p, ul + .twobuttons links
 *                (btn-default -> italic link = outline button, btn-primary -> bold link = solid button)
 *   resources -> .resource-tool-table-wrapper (label + links)
 *
 * XWalk model (blocks/product-hero/_product-hero.json): image (+ imageAlt) | text | resources
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
  const img = element.querySelector('.lt-holder img, .product-gallery-carousel img');

  const imageCell = document.createDocumentFragment();
  imageCell.appendChild(document.createComment(' field:image '));
  if (img) {
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
    } else if (child.classList.contains('twobuttons')) {
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

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'product-hero',
    cells: [[imageCell], [textCell], [resourcesCell]],
  });
  element.replaceWith(block);
}
