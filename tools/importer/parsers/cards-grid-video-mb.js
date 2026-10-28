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
 * Rows 2..N: poster image (Wistia oEmbed poster for the known ids, else the
 *            largest Wistia thumbnail; alt = title)
 *            | <p><a href="https://fast.wistia.net/embed/iframe/{id}">{title}</a></p>
 * Video ids come from wmediaid / the thumbnail URL, never from the channel id.
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

// Wistia oEmbed thumbnail_url per media id
// (https://fast.wistia.com/oembed?url=https://fast.wistia.net/embed/iframe/{id}):
// the gallery thumbnails all share the file name thumbnail-640.webp, so they
// cannot get distinct AEM Assets paths; the oEmbed posters have unique names
const POSTERS = {
  '1nyrf4wf4x': 'https://embed-ssl.wistia.com/deliveries/e6d1c6d874dbc935a49a5708a12b4e0e.jpg?image_crop_resized=960x540',
  '6yc9dtf8jn': 'https://embed-ssl.wistia.com/deliveries/50e244c00777190b1d68e625fcadf3e2.jpg?image_crop_resized=960x540',
  a7fwbsbm1x: 'https://embed-ssl.wistia.com/deliveries/5702af258835345953234a5891605f90a3af40e2.jpg?image_crop_resized=960x540',
  isge0kog69: 'https://embed-ssl.wistia.com/deliveries/fc26b07f327410cfe988f88e29ae5da8.jpg?image_crop_resized=960x540',
  q1pgs93mew: 'https://embed-ssl.wistia.com/deliveries/daddcd151acb3a5e63a6ec126dd0ff04.jpg?image_crop_resized=960x540',
  '4qgtx9nelf': 'https://embed-ssl.wistia.com/deliveries/45e305cfc56cdabaa65169d0fa94af5e.jpg?image_crop_resized=960x540',
};

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
    const src = POSTERS[id] || (poster ? posterSrc(poster) : `https://fast.wistia.net/embed/medias/${id}/thumbnail-640.webp`)
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
