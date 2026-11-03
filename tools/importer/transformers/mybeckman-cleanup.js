/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for www.mybeckman.in (Sitecore) FAQ article pages.
 * beforeTransform: remove site chrome and normalize the article text column
 * so the parsers receive clean, authorable markup.
 * afterTransform: final removal of leftover non-authorable nodes.
 */

const CHROME_SELECTORS = [
  'header',
  '.GlobalHeader',
  '#mainNav',
  '.MegaMenu',
  '.DropPanel',
  '.CoveoExternalComponentSection',
  '[class*="Coveo"]',
  '.skip-to-main-content-link',
  '.footer2023',
  'footer',
  '#consent_blackbar',
  '#truste-consent-track',
  '#trustarc-banner-overlay',
  '[id^="truste"]',
  '.MaskOverlay',
  '#ModalPopup',
  '.flash-message',
  '#mktoStyleLoaded',
  'form.mktoForm',
  'iframe[id^="font-resize-frame-"]',
  'iframe.font-resize-helper',
  '#MktoForms2XDIframe',
  '.col-md-3.col-md-offset-1',
  'aside.faq-sidebar',
  'script',
  'noscript',
  'style',
  'link',
  'input',
];

const BLOCK_TAGS = new Set([
  'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'DL', 'DIV', 'TABLE',
  'BLOCKQUOTE', 'PRE', 'HR', 'FIGURE', 'SECTION', 'ARTICLE', 'ASIDE', 'NAV',
  'FORM', 'HEADER', 'FOOTER', 'MAIN', 'PICTURE', 'VIDEO', 'IFRAME',
]);

const VIDEO_IFRAME = /(fast\.wistia\.(net|com)|youtube(-nocookie)?\.com|youtu\.be|player\.vimeo\.com)/i;

function isBlock(node) {
  return node.nodeType === 1 && BLOCK_TAGS.has(node.tagName);
}

function isMediaOnly(node) {
  // inline element (span/a) whose only meaningful content is an image
  return node.nodeType === 1
    && node.tagName !== 'BR'
    && (node.tagName === 'IMG' || node.querySelector('img'))
    && !node.textContent.replace(/ /g, ' ').trim();
}

function hasMedia(el) {
  return !!el.querySelector('img, picture, iframe, video');
}

function isBlankText(str) {
  return !str.replace(/ /g, ' ').trim();
}

function videoLinkFor(document, src) {
  let href = src;
  try {
    const url = new URL(src, 'https://www.mybeckman.in');
    if (/wistia/i.test(url.hostname)) {
      const id = url.pathname.split('/').filter(Boolean).pop();
      href = `https://fast.wistia.net/embed/iframe/${id}`;
    } else if (/youtube/i.test(url.hostname) && url.pathname.startsWith('/embed/')) {
      href = `https://www.youtube.com/watch?v=${url.pathname.split('/').filter(Boolean).pop()}`;
    } else if (/vimeo/i.test(url.hostname)) {
      href = `https://vimeo.com/${url.pathname.split('/').filter(Boolean).pop()}`;
    } else {
      url.search = '';
      href = url.href;
    }
  } catch (e) { /* keep raw src */ }
  const a = document.createElement('a');
  a.href = href;
  if (/wistia/i.test(href)) a.textContent = 'Wistia video player';
  else if (/youtube/i.test(href)) a.textContent = 'YouTube video player';
  else a.textContent = 'Vimeo video player';
  return a;
}

function replaceVideos(document, root) {
  // Wistia responsive embeds
  root.querySelectorAll('div.wistia_responsive_padding').forEach((wrap) => {
    const iframe = wrap.querySelector('iframe[src]');
    if (!iframe) { wrap.remove(); return; }
    const p = document.createElement('p');
    p.append(videoLinkFor(document, iframe.getAttribute('src')));
    wrap.replaceWith(p);
  });
  // any remaining video iframes (YouTube / Vimeo / bare Wistia)
  root.querySelectorAll('iframe[src]').forEach((iframe) => {
    const src = iframe.getAttribute('src');
    if (!VIDEO_IFRAME.test(src)) return;
    const a = videoLinkFor(document, src);
    if (iframe.parentElement && iframe.parentElement.tagName === 'P') {
      iframe.replaceWith(a);
    } else {
      const p = document.createElement('p');
      p.append(a);
      iframe.replaceWith(p);
    }
  });
}

function unwrap(el) {
  el.replaceWith(...el.childNodes);
}

