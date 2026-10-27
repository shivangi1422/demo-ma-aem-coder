/* eslint-disable */
/* global WebImporter */

/**
 * Parser for embed-video (template: reagent-product).
 * Source: https://www.mybeckman.in/reagents/particle/valita-titer-assays
 *         https://www.mybeckman.in/reagents/particle/valita-aggregation-pure
 * Selector: .product-spotlight-wrapper .spotlight-content-wrapper > .embeded-video
 *
 * Model (blocks/embed-video/_embed-video.json):
 *   image (reference, optional poster) [+ imageAlt collapsed], link (aem-content)
 *
 * Output rows:
 *   row 1: image (empty: the source has no authored poster, Wistia renders its own)
 *   row 2: link  https://fast.wistia.net/embed/iframe/<mediaId>
 *          (the form blocks/embed-video/embed-video.js parses for Wistia)
 */
export default function parse(element, { document }) {
  let mediaId = '';

  // 1. class wistia_async_<id> on the .wistia_embed container
  const asyncEl = element.querySelector('[class*="wistia_async_"]');
  if (asyncEl) {
    const m = asyncEl.className.match(/wistia_async_([a-z0-9]+)/i);
    if (m) mediaId = m[1];
  }

  // 2. iframe / link src pointing at Wistia
  if (!mediaId) {
    const src = Array.from(element.querySelectorAll('iframe[src], a[href]'))
      .map((el) => el.getAttribute('src') || el.getAttribute('href'))
      .find((u) => /wistia\.(net|com)/i.test(u || ''));
    const m = src && src.match(/\/(?:embed\/iframe|medias|embed\/medias)\/([a-z0-9]+)/i);
    if (m) mediaId = m[1];
  }

  // 3. JSON-LD VideoObject (@id / embedUrl)
  if (!mediaId) {
    Array.from(element.querySelectorAll('script[type="application/ld+json"]')).some((s) => {
      const m = (s.textContent || '').match(/wistia\.(?:net|com)\/(?:embed\/iframe|medias|embed\/medias)\/([a-z0-9]+)/i);
      if (m) mediaId = m[1];
      return !!mediaId;
    });
  }

  let linkCell = '';
  if (mediaId) {
    const url = `https://fast.wistia.net/embed/iframe/${mediaId}`;
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.textContent = url;
    linkCell = document.createDocumentFragment();
    linkCell.appendChild(document.createComment(' field:link '));
    linkCell.appendChild(a);
  }

  const cells = [[''], [linkCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'embed-video', cells });
  element.replaceWith(block);
}
