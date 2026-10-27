/* eslint-disable */
/* global WebImporter */

/**
 * Parser for content-reversed (block: content-reversed, image left / text right).
 * Source: div.adjustable-two-column-display (beckmancoulter.com dxs-service-and-supports pages).
 *
 * xwalk model `content-reversed`: image (reference, imageAlt collapsed), text (richtext).
 * Row 1: image (.adjustable-two-column-display-image img)
 * Row 2: <p>eyebrow (h2 span.label)</p> <h2>title</h2> paragraphs/lists <p><a>CTA</a></p>
 */

const clean = (str) => (str || '').replace(/\s+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

export default function parse(element, { document }) {
  const cells = [];
  const imageSeg = element.querySelector('.adjustable-two-column-display-image');
  const textSeg = element.querySelector('.adjustable-two-column-display-content') || element;

  // ---- row 1: image -------------------------------------------------------
  const srcImg = (imageSeg || element).querySelector('img[src]');
  if (srcImg) {
    const img = document.createElement('img');
    img.src = srcImg.getAttribute('src');
    img.alt = clean(srcImg.getAttribute('alt'));
    cells.push([[document.createComment(' field:image '), img]]);
  } else {
    cells.push(['']);
  }

  // ---- row 2: text --------------------------------------------------------
  const textCell = [];
  textSeg.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, a.button').forEach((el) => {
    if (imageSeg && imageSeg.contains(el)) return;
    const tag = el.tagName;
    if (/^H[1-6]$/.test(tag)) {
      const labels = [...el.querySelectorAll('.label')].map((l) => clean(l.textContent)).filter(Boolean);
      if (labels.length) {
        const eyebrow = document.createElement('p');
        eyebrow.textContent = labels.join(' ');
        textCell.push(eyebrow);
      }
      const clone = el.cloneNode(true);
      clone.querySelectorAll('.label').forEach((l) => l.remove());
      const text = clean(clone.textContent);
      if (!text || /^empty heading$/i.test(text)) return;
      const h = document.createElement(tag === 'H1' ? 'h2' : tag.toLowerCase());
      h.textContent = text;
      textCell.push(h);
      return;
    }
    if (tag === 'UL' || tag === 'OL') {
      if (el.parentElement.closest('ul, ol')) return;
      const list = document.createElement(tag.toLowerCase());
      el.querySelectorAll(':scope > li').forEach((li) => {
        const text = clean(li.textContent);
        if (!text) return;
        const item = document.createElement('li');
        item.textContent = text;
        list.append(item);
      });
      if (list.children.length) textCell.push(list);
      return;
    }
    if (tag === 'A') {
      if (el.closest('p')) return; // handled with its paragraph
      const text = clean(el.textContent);
      if (!text) return;
      const p = document.createElement('p');
      const href = el.getAttribute('href');
      if (isUsableHref(href)) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = text;
        p.append(a);
      } else {
        p.textContent = text;
      }
      textCell.push(p);
      return;
    }
    // paragraph
    if (el.closest('li')) return;
    const text = clean(el.textContent);
    if (!text) return;
    const p = document.createElement('p');
    const link = el.querySelector('a');
    if (link && clean(link.textContent) === text && isUsableHref(link.getAttribute('href'))) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = text;
      p.append(a);
    } else {
      p.textContent = text;
    }
    textCell.push(p);
  });

  if (textCell.length) {
    textCell.unshift(document.createComment(' field:text '));
    cells.push([textCell]);
  } else {
    cells.push(['']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'content-reversed', cells });
  element.replaceWith(block);
}
