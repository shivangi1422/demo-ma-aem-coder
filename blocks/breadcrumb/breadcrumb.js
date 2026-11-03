/**
 * Breadcrumb: authored as a list of links; the last entry (plain text or link) is the current page.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const items = [];
  const list = block.querySelector('ul, ol');
  if (list) {
    [...list.children].forEach((li) => items.push(li));
  } else {
    // fall back to one link or text per paragraph
    block.querySelectorAll('p').forEach((p) => items.push(p));
  }

  const ol = document.createElement('ol');
  items.forEach((item, i) => {
    const li = document.createElement('li');
    const a = item.querySelector('a');
    const last = i === items.length - 1;
    if (last) {
      li.textContent = item.textContent.trim();
      li.setAttribute('aria-current', 'page');
    } else if (a) {
      a.className = '';
      li.append(a);
    } else {
      li.textContent = item.textContent.trim();
    }
    if (li.textContent) ol.append(li);
  });

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  nav.append(ol);
  block.replaceChildren(nav);
}
