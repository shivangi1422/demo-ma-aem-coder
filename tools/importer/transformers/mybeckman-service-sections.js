/* eslint-disable */
/* global WebImporter */

/**
 * Section transformer for www.mybeckman.in service / support content pages.
 * The page body is a list of `.bc-test-layout .bc-rich-text` chunks, each one
 * holding a `.Section` (optionally wrapped in `.Section--blue` / `.Section--grey`).
 * beforeTransform (runs after mybeckman-cleanup, before the parsers):
 *  - inserts an <hr> section break before every non-empty chunk and remembers its style
 *  - turns Wistia embeds into video link paragraphs
 *  - turns `a.btn` links into authorable buttons (own paragraph, strong / em / strong+em)
 *  - turns Font Awesome check icons in running text into a ✔ character
 *  - wraps loose text runs into paragraphs, drops empty chunks
 * afterTransform: adds Section Metadata (style) at the end of each styled section; a video link alone
 *  in its paragraph outside a block becomes an embed block.
 */

const MARKER = 'data-scp-section-style';

const BLOCK_TAGS = new Set([
  'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'DL', 'DIV', 'TABLE',
  'BLOCKQUOTE', 'PRE', 'HR', 'FIGURE', 'SECTION', 'ARTICLE', 'ASIDE', 'NAV',
  'FORM', 'HEADER', 'FOOTER', 'MAIN', 'PICTURE', 'VIDEO', 'IFRAME', 'LABEL',
]);

function isBlankText(str) {
  return !(str || '').replace(/ /g, ' ').trim();
}

function hasContent(el) {
  return !isBlankText(el.textContent) || !!el.querySelector('img, picture, iframe, video, table, form, .wistia_embed');
}

function sectionStyle(chunk) {
  if (chunk.querySelector('.Section--blue') || chunk.classList.contains('Section--blue')) return 'blue';
  if (chunk.querySelector('.Section--grey') || chunk.classList.contains('Section--grey')) return 'grey';
  return '';
}

function wistiaId(el) {
  const m = (el.className || '').match(/wistia_async_([a-z0-9]+)/i);
  if (m) return m[1];
  const iframe = el.querySelector && el.querySelector('iframe[src*="wistia"]');
  if (iframe) return iframe.getAttribute('src').split('?')[0].split('/').filter(Boolean).pop();
  return null;
}

function replaceWistia(document, root) {
  // rendered (div.wistia_embed inside .wistia_responsive_padding) and unrendered embeds
  root.querySelectorAll('.wistia_responsive_padding, .wistia_embed').forEach((el) => {
    if (!el.isConnected) return;
    const wrap = el.closest('.wistia_responsive_padding') || el;
    const embed = wrap.matches('.wistia_embed') ? wrap : wrap.querySelector('.wistia_embed, iframe[src*="wistia"]');
    const id = embed ? wistiaId(embed) : null;
    if (!id) { wrap.remove(); return; }
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = `https://fast.wistia.net/embed/iframe/${id}`;
    a.textContent = 'Wistia video player';
    p.append(a);
    wrap.replaceWith(p);
  });
}

// <a><button class="btn …">Label</button></a> (training) -> a.btn; red outline buttons (.redbtn) -> secondary
function linkButtons(root) {
  root.querySelectorAll('a > button').forEach((button) => {
    const a = button.parentElement;
    if (button.classList.contains('menu-item') || a.children.length !== 1) return;
    const cls = button.classList.contains('redbtn') ? 'btn btn-secondary' : `btn ${button.className}`;
    a.className = cls;
    a.textContent = button.textContent.replace(/\s+/g, ' ').trim();
  });
}

function buttonize(document, root) {
  root.querySelectorAll('a.btn').forEach((a) => {
    const link = document.createElement('a');
    link.href = a.getAttribute('href') || '';
    link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
    if (a.getAttribute('title')) link.title = a.getAttribute('title');
    let wrapped = link;
    const cls = a.className;
    if (/btn-red|btn-accent/.test(cls)) {
      const em = document.createElement('em');
      em.append(link);
      wrapped = document.createElement('strong');
      wrapped.append(em);
    } else if (/btn-secondary|btn-outline/.test(cls)) {
      wrapped = document.createElement('em');
      wrapped.append(link);
    } else {
      wrapped = document.createElement('strong');
      wrapped.append(link);
    }
    const parent = a.parentElement;
    const alone = parent && parent.tagName === 'P' && parent.textContent.trim() === a.textContent.trim();
    if (alone) {
      a.replaceWith(wrapped);
    } else {
      const p = document.createElement('p');
      p.append(wrapped);
      // a button inside a text paragraph is moved after it
      const host = parent && parent.tagName === 'P' ? parent : a;
      if (host === a) a.replaceWith(p); else { host.after(p); a.remove(); }
    }
  });
}

