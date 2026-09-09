/**
 * hero-blog decoration.
 * Adds the "Share" social row to the hero header (matches source), which is
 * chrome not carried in the authored content. Icons are inline SVG so there
 * is no icon-font or external image dependency.
 */

const SHARE_LINKS = [
  { label: 'LinkedIn', svg: '<path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7.5 0h3.8v2.2h.05c.53-1 1.83-2.2 3.77-2.2 4.03 0 4.78 2.65 4.78 6.1V24h-4v-7.1c0-1.7-.03-3.9-2.38-3.9-2.38 0-2.75 1.86-2.75 3.78V24h-4V8z"/>' },
  { label: 'Twitter', svg: '<path d="M23.95 4.57a10 10 0 0 1-2.83.78 4.94 4.94 0 0 0 2.16-2.72 9.86 9.86 0 0 1-3.13 1.2 4.92 4.92 0 0 0-8.39 4.49A13.97 13.97 0 0 1 1.64 3.16a4.92 4.92 0 0 0 1.52 6.57 4.9 4.9 0 0 1-2.23-.62v.06a4.93 4.93 0 0 0 3.95 4.83 4.96 4.96 0 0 1-2.22.08 4.93 4.93 0 0 0 4.6 3.42A9.87 9.87 0 0 1 0 19.54a13.94 13.94 0 0 0 7.55 2.21c9.05 0 14-7.5 14-14 0-.21 0-.42-.02-.63a9.94 9.94 0 0 0 2.46-2.55z"/>' },
  { label: 'Facebook', svg: '<path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/>' },
  { label: 'Email', svg: '<path d="M2 4h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm10 7L2.4 5.4 12 12.5 21.6 5.4 12 11z"/>' },
];

/**
 * Build the Share control that sits in the hero header.
 * @returns {HTMLElement}
 */
function buildShare() {
  const share = document.createElement('div');
  share.className = 'hero-blog-share';

  const label = document.createElement('span');
  label.className = 'hero-blog-share-label';
  label.textContent = 'Share';
  share.append(label);

  SHARE_LINKS.forEach((item) => {
    const a = document.createElement('a');
    a.className = 'hero-blog-share-icon';
    a.href = '#';
    a.setAttribute('aria-label', `Share on ${item.label}`);
    a.innerHTML = `<svg viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">${item.svg}</svg>`;
    share.append(a);
  });

  return share;
}

/**
 * loads and decorates the hero-blog block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // The text column is the block's last child; its read-time paragraph is first.
  const textCol = block.lastElementChild?.querySelector(':scope > div') || block.lastElementChild;
  const readTime = textCol?.querySelector('p');
  if (readTime && !block.querySelector('.hero-blog-share')) {
    // Wrap read-time + Share in a top row like the source header.
    const topRow = document.createElement('div');
    topRow.className = 'hero-blog-meta';
    readTime.replaceWith(topRow);
    topRow.append(readTime, buildShare());
  }
}
