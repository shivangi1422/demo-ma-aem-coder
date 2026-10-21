/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-grid-showcase (block: cards-grid, Style option: showcase).
 * Sources (beckmancoulter.com solutions pages):
 *  - div.double-showcase-feature  : background + text-only cards (Cepheid / Radiometer)
 *  - div.tripple-showcase-feature : background + h2/sub-header + 3 photo cards
 *
 * xwalk container model `cards-grid`: text (richtext), image (reference), classes.
 * Item model `cards-grid-item`: image (reference, imageAlt collapsed), text (richtext).
 *
 * Row 1: heading / intro (h2 + sub-header p) - empty when the source has none
 * Row 2: background image (CSS background of div.floating-bg)
 * Rows 3..N: card image (optional) | h3 title + description + "Learn more" CTA
 *
 * CTA href: the anchor's href; photo cards carry no href on the button, so the
 * card's onclick="window.location.href='...'" destination is used. When no
 * destination exists the CTA text is kept without a link.
 */

const clean = (str) => (str || '').replace(/\s+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

function bgUrl(el) {
  if (!el) return '';
  const style = el.getAttribute('style') || '';
  const re = /url\(\s*['"]?([^'")]*)['"]?\s*\)/gi;
  let m;
  while ((m = re.exec(style))) {
    const url = m[1].replace(/&amp;/g, '&').trim();
    if (url) return url;
  }
  return '';
}

/** background-image set by a stylesheet (live DOM only) */
function computedBgUrl(el, document) {
  try {
    const view = document.defaultView;
    if (!el || !view || !view.getComputedStyle) return '';
    const value = view.getComputedStyle(el).backgroundImage || '';
    const m = value.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    return m ? m[1] : '';
  } catch (e) {
    return '';
  }
}

function onclickHref(el) {
  const holder = el && (el.matches('[onclick]') ? el : el.closest('[onclick]') || el.querySelector('[onclick]'));
  const onclick = holder ? holder.getAttribute('onclick') || '' : '';
  const m = onclick.match(/location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i);
  return m ? m[1] : '';
}

function para(document, text) {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

function ctaPara(document, text, href) {
  const p = document.createElement('p');
  if (isUsableHref(href)) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    p.append(a);
  } else {
    p.textContent = text;
  }
  return p;
}

export default function parse(element, { document }) {
  const cells = [];

  // ---- row 1: heading / intro ------------------------------------------
  const intro = [];
  const introHeading = element.querySelector('.intro-content h1, .intro-content h2, .intro-content h3');
  if (introHeading) {
    const headingClone = introHeading.cloneNode(true);
    headingClone.querySelectorAll('.sub-header, .data-uw-rm-autofix-hide').forEach((s) => s.remove());
    const headingText = clean(headingClone.textContent);
    if (headingText && !/^empty heading$/i.test(headingText)) {
      const h2 = document.createElement('h2');
      h2.textContent = headingText;
      intro.push(h2);
    }
  }
  element.querySelectorAll('.intro-content .sub-header, .intro-content > p').forEach((sub) => {
    const text = clean(sub.textContent);
    if (text) intro.push(para(document, text));
  });
  if (intro.length) {
    intro.unshift(document.createComment(' field:text '));
    cells.push([intro]);
  } else {
    cells.push(['']);
  }

  // ---- background image → section metadata "background" ---------------
  // Authored on the section (not the block) so the cards-grid model stays
  // compatible with existing pages; the block reads section.dataset.background.
  const bgEl = element.querySelector('.floating-bg') || element;
  const bgImg = element.querySelector('.floating-bg img');
  const bgSrc = bgEl.getAttribute('data-bg-src') || element.getAttribute('data-bg-src')
    || bgUrl(bgEl) || bgUrl(element)
    || (bgImg && bgImg.getAttribute('src')) || computedBgUrl(bgEl, document);
  let sectionMeta = null;
  if (bgSrc) {
    const img = document.createElement('img');
    img.src = bgSrc;
    img.alt = '';
    sectionMeta = WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: { background: img },
    });
  }

  // ---- items: one per .feature-content ---------------------------------
  let features = [...element.querySelectorAll('.feature-container > .feature-content')];
  if (!features.length) features = [...element.querySelectorAll('.showcase-feature, .photo-card')];

  features.forEach((feature) => {
    const card = feature.querySelector('.photo-card, .card') || feature.querySelector('.showcase-feature') || feature;

    // image
    const imageCell = [];
    const srcImg = card.querySelector('.image-card-box img, img');
    if (srcImg && srcImg.getAttribute('src')) {
      const img = document.createElement('img');
      img.src = srcImg.getAttribute('src');
      img.alt = clean(srcImg.getAttribute('alt'));
      imageCell.push(document.createComment(' field:image '), img);
    }

    // text
    const textCell = [];
    const titleEl = card.querySelector('.card-header-text, h1, h2, h3, h4');
    const title = clean(titleEl ? titleEl.textContent : '');
    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title;
      textCell.push(h3);
    }

    const descEls = [...card.querySelectorAll('.card-content-text, p')]
      .filter((el) => !el.closest('.explore-link') && !el.querySelector('a.button, a.btn-cta'));
    descEls.forEach((el) => {
      const text = clean(el.textContent);
      if (text) textCell.push(para(document, text));
    });

    const cta = card.querySelector('a.btn-cta, a.ui.button, .explore-link a');
    const ctaText = clean(cta ? cta.textContent : '');
    if (ctaText) {
      const href = (cta.getAttribute('href') || '').trim();
      textCell.push(ctaPara(document, ctaText, isUsableHref(href) ? href : onclickHref(card)));
    }

    if (textCell.length) textCell.unshift(document.createComment(' field:text '));
    if (!imageCell.length && !textCell.length) return;
    cells.push([imageCell.length ? imageCell : '', textCell.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-grid (showcase)', cells });
  if (sectionMeta) element.before(sectionMeta);
  element.replaceWith(block);
}
