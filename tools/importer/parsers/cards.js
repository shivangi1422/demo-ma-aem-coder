/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards (boilerplate cards; xwalk items: card: image, text) — cards convention:
 * one row per card, first cell image (kept empty when the card has none), second cell rich text.
 * Sources:
 *  - .panel-wrapper (support link panels): .panel > a > img + .panel-content (a > h4 title, text);
 *    the panels of directly following .row > .panel-wrapper lists join the same block;
 *    empty .panel-noborder fillers are dropped
 *  - .cards (screenshot cards, variant grey): .card-container > img + .card-content (caption)
 *  - .content-list (link list, variant list): table > tr.content-list-item > .news-list
 *    (.image-wrap > a > img, .description-wrap: a > h3 title, .para-text > a.read-more text)
 * Output: [<!-- field:image --><img>] [<!-- field:text --><h4><a>title</a></h4><p>…</p>]
 */
function imageCell(document, card) {
  const cell = document.createDocumentFragment();
  const srcImg = card.querySelector('img');
  if (srcImg && srcImg.getAttribute('src')) {
    const img = document.createElement('img');
    img.src = srcImg.getAttribute('src');
    img.alt = srcImg.getAttribute('alt') || '';
    cell.appendChild(document.createComment(' field:image '));
    cell.appendChild(img);
    const link = srcImg.closest('a');
    (link && !link.textContent.trim() ? link : srcImg).remove();
  }
  return cell;
}

function textCell(document, content) {
  const cell = document.createDocumentFragment();
  if (!content) return cell;
  // a > h4 (link around the title) -> h4 > a
  content.querySelectorAll('a > h1, a > h2, a > h3, a > h4, a > h5').forEach((h) => {
    const a = h.parentElement;
    const link = document.createElement('a');
    link.href = a.getAttribute('href') || '';
    link.append(...h.childNodes);
    h.append(link);
    a.replaceWith(h);
  });
  const nodes = [];
  let run = null;
  [...content.childNodes].forEach((n) => {
    if (n.nodeType === 1 && /^(H[1-6]|P|UL|OL)$/.test(n.tagName)) { run = null; nodes.push(n); return; }
    if (n.nodeType === 3 && !n.textContent.trim()) return;
    if (n.nodeType !== 1 && n.nodeType !== 3) return;
    if (!run) { run = document.createElement('p'); nodes.push(run); }
    run.append(n);
  });
  if (nodes.length) {
    cell.appendChild(document.createComment(' field:text '));
    nodes.forEach((n) => cell.appendChild(n));
  }
  return cell;
}

export default function parse(element, { document }) {
  if (element.classList.contains('panel-wrapper')) {
    const wrappers = [element];
    let row = element.parentElement && element.parentElement.classList.contains('row') ? element.parentElement : null;
    while (row && row.nextElementSibling && row.nextElementSibling.matches('.row') && row.nextElementSibling.querySelector(':scope > .panel-wrapper')) {
      row = row.nextElementSibling;
      wrappers.push(row.querySelector(':scope > .panel-wrapper'));
    }
    const panels = wrappers.flatMap((w) => [...w.children])
      .filter((p) => p.classList.contains('panel') && p.textContent.trim());
    const cells = panels.map((panel) => [imageCell(document, panel), textCell(document, panel.querySelector('.panel-content'))]);
    if (!cells.length) { element.remove(); return; }
    const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
    element.replaceWith(block);
    wrappers.slice(1).forEach((w) => (w.closest('.row') || w).remove());
    return;
  }

  if (element.classList.contains('content-list')) {
    const items = [...element.querySelectorAll('.content-list-item .news-list')];
    if (!items.length) return;
    const cells = items.map((item) => {
      const desc = item.querySelector('.description-wrap') || item;
      const text = document.createElement('div');
      const title = desc.querySelector('h1, h2, h3, h4');
      if (title) {
        const a = title.closest('a');
        const h = document.createElement('h3');
        if (a && a.getAttribute('href')) {
          const link = document.createElement('a');
          link.href = a.getAttribute('href');
          link.textContent = title.textContent.trim();
          h.append(link);
        } else h.textContent = title.textContent.trim();
        text.append(h);
      }
      desc.querySelectorAll('.para-text').forEach((para) => {
        const p = document.createElement('p');
        p.append(...para.childNodes);
        text.append(p);
      });
      return [imageCell(document, item), textCell(document, text)];
    });
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'Cards (list)', cells }));
    return;
  }

  // .cards > .card-container screenshot cards
  const cards = [...element.children].filter((c) => c.classList.contains('card-container'));
  if (!cards.length) return;
  const cells = cards.map((card) => [imageCell(document, card), textCell(document, card.querySelector('.card-content'))]);
  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (grey)', cells });
  element.replaceWith(block);
}
