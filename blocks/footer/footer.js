import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  // default to a "footer" fragment in the current content directory, falling
  // back to the site-root "/footer" when the page lives at the root
  const dir = window.location.pathname.replace(/[^/]+$/, '');
  const defaultPath = dir && dir !== '/' ? `${dir}footer` : '/footer';
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : defaultPath;
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
