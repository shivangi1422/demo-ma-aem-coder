/* eslint-disable */
/* global WebImporter */

/**
 * Parser for resource-list (Resource List block, key/value settings): the
 * "Content and Resources" widget, fetched from the Sitecore resource controller.
 * Source: https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise
 * Selector: #multiselect__container
 * Model: resource-list (key-value block; one row per setting).
 * Settings come from the page: filter options = the Resource Type checkboxes
 * (label = value GUID list), data source id = the widget's init script (copied to
 * data-excat-datasource-id by the import script's onLoad, as html2md drops scripts).
 * The server-rendered first page and pager are data, not content: the cleanup
 * transformer removes them.
 */

const norm = (s) => (s || '').replace(/[\s ]+/g, ' ').trim();

function scriptValue(document, key) {
  const text = Array.from(document.querySelectorAll('script')).map((s) => s.textContent).join('\n');
  const m = text.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`));
  return m ? m[1] : '';
}

// saved copy of the real API responses (tools/fallback-data/build-fallback-data.mjs),
// used by the block only when the live API is unreachable
function fallbackPath(params, file) {
  try {
    const pagePath = new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html?$/, '');
    return `/fallback-data${pagePath}/${file}`;
  } catch (e) {
    return '';
  }
}

export default function parse(element, { document, params }) {
  const options = Array.from(element.querySelectorAll('.multiselect-checkbox-label-wrapper')).map((w) => {
    const input = w.querySelector('input');
    const label = w.querySelector('label');
    return input && label ? `${norm(label.textContent)} = ${input.getAttribute('value')}` : '';
  }).filter(Boolean);
  const heading = element.querySelector('.ms-filter-heading');
  const dropdown = element.querySelector('.resource-type-dropdown-heading');
  const done = element.querySelector('.multiselect-checkbox-done-wrapper');

  const cells = [
    ['endpoint', ''],
    ['dataSourceId', element.getAttribute('data-excat-datasource-id') || scriptValue(document, 'dataSourceId')],
    ['filterOptions', options.join('; ')],
    ['filterByLabel', heading ? norm(heading.textContent) : scriptValue(document, 'filterByText')],
    ['dropdownLabel', dropdown ? norm(dropdown.textContent) : scriptValue(document, 'defaultText')],
    ['doneLabel', done ? norm(done.textContent) : 'Done'],
    ['noMatchingMessage', scriptValue(document, 'noMatching') || 'No matching records found'],
    ['fallbackData', fallbackPath(params, 'resources.json')],
  ];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Resource List', cells });
  element.replaceWith(block);
}
