/* eslint-disable */
/* global WebImporter */
/**
 * Parser for blog-tags. Base block: blog-tags (named block/v1/block).
 * Source: https://www.beckmancoulter.com/en/blog/diagnostics/the-value-of-mpv-in-hematology
 * Model (blocks/blog-tags/_blog-tags.json): text [richtext] — the tag links.
 * Named-block structure: one row, one text cell (field:text) holding the tag link(s).
 * Content: horizontal strip of blog category/tag links. Tag icon and share widget are chrome -> dropped.
 */
export default function parse(element, { document }) {
  // Category/tag links (the meaningful content). Exclude the share widget links (.logo-padding).
  let links = Array.from(element.querySelectorAll('a.blog-tag'));

  // Fallback: anchors in the content column that are not part of the share menu.
  if (links.length === 0) {
    links = Array.from(element.querySelectorAll('.thirteen.wide.column a, .ui.column a'))
      .filter((a) => !a.closest('.share-container') && !a.classList.contains('logo-padding'));
  }

  if (links.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Single row with a single richtext cell (field:text) holding the tag link(s).
  const cell = [document.createComment(' field:text ')];
  links.forEach((a, i) => {
    if (i > 0) cell.push(document.createTextNode(' '));
    cell.push(a);
  });

  const cells = [[cell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'blog-tags', cells });
  element.replaceWith(block);
}
