/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-home-mb (block: hero, Style option: home).
 * Sources on mybeckman.in resource pages (1 per page):
 *   1. div.top-banner > img + div#innertext1 > h1 [+ p tagline with <b>A</b>ccurate...]
 *      (monoclonal-antibodies, cell-line-development, analytical-ultracentrifugation;
 *      div.dark-overlay is removed by the cleanup)
 *   2. div.outimg > div.largebanner > img + div#topbannertext > h1 + h2 (tagline)
 *      (synthetic-biology; div.smallbanner mobile crop removed by the cleanup)
 *   3. div.section > h1 + iframe.responsive-iframe (Wistia background video)
 *      [+ div#subhead > p + div.eCardContainer > div.e-cards > p > strong > a CTAs]
 *      (biomanufacturing, next-generation-sequencing; div.color-overlay removed)
 *
 * Library convention (Hero): 1 column, block name row + 2 content rows:
 *   Row 1: background image (optional)
 *   Row 2: title (heading), subheading, call-to-action
 * xwalk model `hero`: image (reference, imageAlt collapsed), text (richtext), classes.
 *
 * Top banners without div.dark-overlay (tagged data-mb-tone="light" by the
 * cleanup) are emitted as "hero (light)": centred red title, no overlay.
 *
 * Row 1: banner image. Video banners have no poster in the DOM: the Wistia
 *        poster frame (oEmbed thumbnail_url, resolved once for the two known
 *        ids, else the Wistia swatch) is authored as the image. The hero has
 *        no video field; the background video
 *        (https://fast.wistia.net/embed/iframe/{id}) is not migrated.
 * Row 2: h1 + tagline / subtitle paragraphs (a heading after the h1 becomes a
 *        paragraph; inline bold kept) + CTA paragraphs (bold link = button;
 *        in-page anchors were rewritten by the cleanup).
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

const isUsableHref = (href) => !!href && href.trim() !== '' && href.trim() !== '#'
  && !/^javascript:/i.test(href.trim());

const WISTIA_RE = /wistia\.(?:net|com)\/(?:embed\/(?:iframe|medias)|medias)\/([A-Za-z0-9]+)/i;

// Wistia oEmbed thumbnail_url (https://fast.wistia.com/oembed?url=...)
const WISTIA_POSTERS = {
  '1pmra0z1g5': 'https://embed-ssl.wistia.com/deliveries/5dd736fef9e33dadee202947e3458ca8c4d58741.jpg?image_crop_resized=960x540',
  '1md9wyt5z3': 'https://embed-ssl.wistia.com/deliveries/409cbdc255c1a944ebc233d2115f98e6a326cc45.jpg?image_crop_resized=960x540',
};

/** copies inline content (text, links, bold, italics, sup/sub) */
function copyInline(src, dest, document) {
  src.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      dest.append(document.createTextNode(node.textContent.replace(/\s+/g, ' ')));
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = node.tagName;
    if (/^(SCRIPT|STYLE|NOSCRIPT|IFRAME|VIDEO|IMG|SVG|BR|BUTTON)$/.test(tag)) {
      if (tag === 'BUTTON' || tag === 'BR') dest.append(document.createTextNode(` ${clean(node.textContent)} `));
      return;
    }
    if (!clean(node.textContent)) return;
    if (tag === 'A') {
      const href = node.getAttribute('href');
      if (isUsableHref(href)) {
        const a = document.createElement('a');
        a.href = href.trim();
        copyInline(node, a, document);
        dest.append(a);
      } else {
        copyInline(node, dest, document);
      }
      return;
    }
    if (/^(STRONG|B|EM|I|SUP|SUB)$/.test(tag)) {
      const name = { B: 'strong', I: 'em' }[tag] || tag.toLowerCase();
      const el = document.createElement(name);
      copyInline(node, el, document);
      dest.append(el);
      return;
    }
    copyInline(node, dest, document);
  });
}

function trimEdges(el) {
  const first = el.firstChild;
  if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
  const last = el.lastChild;
  if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
  return el;
}

export default function parse(element, { document }) {
  const cells = [];
  const title = element.querySelector('h1') || element.querySelector('h2');

  // ---- row 1: background image ------------------------------------------
  const srcImg = element.querySelector('.largebanner img[src]')
    || [...element.querySelectorAll('img[src]')].find((img) => !img.closest('.smallbanner'));
  const iframe = element.querySelector('iframe.responsive-iframe, iframe[src*="wistia"]');
  const videoId = iframe && ((iframe.getAttribute('src') || '').match(WISTIA_RE) || [])[1];
  let imageSrc = '';
  let imageAlt = '';
  if (srcImg) {
    imageSrc = srcImg.getAttribute('src');
    imageAlt = clean(srcImg.getAttribute('alt'));
  } else if (videoId) {
    imageSrc = WISTIA_POSTERS[videoId] || `https://fast.wistia.com/embed/medias/${videoId}/swatch`;
  }
  if (imageSrc) {
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = imageAlt;
    cells.push([[document.createComment(' field:image '), img]]);
  } else {
    cells.push(['']);
  }

  // ---- row 2: heading, tagline, CTAs ---------------------------------------
  const text = [];
  if (title && clean(title.textContent)) {
    const h1 = document.createElement('h1');
    h1.textContent = clean(title.textContent);
    text.push(h1);
  }
  const seen = new Set();
  [...element.querySelectorAll('h1, h2, h3, h4, h5, h6, p')].forEach((el) => {
    if (el === title || el.closest('.smallbanner')) return;
    if ([...seen].some((s) => s.contains(el))) return;
    seen.add(el);
    if (!clean(el.textContent)) return;
    const p = document.createElement('p');
    copyInline(el, p, document);
    trimEdges(p);
    if (clean(p.textContent)) text.push(p);
  });
  if (text.length) {
    cells.push([[document.createComment(' field:text '), ...text]]);
  } else {
    cells.push(['']);
  }

  // light banner photo with a red title (tagged by mybeckman-cleanup)
  const light = element.matches('[data-mb-tone="light"]') || !!element.querySelector('[data-mb-tone="light"]');
  const block = WebImporter.Blocks.createBlock(document, { name: light ? 'hero (light)' : 'hero (home)', cells });
  element.replaceWith(block);
}
