/* eslint-disable */
/* global WebImporter */

/**
 * Parser for technical-documents.
 * Source: https://www.mybeckman.in/flow-cytometry/software/kaluza-c
 * Selector: #techdocs-wrapper #coveo-center-column (left as a placeholder by the cleanup
 * transformer, which drops the live search widget inside it)
 * The live table is filled at runtime from the site's search service, so the documents come
 * from the capture in ../data/technical-documents.js (keyed by page path). Pages without a
 * capture get no block, keeping only the "Didn't find … click here." line.
 *
 * XWalk model (blocks/technical-documents/_technical-documents.json), item technical-document:
 *   link (+ linkText) | category (document type) | docId | details (list of "Lot Number(s): …",
 *   "Language: …"); the type field is "category" because md2jcr treats a "…Type" name as a suffix field
 */
import captured from '../data/technical-documents.js';

export default function parse(element, { document, params }) {
  const path = new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html?$/, '');
  const items = (captured[path] && captured[path].items) || [];
  if (!items.length) {
    element.remove();
    return;
  }

  const cells = items.map((item) => {
    const linkCell = document.createDocumentFragment();
    linkCell.appendChild(document.createComment(' field:link '));
    const p = document.createElement('p');
    if (item.href) {
      const a = document.createElement('a');
      a.setAttribute('href', item.href);
      a.textContent = item.title;
      p.appendChild(a);
    } else {
      p.textContent = item.title;
    }
    linkCell.appendChild(p);

    const typeCell = document.createDocumentFragment();
    typeCell.appendChild(document.createComment(' field:category '));
    typeCell.appendChild(document.createTextNode(item.type || ''));

    const idCell = document.createDocumentFragment();
    idCell.appendChild(document.createComment(' field:docId '));
    idCell.appendChild(document.createTextNode(item.docId || ''));

    const detailsCell = document.createDocumentFragment();
    detailsCell.appendChild(document.createComment(' field:details '));
    const lines = [];
    if (item.lots && item.lots.length) lines.push(`Lot Number(s): ${item.lots.join(', ')}`);
    if (item.languages && item.languages.length) lines.push(`Language: ${item.languages.join(', ')}`);
    if (lines.length) {
      const ul = document.createElement('ul');
      lines.forEach((line) => {
        const li = document.createElement('li');
        li.textContent = line;
        ul.appendChild(li);
      });
      detailsCell.appendChild(ul);
    }
    return [linkCell, typeCell, idCell, detailsCell];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'technical-documents', cells });
  element.replaceWith(block);
}
