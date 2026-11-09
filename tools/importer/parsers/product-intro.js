/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-product-intro (xwalk model: columns-product-intro: image (reference,
 * imageAlt collapsed onto the img alt), text (richtext)).
 * Source (www.beckman.com product page): .product-intro-wrapper > .product-intro-holder >
 *   .rt-holder (h1, p, ul checklist, div > a buttons, .resource-tool-table-wrapper) and a nested
 *   .product-intro-holder > .lt-holder > .product-gallery-carousel (reduced to one img by
 *   beckman-product-prepare; on the raw page the first carousel img is used).
 * Output (one row, two cells):
 *   [<!-- field:image --><img>] [<!-- field:text --><h1/><p/><ul/>
 *     <p><strong><a/></strong></p> (primary: the source .btn-primary link, e.g. Request a Quote)
 *     <p><em><a/></em></p>         (secondary: e.g. the "Explore … Models" link)
 *     <p><strong>Resources + Tools</strong></p><ul><li><a/></li>…</ul>]
 */
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

function link(document, a) {
  const out = document.createElement('a');
  out.href = a.getAttribute('href') || '';
  out.textContent = clean(a.textContent);
  return out;
}

export default function parse(element, { document }) {
  // image cell
  const imageCell = document.createDocumentFragment();
  const srcImg = element.querySelector('.lt-holder .product-gallery-carousel img[src], .lt-holder img[src]');
  if (srcImg) {
    const img = document.createElement('img');
    img.src = srcImg.getAttribute('src');
    img.alt = srcImg.getAttribute('alt') || '';
    imageCell.appendChild(document.createComment(' field:image '));
    imageCell.appendChild(img);
  }

  // text cell
  const parts = [];
  const text = element.querySelector('.rt-holder');
  if (text) {
    [...text.children].forEach((el) => {
      if (/^(H[1-6]|P|UL|OL)$/.test(el.tagName)) {
        if (clean(el.textContent)) parts.push(el);
        return;
      }
      if (el.matches('.resource-tool-table-wrapper')) {
        const links = [...el.querySelectorAll('a[href]')].filter((a) => clean(a.textContent));
        const heading = el.querySelector('.resource-tool-table-links-heading');
        if (heading && clean(heading.textContent)) {
          const p = document.createElement('p');
          const strong = document.createElement('strong');
          strong.textContent = clean(heading.textContent);
          p.append(strong);
          parts.push(p);
        }
        if (links.length) {
          const ul = document.createElement('ul');
          links.forEach((a) => {
            const li = document.createElement('li');
            li.append(link(document, a));
            ul.append(li);
          });
          parts.push(ul);
        }
        return;
      }
      // button group: the source .btn-primary link (Request a Quote) is the primary button, the rest
      // (the outlined in-page "Explore … Models" link) secondary
      const buttons = [...el.querySelectorAll('a[href]')].filter((a) => clean(a.textContent));
      const hasPrimary = buttons.some((a) => a.classList.contains('btn-primary'));
      buttons.forEach((a, i) => {
        const primary = hasPrimary ? a.classList.contains('btn-primary') : i === 0;
        const p = document.createElement('p');
        const wrap = document.createElement(primary ? 'strong' : 'em');
        wrap.append(link(document, a));
        p.append(wrap);
        parts.push(p);
      });
    });
  }
  const textCell = document.createDocumentFragment();
  if (parts.length) {
    textCell.appendChild(document.createComment(' field:text '));
    parts.forEach((n) => textCell.appendChild(n));
  }

  const cells = [[imageCell, textCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-product-intro', cells });
  element.replaceWith(block);
}
