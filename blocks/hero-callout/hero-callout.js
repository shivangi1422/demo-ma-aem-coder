/**
 * Hero callout: centred logo, heading and subheading, then a white callout box
 * (label + buttons in a row) overlapping the section below (source .Header).
 * Rows: image, text. Everything after the last heading of the text is shown in the callout box.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  let textRow = null;
  rows.forEach((row) => {
    if (row.querySelector('picture') && !row.textContent.trim()) row.className = 'hero-callout-logo';
    else if (row.textContent.trim() && !textRow) textRow = row;
    else row.remove();
  });
  if (!textRow) return;
  textRow.className = 'hero-callout-text';
  const text = textRow.firstElementChild || textRow;
  const headings = [...text.querySelectorAll(':scope > :is(h1, h2, h3, h4, h5, h6)')];
  const last = headings[headings.length - 1];
  const all = [...text.children];
  const rest = last ? all.slice(all.indexOf(last) + 1) : all;
  if (!rest.length) return;

  const box = document.createElement('div');
  box.className = 'hero-callout-box';
  const buttons = document.createElement('div');
  buttons.className = 'hero-callout-buttons';
  rest.forEach((el) => (el.classList.contains('button-wrapper') ? buttons : box).append(el));
  if (buttons.children.length) box.append(buttons);
  text.append(box);
}
