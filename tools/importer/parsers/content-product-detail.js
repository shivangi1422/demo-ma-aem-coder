/* eslint-disable */
/* global WebImporter */

/**
 * Parser for content-product-detail (template: reagent-product).
 * Source: https://www.mybeckman.in/reagents/particle/valita-titer-assays
 *         https://www.mybeckman.in/reagents/particle/valita-aggregation-pure
 * Selector: .product-spotlight-wrapper > .product-intro-wrapper
 *
 * Model (blocks/content-product-detail/_content-product-detail.json):
 *   block "content-product-detail": text (richtext)
 *   item  "content-product-detail-item": image (reference) [+ imageAlt collapsed]
 *
 * Output rows:
 *   row 0  : text  (.rt-holder: H1, H2, intro, bullets, Application Notes, CTAs, Resources + Tools)
 *   row 1..: image (one per unique gallery slide image; first = main image)
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const BLOCK_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'UL', 'OL', 'BLOCKQUOTE', 'TABLE']);

  const makeLinkPara = (a) => {
    const text = clean(a.textContent);
    const href = a.getAttribute('href');
    if (!text || !href) return null;
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = text;
    p.appendChild(link);
    return p;
  };

  const textNodes = [];
  const rt = element.querySelector('.rt-holder');
  if (rt) {
    Array.from(rt.children).forEach((child) => {
      const tag = child.tagName;
      if (BLOCK_TAGS.has(tag)) {
        if (!clean(child.textContent) && !child.querySelector('img')) return;
        const clone = child.cloneNode(true);
        clone.querySelectorAll('input, script, style').forEach((n) => n.remove());
        clone.removeAttribute('style');
        clone.querySelectorAll('[style]').forEach((n) => n.removeAttribute('style'));
        // drop empty anchors inside lists / paragraphs
        clone.querySelectorAll('a').forEach((a) => { if (!clean(a.textContent)) a.remove(); });
        textNodes.push(clone);
        return;
      }
      if (tag === 'A') {
        const p = makeLinkPara(child);
        if (p) textNodes.push(p);
        return;
      }
      if (child.classList.contains('resource-tool-table-wrapper')) {
        const heading = child.querySelector('.resource-tool-table-links-heading');
        const links = Array.from(child.querySelectorAll('.resource-tool-table-links-wrapper a[href]'))
          .map(makeLinkPara).filter(Boolean);
        if (!links.length) return;
        const headText = clean(heading && heading.textContent);
        if (headText) {
          const h = document.createElement('h4');
          h.textContent = headText;
          textNodes.push(h);
        }
        links.forEach((p) => textNodes.push(p));
        return;
      }
      if (tag === 'DIV') {
        // CTA wrapper: "Explore ..." anchor link + Request a Quote button
        Array.from(child.querySelectorAll('a[href]')).forEach((a) => {
          const p = makeLinkPara(a);
          if (p) textNodes.push(p);
        });
      }
    });
  }

  const cells = [];
  if (textNodes.length) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:text '));
    textNodes.forEach((n) => frag.appendChild(n));
    cells.push([frag]);
  } else {
    cells.push(['']);
  }

  // Gallery images (slides only, not pagination thumbnails), deduped by path
  const seen = new Set();
  Array.from(element.querySelectorAll('.product-gallery-carousel .slideset .slide img')).forEach((src) => {
    const url = src.getAttribute('src');
    if (!url) return;
    const key = url.split('?')[0];
    if (seen.has(key)) return;
    seen.add(key);
    const img = document.createElement('img');
    img.setAttribute('src', url);
    img.setAttribute('alt', clean(src.getAttribute('alt')));
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:image '));
    frag.appendChild(img);
    cells.push([frag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'content-product-detail', cells });
  element.replaceWith(block);
}