function cleanInline(root) {
  // empty anchors: no href and no text/media
  root.querySelectorAll('a').forEach((a) => {
    if (!a.getAttribute('href') && isBlankText(a.textContent) && !hasMedia(a)) a.remove();
  });
  // inline styles
  root.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));
  // presentational spans (no attributes left once style is gone)
  [...root.querySelectorAll('span')].reverse().forEach((span) => {
    if (span.attributes.length === 0) unwrap(span);
  });
}

function trimBreaks(nodes) {
  const isTrimmable = (n) => (n.nodeType === 3 && isBlankText(n.textContent))
    || (n.nodeType === 1 && n.tagName === 'BR');
  while (nodes.length && isTrimmable(nodes[0])) nodes.shift();
  while (nodes.length && isTrimmable(nodes[nodes.length - 1])) nodes.pop();
  return nodes;
}

/**
 * Wrap runs of inline content (text nodes, inline elements, <br>) that sit
 * directly in a text container into <p>. Image-only inline elements get a
 * paragraph of their own. Plain <div> children holding only inline content
 * (e.g. <div><img></div>) become <p>.
 */
function wrapInlineRuns(document, container) {
  // plain divs with only inline content -> p
  [...container.children].forEach((child) => {
    if (child.tagName !== 'DIV' || child.className || child.id) return;
    if ([...child.children].some(isBlock)) return;
    const p = document.createElement('p');
    p.append(...child.childNodes);
    child.replaceWith(p);
  });

  const nodes = [...container.childNodes];
  let run = [];
  const flush = (before) => {
    const content = trimBreaks(run);
    run = [];
    if (!content.length) return;
    if (content.every((n) => n.nodeType !== 1 && isBlankText(n.textContent || ''))) return;
    const p = document.createElement('p');
    if (before) container.insertBefore(p, before); else container.append(p);
    p.append(...content);
  };
  nodes.forEach((node) => {
    if (node.nodeType === 8) return; // leave comments in place
    if (isBlock(node)) {
      flush(node);
      return;
    }
    if (isMediaOnly(node)) {
      flush(node);
      const p = document.createElement('p');
      container.insertBefore(p, node);
      p.append(node);
      return;
    }
    run.push(node);
  });
  flush(null);
  // drop stray whitespace / <br> runs that were trimmed away
  [...container.childNodes].forEach((n) => {
    if (n.nodeType === 3 && isBlankText(n.textContent)) n.remove();
    else if (n.nodeType === 1 && n.tagName === 'BR') n.remove();
  });
}

function removeEmptyParagraphs(root) {
  root.querySelectorAll('p').forEach((p) => {
    if (isBlankText(p.textContent) && !hasMedia(p)) p.remove();
  });
}

function textContainers(root) {
  const holder = root.querySelector('#content-holder');
  if (!holder) return [];
  const cols = [...holder.querySelectorAll('.col-md-8, .col-sm-8, .col-md-12, .col-xs-12')];
  return cols.length ? cols : [holder];
}

export default function transform(hookName, element, payload) {
  const document = element.ownerDocument || (payload && payload.document);

  if (hookName === 'beforeTransform') {
    // video embeds first: generic iframe cleanup must not swallow them
    const holder = element.querySelector('#content-holder');
    if (holder) replaceVideos(document, holder);

    WebImporter.DOMUtils.remove(element, CHROME_SELECTORS);
    // any non-video iframe left outside the article
    element.querySelectorAll('iframe').forEach((f) => {
      if (!holder || !holder.contains(f)) f.remove();
    });

    if (holder) {
      cleanInline(holder);
      textContainers(element).forEach((col) => wrapInlineRuns(document, col));
      // unwrap remaining classed presentational spans (e.g. span.image-align-right)
      [...holder.querySelectorAll('span[class]')].reverse().forEach((span) => {
        if (/image-align|align-/.test(span.className)) unwrap(span);
      });
      removeEmptyParagraphs(holder);
    }

    // tracking / handler attributes
    element.querySelectorAll('[onclick], [onload], [data-gtm], [data-analytics]').forEach((el) => {
      ['onclick', 'onload', 'data-gtm', 'data-analytics'].forEach((a) => el.removeAttribute(a));
    });
  }

  if (hookName === 'afterTransform') {
    WebImporter.DOMUtils.remove(element, [
      'script',
      'noscript',
      'style',
      'link',
      'input',
      'form',
      'iframe',
      '.MaskOverlay',
      '#ModalPopup',
      '.footer2023',
      '#consent_blackbar',
    ]);
  }
}
