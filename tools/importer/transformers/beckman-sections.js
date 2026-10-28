/* eslint-disable */
/* global WebImporter */

/**
 * Sections transformer: one EDS section per template section found on the page, with a
 * Section Metadata "style" for styled sections. Sections missing on a page are skipped.
 * beforeTransform inserts <hr> markers (while selectors still match); afterTransform
 * adds the Section Metadata block at the end of each styled section.
 */
const MARKER = 'data-excat-style';

const find = (root, selectors) => {
  for (const sel of [].concat(selectors || [])) {
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) { /* invalid selector: try next */ }
  }
  return null;
};

// sections flagged "insets": the source indents the copy with inline % margins
// (e.g. style="margin-left: 12%; margin-right: 12%") -> inset-left-N / inset-right-N styles
const insetStyles = (el) => {
  const styled = el.matches('[style*="margin"]') ? el : el.querySelector('[style*="margin"]');
  const css = styled?.getAttribute('style') || '';
  return ['left', 'right'].map((side) => {
    const m = css.match(new RegExp(`margin-${side}\\s*:\\s*(\\d+)%`));
    return m && Number(m[1]) ? `inset-${side}-${m[1]}` : null;
  }).filter(Boolean);
};

export default function transform(hookName, element, payload) {
  const sections = payload?.template?.sections || [];
  if (!sections.length) return;
  const document = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    const found = sections.map((s) => find(element, s.selector));
    const first = found.findIndex(Boolean);
    found.forEach((el, i) => {
      if (!el) return;
      const hr = document.createElement('hr');
      const style = [sections[i].style, ...(sections[i].insets ? insetStyles(el) : [])].filter(Boolean).join(', ');
      if (style) hr.setAttribute(MARKER, style);
      if (i === first) hr.setAttribute('data-excat-first', '');
      el.before(hr);
    });
  }

  if (hookName === 'afterTransform') {
    // markers can sit at different nesting depths: a section ends at the next <hr> in document order
    const markers = [...element.querySelectorAll('hr')];
    markers.forEach((hr, i) => {
      const style = hr.getAttribute(MARKER);
      if (style) {
        const meta = WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style } });
        const next = markers[i + 1];
        if (next) next.before(meta); else element.append(meta);
      }
      hr.removeAttribute(MARKER);
      // the first section opens the document: no leading break
      if (hr.hasAttribute('data-excat-first')) hr.remove();
    });
  }
}
