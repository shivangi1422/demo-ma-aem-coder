/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-video-mb (block: cards-grid, Style option: video).
 * Source: div.wistia_channel - the Wistia channel gallery (React, injected at
 * runtime) on mybeckman.in monoclonal-antibodies (channel kpak8m8xbt, 2 videos)
 * and synthetic-biology (channel uri4d24ahy, 4 videos). Per video:
 *   div[data-testid=gallery-section-media-wrapper] > a.w-video-card[href*="wmediaid=<id>"]
 *     ... img[src*="fast.wistia.net/embed/medias/<id>/thumbnail-320.webp"] (srcset up to 640w)
 *     ... h3[title] (video title)
 *     ... duration badge ("5 MIN": Wistia generated, dropped)
 * The play button sits inside the card link (invalid nesting), so units are
 * the media wrappers, and each card's parts are read inside its own wrapper.
 *
 * Library cards convention (one row per card) preceded by the local
 * cards-grid container row (heading / intro, left empty).
 * xwalk container model `cards-grid`: text (richtext), classes.
 * Item model `cards-grid-item`: image (reference, imageAlt collapsed), text (richtext).
 *
 * Row 1: heading row - empty (the section heading stays default content)
 * Rows 2..N: poster image (largest Wistia thumbnail, alt = title)
 *            | <p><a href="https://fast.wistia.net/embed/iframe/{id}">{title}</a></p>
 * Video ids come from wmediaid / the thumbnail URL, never from the channel id.
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

const MEDIA_RE = /fast\.wistia\.(?:net|com)\/embed\/medias\/([A-Za-z0-9]+)\//i;

function mediaId(unit) {
  const link = unit.matches('a[href*="wmediaid="]') ? unit : unit.querySelector('a[href*="wmediaid="]');
  const m = link && (link.getAttribute('href') || '').match(/[?&]wmediaid=([A-Za-z0-9]+)/);
  if (m) return m[1];
  const img = [...unit.querySelectorAll('img[src], img[srcset]')]
    .map((i) => `${i.getAttribute('src') || ''} ${i.getAttribute('srcset') || ''}`)
    .find((s) => MEDIA_RE.test(s));
  return img ? img.match(MEDIA_RE)[1] : '';
}

/** largest srcset candidate, else src */
function posterSrc(img) {
  const srcset = img.getAttribute('srcset') || '';
  const best = srcset.split(',').map((s) => s.trim().split(/\s+/))
    .filter(([u]) => u)
    .map(([u, w]) => ({ u, w: parseInt(w, 10) || 0 }))
    .sort((a, b) => b.w - a.w)[0];
  return (best && best.u) || img.getAttribute('src') || '';
}

export default function parse(element, { document }) {
  const cells = [];

  // ---- row 1: heading row (empty) -----------------------------------------
  cells.push(['']);

  // ---- one row per video ---------------------------------------------------
  let units = [...element.querySelectorAll('[data-testid="gallery-section-media-wrapper"]')];
  if (!units.length) units = [...element.querySelectorAll('a[href*="wmediaid="]')];
  const seen = new Set();
  units.forEach((unit) => {
    const id = mediaId(unit);
    if (!id || seen.has(id)) return;
    seen.add(id);
    const titleEl = unit.querySelector('h3[title], h3, h4, [class*="title"]');
    const title = clean((titleEl && (titleEl.getAttribute('title') || titleEl.textContent)) || '') || 'Watch video';

    const poster = [...unit.querySelectorAll('img')].find((i) => MEDIA_RE.test(`${i.getAttribute('src')} ${i.getAttribute('srcset')}`));
    const imageCell = [];
    // same 640px rendition on every page (synthetic-biology has no srcset)
    const src = (poster ? posterSrc(poster) : `https://fast.wistia.net/embed/medias/${id}/thumbnail-640.webp`)
      .replace(/\/thumbnail-(?:160|320)\.webp/, '/thumbnail-640.webp');
    const img = document.createElement('img');
    img.src = src;
    img.alt = title;
    imageCell.push(document.createComment(' field:image '), img);

    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = `https://fast.wistia.net/embed/iframe/${id}`;
    a.textContent = title;
    p.append(a);

    cells.push([imageCell, [document.createComment(' field:text '), p]]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid (video)', cells });
  element.replaceWith(block);
}
