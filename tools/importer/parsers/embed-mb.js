/* eslint-disable */
/* global WebImporter */

/**
 * Parser for embed-mb (block: embed) - standalone Wistia players.
 * Source: div.embeded-video__wrapper on mybeckman.in (biomanufacturing,
 * cell-line-development, analytical-ultracentrifugation x2):
 *   div.embeded-video__wrapper > div.wistia-video__wrapper[data-video-id][data-title]
 *     + the Wistia player DOM injected at runtime (chrome text such as
 *       "Press O for more options", "Click for sound", durations: not content)
 * The surrounding div.embeded-video > h2 and p.embeded-video__caption stay
 * default content (the instance root is the inner wrapper).
 *
 * Library convention (Embed): 1 column, block name row + a row with the URL
 * of the external content. The local block adds an optional title row.
 * xwalk model `embed`: url (aem-content), title (text).
 *
 * Row 1: <a href="https://fast.wistia.net/embed/iframe/{data-video-id}">
 * Row 2: frame title (plain text): the Wistia video title (oEmbed, tidied for
 *        the known ids), else the player's "Play Video: <title>" label, else
 *        data-title.
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

const WISTIA_RE = /wistia\.(?:net|com)\/(?:embed\/(?:iframe|medias)|medias)\/([A-Za-z0-9]+)/i;

// Wistia video titles (oEmbed), tidied for use as iframe titles
const TITLES = {
  fdbmwymdzr: 'Biomanufacturing: Lesaffre Testimonial',
  '1nyrf4wf4x': 'Cell Line Development',
  sqikwqhhpb: 'Introduction to AUC-101',
  vglm8ingg7: 'AUC Customer Testimonial',
};

function videoId(element) {
  const holder = element.matches('[data-video-id]') ? element : element.querySelector('[data-video-id]');
  if (holder && clean(holder.getAttribute('data-video-id'))) return clean(holder.getAttribute('data-video-id'));
  const player = element.querySelector('wistia-player[media-id]');
  if (player && /^[a-z0-9]+$/i.test(clean(player.getAttribute('media-id')))) return clean(player.getAttribute('media-id'));
  const iframe = [...element.querySelectorAll('iframe[src]')].find((f) => WISTIA_RE.test(f.getAttribute('src')));
  if (iframe) return iframe.getAttribute('src').match(WISTIA_RE)[1];
  const async = element.querySelector('[class*="wistia_async_"]');
  const m = async && async.className.match(/wistia_async_([a-z0-9]+)/i);
  return m ? m[1] : '';
}

function playerTitle(element) {
  const labelled = [...element.querySelectorAll('[aria-label^="Play Video:"]')]
    .map((el) => clean(el.getAttribute('aria-label').replace(/^Play Video:\s*/, '')))
    .find(Boolean);
  return labelled || '';
}

export default function parse(element, { document }) {
  const id = videoId(element);
  const cells = [];

  // ---- row 1: url ----------------------------------------------------------
  if (id) {
    const url = `https://fast.wistia.net/embed/iframe/${id}`;
    const a = document.createElement('a');
    a.href = url;
    a.textContent = url;
    cells.push([[document.createComment(' field:url '), a]]);
  } else {
    cells.push(['']);
  }

  // ---- row 2: title -----------------------------------------------------------
  const holder = element.querySelector('[data-video-id]');
  const dataTitle = clean(holder && holder.getAttribute('data-title'));
  const title = TITLES[id] || playerTitle(element) || dataTitle;
  if (title) {
    cells.push([[document.createComment(' field:title '), document.createTextNode(title)]]);
  } else {
    cells.push(['']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'embed', cells });
  element.replaceWith(block);
}
