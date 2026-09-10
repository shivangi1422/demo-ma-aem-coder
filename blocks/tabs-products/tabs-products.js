import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the tabs-products block.
 * Authored structure: one row per tab panel. Each row has:
 *   cell 0: the tab label (plain text)
 *   cell 1: the panel text content (eyebrow, title, description, bullet list, CTA)
 *   cell 2: the panel image
 * A tab bar is generated from the labels; clicking a tab shows its panel.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];

  // Adopt a section heading that sits just before the block (emitted as default
  // content by the importer) so it renders INSIDE the block and shares its
  // padding/alignment instead of sitting flush at the section edge.
  let heading = null;
  const prev = block.parentElement?.previousElementSibling;
  const prevHeading = prev && (prev.matches?.('h1, h2, h3') ? prev : prev.querySelector?.('h1, h2, h3'));
  const ownWrapper = block.closest('.tabs-products-wrapper');
  const wrapperPrevHeading = ownWrapper?.previousElementSibling?.matches?.('h1, h2, h3')
    ? ownWrapper.previousElementSibling : null;
  const src = wrapperPrevHeading || prevHeading;
  if (src && src.textContent.trim()) {
    heading = document.createElement('h2');
    heading.className = 'tabs-products-heading';
    heading.textContent = src.textContent.trim();
    src.remove();
  }

  const tabbar = document.createElement('div');
  tabbar.className = 'tabs-products-tabbar';
  tabbar.setAttribute('role', 'tablist');

  const panels = document.createElement('div');
  panels.className = 'tabs-products-panels';

  // A tab label ending in "*" marks the default-active tab; falls back to the first.
  const activeIndex = Math.max(0, rows.findIndex((row) => {
    const t = (row.children[0]?.textContent || '').trim();
    return t.endsWith('*');
  }));

  rows.forEach((row, i) => {
    const cells = [...row.children];
    const labelCell = cells[0];
    const imageCell = cells.find((c) => c.querySelector('picture'));
    const textCell = cells.find((c) => c !== labelCell && c !== imageCell);

    const label = (labelCell?.textContent || `Tab ${i + 1}`).trim().replace(/\s*\*$/, '');

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-products-tab';
    tab.setAttribute('role', 'tab');
    tab.textContent = label;
    if (i === activeIndex) tab.classList.add('is-active');

    const panel = document.createElement('div');
    panel.className = 'tabs-products-panel';
    if (i === activeIndex) panel.classList.add('is-active');
    moveInstrumentation(row, panel);

    const textCol = document.createElement('div');
    textCol.className = 'tabs-products-text';
    if (textCell) while (textCell.firstChild) textCol.append(textCell.firstChild);

    // Regroup a flat resource list (eyebrow <p> + <h4> + link <p>, repeated)
    // into separated resource items. Each <h4> begins an item; a preceding <p>
    // (with no anchor) is its eyebrow tag. Only runs when the panel is a list of
    // h4 resources (e.g. "Articles and Stories"), not a normal product panel.
    const headings = [...textCol.children].filter((el) => el.tagName === 'H4');
    if (headings.length > 1) {
      const nodes = [...textCol.children];
      const items = [];
      let current = null;
      nodes.forEach((el) => {
        const isEyebrow = el.tagName === 'P' && !el.querySelector('a');
        // A new resource starts at its eyebrow <p>, or at an <h4> if the item
        // has no eyebrow. The title/link then append to the current item.
        const startsItem = isEyebrow || (el.tagName === 'H4' && (!current || current.querySelector('h4')));
        if (startsItem) {
          current = document.createElement('div');
          current.className = 'tabs-products-resource';
          items.push(current);
        }
        if (isEyebrow) el.classList.add('tabs-products-eyebrow');
        (current || textCol).append(el);
      });
      textCol.append(...items);
    }

    panel.append(textCol);

    if (imageCell) {
      const imgWrap = document.createElement('div');
      imgWrap.className = 'tabs-products-image';
      const img = imageCell.querySelector('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, img.alt, i === 0, [{ width: '1000' }]);
        moveInstrumentation(img, optimized.querySelector('img'));
        imgWrap.append(optimized);
      }
      panel.append(imgWrap);
    }

    tab.addEventListener('click', () => {
      tabbar.querySelectorAll('.tabs-products-tab').forEach((t, ti) => t.classList.toggle('is-active', ti === i));
      panels.querySelectorAll('.tabs-products-panel').forEach((p, pi) => p.classList.toggle('is-active', pi === i));
    });

    tabbar.append(tab);
    panels.append(panel);
  });

  if (heading) {
    block.replaceChildren(heading, tabbar, panels);
  } else {
    block.replaceChildren(tabbar, panels);
  }
}
