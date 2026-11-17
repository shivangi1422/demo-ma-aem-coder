/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-jumplinks (Columns block, jumplinks option).
 * Source: https://www.mybeckman.in/resources/disease-research/leukemia-and-lymphoma
 *   (bar of 5 in-page links: .bc-rich-text > .sticky > .sticky-menu-item > a)
 * Selector: .bc-rich-text > .sticky
 * Model: columns (no field hints for Columns blocks); option class "jumplinks".
 * Library convention: one row with one cell per column; here one cell per link
 * (plain links, not buttons).
 * Anchors: the source ids sit on the banner wrappers (e.g. #diagnostic-tool); the
 * migrated banner (hero-centered strip) takes its anchor from its heading text, so
 * each href is rewritten to the slug of the target's heading
 * ("Flow Cytometry as a Diagnostic Tool" -> #flow-cytometry-as-a-diagnostic-tool).
 */

const slug = (text) => (text || '').trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function parse(element, { document }) {
  const links = Array.from(element.querySelectorAll('a[href]'));
  const row = links.map((a) => {
    let href = a.getAttribute('href');
    if (href.startsWith('#')) {
      const target = document.getElementById(href.slice(1));
      const heading = target && target.querySelector('h1, h2, h3');
      if (heading) href = `#${slug(heading.textContent)}`;
    }
    const link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = a.textContent.trim();
    const p = document.createElement('p');
    p.appendChild(link);
    return [p];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (jumplinks)', cells: [row] });
  element.replaceWith(block);
}
