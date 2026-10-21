/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-media-list (base: cards).
 * Source: div.media-showcase-group (created by beckmancoulter-cleanup transformer)
 * wrapping consecutive div.media-showcase-simple rows. One block row per source row.
 *
 * Cell 1 (media_ group): media_image (img, alt collapsed) + optional media_link
 *   (video play URL for Vidyard rows).
 * Cell 2 (text, richtext): optional badge p, eyebrow p, h3 title (linked),
 *   description paragraph(s), optional CTA p with link.
 */

const clean = (str) => (str || '').replace(/\s+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#';

const isVideoHref = (href) => /vidyard\.com|youtube\.com|youtu\.be|vimeo\.com/i.test(href || '');

export default function parse(element, { document }) {
  const rows = element.matches('div.media-showcase-simple')
    ? [element]
    : [...element.querySelectorAll(':scope > div.media-showcase-simple')];
  const items = rows.length ? rows : [...element.querySelectorAll('div.media-showcase-simple')];

  const cells = [];

  items.forEach((row) => {
    const imageWrap = row.querySelector('.content-container > .image, .image');
    const content = row.querySelector('.content-container > .content, .content');

    // ---- collect links -------------------------------------------------
    const titleHeading = content ? content.querySelector('h1, h2, h3, h4, h5, h6') : null;
    const titleLink = titleHeading ? titleHeading.closest('a') : null;
    const ctaLink = content ? content.querySelector('a.btn-cta, a.ui.button') : null;
    const imageLink = imageWrap ? imageWrap.querySelector('a.media-link-image, a[href]') : null;

    const linkCandidates = [titleLink, ctaLink, imageLink].filter(Boolean);
    const primaryHref = (linkCandidates.map((a) => a.getAttribute('href')).find(isUsableHref)) || '';
    const isVideo = !!row.querySelector('.type-video, .vidyard-player-container, img.vidyard-lightbox-image')
      || isVideoHref(primaryHref);

    // ---- cell 1: image + optional video link ----------------------------
    const mediaCell = [];
    let srcImg = imageWrap
      ? imageWrap.querySelector('img.vidyard-lightbox-image, img')
      : null;
    if (!srcImg) srcImg = row.querySelector('img');
    let img = null;
    if (srcImg && srcImg.getAttribute('src')) {
      img = document.createElement('img');
      img.src = srcImg.getAttribute('src');
      img.alt = srcImg.getAttribute('alt') || '';
    } else if (isVideo && /vidyard\.com\/([^/?#.]+)/i.test(primaryHref)) {
      // poster fallback for Vidyard videos
      const id = primaryHref.match(/vidyard\.com\/([^/?#.]+)/i)[1];
      img = document.createElement('img');
      img.src = `https://play.vidyard.com/${id}.jpg`;
      img.alt = clean(titleHeading ? titleHeading.textContent : '');
    }
    if (img) {
      mediaCell.push(document.createComment(' field:media_image '));
      mediaCell.push(img);
    }
    if (isVideo && isUsableHref(primaryHref)) {
      const videoLink = document.createElement('a');
      videoLink.href = primaryHref;
      videoLink.textContent = primaryHref;
      mediaCell.push(document.createComment(' field:media_link '));
      mediaCell.push(videoLink);
    }

    // ---- cell 2: rich text ----------------------------------------------
    const textCell = [];

    // badge (e.g. NEW) - hidden tags have empty spans
    const badgeEl = row.querySelector('.card-tag:not(.hide) span, .card-tag span');
    const badgeText = clean(badgeEl ? badgeEl.textContent : '');
    if (badgeText) {
      const p = document.createElement('p');
      p.textContent = badgeText;
      textCell.push(p);
    }

    // eyebrow + title
    let titleText = '';
    if (titleHeading) {
      const label = titleHeading.querySelector('.label');
      const eyebrowText = clean(label ? label.textContent : '');
      if (eyebrowText) {
        const p = document.createElement('p');
        p.textContent = eyebrowText;
        textCell.push(p);
      }
      const headingClone = titleHeading.cloneNode(true);
      headingClone.querySelectorAll('.label').forEach((l) => l.remove());
      titleText = clean(headingClone.textContent);
    }
    if (titleText) {
      const h3 = document.createElement('h3');
      const titleHref = titleLink ? titleLink.getAttribute('href') : '';
      if (isUsableHref(titleHref)) {
        const a = document.createElement('a');
        a.href = titleHref;
        a.textContent = titleText;
        h3.append(a);
      } else {
        h3.textContent = titleText;
      }
      textCell.push(h3);
    }

    // description(s): paragraphs / quotes in document order
    if (content) {
      content.querySelectorAll('p, blockquote').forEach((el) => {
        if (el.closest('a')) return;
        if (el.tagName === 'P' && el.closest('blockquote')) return;
        if (!clean(el.textContent)) return;
        if (el.tagName === 'BLOCKQUOTE') {
          const bq = document.createElement('blockquote');
          bq.innerHTML = el.innerHTML;
          textCell.push(bq);
          return;
        }
        const p = document.createElement('p');
        // unwrap a single wrapper span, keep inline formatting (em/strong/links)
        const onlyChild = el.children.length === 1 && el.firstElementChild.tagName === 'SPAN'
          && clean(el.textContent) === clean(el.firstElementChild.textContent);
        p.innerHTML = (onlyChild ? el.firstElementChild.innerHTML : el.innerHTML).trim();
        p.querySelectorAll('a[href="#"], a:not([href])').forEach((a) => {
          a.replaceWith(document.createTextNode(a.textContent));
        });
        // intra-word emphasis (e.g. Auto<em>Mat</em>e) would split the word in markdown
        p.querySelectorAll('em, i, strong, b').forEach((el) => {
          const prev = el.previousSibling;
          const next = el.nextSibling;
          const prevWord = prev && prev.nodeType === 3 && /\w$/.test(prev.textContent);
          const nextWord = next && next.nodeType === 3 && /^\w/.test(next.textContent);
          if (prevWord || nextWord) el.replaceWith(document.createTextNode(el.textContent));
        });
        p.normalize();
        textCell.push(p);
      });
    }

    // CTA
    if (ctaLink) {
      const ctaText = clean(ctaLink.textContent);
      const ctaHref = ctaLink.getAttribute('href');
      if (ctaText) {
        const p = document.createElement('p');
        if (isUsableHref(ctaHref)) {
          const a = document.createElement('a');
          a.href = ctaHref;
          a.textContent = ctaText;
          if (ctaLink.getAttribute('title')) a.title = ctaLink.getAttribute('title');
          p.append(a);
        } else {
          p.textContent = ctaText;
        }
        textCell.push(p);
      }
    }

    if (textCell.length) textCell.unshift(document.createComment(' field:text '));

    cells.push([mediaCell.length ? mediaCell : '', textCell.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-media-list', cells });
  element.replaceWith(block);
}
