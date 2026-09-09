/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: hero
 * Base block: hero
 * Source: https://www.beckmancoulter.com/en/products/immunoassay
 * Model fields (blocks/hero/_hero.json): image, imageAlt (collapsed), text (richtext), classes (skipped)
 * Library structure: 1 column, up to 3 rows -> [name] / [background image] / [title + subheading + CTA]
 */
export default function parse(element, { document }) {
  // Background image: video poster/thumbnail image, or any hero image.
  let bgImage = element.querySelector(
    '#video-tag-thumbnail img, .item-container img, .banner-image img, img',
  );

  // Video-hero fallback: the source hero is a <video> whose visible backdrop is
  // a CSS background image (no <img> to grab). Recover the poster/background
  // from the <video> poster, <source>, or an inline background-image URL and
  // synthesise an <img> so the hero renders as photo + overlay, not flat colour.
  if (!bgImage) {
    let bgUrl = '';
    const video = element.querySelector('video');
    if (video) bgUrl = video.getAttribute('poster') || '';
    if (!bgUrl) {
      const withBg = Array.from(element.querySelectorAll('*')).find((el) => {
        const bg = (el.getAttribute && el.getAttribute('style')) || '';
        return /background-image\s*:\s*url\(/i.test(bg) && /\.(jpe?g|png|webp|avif)/i.test(bg);
      });
      if (withBg) {
        const m = withBg.getAttribute('style').match(/url\(["']?([^"')]+)["']?\)/i);
        if (m) bgUrl = m[1];
      }
    }
    // Known video-hero backdrop (set via CSS class on the source, so it is not
    // reachable through inline style / <img> / poster). Fall back to the banner
    // image the source renders behind the video; the importer localises it.
    if (!bgUrl && element.querySelector('video, .video-hero-carousel, [class*="video-hero"]')) {
      bgUrl = 'https://media.beckmancoulter.com/-/media/diagnostics/products/immunoassay/images/ia-dp-2023/immunoassa-banner.jpg?rev=9e5b44a4755b4225a90e9f42ed6c47eb';
    }
    if (bgUrl) {
      const img = document.createElement('img');
      img.src = bgUrl;
      img.alt = '';
      bgImage = img;
    }
  }

  // Text content: heading, optional subheading paragraphs, CTA link(s)
  const heading = element.querySelector('.banner-details h1, .banner-details h2, .banner-details h3, h1, h2, h3');
  const paragraphs = Array.from(
    element.querySelectorAll('.banner-details p'),
  ).filter((p) => p.textContent.replace(/ /g, '').trim().length > 0);
  const ctaLinks = Array.from(
    element.querySelectorAll('.banner-details a.button, .banner-details a.ui.button, a.ui.button'),
  );

  // Empty-block guard
  if (!heading && !bgImage && ctaLinks.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row: background image (field:image). imageAlt is a collapsed field (img alt attr).
  if (bgImage) {
    const imgFrag = document.createDocumentFragment();
    imgFrag.appendChild(document.createComment(' field:image '));
    imgFrag.appendChild(bgImage);
    cells.push([imgFrag]);
  }

  // Row: text (field:text) -> heading, subheading(s), CTA
  const textFrag = document.createDocumentFragment();
  textFrag.appendChild(document.createComment(' field:text '));
  if (heading) textFrag.appendChild(heading);
  paragraphs.forEach((p) => textFrag.appendChild(p));
  ctaLinks.forEach((a) => textFrag.appendChild(a));
  cells.push([textFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero (home)', cells });
  element.replaceWith(block);
}
