/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: cards-grid
 * Base block: cards-grid (container)
 * Source: https://www.beckmancoulter.com/en/products/immunoassay
 * Model (blocks/cards-grid/_cards-grid.json):
 *   container cards-grid: text (richtext heading/intro), classes (skipped)
 *   item cards-grid-item: image (reference), imageAlt (collapsed), text (richtext)
 * Handles two source shapes:
 *   1) Value-prop icon features: `.column` cards with icon <img> + <strong> title + description.
 *   2) Analyzer product cards: `.product-card` with thumbnail <img> + label + <h3> + <p> + CTA.
 * Library structure: row 0 = block name; optional heading/intro row (container text);
 *   one row per card with [image cell, text cell].
 */
export default function parse(element, { document }) {
  const isPlaceholder = (t) => !t || /^\s*(empty heading)?\s*$/i.test(t);

  // Container heading / intro (field:text) — skip auto-generated "Empty heading"
  // placeholders. Also match the data-visualization intro (`.dv-header`) used by
  // the stat-card section.
  let headingEl = Array.from(
    element.querySelectorAll(':scope > .content-container > .heading h1, :scope > .content-container > .heading h2, :scope .heading > h1, :scope .heading > h2, :scope .dv-header h1, :scope .dv-header h2, :scope .carousel-heading'),
  ).find((h) => !isPlaceholder(h.textContent));
  const introEl = element.querySelector(':scope .dv-sub-header');

  // If the grid has no heading of its own, adopt a heading from the immediately
  // preceding sibling section (the source keeps the section title in a separate
  // node before the card grid — e.g. "Service Solutions and Resources…"). Remove
  // that sibling so it isn't also emitted as a standalone block.
  let adoptedHeadingSibling = null;
  if (!headingEl) {
    // Walk back past <hr> section-break markers (inserted by the sections
    // transformer before parsers run) and empty nodes to the real heading node.
    let prev = element.previousElementSibling;
    let hops = 0;
    while (prev && hops < 4) {
      const isBreak = prev.tagName === 'HR' || !prev.textContent.trim();
      if (!isBreak) {
        const h = prev.matches && prev.matches('h1, h2, h3')
          ? prev
          : (prev.querySelector && Array.from(prev.querySelectorAll('h1, h2, h3'))
            .find((el) => !isPlaceholder(el.textContent)));
        // Adopt ONLY when the sibling is a standalone heading node — i.e. it
        // contains nothing but headings (e.g. dxs "Service Solutions and
        // Resources…", preceded by an auto "Empty heading" placeholder). This
        // avoids stealing a heading out of a richer block like a hero (which
        // also carries a CTA / body copy alongside its title).
        // "Standalone" = the sibling's entire visible text is just its
        // heading(s); once every h1-h6 is removed, no other text remains.
        let onlyHeadings = false;
        if (h && prev.cloneNode) {
          const clone = prev.cloneNode(true);
          clone.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => el.remove());
          onlyHeadings = clone.textContent.replace(/\s+/g, ' ').trim() === '';
        }
        if (h && !isPlaceholder(h.textContent) && onlyHeadings) {
          headingEl = h;
          adoptedHeadingSibling = prev;
        }
        break;
      }
      prev = prev.previousElementSibling;
      hops += 1;
    }
  }

  const cells = [];

  if (headingEl) {
    const headFrag = document.createDocumentFragment();
    headFrag.appendChild(document.createComment(' field:text '));
    headFrag.appendChild(headingEl);
    // Fold the dv intro paragraph into the heading cell so it isn't dropped.
    // Strip source hard-wrap <br>s so the sentence flows as one line.
    if (introEl && introEl.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = introEl.textContent.replace(/\s+/g, ' ').trim();
      headFrag.appendChild(p);
    }
    cells.push([headFrag]);
  }

  // Determine card set: product cards, then data-viz "chart-feature" stat cards,
  // then icon-feature columns.
  let cards = Array.from(element.querySelectorAll(':scope .product-card'));
  let mode = 'product';
  if (cards.length === 0) {
    const charts = Array.from(element.querySelectorAll(':scope .chart-feature'));
    const articles = Array.from(element.querySelectorAll(':scope .item[class*="Blog"], :scope .item[class*="Article"], :scope .item[class*="Webinar"], :scope .item[class*="News"]'));
    if (charts.length) {
      cards = charts;
      mode = 'chart';
    } else if (articles.length) {
      cards = articles;
      mode = 'article';
    } else {
      cards = Array.from(element.querySelectorAll(':scope > .column'));
      mode = 'feature';
    }
  }

  // Known stat-card icons (source lazy-loads them via empty url(''), so they are
  // unreachable at import time). Map by heading text to the real asset URLs.
  const CHART_ICONS = {
    'maximize uptime': 'https://media.beckmancoulter.com/-/media/diagnostics/products/dxs-services/icons/mazimize_uptime-1.png',
    'increase confidence': 'https://media.beckmancoulter.com/-/media/diagnostics/products/dxs-services/icons/confidence-1.png',
    'gain peace-of-mind': 'https://media.beckmancoulter.com/-/media/diagnostics/products/dxs-services/icons/peace_of_mind-1.png',
  };

  cards.forEach((card) => {
    // Image cell (field:image). Skip inline data: SVG icons used for UI chrome.
    let img = Array.from(card.querySelectorAll('img')).find(
      (i) => !(i.getAttribute('src') || '').startsWith('data:'),
    ) || null;
    // Chart stat cards keep their icon as a lazy-loaded CSS background (empty at
    // import time). Recover it from the known-icon map keyed by the card title.
    if (!img && mode === 'chart') {
      const header = card.querySelector('.chart-header');
      const key = header ? header.textContent.replace(/\s+/g, ' ').trim().toLowerCase() : '';
      if (CHART_ICONS[key]) {
        img = document.createElement('img');
        img.src = CHART_ICONS[key];
        img.alt = header.textContent.trim();
      }
    }

    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img);
    }

    // Text cell (field:text): title (as heading) + description + CTA.
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));

    if (mode === 'article') {
      // Education-carousel article card: `.subheading` tag + title + "Read more".
      // Title is nested <h3><h4>Title</h4></h3>; pick the first heading WITH text
      // (querySelector on a list returns doc-order, so an empty outer h3 would win).
      const tag = card.querySelector('.subheading');
      const title = Array.from(card.querySelectorAll('h2, h3, h4, h5'))
        .find((el) => el.textContent && el.textContent.trim() && !isPlaceholder(el.textContent));
      const link = card.querySelector('.item-action a, a.button, a[href]');
      if (tag && tag.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = tag.textContent.trim();
        textFrag.appendChild(p);
      }
      if (title) {
        const h = document.createElement('h3');
        h.textContent = title.textContent.trim();
        textFrag.appendChild(h);
      }
      if (link && (link.getAttribute('href') || '').trim()) {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.setAttribute('href', link.getAttribute('href'));
        a.textContent = link.textContent.trim() || 'Read more';
        p.appendChild(a);
        textFrag.appendChild(p);
      }
    } else if (mode === 'chart') {
      // Data-viz stat card: `.chart-header` title + `.chart-body` description.
      // The animated counter (`.count`, always "0" here) is decorative — skipped.
      const header = card.querySelector('.chart-header');
      const body = card.querySelector('.chart-body');
      if (header && !isPlaceholder(header.textContent)) {
        const h = document.createElement('h3');
        h.textContent = header.textContent.trim();
        textFrag.appendChild(h);
      }
      if (body && body.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = body.textContent.replace(/\s+/g, ' ').trim();
        textFrag.appendChild(p);
      }
    } else if (mode === 'product') {
      const label = card.querySelector('.label');
      const title = card.querySelector('h2, h3, h4');
      const paras = Array.from(card.querySelectorAll('.product-description > p, p')).filter(
        (p) => p.textContent.trim().length > 0,
      );
      const cta = card.querySelector('a.button, a.btn-cta, .product-description a');
      if (label && label.textContent.trim()) {
        const p = document.createElement('p');
        p.append(...label.childNodes);
        textFrag.appendChild(p);
      }
      if (title && !isPlaceholder(title.textContent)) textFrag.appendChild(title);
      paras.forEach((p) => textFrag.appendChild(p));
      if (cta) textFrag.appendChild(cta);
    } else {
      // Feature/icon column: content lives in a richtext <p> mixing <strong> title + text.
      const source = card.querySelector('.richText-mobile, .content-container') || card;
      // Promote the <strong> to a heading.
      const strong = source.querySelector('strong, b');
      if (strong && strong.textContent.trim()) {
        const h = document.createElement('h3');
        h.textContent = strong.textContent.trim();
        textFrag.appendChild(h);
        strong.remove();
      }
      // Remaining textual lines become a paragraph (drop the icon <img> and empty headings).
      source.querySelectorAll('img').forEach((i) => i.remove());
      source.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
        if (isPlaceholder(h.textContent)) h.remove();
      });
      const remainder = source.textContent.replace(/\s+/g, ' ').trim();
      if (remainder) {
        const p = document.createElement('p');
        p.innerHTML = (source.querySelector('p') ? source.querySelector('p').innerHTML : remainder).trim();
        // Clean leading <br>s.
        while (p.firstChild && (p.firstChild.nodeName === 'BR' || (p.firstChild.nodeType === 3 && !p.firstChild.textContent.trim()))) {
          p.removeChild(p.firstChild);
        }
        if (p.textContent.trim()) textFrag.appendChild(p);
      }
    }

    cells.push([imageFrag, textFrag]);
  });

  // Empty-block guard.
  if (cards.length === 0 && !headingEl) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Emit the styled variant per instance:
  //   feature icons + chart stat cards -> solutions;
  //   education article cards (tag + title + link, no image) -> insights;
  //   analyzer/service product cards -> productlines.
  let variant = 'productlines';
  if (mode === 'feature' || mode === 'chart') variant = 'solutions';
  else if (mode === 'article') variant = 'insights';
  const block = WebImporter.Blocks.createBlock(document, { name: `cards-grid (${variant})`, cells });
  element.replaceWith(block);

  // Remove the adopted heading sibling so the section title isn't also emitted
  // as a standalone block (it now lives in this grid's heading field).
  if (adoptedHeadingSibling && adoptedHeadingSibling.parentNode) {
    adoptedHeadingSibling.remove();
  }
}
