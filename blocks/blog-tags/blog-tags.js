/**
 * blog-tags decoration.
 * Named block (block/v1/block) authored as one row with a single richtext cell
 * of tag links. Unwrap the row/cell wrappers so the tag links sit directly in
 * the block, letting the flex row + leading tag icon (CSS) lay them out.
 * @param {Element} block
 */
export default function decorate(block) {
  const cell = block.querySelector(':scope > div > div') || block.querySelector(':scope > div');
  if (cell) {
    block.replaceChildren(...cell.childNodes);
  }
}
