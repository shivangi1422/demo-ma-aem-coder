/* eslint-disable */
/* global WebImporter */

/**
 * Section transformer for www.mybeckman.in.
 * beforeTransform: insert <hr> section breaks before every non-first section
 * (driven by payload.template.sections) while the original elements exist.
 * afterTransform: add Section Metadata for styled sections and the page
 * Metadata block (Title, Description; Template when the page template sets pageTemplate,
 * e.g. service-landing: body class for the template layout).
 */

const MARKER = 'data-excat-section-id';

function findSectionElement(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (let i = 0; i < selectors.length; i += 1) {
    const sel = selectors[i];
    if (!sel) continue;
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) { /* invalid selector, try next */ }
  }
  return null;
}

function readMeta(document, element) {
  const meta = (name) => {
    const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    return el ? (el.getAttribute('content') || '').trim() : '';
  };
  let title = meta('og:title') || (document.title || '').trim();
  title = title.replace(/\s*\|\s*Beckman Coulter.*$/i, '').trim();
  if (!title) {
    const h1 = element.querySelector('#content-holder > h1, h1');
    title = h1 ? h1.textContent.trim() : '';
  }
  const description = meta('description') || meta('og:description');
  return { title, description };
}

export default function transform(hookName, element, payload) {
  const document = element.ownerDocument || (payload && payload.document);
  const template = payload && payload.template;
  const sections = (template && template.sections) || [];

  if (hookName === 'beforeTransform') {
    // capture page metadata before any cleanup touches the head
    payload.mybeckmanMeta = readMeta(document, element);

    if (sections.length < 2) return;
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = findSectionElement(element, section);
      if (!el) continue;
      if (i === 0 && !section.style) continue;
      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(MARKER, section.id);
      if (i === 0) hr.setAttribute(`${MARKER}-first`, 'true');
      el.parentNode.insertBefore(hr, el);
    }
  }

  if (hookName === 'afterTransform') {
    if (sections.length >= 2) {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        const anchor = marker || findSectionElement(element, section);
        if (!anchor) continue;
        const sm = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        if (marker) {
          // place Section Metadata at the end of this section (before the next break)
          let end = marker.nextElementSibling;
          while (end && end.tagName !== 'HR') end = end.nextElementSibling;
          if (end) end.parentNode.insertBefore(sm, end);
          else marker.parentNode.appendChild(sm);
        } else {
          anchor.after(sm);
        }
      }
      element.querySelectorAll(`hr[${MARKER}-first]`).forEach((hr) => hr.remove());
      element.querySelectorAll(`hr[${MARKER}]`).forEach((hr) => hr.removeAttribute(MARKER));
    }

    // page metadata
    const { title, description } = payload.mybeckmanMeta || readMeta(document, element);
    const cells = {};
    if (title) cells.Title = title;
    if (description) cells.Description = description;
    if (payload.template && payload.template.pageTemplate) cells.Template = payload.template.pageTemplate;
    const metaBlock = WebImporter.Blocks.createBlock(document, { name: 'Metadata', cells });
    element.append(metaBlock);
  }
}
