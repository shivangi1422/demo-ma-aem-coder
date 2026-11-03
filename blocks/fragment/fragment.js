/*
 * Fragment Block
 * Include content on a page as a fragment.
 * https://www.aem.live/developer/block-collection/fragment
 */

// eslint-disable-next-line import/no-cycle
import {
  decorateMain,
} from '../../scripts/scripts.js';

import {
  loadSections,
} from '../../scripts/aem.js';

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {HTMLElement} The root element of the fragment
 */
export async function loadFragment(path) {
  if (path && path.startsWith('/') && !path.startsWith('//')) {
    // eslint-disable-next-line no-param-reassign
    path = path.replace(/(\.plain)?\.html/, '');
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
      // parse inertly so relative images are not requested against the page path first
      const parsed = new DOMParser().parseFromString(`<main>${await resp.text()}</main>`, 'text/html');

      // reset base path for media to fragment base
      const base = new URL(path, window.location);
      const resetAttributeBase = (tag, attr) => {
        parsed.querySelectorAll(`${tag}[${attr}]`).forEach((elem) => {
          const value = elem.getAttribute(attr);
          if (!/^([a-z]+:|\/|#)/i.test(value)) elem.setAttribute(attr, new URL(value, base).href);
        });
      };
      resetAttributeBase('img', 'src');
      resetAttributeBase('source', 'srcset');

      const main = document.adoptNode(parsed.querySelector('main'));

      decorateMain(main);
      await loadSections(main);
      return main;
    }
  }
  return null;
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  const fragment = await loadFragment(path);
  if (fragment) block.replaceChildren(...fragment.childNodes);
}
