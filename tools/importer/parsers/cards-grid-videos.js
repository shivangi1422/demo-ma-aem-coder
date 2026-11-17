/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-videos, emitted as the Cards Grid block with the
 * videos option. Base: cards.
 * Source: https://www.mybeckman.in/resources/industries/synthetic-biology
 *   ("Video Gallery": Wistia channel embed .wistia_channel.wistia_async_<channel>;
 *    the rendered cards are a.w-video-card[href*="wmediaid=<id>"] with an h3 title
 *    and a "4 MIN" duration indicator over the poster)
 * Selector: .wistia_channel
 * Model: block "cards-grid" (text = optional heading/intro, classes = style)
 *        items "cards-grid-item" (image/imageAlt, text).
 * Row 1: heading/intro (empty; the gallery H2 stays default content above the block).
 * Rows 2..N: one per video - [thumbnail, <h3><a href="https://fast.wistia.net/embed/iframe/<id>">Title</a></h3><p>4 MIN</p>].
 * Thumbnail: Wistia's 640px poster https://fast.wistia.net/embed/medias/<id>/thumbnail-640.webp
 * (decorative next to the title: empty alt).
 */

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

export default function parse(element, { document }) {
  const cells = [['']];
  const seen = new Set();

  element.querySelectorAll('a.w-video-card[href*="wmediaid="], a[href*="wmediaid="]').forEach((card) => {
    const m = (card.getAttribute('href') || '').match(/wmediaid=([a-z0-9]+)/i);
    if (!m || seen.has(m[1])) return;
    const id = m[1];
    seen.add(id);
    const h3 = card.querySelector('h3');
    const title = norm((h3 && (h3.getAttribute('title') || h3.textContent)) || card.textContent);
    const durationEl = Array.from(card.querySelectorAll('div, span'))
      .find((el) => !el.children.length && /^\d+\s*(MIN|SEC)$/i.test(norm(el.textContent)));
    const duration = durationEl ? norm(durationEl.textContent) : '';

    const imageFrag = document.createDocumentFragment();
    const img = document.createElement('img');
    img.setAttribute('src', `https://fast.wistia.net/embed/medias/${id}/thumbnail-640.webp`);
    img.setAttribute('alt', '');
    imageFrag.appendChild(document.createComment(' field:image '));
    imageFrag.appendChild(img);

    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    const heading = document.createElement('h3');
    const a = document.createElement('a');
    a.setAttribute('href', `https://fast.wistia.net/embed/iframe/${id}`);
    a.textContent = title;
    heading.appendChild(a);
    textFrag.appendChild(heading);
    if (duration) {
      const p = document.createElement('p');
      p.textContent = duration;
      textFrag.appendChild(p);
    }
    cells.push([imageFrag, textFrag]);
  });

  if (cells.length < 2) return;
  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards Grid (videos)', cells });
  element.replaceWith(block);
}
