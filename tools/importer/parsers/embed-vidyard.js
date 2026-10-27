/* eslint-disable */
/* global WebImporter */

/**
 * Parser for embed-vidyard (block: embed).
 * Source: an inline Vidyard player inside default content - the instance is the
 * paragraph holding the iframe (p.VideoAdj on /en/solutions/hematology-solution):
 *   <p><iframe src="https://play.vidyard.com/{uuid}?" title="play-vidyard"></iframe></p>
 *
 * Library convention (Embed): 1 column, block name row + one row with a single
 * cell holding the URL of the external content (optional poster image above
 * the link). The local block (blocks/embed/README.md) adds an optional title
 * row, same as parsers/embed.js.
 * xwalk model `embed`: url (aem-content), title (text).
 *
 * Row 1: <a href="https://play.vidyard.com/{uuid}"> (query string dropped; the
 *        embed block builds the player URL itself). No poster image: the
 *        source has none.
 * Row 2: frame title - the iframe title unless it is a placeholder
 *        ("play-vidyard"), else "Video: {nearest heading before the player}".
 */

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

const VIDYARD_RE = /(?:play|embed|share)\.vidyard\.com\/(?:watch\/)?([A-Za-z0-9_-]+)/i;

const isGenericTitle = (title) => !title
  || /^(play[-\s]?vidyard|vidyard|iframe|embed|frame|video|player|untitled)$/i.test(title)
  || /^https?:\/\//i.test(title);

function headingBefore(element) {
  let node = element;
  for (let depth = 0; node && depth < 6; depth += 1) {
    let prev = node.previousElementSibling;
    while (prev) {
      const headings = /^H[1-6]$/.test(prev.tagName) ? [prev] : [...prev.querySelectorAll('h1, h2, h3, h4, h5, h6')];
      const h = headings.reverse().find((hd) => clean(hd.textContent) && !/^empty heading$/i.test(clean(hd.textContent)));
      if (h) return clean(h.textContent);
      prev = prev.previousElementSibling;
    }
    node = node.parentElement;
  }
  return '';
}

export default function parse(element, { document }) {
  const iframe = element.tagName === 'IFRAME' ? element : element.querySelector('iframe');
  const src = iframe ? (iframe.getAttribute('src') || iframe.getAttribute('data-src') || '') : '';
  const match = src.match(VIDYARD_RE);
  const url = match ? `https://play.vidyard.com/${match[1]}` : src.trim();

  const cells = [];

  // ---- row 1: url ----------------------------------------------------------
  if (url) {
    const a = document.createElement('a');
    a.href = url;
    a.textContent = url;
    cells.push([[document.createComment(' field:url '), a]]);
  } else {
    cells.push(['']);
  }

  // ---- row 2: title (local block extension) --------------------------------
  const iframeTitle = clean(iframe && iframe.getAttribute('title'));
  const heading = headingBefore(element);
  const title = !isGenericTitle(iframeTitle) ? iframeTitle : (heading ? `Video: ${heading}` : '');
  if (title) {
    cells.push([[document.createComment(' field:title '), document.createTextNode(title)]]);
  } else {
    cells.push(['']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'embed', cells });
  element.replaceWith(block);
}
