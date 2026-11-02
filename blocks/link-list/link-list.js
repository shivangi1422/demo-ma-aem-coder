/**
 * Decorates the link-list block: a bold label followed by a list of related links.
 * The single rich-text cell is unwrapped so the list sits directly in the block.
 * @param {Element} block
 */
export default function decorate(block) {
  const cell = block.querySelector(':scope > div > div');
  if (!cell) return;
  const content = document.createElement('div');
  content.className = 'link-list-content';
  [...cell.attributes].forEach(({ name, value }) => content.setAttribute(name, value));
  while (cell.firstChild) content.append(cell.firstChild);
  const title = content.querySelector(':scope > p:first-child');
  if (title && !title.querySelector('a')) title.classList.add('link-list-title');
  block.replaceChildren(content);
}
