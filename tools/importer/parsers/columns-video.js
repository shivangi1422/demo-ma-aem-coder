/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-video (block: columns, two columns, one row).
 * Source: div.social-proof-section (beckmancoulter.com dxs-service-and-supports pages).
 *
 * xwalk: core columns component (columns=2, rows=1); column children are
 * default content, so no field hints are emitted.
 *
 * Row 1: [text: <p>eyebrow</p> <h2>title</h2> <p>body</p> <p><a>Learn more</a></p>]
 *        | [video: poster <img> + <p><a href="https://play.vidyard.com/{uuid}">title</a></p>]
 * The source DOM lists the video first, but the page shows text left / video right
 * (CSS reorder), so the text column comes first. columns.js turns the
 * Vidyard link into a poster + inline player.
 */

const clean = (str) => (str || '').replace(/\s+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

const VIDYARD_RE = /(?:play|embed|share)\.vidyard\.com\/(?:watch\/)?([A-Za-z0-9_-]+)/i;

function vidyardUuid(root) {
  const withId = root.querySelector('[videoid], [uuid], [data-uuid]');
  if (withId) {
    const id = withId.getAttribute('videoid') || withId.getAttribute('uuid') || withId.getAttribute('data-uuid');
    if (clean(id)) return clean(id);
  }
  const link = [...root.querySelectorAll('a[href], iframe[src]')]
    .map((el) => el.getAttribute('href') || el.getAttribute('src'))
    .find((u) => VIDYARD_RE.test(u || ''));
  if (link) return link.match(VIDYARD_RE)[1];
  const cls = [...root.querySelectorAll('[class*="vidyard-div-"]')]
    .map((el) => (el.className.match(/vidyard-div-([A-Za-z0-9_-]+)/) || [])[1])
    .find(Boolean);
  return cls || '';
}

export default function parse(element, { document }) {
  const card = element.querySelector('.social-proof-card') || element;
  const mediaWrap = card.querySelector('.image') || card;
  const contentWrap = card.querySelector('.content') || card;

  // ---- text column ----------------------------------------------------------
  const textCol = [];
  const titleEl = contentWrap.querySelector('h1, h2, h3');
  if (titleEl) {
    const labels = [...titleEl.querySelectorAll('.label')]
      .map((l) => clean(l.textContent)).filter(Boolean);
    if (labels.length) {
      const eyebrow = document.createElement('p');
      eyebrow.textContent = labels.join(' ');
      textCol.push(eyebrow);
    }
    const clone = titleEl.cloneNode(true);
    clone.querySelectorAll('.label').forEach((l) => l.remove());
    const titleText = clean(clone.textContent);
    if (titleText) {
      const h2 = document.createElement('h2');
      h2.textContent = titleText;
      textCol.push(h2);
    }
  }
  contentWrap.querySelectorAll('p').forEach((srcP) => {
    const text = clean(srcP.textContent);
    if (!text) return;
    const p = document.createElement('p');
    const link = srcP.querySelector('a');
    if (link && clean(link.textContent) === text) {
      const href = link.getAttribute('href');
      if (isUsableHref(href)) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = text;
        p.append(a);
      } else {
        p.textContent = text;
      }
    } else {
      p.textContent = text;
    }
    textCol.push(p);
  });

  // ---- video column ---------------------------------------------------------
  const videoCol = [];
  const uuid = vidyardUuid(mediaWrap) || vidyardUuid(card);
  const posterSrc = [...mediaWrap.querySelectorAll('img')]
    .map((i) => i.getAttribute('src'))
    .find((s) => s && !/^data:/i.test(s));
  const videoTitle = clean([
    titleEl && [...titleEl.querySelectorAll('.label')].map((l) => clean(l.textContent)).filter(Boolean).join(' '),
    textCol.find((n) => n.tagName === 'H2') && textCol.find((n) => n.tagName === 'H2').textContent,
  ].filter(Boolean).join(': '));
  if (uuid) {
    const img = document.createElement('img');
    img.src = posterSrc || `https://play.vidyard.com/${uuid}.jpg`;
    img.alt = videoTitle ? `${videoTitle.split(':')[0]} video` : 'Video';
    videoCol.push(img);
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = `https://play.vidyard.com/${uuid}`;
    a.textContent = videoTitle || a.href;
    p.append(a);
    videoCol.push(p);
  } else if (posterSrc) {
    const img = document.createElement('img');
    img.src = posterSrc;
    img.alt = '';
    videoCol.push(img);
  }

  const cells = [[textCol.length ? textCol : '', videoCol.length ? videoCol : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
