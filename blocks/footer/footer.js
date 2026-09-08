import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Explicitly tag structural pieces so styling does not depend on the exact
  // section-wrapper nesting, which differs between EDS preview and AEM author.
  // The columns row is the div whose direct children are the branding + link
  // columns (>= 3 child divs). Tagging it directly makes the grid layout apply
  // in both environments.
  const candidates = [...footer.querySelectorAll('div')];
  const columnsRow = candidates.find((el) => {
    const childDivs = [...el.children].filter((c) => c.tagName === 'DIV');
    return childDivs.length >= 3
      && childDivs.some((c) => c.querySelector('ul'));
  });
  if (columnsRow) {
    columnsRow.classList.add('footer-columns');
    [...columnsRow.children].forEach((col, i) => {
      col.classList.add('footer-col');
      if (i === 0) col.classList.add('footer-branding');
    });
  }

  // The copyright is a paragraph with no link list, in its own section.
  const copyright = [...footer.querySelectorAll('p')]
    .find((p) => /rights reserved/i.test(p.textContent));
  if (copyright) copyright.closest('div')?.classList.add('footer-bottom');

  block.append(footer);
}
