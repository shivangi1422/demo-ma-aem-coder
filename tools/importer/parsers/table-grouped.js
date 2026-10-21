/* eslint-disable */
/* global WebImporter */

/**
 * Parser for table-grouped (block: table-grouped).
 * Source: table inside #main-container div.page-content (beckmancoulter.com
 * solutions pages - "Advancing Diagnostic Biomarkers").
 *
 * xwalk item model `table-grouped-row`: name (richtext), description (richtext).
 * One block row per non-empty source <tr>:
 *  - group label row (single colspan cell): <p><strong>label</strong></p> | (empty)
 *  - data row: name (may hold a link) | description
 * No header row; empty <tr> elements are skipped.
 */

const clean = (str) => (str || '').replace(/\s+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#';

/** rebuild a cell's content as clean paragraphs, keeping links and bold */
function cellContent(td, document, { bold = false } = {}) {
  const blocks = [...td.querySelectorAll(':scope > p, :scope > ul, :scope > ol')];
  const sources = blocks.length ? blocks : [td];
  const out = [];
  sources.forEach((src) => {
    if (!clean(src.textContent)) return;
    if (src.tagName === 'UL' || src.tagName === 'OL') {
      const list = document.createElement(src.tagName.toLowerCase());
      src.querySelectorAll(':scope > li').forEach((li) => {
        const item = document.createElement('li');
        item.textContent = clean(li.textContent);
        list.append(item);
      });
      out.push(list);
      return;
    }
    const p = document.createElement('p');
    const link = src.querySelector('a[href]');
    const text = clean(src.textContent);
    if (link && isUsableHref(link.getAttribute('href')) && clean(link.textContent) === text) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = text;
      p.append(a);
    } else if (link) {
      // mixed text + links: keep inline anchors, strip styling spans
      src.childNodes.forEach((node) => {
        if (node.nodeType === 1 && node.tagName === 'A' && isUsableHref(node.getAttribute('href'))) {
          const a = document.createElement('a');
          a.href = node.getAttribute('href');
          a.textContent = clean(node.textContent);
          p.append(a);
        } else {
          p.append(document.createTextNode(node.textContent.replace(/\s+/g, ' ')));
        }
      });
      p.normalize();
    } else {
      p.textContent = text;
    }
    if (bold || src.querySelector('strong, b')) {
      if (clean(src.querySelector('strong, b') ? src.querySelector('strong, b').textContent : '') === text || bold) {
        const strong = document.createElement('strong');
        while (p.firstChild) strong.append(p.firstChild);
        p.append(strong);
      }
    }
    out.push(p);
  });
  return out;
}

export default function parse(element, { document }) {
  const table = element.tagName === 'TABLE' ? element : element.querySelector('table');
  const cells = [];

  const rows = table ? [...table.querySelectorAll(':scope > tbody > tr, :scope > thead > tr, :scope > tr')] : [];
  rows.forEach((tr) => {
    const tds = [...tr.querySelectorAll(':scope > td, :scope > th')];
    if (!tds.length || !clean(tr.textContent)) return;

    const isGroup = tds.length === 1 || tds.slice(1).every((td) => !clean(td.textContent));
    if (isGroup) {
      const name = cellContent(tds[0], document, { bold: true });
      cells.push([[document.createComment(' field:name '), ...name], '']);
      return;
    }

    const name = cellContent(tds[0], document);
    const desc = cellContent(tds[1], document);
    cells.push([
      name.length ? [document.createComment(' field:name '), ...name] : '',
      desc.length ? [document.createComment(' field:description '), ...desc] : '',
    ]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-grouped', cells });
  element.replaceWith(block);
}
