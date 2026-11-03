/* eslint-disable */
/* global WebImporter */

/**
 * Parser for product-table.
 * Source: https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise
 * Selector: .product-spotlight-wrapper .CoveoSearchInterface:has(.product-table)
 * The live table is filled at runtime from the site's search service (results, facet
 * values and counts), which the import browser usually can't reach, and the rendered
 * cards don't carry their facet values anyway. So the products come from the capture
 * in ../data/product-tables.js (keyed by page path); when a page has no capture, any
 * cards rendered in the DOM are used without filter values.
 *
 * XWalk model (blocks/product-table/_product-table.json), item product-table-item:
 *   image (+ imageAlt) | text (linked name heading + product number) | filters (list of
 *   "Filter: Value") | quoteLink (+ quoteLinkText)
 */
import captured from '../data/product-tables.js';

const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();

function fromDom(element) {
  return [...element.querySelectorAll('.CoveoResult .product-card')].map((card) => {
    const img = card.querySelector('img');
    const title = card.querySelector('.product-card__title a, .product-card__title');
    const quote = card.querySelector('.add-to-quote-link, .product-card__footer a');
    return {
      number: clean(card.querySelector('.product-card__number')?.textContent).replace(/^Product No:\s*/, ''),
      title: clean(title?.textContent),
      href: title?.getAttribute('href') || null,
      image: img?.getAttribute('src'),
      alt: img?.getAttribute('alt') || '',
      quote: quote?.getAttribute('href') || null,
      filters: [],
    };
  });
}

export default function parse(element, { document, params }) {
  const path = new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html?$/, '');
  const items = (captured[path] && captured[path].items) || fromDom(element);
  if (!items.length) {
    element.remove();
    return;
  }

  const cells = items.map((item) => {
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    if (item.image) {
      const img = document.createElement('img');
      img.setAttribute('src', item.image);
      img.setAttribute('alt', item.alt || '');
      imageCell.appendChild(img);
    }

    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    const h3 = document.createElement('h3');
    if (item.href) {
      const a = document.createElement('a');
      a.setAttribute('href', item.href);
      a.textContent = item.title;
      h3.appendChild(a);
    } else {
      h3.textContent = item.title;
    }
    textCell.appendChild(h3);
    if (item.number) {
      const p = document.createElement('p');
      p.textContent = `Product No: ${item.number}`;
      textCell.appendChild(p);
    }

    const filtersCell = document.createDocumentFragment();
    filtersCell.appendChild(document.createComment(' field:filters '));
    if (item.filters.length) {
      const ul = document.createElement('ul');
      item.filters.forEach(([name, value]) => {
        const li = document.createElement('li');
        li.textContent = `${name}: ${value}`;
        ul.appendChild(li);
      });
      filtersCell.appendChild(ul);
    }

    const quoteCell = document.createDocumentFragment();
    quoteCell.appendChild(document.createComment(' field:quoteLink '));
    if (item.quote) {
      const a = document.createElement('a');
      a.setAttribute('href', item.quote);
      a.textContent = 'Add to Quote';
      quoteCell.appendChild(a);
    }
    return [imageCell, textCell, filtersCell, quoteCell];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'product-table', cells });
  // The section heading: Cytobank pages show a separate heading above the widget (the
  // widget's own header is a hidden duplicate); Kaluza shows only the widget's header.
  const separate = document.querySelector('div.product-page-sub-heading-wrapper#product-table-wrapper');
  const inner = element.querySelector('.product-table__header h3');
  if (!separate && inner && clean(inner.textContent)) {
    const h3 = document.createElement('h3');
    h3.textContent = clean(inner.textContent);
    element.replaceWith(h3, block);
  } else {
    element.replaceWith(block);
  }
}
