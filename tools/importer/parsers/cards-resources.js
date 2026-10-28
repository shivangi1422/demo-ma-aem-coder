/* eslint-disable */
/* global WebImporter */

/**
 * Parser for `cards-resources` (GSPANN insights resource scroller).
 * Source: div.rc-track > div.rc-slide > article.resource-card > a.resource-card-link
 *   .resource-card-image img | .resource-card-content: span.resource-type-badge,
 *   h3.resource-card-title, p.resource-card-excerpt, span.resource-card-readmore
 * Output (xwalk model cards-resources-item: image, imageAlt, text), one row per card:
 *   [ <!-- field:image --> img | <!-- field:text --> p badge, H3, p excerpt, p>a "Read More" ]
 * The whole source card is one link; it is rebuilt as the "Read More" link on a
 * site-relative /insights/... path.
 */

function cleanImageSrc(src) {
  if (!src) return '';
  const next = src.match(/_next\/image\?(?:.*&)?url=([^&]+)/);
  let url = next ? decodeURIComponent(next[1]) : src;
  if (/cdn\.sanity\.io\/.+\.svg$/i.test(url)) url += '?fm=png&w=400';
  return url;
}

/** Keep GSPANN-internal links site-relative (the importer may absolutise them to its own host). */
function relativeHref(href) {
  if (!href) return '';
  try {
    const u = new URL(href, 'https://www.gspann.com');
    if (/(^|\.)gspann\.com$|^localhost$|^127\.0\.0\.1$/.test(u.hostname)) {
      return `${u.pathname}${u.search}${u.hash}`;
    }
    return u.href;
  } catch (e) {
    return href;
  }
}

export default function parse(element, { document }) {
  const cells = [];

  element.querySelectorAll('.resource-card').forEach((card) => {
    const srcImg = card.querySelector('.resource-card-image img');
    let imageCell = '';
    if (srcImg) {
      const img = document.createElement('img');
      img.src = cleanImageSrc(srcImg.getAttribute('src'));
      img.alt = srcImg.getAttribute('alt') || '';
      imageCell = [document.createComment(' field:image '), img];
    }

    const text = [];
    const badge = card.querySelector('.resource-type-badge');
    if (badge && badge.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = badge.textContent.trim();
      text.push(p);
    }
    const title = card.querySelector('.resource-card-title');
    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title.textContent.trim();
      text.push(h3);
    }
    const excerpt = card.querySelector('.resource-card-excerpt');
    if (excerpt) {
      const p = document.createElement('p');
      p.textContent = excerpt.textContent.trim();
      text.push(p);
    }
    const linkEl = card.querySelector('a.resource-card-link') || card.closest('a');
    const href = relativeHref(linkEl?.getAttribute('href'));
    if (href) {
      const readMore = card.querySelector('.resource-card-readmore');
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = (readMore?.textContent || '').replace(/[→›]/g, '').trim() || 'Read More';
      p.append(a);
      text.push(p);
    }

    if (!imageCell && !text.length) return;
    cells.push([imageCell, text.length ? [document.createComment(' field:text '), ...text] : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-resources', cells });
  element.replaceWith(block);
}