function wrapInlineRuns(document, container) {
  const nodes = [...container.childNodes];
  let run = [];
  const flush = (before) => {
    const content = run;
    run = [];
    while (content.length && (content[0].nodeType === 3 ? isBlankText(content[0].textContent) : content[0].tagName === 'BR')) content.shift();
    while (content.length && (content[content.length - 1].nodeType === 3 ? isBlankText(content[content.length - 1].textContent) : content[content.length - 1].tagName === 'BR')) content.pop();
    if (!content.length) return;
    const p = document.createElement('p');
    container.insertBefore(p, before);
    p.append(...content);
  };
  nodes.forEach((n) => {
    if (n.nodeType === 8) return;
    if (n.nodeType === 1 && BLOCK_TAGS.has(n.tagName)) {
      flush(n);
      if (n.tagName === 'DIV') wrapInlineRuns(document, n);
      return;
    }
    run.push(n);
  });
  flush(null);
}

export default function transform(hookName, element, payload) {
  const document = element.ownerDocument || (payload && payload.document);

  if (hookName === 'beforeTransform') {
    // page body: one or more .bc-test-layout lists and / or a .two-columns-holder (col-md-9 + col-md-3) row
    const ROOTS = '.bc-test-layout, .two-columns-holder';
    const roots = [...element.querySelectorAll(ROOTS)].filter((r) => !r.parentElement.closest(ROOTS));
    // the title holder (#content-holder) can carry page text too (e.g. /support/ecommerce): same inline fixes
    const holder = element.querySelector('#content-holder');
    const textRoots = holder && !roots.some((r) => r.contains(holder)) ? [...roots, holder] : roots;
    textRoots.forEach((root) => {
      // page-level style blocks / js components
      root.querySelectorAll('.row.js-component').forEach((el) => { if (!hasContent(el) || el.querySelector('style')) el.remove(); });
      replaceWistia(document, root);
      linkButtons(root);
      buttonize(document, root);
      // Font Awesome check marks in running text become a text check mark
      // (the benefits callout draws its own icon, its parser drops the span)
      root.querySelectorAll('span.fa-check').forEach((span) => {
        if (!span.closest('.Intro')) span.replaceWith(document.createTextNode('✔ '));
      });
    });

    if (!roots.length) return;

    // two-column rows: with a form in the right column = one "sidebar" section (text left, form right);
    // otherwise the right rail (empty, or the FAQ related-links rail also dropped on faq-article pages) is dropped
    const sidebars = [];
    element.querySelectorAll('.two-columns-holder').forEach((holder) => {
      const right = holder.querySelector('.two-columns-holder__right');
      if (right && right.querySelector('.contact-form-source')) sidebars.push(holder);
      else if (right) right.remove();
    });
    sidebars.forEach((holder) => {
      holder.querySelectorAll('.bc-rich-text').forEach((chunk) => {
        if (!hasContent(chunk)) chunk.remove(); else wrapInlineRuns(document, chunk);
      });
      const hr = document.createElement('hr');
      hr.setAttribute(MARKER, 'sidebar');
      holder.parentNode.insertBefore(hr, holder);
    });

    // a grey band inside a chunk (inline background #f0f0f0, e.g. "Knowledge Awaits" + form on /service/training)
    // starts its own grey section
    roots.forEach((root) => root.querySelectorAll('.bc-rich-text > div[style*="background-color"]').forEach((band) => {
      if (!/#f0f0f0|240,\s*240,\s*240/i.test(band.getAttribute('style'))) return;
      const hr = document.createElement('hr');
      hr.setAttribute(MARKER, 'grey');
      band.parentNode.insertBefore(hr, band);
    }));

    const chunks = roots.flatMap((root) => [...root.querySelectorAll('.bc-rich-text')])
      .filter((c) => c.isConnected && !c.parentElement.closest('.bc-rich-text') && !sidebars.some((h) => h.contains(c)));
    chunks.forEach((chunk) => {
      if (!hasContent(chunk)) { chunk.remove(); return; }
      wrapInlineRuns(document, chunk);
      const hr = document.createElement('hr');
      const style = sectionStyle(chunk);
      if (style) hr.setAttribute(MARKER, style);
      chunk.parentNode.insertBefore(hr, chunk);
    });
    // pages without chunks (plain rich text in the layout) still get one content section
    if (!chunks.length && !sidebars.length) roots[0].parentNode.insertBefore(document.createElement('hr'), roots[0]);
  }

  if (hookName === 'afterTransform') {
    element.querySelectorAll(`hr[${MARKER}]`).forEach((hr) => {
      const style = hr.getAttribute(MARKER);
      hr.removeAttribute(MARKER);
      const sm = WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style } });
      // end of this section = the chunk right after the marker
      const chunk = hr.nextElementSibling;
      if (chunk && chunk.tagName !== 'HR') chunk.append(sm); else hr.after(sm);
    });
    // video links in page text (not in columns, which embed them themselves) -> embed block
    element.querySelectorAll('p > a[href*="fast.wistia.net/embed"]').forEach((a) => {
      const p = a.parentElement;
      if (p.closest('table') || p.textContent.trim() !== a.textContent.trim()) return;
      const link = document.createElement('a');
      link.href = a.href;
      link.textContent = a.href;
      p.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'embed', cells: [[link]] }));
    });
    // drop empty paragraphs left by cleanup
    element.querySelectorAll('p').forEach((p) => {
      if (isBlankText(p.textContent) && !p.querySelector('img, picture, a')) p.remove();
    });
  }
}
