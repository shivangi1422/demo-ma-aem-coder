/**
 * author-bio decoration.
 * Named block (block/v1/block) authored as two rows: an image row and a text
 * row (name + bio + CTA). Flatten them into a single flex row — circular
 * headshot beside the content — and tag the image cell.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const imageRow = rows.find((r) => r.querySelector('picture, img'));
  const textRow = rows.find((r) => r !== imageRow);

  const layout = document.createElement('div');
  layout.className = 'author-bio-row';

  if (imageRow) {
    const imgCol = imageRow.querySelector(':scope > div') || imageRow;
    imgCol.classList.add('author-bio-img-col');
    layout.append(imgCol);
  }
  if (textRow) {
    const textCol = textRow.querySelector(':scope > div') || textRow;
    textCol.classList.add('author-bio-content');
    layout.append(textCol);
  }

  block.replaceChildren(layout);
}
