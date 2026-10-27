/* eslint-disable */
/* global WebImporter */
/**
 * Parser: jump-nav (mybeckman.in home).
 * Source: #main > div.main-holder > nav.sticky... > div#scrollTo
 *   > a.scroll-to-nav-link[href="#latest|#topics|#events|#service|#about"] (x5)
 *       > div > img (data-URI arrow icon, decorative)
 *       > span (label)
 *
 * Block jump-nav (blocks/jump-nav/_jump-nav.json): collection of
 * jump-nav-link items (fields: link, linkText -> linkText collapses into the
 * link text). One row per link, 1 cell:
 *   field:link -> <a href="#anchor">Label</a>
 * Only links whose target is one of the section anchors set by the sections
 * transformer (latest, topics, service, about) are kept: "Upcoming events"
 * (#events) has no target on the page and is dropped.
 */

// Copy of page-templates.json sectionAnchors values (parsers do not get the template).
const SECTION_ANCHORS = ['latest', 'topics', 'service', 'about'];

function norm(s) {
  return (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function hint(document, name) {
  return document.createComment(` field:${name} `);
}

/** "#latest", "/#latest" or "https://site/#latest" -> "latest" */
function anchorOf(href) {
  const h = (href || '').trim();
  const i = h.indexOf('#');
  return i >= 0 ? h.slice(i + 1) : '';
}

export default function parse(element, { document }) {
  const cells = [];
  const seen = new Set();
  element.querySelectorAll('a[href]').forEach((a) => {
    const anchor = anchorOf(a.getAttribute('href'));
    if (!SECTION_ANCHORS.includes(anchor) || seen.has(anchor)) return;
    const labelEl = a.querySelector('span');
    const label = norm((labelEl || a).textContent);
    if (!label) return;
    seen.add(anchor);
    const link = document.createElement('a');
    link.setAttribute('href', `#${anchor}`);
    link.textContent = label;
    cells.push([[hint(document, 'link'), link]]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'jump-nav', cells });
  element.replaceWith(block);
}
