/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-blog. Base block: cards.
 * Source: https://www.beckmancoulter.com/en/blog/diagnostics/the-value-of-mpv-in-hematology
 * Container block: N rows, each row = 2 cells (image | text richtext). Empty cells still included.
 * card model (blocks/cards-blog/_cards-blog.json): image [reference], imageAlt [collapsed -> img alt], text [richtext].
 * 'Related Articles' H3 subtitle is section default content (handled elsewhere), not part of the block.
 */
export default function parse(element, { document }) {
  const cardEls = Array.from(element.querySelectorAll('.blog-card'));

  if (cardEls.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  cardEls.forEach((card) => {
    // Cell 1: image (field:image). imageAlt collapses into <img alt>. Include cell even if empty.
    const img = card.querySelector('.card-image img, img');
    const imageCell = [document.createComment(' field:image ')];
    if (img) imageCell.push(img);

    // Cell 2: text richtext (field:text): title + byline + summary + CTA
    const textCell = [document.createComment(' field:text ')];

    const title = card.querySelector('.card-title, h2, h3');
    if (title && title.textContent.trim()) {
      const h = document.createElement('h3');
      h.textContent = title.textContent.trim();
      textCell.push(h);
    }

    const author = card.querySelector('.card-author');
    const date = card.querySelector('.card-date');
    const readtime = card.querySelector('.card-readtime');
    const bylineParts = [];
    if (author) bylineParts.push(author.textContent.trim());
    if (date) bylineParts.push(date.textContent.trim());
    if (readtime) bylineParts.push(readtime.textContent.trim());
    const byline = bylineParts.filter(Boolean).join(' | ');
    if (byline) {
      const p = document.createElement('p');
      p.textContent = byline;
      textCell.push(p);
    }

    const summary = card.querySelector('.card-summary');
    if (summary && summary.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = summary.textContent.trim();
      textCell.push(p);
    }

    const cta = card.querySelector('.card-link a, a.btn-cta, a.button');
    if (cta) {
      const p = document.createElement('p');
      p.appendChild(cta);
      textCell.push(p);
    }

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-blog', cells });

  // Preserve the section subtitle ("Related Articles") as default content before the block.
  const subtitle = element.querySelector('.blog-post-subtitle h1, .blog-post-subtitle h2, .blog-post-subtitle h3, .blog-post-subtitle h4');
  const nodes = [];
  if (subtitle && subtitle.textContent.trim()) {
    const h = document.createElement('h3');
    h.textContent = subtitle.textContent.trim();
    nodes.push(h);
  }
  nodes.push(block);

  element.replaceWith(...nodes);
}
