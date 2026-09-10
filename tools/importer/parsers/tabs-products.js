/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: tabs-products
 * Base block: tabs-products (container)
 * Source: https://www.beckmancoulter.com/en/products/dxs-service-and-supports
 *   Section: "Articles and Stories" — an education filter carousel with a filter
 *   bar (tabs) and resource cards tagged by category (`.item.Blogs` etc.).
 *
 * Model (blocks/tabs-products/_tabs-products.json) + block JS (tabs-products.js):
 *   container tabs-products: (no fields)
 *   item tabs-products-item: label (text), text (richtext), image (reference), imageAlt (collapsed)
 * Block JS reads THREE cells per tab row: [label, panel text, panel image].
 *
 * Mapping: one tab per filter-bar CATEGORY. Each category's per-card grid is
 * collapsed into that tab's richtext panel (title + read link per resource).
 * The first available image for a category goes in the panel image cell.
 */
export default function parse(element, { document }) {
  const isPlaceholder = (t) => !t || /^\s*(empty heading)?\s*$/i.test(t);

  // Section heading ("Articles and Stories") — the block has no heading field,
  // so emit it as default content before the block.
  const sectionHeading = element.querySelector('.carousel-heading, :scope > h1, :scope > h2');
  let headingClone = null;
  if (sectionHeading && !isPlaceholder(sectionHeading.textContent)) {
    headingClone = document.createElement('h2');
    headingClone.textContent = sectionHeading.textContent.trim();
  }

  // Tab labels from the filter bar; fall back to the categories on the cards.
  let labels = Array.from(element.querySelectorAll('.owl-filter-bar .filter-button, .filter-header .filter-button'))
    .map((a) => a.textContent.trim())
    .filter((t) => t.length > 0);
  if (labels.length === 0) {
    labels = [...new Set(Array.from(element.querySelectorAll('.item'))
      .map((c) => {
        const cat = Array.from(c.classList).find((cl) => cl !== 'item');
        return cat || (c.querySelector('.subheading') ? c.querySelector('.subheading').textContent.trim() : '');
      })
      .filter(Boolean))];
  }
  if (labels.length === 0) labels = ['Articles'];

  const cells = [];

  labels.forEach((label) => {
    const cat = label.replace(/\s+/g, '');
    let cards = Array.from(element.querySelectorAll(`.item.${cat}`));
    if (cards.length === 0) {
      cards = Array.from(element.querySelectorAll('.owl-item .item, .item')).filter((c) => {
        const sh = c.querySelector('.subheading');
        return sh && sh.textContent.trim().toLowerCase() === label.toLowerCase();
      });
    }

    // --- label cell (field:label) ---
    const labelFrag = document.createDocumentFragment();
    labelFrag.appendChild(document.createComment(' field:label '));
    labelFrag.appendChild(document.createTextNode(label));

    // --- panel text cell (field:text): one entry per card. Each card becomes a
    // wrapped item (eyebrow tag + title + read link) so the block can style and
    // separate individual resources. ---
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    // Emit each card as a flat eyebrow(p) + title(h4) + link(p) sequence. The
    // importer strips wrapper <div>s when converting cells to markdown, so the
    // block's decorate JS regroups these triplets into styled resource items.
    cards.forEach((card) => {
      // Category eyebrow (e.g. "Blogs") from the card's subheading, else the tab.
      const sub = card.querySelector('.subheading');
      const eyebrow = (sub && sub.textContent.trim()) || label;
      // Title is nested <h3><h4>Title</h4></h3>; take the first heading WITH text.
      const title = Array.from(card.querySelectorAll('h2, h3, h4, h5'))
        .find((el) => el.textContent && el.textContent.trim() && !isPlaceholder(el.textContent));
      const link = card.querySelector('.item-action a, a.button, a[href]');

      if (eyebrow) {
        const e = document.createElement('p');
        e.textContent = eyebrow;
        textFrag.appendChild(e);
      }
      if (title) {
        const h = document.createElement('h4');
        h.textContent = title.textContent.trim();
        textFrag.appendChild(h);
      }
      if (link && (link.getAttribute('href') || '').trim()) {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.setAttribute('href', link.getAttribute('href'));
        a.textContent = link.textContent.trim() || 'Read more';
        p.appendChild(a);
        textFrag.appendChild(p);
      }
    });

    // --- panel image cell (field:image): first non-data image for the category ---
    const imageFrag = document.createDocumentFragment();
    const img = cards
      .map((c) => c.querySelector('img'))
      .find((i) => i && !(i.getAttribute('src') || '').startsWith('data:'));
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img);
    }

    cells.push([labelFrag, textFrag, imageFrag]);
  });

  // Empty-block guard: no tabs/resources found -> unwrap.
  const hasContent = cells.some((row) => row[1] && row[1].childNodes.length > 1);
  if (!hasContent) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-products', cells });
  if (headingClone) {
    element.replaceWith(headingClone, block);
  } else {
    element.replaceWith(block);
  }
}
