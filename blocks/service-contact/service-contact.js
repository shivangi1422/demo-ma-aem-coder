import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the contact actions into a responsive list of buttons and descriptions.
 * @param {Element} block
 */
export default function decorate(block) {
  const list = document.createElement('ul');

  [...block.children].forEach((row) => {
    const item = document.createElement('li');
    const content = row.firstElementChild;
    const link = content && content.querySelector('a');

    moveInstrumentation(row, item);

    if (link) {
      link.classList.add('button', 'service-contact-cta');
      item.append(link);
      const wrapper = link.parentElement;
      if (wrapper && wrapper.tagName === 'P' && !wrapper.textContent.trim()) {
        wrapper.remove();
      }
    }

    if (content && content.textContent.trim()) {
      const description = document.createElement('div');
      description.className = 'service-contact-description';
      while (content.firstChild) description.append(content.firstChild);
      if (description.textContent.trim()) item.append(description);
    }

    list.append(item);
  });

  block.replaceChildren(list);
}
