/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion-toggle-open-mb (block: accordion-toggle, Style option: open).
 * Source: protein-production FAQ - a run of sibling div.bcls-aeo-faq (2):
 *   div.bcls-aeo-faq > h6 (question) + answer p / ul (em, sup kept; empty <p></p>
 *   spacers dropped). The instance is the first of the run (X:not(X + X)); the
 *   following sibling div.bcls-aeo-faq elements are taken in and removed. The
 *   H2 "FAQ on Protein Production ..." (div.bcls-aeo-faqs > h2) stays default content.
 *
 * Library convention (Accordion): one row per item, title | content.
 * xwalk: container model `accordion-toggle` (classes: open); item model
 * `accordion-toggle-item`: title (text), content (richtext).
 *
 * Rows: <!-- field:title --> question (plain) | <!-- field:content --> answer (rich text)
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

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
    if (/^(SCRIPT|STYLE|IMG|SVG|IFRAME)$/.test(tag) || !clean(node.textContent)) return;
    if (tag === 'A' && isUsableHref(node.getAttribute('href'))) {
      const a = document.createElement('a');
      a.href = node.getAttribute('href').trim();
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

function answerNodes(faq, question, document) {
  const out = [];
  [...faq.children].forEach((child) => {
    if (child === question) return;
    const tag = child.tagName;
    if (tag === 'UL' || tag === 'OL') {
      const list = document.createElement(tag.toLowerCase());
      child.querySelectorAll(':scope > li').forEach((li) => {
        const item = document.createElement('li');
        copyInline(li, item, document);
        if (tidy(item)) list.append(item);
      });
      if (list.children.length) out.push(list);
      return;
    }
    if (!clean(child.textContent)) return; // empty <p></p> spacers
    const p = document.createElement('p');
    copyInline(child, p, document);
    if (tidy(p)) out.push(p);
  });
  return out;
}

export default function parse(element, { document }) {
  const roots = [element];
  let next = element.nextElementSibling;
  while (next && matchesSafe(next, 'div.bcls-aeo-faq')) {
    roots.push(next);
    next = next.nextElementSibling;
  }

  const cells = [];
  roots.forEach((faq) => {
    const question = faq.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6')
      || faq.querySelector('h1, h2, h3, h4, h5, h6');
    const title = clean(question && question.textContent);
    const answer = answerNodes(faq, question, document);
    if (!title && !answer.length) return;
    cells.push([
      title ? [document.createComment(' field:title '), document.createTextNode(title)] : '',
      answer.length ? [document.createComment(' field:content '), ...answer] : '',
    ]);
  });

  roots.slice(1).forEach((root) => root.remove());

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-toggle (open)', cells });
  element.replaceWith(block);
}
