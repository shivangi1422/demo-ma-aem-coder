import { moveInstrumentation, rowContentCells } from '../../scripts/scripts.js';

const BUTTON_CLASSES = ['button', 'primary', 'secondary', 'accent'];
const ICON_TOKEN = /^\s*:([a-z0-9-]+):\s*/;
const INLINE_TAGS = ['A', 'STRONG', 'EM', 'B', 'I', 'SPAN', 'BR', 'U', 'SUB', 'SUP', 'CODE', 'IMG', 'PICTURE'];

/**
 * Wraps runs of bare text / inline nodes (no paragraph) into paragraphs, so
 * "  :fa-check-circle-regular: <strong>Title</strong>" becomes one <p>.
 * @param {Element} cell
 */
function wrapInlineRuns(cell) {
  let run = null;
  [...cell.childNodes].forEach((node) => {
    const inline = (node.nodeType === Node.TEXT_NODE)
      || (node.nodeType === Node.ELEMENT_NODE && INLINE_TAGS.includes(node.tagName));
    if (!inline) {
      run = null;
      return;
    }
    if (!run) {
      if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
      run = document.createElement('p');
      node.replaceWith(run);
    }
    run.append(node);
  });
}

/**
 * Makes sure an icon span has an <img> (sizes the glyph) and hands the SVG to
 * CSS as a mask so it can be painted white.
 * @param {HTMLElement} span span.icon.icon-<name>
 */
function decorateIconSpan(span) {
  const iconName = [...span.classList].find((c) => c.startsWith('icon-'))?.substring(5);
  let img = span.querySelector('img');
  if (!img && iconName) {
    img = document.createElement('img');
    img.dataset.iconName = iconName;
    img.src = `${window.hlx?.codeBasePath || ''}/icons/${iconName}.svg`;
    img.alt = '';
    img.loading = 'lazy';
    span.append(img);
  }
  if (!img) return;
  img.width = 16;
  img.height = 16;
  span.style.setProperty('--cards-benefit-check-mask', `url("${img.getAttribute('src')}")`);
  span.setAttribute('aria-hidden', 'true');
}

/**
 * Turns a leading ":icon-name:" text token of a paragraph into span.icon.
 * @param {HTMLElement} p
 */
function tokenToIcon(p) {
  if (p.querySelector('span.icon')) return;
  const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  let text = walker.nextNode();
  while (text && !text.textContent.trim()) text = walker.nextNode();
  if (!text) return;
  const match = text.textContent.match(ICON_TOKEN);
  if (!match) return;
  text.textContent = text.textContent.slice(match[0].length);
  const span = document.createElement('span');
  span.className = `icon icon-${match[1]}`;
  p.prepend(span);
}

/**
 * Cards (benefit check): benefit list on the blue band. Each item is a bold
 * title led by a 16px white check-circle icon, then a description paragraph.
 * From 768px the items split into two columns filled column by column.
 *
 * Authored structure: one row per item, one rich-text cell (an empty image
 * cell is tolerated and dropped):
 *   :fa-check-circle-regular: **Title**
 *   Description paragraph.
 * @param {Element} block
 */
export default function decorate(block) {
  const items = [];

  [...block.children].forEach((row) => {
    const cells = rowContentCells(row).filter((cell) => cell.textContent.trim() !== '' || cell.querySelector('.icon'));
    if (!cells.length) return;

    const li = document.createElement('li');
    li.className = 'cards-benefit-check-item';
    moveInstrumentation(row, li);

    cells.forEach((cell) => {
      wrapInlineRuns(cell);
      // an icon delivered in its own block-level wrapper: lift it into a paragraph
      cell.querySelectorAll(':scope > span.icon').forEach((span) => {
        const p = document.createElement('p');
        span.replaceWith(p);
        p.append(span);
      });
      li.append(...cell.childNodes);
    });

    // drop pictures/images from an image cell (the design has none)
    li.querySelectorAll(':scope > picture, :scope > p > picture:only-child').forEach((pic) => {
      const holder = pic.parentElement === li ? pic : pic.parentElement;
      holder.remove();
    });

    const paragraphs = () => [...li.querySelectorAll(':scope > p')];
    paragraphs().forEach(tokenToIcon);

    // an icon-only paragraph joins the following (title) paragraph
    paragraphs().forEach((p) => {
      const icon = p.querySelector('span.icon');
      if (!icon || p.textContent.trim() !== '') return;
      const next = p.nextElementSibling;
      if (next && next.tagName === 'P') {
        next.prepend(icon);
        p.remove();
      }
    });

    li.querySelectorAll('span.icon').forEach(decorateIconSpan);

    // no button decoration inside benefit items
    li.querySelectorAll('a.button').forEach((a) => a.classList.remove(...BUTTON_CLASSES));

    const all = [...li.children];
    const title = all.find((el) => el.querySelector('span.icon, strong, b'))
      || all.find((el) => /^H[1-6]$/.test(el.tagName))
      || (all.length > 1 ? all[0] : null);
    all.forEach((el) => {
      el.classList.remove('button-wrapper', 'button-container');
      el.classList.add(el === title ? 'cards-benefit-check-title' : 'cards-benefit-check-text');
    });

    items.push(li);
  });

  const firstCount = Math.ceil(items.length / 2);
  const columns = [items.slice(0, firstCount), items.slice(firstCount)]
    .filter((list) => list.length)
    .map((list) => {
      const ul = document.createElement('ul');
      ul.className = 'cards-benefit-check-column';
      ul.append(...list);
      return ul;
    });

  block.replaceChildren(...columns);
}
