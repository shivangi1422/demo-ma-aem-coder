import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Turns a "<strong>Channels:</strong> Website, Mobile App" paragraph into a
 * label plus one span per comma-separated channel.
 * @param {Element} p the channels paragraph
 */
function decorateChannels(p) {
  const label = p.querySelector('strong');
  const names = [...p.childNodes]
    .filter((node) => node !== label)
    .map((node) => node.textContent)
    .join('')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  const labelSpan = document.createElement('span');
  labelSpan.className = 'cards-vertical-channels-label';
  labelSpan.textContent = label.textContent.trim();
  const channels = names.map((name) => {
    const span = document.createElement('span');
    span.className = 'cards-vertical-channel';
    span.textContent = name;
    return span;
  });
  p.className = 'cards-vertical-channels';
  p.replaceChildren(labelSpan, ...channels);
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((cell) => {
      if (cell.querySelector('picture')) cell.className = 'cards-vertical-card-image';
      else if (cell.textContent.trim()) cell.className = 'cards-vertical-card-body';
      else cell.className = 'cards-vertical-card-empty';
    });

    const body = li.querySelector('.cards-vertical-card-body');
    if (body) {
      // the paragraph right after the title is the positioning line
      const heading = body.querySelector(':scope > :is(h2, h3, h4)');
      const tagline = heading?.nextElementSibling;
      if (tagline?.tagName === 'P') tagline.classList.add('cards-vertical-tagline');
      // a paragraph after the list that starts with a bold label holds the channels
      body.querySelectorAll(':scope > ul ~ p').forEach((p) => {
        const first = p.firstElementChild;
        if (first?.tagName === 'STRONG' && p.firstChild === first && p.textContent.trim() !== first.textContent.trim()) {
          decorateChannels(p);
        }
      });
    }
    ul.append(li);
  });
  block.replaceChildren(ul);
}
