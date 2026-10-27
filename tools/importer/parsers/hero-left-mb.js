/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-left-mb (block: hero, Style option: left).
 * Source: div.image_wrapper_vk on mybeckman.in flow cytometry pages
 * (clinical-trials: 1, leukemia-and-lymphoma: 5 banners):
 *   div.image_wrapper_vk > img (banner)
 *     + div.overlay_vk.overlay_0_mobile_vk (hidden duplicate, removed by the cleanup)
 *     + div.overlay_vk.overlay_0_large_vk
 *         clinical-trials: decorative flow icon img + h1 > (strong title) <br> (span subtitle)
 *         leukemia-and-lymphoma: a single h2
 *
 * Library convention (Hero): 1 column, block name row + 2 content rows:
 *   Row 1: background image (optional)
 *   Row 2: title (heading), subheading, call-to-action
 * xwalk model `hero`: image (reference, imageAlt collapsed), text (richtext), classes.
 *
 * Row 1: banner image (alt kept)
 * Row 2: heading (level kept: h1 on clinical-trials, h2 on leukemia - the jump
 *        links target the EDS auto id of the h2) + subtitle paragraph (the text
 *        after the <br> inside the heading). The overlay icon is decoration.
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

/** text lines of an element, split on <br> */
function lines(el) {
  const out = [''];
  const walk = (node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeName === 'BR') out.push('');
      else if (child.nodeType === 3) out[out.length - 1] += child.textContent;
      else if (child.nodeType === 1) walk(child);
    });
  };
  walk(el);
  return out.map(clean).filter(Boolean);
}

export default function parse(element, { document }) {
  const cells = [];
  const overlay = element.querySelector('.overlay_0_large_vk')
    || element.querySelector('.overlay_vk:not(.overlay_0_mobile_vk)');

  // ---- row 1: banner image ------------------------------------------------
  const banner = element.querySelector(':scope > img[src]')
    || [...element.querySelectorAll('img[src]')].find((img) => !overlay || !overlay.contains(img));
  if (banner) {
    const img = document.createElement('img');
    img.src = banner.getAttribute('src');
    img.alt = clean(banner.getAttribute('alt'));
    cells.push([[document.createComment(' field:image '), img]]);
  } else {
    cells.push(['']);
  }

  // ---- row 2: heading + subtitle --------------------------------------------
  const text = [];
  const scope = overlay || element;
  const heading = scope.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    const [title, ...rest] = lines(heading);
    if (title) {
      const h = document.createElement(heading.tagName.toLowerCase());
      h.textContent = title;
      text.push(h);
    }
    rest.forEach((line) => {
      const p = document.createElement('p');
      p.textContent = line;
      text.push(p);
    });
  }
  // further overlay text (not on the source pages; kept if present)
  [...scope.querySelectorAll('p')].forEach((el) => {
    if (heading && heading.contains(el)) return;
    const value = clean(el.textContent);
    if (!value) return;
    const p = document.createElement('p');
    p.textContent = value;
    text.push(p);
  });
  if (text.length) {
    cells.push([[document.createComment(' field:text '), ...text]]);
  } else {
    cells.push(['']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero (left)', cells });
  element.replaceWith(block);
}
