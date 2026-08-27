import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Standalone navigation block (Beckman Coulter).
 * Expected initial structure — three rows:
 *   row 1: brand (logo text or image + link)
 *   row 2: nav links (a list; nested lists become dropdowns)
 *   row 3: tools (search icon, Contact Us CTA)
 *
 * Renders a responsive bar with a hamburger toggle on mobile.
 */
export default function decorate(block) {
  // each row wraps its content in a single cell <div>; unwrap it
  const unwrap = (row) => {
    if (row && row.children.length === 1 && row.firstElementChild.tagName === 'DIV') {
      return row.firstElementChild;
    }
    return row;
  };

  const rows = [...block.children];
  const [brandRow, sectionsRow, toolsRow] = rows.map(unwrap);

  const nav = document.createElement('nav');
  nav.className = 'navigation-nav';
  nav.setAttribute('aria-expanded', 'false');

  // hamburger (mobile)
  const hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.className = 'navigation-hamburger';
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.setAttribute('aria-controls', 'navigation-sections');
  hamburger.innerHTML = '<span class="navigation-hamburger-icon"></span>';

  const brand = document.createElement('div');
  brand.className = 'navigation-brand';
  if (brandRow) {
    moveInstrumentation(brandRow, brand);
    while (brandRow.firstChild) brand.append(brandRow.firstChild);
  }

  const sections = document.createElement('div');
  sections.className = 'navigation-sections';
  sections.id = 'navigation-sections';
  if (sectionsRow) {
    moveInstrumentation(sectionsRow, sections);
    while (sectionsRow.firstChild) sections.append(sectionsRow.firstChild);
  }

  // mark list items that contain a nested list as dropdowns
  sections.querySelectorAll(':scope ul > li').forEach((li) => {
    if (li.querySelector('ul')) li.classList.add('navigation-drop');
  });

  const tools = document.createElement('div');
  tools.className = 'navigation-tools';
  if (toolsRow) {
    moveInstrumentation(toolsRow, tools);
    while (toolsRow.firstChild) tools.append(toolsRow.firstChild);
  }

  hamburger.addEventListener('click', () => {
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    hamburger.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  });

  nav.append(hamburger, brand, sections, tools);
  block.replaceChildren(nav);
}
