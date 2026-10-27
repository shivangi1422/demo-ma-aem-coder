/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for the 9 mybeckman.in templates (`mybeckman-<slug>`):
 * clinical-trials, leukemia-and-lymphoma, monoclonal-antibodies,
 * biomanufacturing, synthetic-biology, cell-line-development,
 * protein-production, analytical-ultracentrifugation,
 * next-generation-sequencing.
 *
 * Only runs when payload.template.name starts with "mybeckman-" (every import
 * script loads all transformers in this folder). The import runs against the
 * raw snapshots in tools/importer/bd-snapshots/www.mybeckman.in/; every
 * selector below comes from migration-work/mybeckman/mapping-notes.md.
 *
 * onLoad: records the section background image (clinical-trials jump nav
 *   gradient) as data-mb-section-bg on its section element.
 *
 * beforeTransform (before the parsers):
 *  - tags every template section start with data-mb-section (read by
 *    mybeckman-sections.js, which runs after this cleanup) so restructuring
 *    below cannot break the section selectors
 *  - removes global chrome: TrustArc bar, skip link, hidden inputs, header,
 *    breadcrumb, footer (incl. newsletter form 3594), flash message, modal,
 *    go-to-top button, body-level injected nodes (Wistia styles/tag manager,
 *    Marketo clones/iframes), inline style/link/script/noscript, browser
 *    extension inputs, source HTML comments
 *  - removes hidden duplicates / decorative nodes listed in mapping-notes
 *    (mobile overlays/crops, display:none callout images, zoom overlays,
 *    colour overlays, #content-0, slideshow arrows/dots, icon-font glyphs,
 *    panel fillers, accordion hrs, testimonial spacer column, empty
 *    headings/paragraphs/captions, line-break spacers, empty wrappers)
 *  - promotes the form headings (p.formtitle / div.formtitle) to H2, the
 *    monoclonal-antibodies mission title to H2, demotes every H1 after the
 *    first to H2, turns the monoclonal-antibodies reference h5 lines into
 *    paragraphs
 *  - makes relative Sitecore media links (-/media/<guid>.ashx) absolute
 *  - turns the analytical-ultracentrifugation script-only jump buttons into
 *    links and authors every jump nav as a link list
 *  - rewrites in-page anchors to the EDS heading id of their target
 *    (github-slugger rules), per the mapping-notes table
 *  - unlinks the leukemia footnote superscripts (EDS drops li ids) and the
 *    links that are broken on the source (notfound.aspx, unresolved
 *    ~/link.aspx) - kept as plain text
 *  - a > button CTAs become plain links; bare CTA links get a paragraph
 *  Block instance elements from template.blocks[] are never removed and are
 *  not restructured (only attribute fixes and listed removals inside them).
 *
 * afterTransform (after the parsers; xwalk field-hint comments are kept):
 *  - removes remaining non-content elements and script-only attributes
 *  - unlinks broken source links in the parser output
 *  - appends a Metadata block (Title, Description, Keywords, Image = og:image;
 *    canonical omitted - it points at beckman.com) and removes the head tags
 *    WebImporter.rules.createMetadata reads, so it does not add a second one
 *  - points image-file links (tabs-workflow / accordion product images) and
 *    the page image at their AEM Assets paths (DAM_MAP at the end); <img>
 *    sources are rewritten by the bulk importer's final step from the
 *    snapshots' <page>.images.json maps (after adjustImageUrls)
 */

const TEMPLATE_PREFIX = 'mybeckman-';
const ORIGIN = 'https://www.mybeckman.in';
const SECTION_ATTR = 'data-mb-section';
const BG_ATTR = 'data-mb-section-bg';

/** per page settings (key = template name without the prefix) */
const PAGES = {
  'clinical-trials': {
    remove: ['#main hr'],
    anchors: {
      multicenter: 'chapter-1-harmonize-your-multicenter-trials',
      resources: 'chapter-2-leverage-expert-support-in-your-clinical-trials',
      efficiency: 'chapter-3-increase-efficiency-with-automated-solutions',
    },
    // section background (not content): jump nav gradient image
    backgrounds: [{ section: 'div.container-overlay-full-width:has(div.sticky)', img: ':scope > img' }],
  },
  'leukemia-and-lymphoma': {
    remove: [],
    anchors: {
      'overview-and-statistics': 'overview-and-statistics',
      'diagnostic-tool': 'flow-cytometry-as-a-diagnostic-tool',
      'laboratory-challenges': 'laboratory-challenges',
      'standardized-reagents': 'advantages-of-standardized-reagents',
      'additional-resources': 'additional-resources',
    },
    unlinkFootnotes: true,
  },
  'monoclonal-antibodies': {
    remove: ['#content-holder > h1'],
    anchors: { anchor: 'our-team-is-ready-to-help' },
    strongHeadings: ['div.bc-rich-text > div.row:has(a.primary-btn) p'],
    referenceLines: ['div.bc-rich-text:has(h2 + h5) h5'],
  },
  biomanufacturing: {
    remove: [],
    anchors: { form: 'our-team-is-ready-to-help' },
  },
  'synthetic-biology': {
    remove: [
      'div.accordion-content hr',
      'div.containercustom > div.row:has(wistia-player) > div.col-md-1',
    ],
    anchors: { form: 'our-team-is-ready-to-help' },
  },
  'cell-line-development': {
    remove: [],
    anchors: { anchor: 'want-to-bring-your-cell-line-development-workflow-to-the-next-level' },
  },
  'protein-production': {
    remove: [],
    anchors: {},
  },
  'analytical-ultracentrifugation': {
    remove: ['#main hr'],
    anchors: { anchor: 'talk-to-an-expert-on-analytical-ultracentrifugation' },
    // button[onclick=scrollToDiv('x')] -> link to the EDS heading id
    jumpButtons: {
      overview: 'introduction', // 'overview' does not exist on the source
      benefits: 'key-benefits-of-auc',
      applications: 'applications-of-analytical-ultracentrifugation',
      methods: 'optima-auc-multiple-methods-in-one',
    },
  },
  'next-generation-sequencing': {
    remove: [],
    anchors: {
      form: 'ready-to-get-started',
      Solutions: 'our-ngs-library-prep-automated-solutions',
    },
  },
};

/** non-content on every page */
const CHROME_SELECTORS = [
  '#consent_blackbar',
  '#truste-consent-track',
  'a.skip-to-main-content-link',
  'body > input[type="hidden"]',
  '#wrapper > input#csrfToken',
  'input#csrfToken',
  'header#mainNav',
  '#main > div.main-holder > div.container.custome-container',
  'nav.breadcrumbs',
  'div.footer2023',
  '#mktoForm_3594',
  'div.flash-message',
  'div.MaskOverlay',
  '#ModalPopup',
  'button#myBtn',
  'body > style',
  'body > iframe',
  'body > form.mktoForm',
  'body > #mktoStyleLoaded',
  '#mktoStyleLoaded',
  'body > wistia-tag-manager',
  'wistia-tag-manager',
  'input#hippowiz-ass-injected',
  'input#hvmessage-toextension-listener',
  '#main style',
  '#main link',
  '#main noscript',
  '#main script',
  'script',
  'noscript',
  'body > link',
  // hidden duplicates / decorative (mapping-notes "Hidden duplicates" + cleanup table)
  'div.overlay_0_mobile_vk',
  'div.container-overlay-full-width > div.overlay',
  'a[data-featherlight]',
  'div.smallbanner',
  'div.wf-grid-mobile',
  'div.color-overlay',
  'div.dark-overlay',
  'div.tab-scroll #content-0',
  'div.slideshow-container a.prev',
  'div.slideshow-container a.next',
  'div.dot-container',
  'em.fa-quote-left',
  'div.panel.panel-noborder',
];

const HINDI_MONTHS = [
  [/जनवरी/g, 'January'],
  [/फ़रवरी|फरवरी/g, 'February'],
  [/मार्च/g, 'March'],
  [/अप्रैल/g, 'April'],
  [/मई/g, 'May'],
  [/जून/g, 'June'],
  [/जुलाई/g, 'July'],
  [/अगस्त/g, 'August'],
  [/सितम्बर|सितंबर/g, 'September'],
  [/अक्टूबर|अक्तूबर/g, 'October'],
  [/नवम्बर|नवंबर/g, 'November'],
  [/दिसम्बर|दिसंबर/g, 'December'],
];

const BROKEN_LINK = 'a[href*="/sitecore/service/notfound.aspx"], a[href*="link.aspx?_id="]';

function safeQueryAll(root, selector) {
  try {
    return [...root.querySelectorAll(selector)];
  } catch (e) {
    return [];
  }
}

function safeQuery(root, selector) {
  try {
    return root.querySelector(selector);
  } catch (e) {
    return null;
  }
}

const clean = (text) => (text || '').replace(/[\s\u00a0]+/g, ' ').trim();

/** EDS heading id (github-slugger rules, as rendered by the pipeline) */
function slug(text) {
  return clean(text).toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '')
    .replace(/ /g, '-');
}

function pageConfig(template) {
  const key = template.name.slice(TEMPLATE_PREFIX.length);
  return PAGES[key] || { remove: [], anchors: {} };
}

function contentRoot(element) {
  return element.querySelector('#main') || element;
}

function blockInstances(element, template) {
  const set = new Set();
  ((template && template.blocks) || []).forEach((block) => {
    (block.instances || []).forEach((sel) => {
      safeQueryAll(element, sel).forEach((el) => set.add(el));
    });
  });
  return [...set];
}

/** first match of each template section (selectors tried in order) */
function sectionStarts(element, template) {
  const found = [];
  ((template && template.sections) || []).forEach((section) => {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      const el = safeQuery(element, sel);
      if (el) {
        found.push({ section, el });
        break;
      }
    }
  });
  return found;
}

function makeContext(element, template) {
  const instances = blockInstances(element, template);
  const sections = sectionStarts(element, template).map((s) => s.el);
  const keep = [...new Set([...instances, ...sections])];
  const insideInstance = (el) => instances.some((inst) => inst !== el && inst.contains(el));
  const isInstance = (el) => instances.includes(el);
  const remove = (el) => {
    if (!el || !el.isConnected) return;
    if (el === element || el.id === 'main' || el.id === 'wrapper') return;
    if (el.contains(contentRoot(element)) && contentRoot(element) !== element) return;
    if (keep.some((p) => p === el || el.contains(p))) return;
    el.remove();
  };
  return { instances, sections, insideInstance, isInstance, remove };
}

function renameTag(el, tagName) {
  const next = el.ownerDocument.createElement(tagName);
  [...el.attributes].forEach(({ name, value }) => {
    if (name !== 'style') next.setAttribute(name, value);
  });
  while (el.firstChild) next.append(el.firstChild);
  el.replaceWith(next);
  return next;
}

function unwrap(el) {
  if (!el || !el.parentNode) return;
  el.replaceWith(...el.childNodes);
}

const hasMedia = (el) => !!el.querySelector('img, picture, video, iframe, table, svg, wistia-player, [data-video-id], [media-id], input, select, textarea, form');
const isBlank = (el) => !clean(el.textContent) && !hasMedia(el);

/* ---------------------------------------------------------------- onLoad / before */

/** gradient image of the jump nav = section background, not content */
function recordBackgrounds(element, config) {
  (config.backgrounds || []).forEach(({ section, img }) => {
    safeQueryAll(element, section).forEach((sec) => {
      const image = safeQuery(sec, img);
      if (!image) return;
      const src = image.getAttribute('src');
      if (src && !sec.getAttribute(BG_ATTR)) {
        sec.setAttribute(BG_ATTR, new URL(src, `${ORIGIN}/`).href);
      }
    });
  });
}

function removeBackgroundImages(element, config) {
  (config.backgrounds || []).forEach(({ section, img }) => {
    safeQueryAll(element, section).forEach((sec) => {
      if (sec.getAttribute(BG_ATTR)) {
        const image = safeQuery(sec, img);
        if (image) image.remove();
      }
    });
  });
}

function tagSections(element, template) {
  sectionStarts(element, template).forEach(({ section, el }) => {
    if (!el.hasAttribute(SECTION_ATTR)) el.setAttribute(SECTION_ATTR, section.id);
  });
}

function removeComments(element) {
  const doc = element.ownerDocument;
  const walker = doc.createTreeWalker(element, 128 /* NodeFilter.SHOW_COMMENT */);
  const comments = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach((c) => c.remove());
}

/**
 * callout cards hold the same image twice (a visible copy + a display:none
 * duplicate; in the import browser site script can hide both): keep one
 * image per image wrapper, un-hiding it when no visible copy is left
 */
function dedupeCalloutImages(element) {
  const hidden = (img) => /display:\s*none/i.test(img.getAttribute('style') || '');
  safeQueryAll(element, 'div.product-series-callouts .product-series-callouts__image-wrap').forEach((wrap) => {
    const imgs = [...wrap.querySelectorAll('img')];
    if (!imgs.length) return;
    const keep = imgs.find((img) => !hidden(img)) || imgs[0];
    keep.removeAttribute('style');
    imgs.filter((img) => img !== keep).forEach((img) => img.remove());
  });
}

// pages migrated to this site: site-relative links to them stay relative
const MIGRATED_PATHS = [
  '/flow-cytometry/clinical-trials',
  '/resources/disease-research/leukemia-and-lymphoma',
  '/resources/disease-research/monoclonal-antibodies',
  '/resources/industries/biomanufacturing',
  '/resources/industries/synthetic-biology',
  '/resources/methods/cell-line-development',
  '/resources/product-applications/process-development-manufacturing/protein-production',
  '/resources/technologies/analytical-ultracentrifugation',
  '/resources/technologies/next-generation-sequencing',
];

/**
 * site-relative links to pages that are not migrated would 404 on EDS:
 * point them at the source site (form definitions under /forms/ stay local)
 */
function absolutizeSiteLinks(element) {
  safeQueryAll(element, 'a[href^="/"]:not([href^="//"])').forEach((a) => {
    const href = a.getAttribute('href');
    const path = href.split(/[?#]/)[0].replace(/\/$/, '').toLowerCase();
    if (path.startsWith('/forms/') || path.startsWith('/content/dam/') || MIGRATED_PATHS.includes(path)) return;
    a.setAttribute('href', `${ORIGIN}${href}`);
  });
}

/** image-file links -> AEM Assets paths (the link text, the alt, is kept) */
function damifyImageLinks(element) {
  safeQueryAll(element, 'a[href]').forEach((a) => {
    const dam = DAM_MAP[a.getAttribute('href')];
    if (dam) {
      if (a.textContent.trim() === a.getAttribute('href')) a.textContent = dam;
      a.setAttribute('href', dam);
    }
  });
}

function removeChrome(element, config, ctx) {
  [...CHROME_SELECTORS, ...(config.remove || [])]
    .forEach((sel) => safeQueryAll(element, sel).forEach(ctx.remove));
  // body-level leftovers outside #wrapper (styles, iframes, clones)
  [...element.children].forEach((child) => {
    if (child.id === 'wrapper' || child.contains(contentRoot(element))) return;
    if (['STYLE', 'LINK', 'IFRAME', 'FORM', 'INPUT', 'SCRIPT', 'NOSCRIPT'].includes(child.tagName)
      || child.tagName.includes('-')) {
      ctx.remove(child);
    }
  });
  // icon-font glyphs (Font Awesome) without text
  safeQueryAll(contentRoot(element), 'i[class*="fa-"], em[class*="fa-"], span[class*="fa-"]').forEach((icon) => {
    if (!clean(icon.textContent)) ctx.remove(icon);
  });
}

/** empty headings / captions / paragraphs, line-break spacers */
function removeEmptyText(element, ctx) {
  const root = contentRoot(element);
  safeQueryAll(root, 'h1, h2, h3, h4, h5, h6, p, p.embeded-video__caption').forEach((el) => {
    if (el.closest('form, .formassembly-container')) return;
    if (isBlank(el)) ctx.remove(el);
  });
  safeQueryAll(root, 'br').forEach((br) => {
    const parent = br.parentElement;
    if (!parent || parent.closest('form, .formassembly-container')) return;
    const meaningful = (node, dir) => {
      let n = node[dir];
      while (n && ((n.nodeType === 3 && !clean(n.textContent))
        || n.nodeType === 8 || (n.nodeType === 1 && n.tagName === 'BR'))) n = n[dir];
      return n;
    };
    const prev = meaningful(br, 'previousSibling');
    const next = meaningful(br, 'nextSibling');
    const block = /^(DIV|SECTION|ARTICLE|ASIDE|LI|TD|TH)$/.test(parent.tagName);
    const edge = !prev || !next; // leading / trailing <br> in any element
    const betweenBlocks = block && (!prev || prev.nodeType === 1) && (!next || next.nodeType === 1)
      && !/^(A|SPAN|STRONG|B|EM|I|SUP|SUB|IMG)$/.test((prev && prev.tagName) || '')
      && !/^(A|SPAN|STRONG|B|EM|I|SUP|SUB|IMG)$/.test((next && next.tagName) || '');
    if (edge || betweenBlocks) br.remove();
  });
  // strong/b left empty by the br removal
  safeQueryAll(root, 'strong, b').forEach((el) => {
    if (isBlank(el)) el.remove();
  });
}

/** empty wrappers (style-only div.bc-rich-text, js-component rows, published date holder) */
function removeEmptyWrappers(element, ctx) {
  const root = contentRoot(element);
  safeQueryAll(root, 'div, section').reverse().forEach((el) => {
    if (ctx.isInstance(el) || ctx.insideInstance(el)) return;
    if (el.hasAttribute('id') && /^(main|wrapper|content-holder)$/.test(el.id)) return;
    if (isBlank(el)) ctx.remove(el);
  });
}

/** p.formtitle / div.formtitle -> h2 (anchor target), div.formtext -> p */
function promoteFormHeadings(element) {
  const root = contentRoot(element);
  safeQueryAll(root, 'p.formtitle, div.formtitle').forEach((el) => {
    if (!clean(el.textContent)) return;
    const h2 = renameTag(el, 'h2');
    h2.textContent = clean(h2.textContent);
  });
  safeQueryAll(root, 'div.formtext').forEach((el) => {
    if (!el.querySelector('div, p')) renameTag(el, 'p');
  });
}

/** a paragraph that is only bold text -> h2 (monoclonal-antibodies mission) */
function promoteStrongHeadings(element, config) {
  (config.strongHeadings || []).forEach((sel) => {
    const p = safeQueryAll(element, sel).find((el) => {
      const strong = clean([...el.querySelectorAll('strong, b')].map((s) => s.textContent).join(' '));
      return strong && strong === clean(el.textContent);
    });
    if (!p) return;
    const h2 = renameTag(p, 'h2');
    h2.textContent = clean(h2.textContent);
  });
}

/** reference lines authored as headings -> paragraphs */
function demoteReferenceLines(element, config) {
  (config.referenceLines || []).forEach((sel) => {
    safeQueryAll(element, sel).forEach((h) => renameTag(h, 'p'));
  });
}

/** one H1 per page: every later H1 becomes H2 */
function demoteExtraH1s(element) {
  safeQueryAll(contentRoot(element), 'h1').slice(1).forEach((h1) => renameTag(h1, 'h2'));
}

/** author box label (h5/h6 "About the author:") would skip heading levels: make it h3 */
function fixAuthorHeadings(element) {
  safeQueryAll(contentRoot(element), '.bcls-aeo-author h5, .bcls-aeo-author h6').forEach((h) => renameTag(h, 'h3'));
}

/** -/media/<guid>.ashx (resolves under the page folder) -> absolute */
function absolutizeAssetLinks(element) {
  const fix = (value) => {
    const v = (value || '').trim();
    if (/^(-|~)\/media\//i.test(v)) return `${ORIGIN}/-/media/${v.replace(/^(-|~)\/media\//i, '')}`;
    if (/^\/(-|~)\/media\//i.test(v)) return `${ORIGIN}/-/media/${v.replace(/^\/(-|~)\/media\//i, '')}`;
    if (/^\/[^/].*\.(ashx|pdf)(\?|#|$)/i.test(v)) return `${ORIGIN}${v}`;
    return null;
  };
  safeQueryAll(element, 'a[href]').forEach((a) => {
    const next = fix(a.getAttribute('href'));
    if (next) a.setAttribute('href', next);
  });
  safeQueryAll(element, 'img[src]').forEach((img) => {
    const next = fix(img.getAttribute('src'));
    if (next) img.setAttribute('src', next);
  });
}

function linkList(doc, links) {
  const ul = doc.createElement('ul');
  links.forEach(({ href, text }) => {
    const li = doc.createElement('li');
    const a = doc.createElement('a');
    a.setAttribute('href', href);
    a.textContent = text;
    li.append(a);
    ul.append(li);
  });
  return ul;
}

/** analytical-ultracentrifugation: button[onclick=scrollToDiv('x')] -> links */
function convertJumpButtons(element, config) {
  const map = config.jumpButtons;
  if (!map) return;
  const doc = element.ownerDocument;
  safeQueryAll(contentRoot(element), 'div.quick-nav-row, #quick-nav').forEach((row) => {
    if (!row.isConnected) return;
    const buttons = [...row.querySelectorAll(':scope > button[onclick]')];
    if (!buttons.length) return;
    const links = buttons.map((b) => {
      const m = (b.getAttribute('onclick') || '').match(/scrollToDiv\(\s*['"]([^'"]+)['"]\s*\)/);
      const target = m && (map[m[1]] || m[1]);
      return target ? { href: `#${target}`, text: clean(b.textContent) } : null;
    }).filter(Boolean);
    buttons.forEach((b) => b.remove());
    row.append(linkList(doc, links));
  });
}

/** div.sticky jump navs (sticky-menu-item divs) -> one link list */
function normalizeJumpNavs(element) {
  const doc = element.ownerDocument;
  safeQueryAll(contentRoot(element), 'div.sticky').forEach((nav) => {
    const links = [...nav.querySelectorAll('a[href]')].map((a) => ({
      href: a.getAttribute('href'),
      text: clean(a.textContent),
    }));
    if (!links.length) return;
    nav.replaceChildren(linkList(doc, links));
  });
}

/** in-page anchors -> EDS heading ids (mapping-notes table, else the target heading) */
function rewriteAnchors(element, config) {
  const root = contentRoot(element);
  const map = config.anchors || {};
  const headings = safeQueryAll(root, 'h1, h2, h3, h4, h5, h6').filter((h) => clean(h.textContent));
  safeQueryAll(root, 'a[href^="#"]').forEach((a) => {
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (!id) return;
    if (Object.prototype.hasOwnProperty.call(map, id)) {
      a.setAttribute('href', `#${map[id]}`);
      return;
    }
    if (/^ref\d+$/.test(id)) return; // footnotes: handled by unlinkFootnotes
    const esc = id.replace(/["\\]/g, '');
    const target = safeQuery(root, `[id="${esc}"]`) || safeQuery(root, `a[name="${esc}"]`);
    if (!target) return;
    let heading = /^H[1-6]$/.test(target.tagName) ? target : target.querySelector('h1, h2, h3, h4, h5, h6');
    if (!heading) {
      heading = headings.find((h) => !target.contains(h)
        && (target.compareDocumentPosition(h) & 4 /* DOCUMENT_POSITION_FOLLOWING */));
    }
    if (heading) a.setAttribute('href', `#${slug(heading.textContent)}`);
  });
}

/** leukemia #ref1..#ref6 superscripts: EDS drops li ids -> keep the numbers only */
function unlinkFootnotes(element, config) {
  if (!config.unlinkFootnotes) return;
  safeQueryAll(contentRoot(element), 'a[href^="#ref"]').forEach(unwrap);
}

/** links broken on the source -> plain text (no decided target) */
function unlinkBroken(element, ctx) {
  safeQueryAll(element, BROKEN_LINK).forEach((a) => {
    if (ctx && (ctx.isInstance(a) || ctx.insideInstance(a))) return; // parsers read them
    unwrap(a);
  });
}

/** <a><button>Text</button></a> -> <a>Text</a> (icon images inside dropped) */
function flattenButtonLinks(element, ctx) {
  safeQueryAll(element, 'a button').forEach((button) => {
    if (ctx && ctx.insideInstance(button)) return;
    button.replaceWith(element.ownerDocument.createTextNode(clean(button.textContent)));
  });
  safeQueryAll(element, 'a').forEach((a) => {
    if (ctx && ctx.insideInstance(a)) return;
    if (a.querySelector('img') && !clean(a.textContent)) return;
    if (/btn|button/.test(a.className || '') || a.closest('div.buttflex')) {
      a.querySelectorAll('img').forEach((img) => img.remove());
      if (a.children.length === 0) a.textContent = clean(a.textContent);
    }
  });
}

/** bare CTA links directly inside a div -> own paragraph */
function wrapBareLinks(element, ctx) {
  const doc = element.ownerDocument;
  safeQueryAll(contentRoot(element), 'a[href]').forEach((a) => {
    if (ctx.isInstance(a) || ctx.insideInstance(a)) return;
    const parent = a.parentElement;
    if (!parent || !/^(DIV|SECTION|ARTICLE)$/.test(parent.tagName)) return;
    if (!clean(a.textContent)) return;
    const p = doc.createElement('p');
    a.replaceWith(p);
    p.append(a);
  });
}

/** protein-production: localised published date (hi) -> English */
function translateDates(element) {
  safeQueryAll(contentRoot(element), 'div.bcls-aeo-published p').forEach((p) => {
    let text = p.textContent;
    HINDI_MONTHS.forEach(([re, en]) => { text = text.replace(re, en); });
    if (text !== p.textContent) p.textContent = clean(text);
  });
}

/** empty named anchors (a[name=form]) once their links are rewritten */
function removeNamedAnchors(element) {
  safeQueryAll(element, 'a[name]:not([href])').forEach((a) => {
    if (!clean(a.textContent) && !a.querySelector('img')) a.remove();
  });
}

/* ---------------------------------------------------------------- after */

function headMeta(doc, attr, name) {
  const head = doc.head || doc;
  return [...head.querySelectorAll(`meta[${attr}="${name}"]`)]
    .map((m) => clean(m.getAttribute('content')))
    .filter(Boolean)
    .join(', ');
}

function appendMetadata(element) {
  const doc = element.ownerDocument;
  const cells = {};
  const title = doc.querySelector('head title') || doc.querySelector('title');
  if (title && clean(title.textContent)) cells.Title = clean(title.textContent);
  const description = headMeta(doc, 'name', 'description') || headMeta(doc, 'property', 'og:description');
  if (description) cells.Description = description;
  const keywords = headMeta(doc, 'name', 'keywords');
  // lowercase: md2jcr maps this row to the page model's multi-value "keywords"
  // field by name only (the "Keywords" label is not matched)
  if (keywords) cells.keywords = keywords;
  const ogImage = headMeta(doc, 'property', 'og:image') || headMeta(doc, 'name', 'og:image');
  if (ogImage) {
    // the page model's "image" reference field: md2jcr maps it by name and
    // only from a link (an <img> in the metadata row is ignored)
    const src = ogImage.split(', ')[0];
    const a = doc.createElement('a');
    a.href = src;
    a.textContent = src;
    cells.image = a;
  }
  if (!Object.keys(cells).length) return;
  element.append(WebImporter.Blocks.createBlock(doc, { name: 'Metadata', cells }));

  // WebImporter.rules.createMetadata (run by the import script afterwards)
  // reads title/description/og:*/twitter:* from the head: remove them so it
  // does not append a second Metadata block (canonical is never migrated)
  const head = doc.head;
  if (!head) return;
  safeQueryAll(doc, 'title').forEach((t) => t.remove());
  safeQueryAll(head, 'meta[name="description"], meta[property^="og:"], meta[property^="twitter:"], link[rel="canonical"]')
    .forEach((m) => m.remove());
}

function stripScriptAttributes(element) {
  safeQueryAll(element, '*').forEach((el) => {
    [...el.attributes].forEach(({ name }) => {
      if (name.startsWith('on') || name.startsWith('data-bind') || name.startsWith('data-featherlight')) {
        el.removeAttribute(name);
      }
    });
  });
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  if (!template || typeof template.name !== 'string' || !template.name.startsWith(TEMPLATE_PREFIX)) return;
  if (!element || !element.querySelectorAll) return;
  const config = pageConfig(template);

  // onLoad runs on the live page (before html2md copies the DOM)
  if (hookName === 'onLoad') {
    // tag section starts on the untouched page: html2md's own preprocessing
    // (before beforeTransform) drops empty anchors such as <a name="form">
    // that some section selectors rely on
    tagSections(element, template);
    recordBackgrounds(element, config);
    return;
  }

  if (hookName === 'beforeTransform') {
    tagSections(element, template);
    recordBackgrounds(element, config);
    const ctx = makeContext(element, template);
    removeBackgroundImages(element, config);
    dedupeCalloutImages(element);
    removeChrome(element, config, ctx);
    removeComments(element);
    promoteFormHeadings(element);
    promoteStrongHeadings(element, config);
    demoteReferenceLines(element, config);
    demoteExtraH1s(element);
    fixAuthorHeadings(element);
    absolutizeAssetLinks(element);
    convertJumpButtons(element, config);
    normalizeJumpNavs(element);
    rewriteAnchors(element, config);
    unlinkFootnotes(element, config);
    unlinkBroken(element, ctx);
    flattenButtonLinks(element, ctx);
    translateDates(element);
    removeNamedAnchors(element);
    wrapBareLinks(element, ctx);
    removeEmptyText(element, ctx);
    removeEmptyWrappers(element, ctx);
  }

  if (hookName === 'afterTransform') {
    WebImporter.DOMUtils.remove(element, [
      'script',
      'noscript',
      'style',
      'link',
      'iframe',
      'video',
      'input',
      'form',
      'button#myBtn',
      'wistia-tag-manager',
      '#consent_blackbar',
      'div.footer2023',
      'header#mainNav',
      '#ModalPopup',
    ]);
    unlinkBroken(element, null);
    flattenButtonLinks(element, null);
    removeNamedAnchors(element);
    absolutizeSiteLinks(element);
    stripScriptAttributes(element);
    appendMetadata(element);
    damifyImageLinks(element);
  }
}

// ---- DAM_MAP (generated) --------------------------------------------------
// Source image URL -> AEM Assets path for the 9 migrated pages, generated from
// migration-work/aem-assets-upload/asset-mapping.json (files to upload are in
// migration-work/aem-assets-upload/demo-ma-aem-coder/mybeckman/).
const DAM_MAP = {
  "https://embed-ssl.wistia.com/deliveries/224144afcbc9d6ca19521b03e49533d5.jpg?image_crop_resized=960x480": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/224144afcbc9d6ca19521b03e49533d5.jpg",
  "https://embed-ssl.wistia.com/deliveries/3209e680127f6a5d15ce62a55bfc6498.jpg?image_crop_resized=960x480": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/3209e680127f6a5d15ce62a55bfc6498.jpg",
  "https://embed-ssl.wistia.com/deliveries/409cbdc255c1a944ebc233d2115f98e6a326cc45.jpg?image_crop_resized=960x540": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/409cbdc255c1a944ebc233d2115f98e6a326cc45.jpg",
  "https://embed-ssl.wistia.com/deliveries/4995dc25d6fa8976480ea4c9558f75dd.jpg?image_crop_resized=960x540": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/4995dc25d6fa8976480ea4c9558f75dd.jpg",
  "https://embed-ssl.wistia.com/deliveries/5dd736fef9e33dadee202947e3458ca8c4d58741.jpg?image_crop_resized=960x540": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/5dd736fef9e33dadee202947e3458ca8c4d58741.jpg",
  "https://embed-ssl.wistia.com/deliveries/c8c2e5649c0cfa1f9611c505461c2801.jpg?image_crop_resized=960x480": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/c8c2e5649c0cfa1f9611c505461c2801.jpg",
  "https://fast.wistia.net/embed/medias/1nyrf4wf4x/thumbnail-640.webp": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/thumbnail-640.webp",
  "https://fast.wistia.net/embed/medias/4qgtx9nelf/thumbnail-640.webp": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/thumbnail-640.webp",
  "https://fast.wistia.net/embed/medias/6yc9dtf8jn/thumbnail-640.webp": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/thumbnail-640.webp",
  "https://fast.wistia.net/embed/medias/a7fwbsbm1x/thumbnail-640.webp": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/thumbnail-640.webp",
  "https://fast.wistia.net/embed/medias/isge0kog69/thumbnail-640.webp": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/thumbnail-640.webp",
  "https://fast.wistia.net/embed/medias/q1pgs93mew/thumbnail-640.webp": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/thumbnail-640.webp",
  "https://media.beckman.com/-/media/app-note-support-items/a-rapid-flow-cytometry-data-analysis-workflow-using-machine-learning/figure-2.png?rev=03187d58c90f47d581431b3faf114d83": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/a-rapid-flow-cytometry-data-analysis-workflow-using-machine-learning/figure-2.png",
  "https://media.beckman.com/-/media/app-note-support-items/automating-cell-based-processes/thumbnail.jpg?h=251&w=195&rev=eed4b5d101af41099f64a80d30aa1945&sc_lang=hi&hash=F9AC4C4D95353F62A7308D946260CCA1": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/automating-cell-based-processes/thumbnail.jpg",
  "https://media.beckman.com/-/media/app-note-support-items/automating-cell-line-development/thumbnail.jpg?h=251&w=195&rev=cbf0d10c3ecc428086619bef6163c5cd&sc_lang=hi&hash=D17C102CE2FBF2BDEAC8C212074FAC47": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/automating-cell-line-development/thumbnail.jpg",
  "https://media.beckman.com/-/media/app-note-support-items/automating-cell-line-development/thumbnail2.jpg?h=251&w=195&rev=405018fae8334c5bbd759964fd13ff1a&sc_lang=hi&hash=41B1EF6F31D2C3BA5413DE352F20E17B": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/automating-cell-line-development/thumbnail2.jpg",
  "https://media.beckman.com/-/media/app-note-support-items/cell-line-development-hit-picking/thumbnail.jpg?h=251&w=195&rev=8d6fecb2eab54b87b0b29741aa0c3be8&sc_lang=hi&hash=291C40FA099FB2A30987FE1323E0AFC7": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/cell-line-development-hit-picking/thumbnail.jpg",
  "https://media.beckman.com/-/media/app-note-support-items/cell-line-development-limiting-dilution/thumbnail.jpg?h=251&w=195&rev=05648305e07b4caeb5ccf27cfb2af0eb&sc_lang=hi&hash=5A0BBBF95393CA79D8A0657924BB03FD": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/cell-line-development-limiting-dilution/thumbnail.jpg",
  "https://media.beckman.com/-/media/app-note-support-items/cell-line-development-selection-enrichment/thumbnail.jpg?h=251&w=195&rev=22c432abaa314bcf8c7135f46b9ef7d8&sc_lang=hi&hash=FC8ADFCF4A668B775E4515EDB573DF35": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/cell-line-development-selection-enrichment/thumbnail.jpg",
  "https://media.beckman.com/-/media/app-note-support-items/cluster-count-analysis-and-sample-preparation/thumbnail?rev=00cce21201e842d78473e71dbe20c155": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/cluster-count-analysis-and-sample-preparation/thumbnail.jpg",
  "https://media.beckman.com/-/media/app-note-support-items/evaluation-of-instrument-to-instrument-performance-of-the-vicell-blu-cell-viability-analyzer/evaluation-of-instrument-to-instrument-performance-of-the-vicell-blu-cell-viability-analyzer?rev=9f2a1c3f8bff4c209c1397f6619a479b": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/evaluation-of-instrument-to-instrument-performance-of-the-vicell-blu-cell-viability-analyzer/evaluation-of-instrument-to-instrument-performance-of-the-vicell-blu-cell-viability-analyzer.jpg",
  "https://media.beckman.com/-/media/app-note-support-items/integration-of-the-vi-cell-blu-cell-viability-analyzer-into-the-sartorius-ambr-250-high-throughput/thumbnail.jpg?h=251&w=195&rev=48723df8b8f044ff81650c20adecd34c&sc_lang=hi&hash=C687FF4143B183AC9213E80432A2686C": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/integration-of-the-vi-cell-blu-cell-viability-analyzer-into-the-sartorius-ambr-250-high-throughput/thumbnail.jpg",
  "https://media.beckman.com/-/media/app-note-support-items/integration-of-the-vi-cell-blu-cell-viability-analyzer-into-the-sartorius-ambr-250-high-throughput/thumbnail?rev=48723df8b8f044ff81650c20adecd34c": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/integration-of-the-vi-cell-blu-cell-viability-analyzer-into-the-sartorius-ambr-250-high-throughput/thumbnail-02630a.jpg",
  "https://media.beckman.com/-/media/app-note-support-items/leveraging-analytical-ultracentrifugation-for-comprehensive-characterization-of-lipid-nanoparticles/application-note-leveraging-analytical-ultracentrifugation-for-comprehensive-characterization-2.jpg?rev=3e6e33700c6a42bd8c4fbd18d751ea85&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/leveraging-analytical-ultracentrifugation-for-comprehensive-characterization-of-lipid-nanoparticles/application-note-leveraging-analytical-ultracentrifugation-for-comprehensive-characterization-2.jpg",
  "https://media.beckman.com/-/media/app-note-support-items/the-vi-cell-blu-cell-viability-analyzer-cell-counter-performance-comparison-for-cho-and-hek-cells/thumbnail?rev=9ffc68c1e7ca4fa7bead012b1e1a7ccd": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/the-vi-cell-blu-cell-viability-analyzer-cell-counter-performance-comparison-for-cho-and-hek-cells/thumbnail.jpg",
  "https://media.beckman.com/-/media/app-note-support-items/variability-analysis-of-the-vi-cell-blu-cell-viability-analyzer-against-3-automated-cell-counting/thumbnail.jpg?h=251&w=195&rev=ce6ad22af0a846d6a1efee30b992ca59&sc_lang=hi&hash=3E70F918AEC24674F9E767987A3393A0": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/variability-analysis-of-the-vi-cell-blu-cell-viability-analyzer-against-3-automated-cell-counting/thumbnail.jpg",
  "https://media.beckman.com/-/media/biolector/cell-viability-vi-cell-blu-carousel-201901.jpg?rev=9ad04fd102ac4e94b9d21eab3afd75ad": "/content/dam/demo-ma-aem-coder/mybeckman/biolector/cell-viability-vi-cell-blu-carousel-201901.jpg",
  "https://media.beckman.com/-/media/cell-preparation-systems/instruments/cellmek-sps/callouts/flow-cytometry-cellmek-sps-8-waste.jpg?rev=ee9ae8d8ac9540dd87331c28627b72f9": "/content/dam/demo-ma-aem-coder/mybeckman/cell-preparation-systems/instruments/cellmek-sps/callouts/flow-cytometry-cellmek-sps-8-waste.jpg",
  "https://media.beckman.com/-/media/cell-preparation-systems/instruments/cellmek-sps/callouts/flow-cytometry-cellmek-sps-precision-performance.jpg?rev=8b0bd20c1c614038b954cc63956c41f8": "/content/dam/demo-ma-aem-coder/mybeckman/cell-preparation-systems/instruments/cellmek-sps/callouts/flow-cytometry-cellmek-sps-precision-performance.jpg",
  "https://media.beckman.com/-/media/cell-preparation-systems/instruments/cellmek-sps/callouts/flow-cytometry-cellmek-sps-sample-prep-performance.jpg?rev=a6a53da589044e39bb1ba61bd3765202": "/content/dam/demo-ma-aem-coder/mybeckman/cell-preparation-systems/instruments/cellmek-sps/callouts/flow-cytometry-cellmek-sps-sample-prep-performance.jpg",
  "https://media.beckman.com/-/media/cell-preparation-systems/instruments/cellmek-sps/flow-cytometry-cellmek-sps-hero-1.jpg": "/content/dam/demo-ma-aem-coder/mybeckman/cell-preparation-systems/instruments/cellmek-sps/flow-cytometry-cellmek-sps-hero-1.jpg",
  "https://media.beckman.com/-/media/cell-preparation-systems/instruments/cellmek-sps/flow-cytometry-cellmek-sps-hero-1.jpg?rev=f7f000d197d74d01b640cb3f9d78e8d7": "/content/dam/demo-ma-aem-coder/mybeckman/cell-preparation-systems/instruments/cellmek-sps/flow-cytometry-cellmek-sps-hero-1.jpg",
  "https://media.beckman.com/-/media/cell-sorters-counters-and-analyzers/cell-analyzers/instruments/cydem-vt/product-images/cydem-vt-system-front-view.jpg?rev=c3d5cae285484fc0baa6021516eae9df": "/content/dam/demo-ma-aem-coder/mybeckman/cell-sorters-counters-and-analyzers/cell-analyzers/instruments/cydem-vt/product-images/cydem-vt-system-front-view.jpg",
  "https://media.beckman.com/-/media/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-analytical-ultracentrifuge-auc-general-lab?rev=0df6a6ca84234caca209b883d07d9bdb": "/content/dam/demo-ma-aem-coder/mybeckman/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-analytical-ultracentrifuge-auc-general-lab.jpg",
  "https://media.beckman.com/-/media/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-analytical-ultracentrifuge-optima-auc-full-view-2017-05.jpg?rev=39d4064f4c334a40986dbbe3ce81d17a": "/content/dam/demo-ma-aem-coder/mybeckman/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-analytical-ultracentrifuge-optima-auc-full-view-2017-05.jpg",
  "https://media.beckman.com/-/media/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-analytical-ultracentrifuge-optima-auc-full-view-2017-05?rev=39d4064f4c334a40986dbbe3ce81d17a": "/content/dam/demo-ma-aem-coder/mybeckman/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-analytical-ultracentrifuge-optima-auc-full-view-2017-05.png",
  "https://media.beckman.com/-/media/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-rotor-analytical-optima-auc-chamber-lid-2017-11.png?rev=4c47520a046b4e47ae166042ca6463e1": "/content/dam/demo-ma-aem-coder/mybeckman/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-rotor-analytical-optima-auc-chamber-lid-2017-11.png",
  "https://media.beckman.com/-/media/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-rotor-analytical-optima-auc-chamber-lid-2017-11?rev=4c47520a046b4e47ae166042ca6463e1": "/content/dam/demo-ma-aem-coder/mybeckman/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-rotor-analytical-optima-auc-chamber-lid-2017-11-4278be.png",
  "https://media.beckman.com/-/media/cytobank/content/premium/cytobank-v10-release-details-img1-2022-09.jpg?rev=0ccf4b855e3b491baecf61432a85a308": "/content/dam/demo-ma-aem-coder/mybeckman/cytobank/content/premium/cytobank-v10-release-details-img1-2022-09.jpg",
  "https://media.beckman.com/-/media/events/speakers/basse_hofzumahaus.jpg?rev=c0fc859e4e054283bdf1511bad88f9d2&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/events/speakers/basse_hofzumahaus.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/5-costly-aspects-of-manual-data-analysis/flow-cytometry-5-costly-aspects-callout-2024-05.jpg?rev=04717ee2f2a3402dba6a9ed38402fe9f&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/5-costly-aspects-of-manual-data-analysis/flow-cytometry-5-costly-aspects-callout-2024-05.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-automated-callout-2024-06.jpg?rev=e361e34e1e744def824bc5dd33c3bbaf&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-automated-callout-2024-06.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-ebook-thumbnail.jpg?rev=6eabb63c1c994714b0da729235de0ccb&sc_lang=hi&hash=61BF460AB1735144D76F49AACFF0DB59": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-ebook-thumbnail.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-hero-banner-2024-04.jpg?rev=73cc09c870b3414ea2a0ec947562cee2&sc_lang=hi&hash=7F904E0F050C96CDD8FE069A8476B1D4": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-hero-banner-2024-04.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-nav-background-2024-06.jpg?rev=08a128a0dfe6473bbda8814468fddd34&sc_lang=hi&hash=E432376D75D67F82926152EE17902E92": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-nav-background-2024-06.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-workflow-steps-2024-06.jpg?rev=7a369532eaea43ecae95f6f9b2d8f883&sc_lang=hi&hash=62FC2F964D408A7EF97B2FD763111671": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-workflow-steps-2024-06.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/fully-automated-workflow/flow-cytometry-clinical-trials-automated-workflow-02c-hardware-2024-06.jpg?rev=832711cbb9334f4d9b821da6f4348134&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/fully-automated-workflow/flow-cytometry-clinical-trials-automated-workflow-02c-hardware-2024-06.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/lack-of-skilled-technicians/flow-cytometry-lack-of-skilled-vacancy-rates-2024-05.jpg?rev=4db47702a5c242fca5a2d35ff89e40db&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/lack-of-skilled-technicians/flow-cytometry-lack-of-skilled-vacancy-rates-2024-05.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/standardization/flow-cytometry-clinical-trials-analysis-evolution-2024-04.jpg?rev=84608d4156674a9aa661b8be06b65251&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/standardization/flow-cytometry-clinical-trials-analysis-evolution-2024-04.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/tracking-car-t-cells-after-infusion/flow-cytometry-clinical-trials-car-t-histogram-1-2024-05.jpg?rev=ac4ec7f4d23e42e7adacd4768fd9a5b3&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/tracking-car-t-cells-after-infusion/flow-cytometry-clinical-trials-car-t-histogram-1-2024-05.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/casebook/clearllab-10c-download/flow-cytometry-clearllab-10c-casebook-cover-2022-06.jpg?rev=8f2ecb57c7884f5cbb64ca9263f0788b": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/casebook/clearllab-10c-download/flow-cytometry-clearllab-10c-casebook-cover-2022-06.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-additional-resources-banner.jpg?rev=ad3351acafb84dea9cd8b121e9b0b0bf": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-additional-resources-banner.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-challenges-banner.jpg?rev=34ce9b6e9cbd4153b0baf1c9caee707a": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-challenges-banner.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-diagnostic-tool-banner.jpg?rev=8f783f0e98044976be9aa1e76569c1fa": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-diagnostic-tool-banner.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-lab-challenges.png?rev=fffaa2edaac641e78d166f8e8abc07bf": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-lab-challenges.png",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-overview-and-statistics-banner.jpg?rev=5739e57e32714629a631bf39b7a908ac": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-overview-and-statistics-banner.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-standardized-reagents-banner.jpg?rev=903180de1f854d8d8422cce35fd65652": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-standardized-reagents-banner.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/poster/flow-cytometry-haematopoietic-malignancies-poster-v2-2022-06.png?rev=b601568543474127bd92e324e6dd3ae2": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/poster/flow-cytometry-haematopoietic-malignancies-poster-v2-2022-06.png",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s1p02-how-flow-aids-diagnosis/flow-cytometry-clearllab-10c-workflow.jpg?rev=2ffc0ecf07ae4f449a7ad1992ecfa875": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s1p02-how-flow-aids-diagnosis/flow-cytometry-clearllab-10c-workflow.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s1p06-plasma-cell-neoplasms/flow-cytometry-plasma-cell-neoplasms.jpg?rev=6a9beb10bf8a464abd286eb145bbfb2f": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s1p06-plasma-cell-neoplasms/flow-cytometry-plasma-cell-neoplasms.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s1p10-t-all/flow-cytometry-t-cell-acute-lymphoblastic-leukemia.jpg?rev=51532f74ae7942c18ddc2340490ef150": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s1p10-t-all/flow-cytometry-t-cell-acute-lymphoblastic-leukemia.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s1p12-aml/flow-cytometry-acute-myeloid-leukemia.jpg?rev=f3a4a9e328414aa489677323dc5adc7e": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s1p12-aml/flow-cytometry-acute-myeloid-leukemia.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s2p01-minimizing-waste/flow-cytometry-workflow-spaghetti-diagram-1.jpg?rev=1f68ced1d77849b6b8581e3d0fef1daf": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s2p01-minimizing-waste/flow-cytometry-workflow-spaghetti-diagram-1.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s2p07-calculator/flow-cytometry-dura-innovations-calculator.png?rev=713cbfe365c74e86b8222ffd591d82ef": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s2p07-calculator/flow-cytometry-dura-innovations-calculator.png",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s2p09-dry-vs-liquid/flow-cytometry-dry-vs-liquid-thumbmail.png?rev=14b5f16b85d5497880edb7377452ff15": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s2p09-dry-vs-liquid/flow-cytometry-dry-vs-liquid-thumbmail.png",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s4p03-hernandez/flow-cytometry-sandra-hernandez.jpg?rev=79e6bc816ef849fdaa0e477ea3042981": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s4p03-hernandez/flow-cytometry-sandra-hernandez.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s5p03-cd200/flow-cytometry-cd200-expression.png?rev=96dce4ed7ae1416d99aef6048d6a3f68": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s5p03-cd200/flow-cytometry-cd200-expression.png",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s5p04-markers-in-the-panel/flow-cytometry-hematological-malignancies-s5-p4-figure-1a.jpg?rev=239ac5995e904da4a02e3ef685188a8a": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s5p04-markers-in-the-panel/flow-cytometry-hematological-malignancies-s5-p4-figure-1a.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s7p03-flow-cytometry-in-pediatric-cancer-diagnosis/flow-cytometry-pediatric-cancer-diagnosis-webinar-fig3-2022-06.jpg?rev=743e1ccbc68044ee8bbc2439ca4f5f8e": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s7p03-flow-cytometry-in-pediatric-cancer-diagnosis/flow-cytometry-pediatric-cancer-diagnosis-webinar-fig3-2022-06.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/hiv-section/section-0/flowc-hiv-cd4-button-guidelines.jpg?rev=f874055d420848ff915044a9fc38f5e3": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hiv-section/section-0/flowc-hiv-cd4-button-guidelines.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/content/ivdr/flow-cytometry-ivdr-impact-of-ivdr-webinar-callout-2.jpg?rev=359f968a009444fdba81d9fbd2960d28": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/ivdr/flow-cytometry-ivdr-impact-of-ivdr-webinar-callout-2.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/products/instruments/cytoflex/flow-cytometry-cytometers-cytoflex-full-view-2017-05.png": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/instruments/cytoflex/flow-cytometry-cytometers-cytoflex-full-view-2017-05.png",
  "https://media.beckman.com/-/media/flow-cytometry/products/instruments/cytoflex/flow-cytometry-cytometers-cytoflex-full-view-2017-05.png?rev=43f5b13d7e0145a89f0c74fc27ab7d7a": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/instruments/cytoflex/flow-cytometry-cytometers-cytoflex-full-view-2017-05.png",
  "https://media.beckman.com/-/media/flow-cytometry/products/instruments/cytoflex/flow-cytometry-instruments-cytoflex-lx-2018-7.gif": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/instruments/cytoflex/flow-cytometry-instruments-cytoflex-lx-2018-7.gif",
  "https://media.beckman.com/-/media/flow-cytometry/products/instruments/cytoflex/flow-cytometry-instruments-cytoflex-lx-2018-7.gif?rev=c47860798bdd4c0d8649eb4212dba6f3": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/instruments/cytoflex/flow-cytometry-instruments-cytoflex-lx-2018-7.gif",
  "https://media.beckman.com/-/media/flow-cytometry/products/instruments/dxflex/callout-images/flow-cytometry-dxflex-standardization-tile.jpg?rev=d3e2f2090b7f4883a38c8b55cdae6a2b&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/instruments/dxflex/callout-images/flow-cytometry-dxflex-standardization-tile.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/products/instruments/navios/flow-cytometers-navios-ex-full-view-2017-05.png?rev=6389c866ca4b43b798eb086cbb435d3a": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/instruments/navios/flow-cytometers-navios-ex-full-view-2017-05.png",
  "https://media.beckman.com/-/media/flow-cytometry/products/instruments/srt/flow-cytometry-cytoflex-srt-front-600x400.jpg?rev=ee2af927f8ab42599d7efc4c73388263": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/instruments/srt/flow-cytometry-cytoflex-srt-front-600x400.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-clearllab10c-10c-rack.jpg?rev=bdf3b56738bb44f2819916caa9a66ae2": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-clearllab10c-10c-rack.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-clearllab10c-compensation-beads.jpg?rev=440450b4a51648969e310cf822abda0e": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-clearllab10c-compensation-beads.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-clearllab10c-controls-tubes-boxes.jpg?rev=0897d9b65f1c42eb966c1e50db2ef42e": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-clearllab10c-controls-tubes-boxes.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-clearllab10c-t-tubes.jpg?rev=05ea779c053848928b1c4c28584a0455": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-clearllab10c-t-tubes.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-reagents-clearllab-10c-workflow-.jpg?w=1140&rev=4c44d07b9fc64b49a1f8ea4a35794035&hash=600D4F68853C84E45B18F2EB0BE800DE": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-reagents-clearllab-10c-workflow-.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-reagents-lab-developed-tests-workflow-v2.jpg?w=1140&rev=b7d731828ed741b2a28f73513b7e723b&hash=C1374ECF85BB6D31087CDDBFEBDFCABB": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-reagents-lab-developed-tests-workflow-v2.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/products/reagents/clearllab/flow-cytometry-clearllab-compensation-kit-2017-05.jpg?rev=c015e74d24c44945aee44ae18ebc66e1": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/clearllab/flow-cytometry-clearllab-compensation-kit-2017-05.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/products/reagents/duraclone/duraclone-im/flow-cytometry-reagent-duraclone-im-panels-2017-05.jpg": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/duraclone/duraclone-im/flow-cytometry-reagent-duraclone-im-panels-2017-05.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/products/reagents/duraclone/duraclone-im/flow-cytometry-reagent-duraclone-im-panels-2017-05.jpg?rev=d31f34ba48d243d98892ea6a60dae277": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/duraclone/duraclone-im/flow-cytometry-reagent-duraclone-im-panels-2017-05.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/products/reagents/duraclone/flow-cytometry-dura-innovations-time-savings-2019-03.jpg?rev=f4750e283a4c4b468f969761d5dc2138": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/duraclone/flow-cytometry-dura-innovations-time-savings-2019-03.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/products/reagents/sample-preparation/flow-cytometry-sample-preparation-02-2018.png?rev=4cd3c62cb35b4d699ace369d1bd46be7": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/sample-preparation/flow-cytometry-sample-preparation-02-2018.png",
  "https://media.beckman.com/-/media/flow-cytometry/products/reagents/supernova/flow-cytometry-reagents-supernova-polymer-dyes-liquid-conjugates.jpg?rev=7d476c673e284b0999ee6467d9187e5c": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/supernova/flow-cytometry-reagents-supernova-polymer-dyes-liquid-conjugates.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/products/software/cytobank/cytobank-learning-center-tiles/flow-cytometry-cytobank-learning-center-security-figure10.jpg?rev=7eda4ef5a4d0442da448d9c0343fa570": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/software/cytobank/cytobank-learning-center-tiles/flow-cytometry-cytobank-learning-center-security-figure10.jpg",
  "https://media.beckman.com/-/media/flow-cytometry/products/software/cytobank/flow-software-cytobank-logo-2023-02.png?rev=12b0ade940f142989c5131f34c3bf358": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/software/cytobank/flow-software-cytobank-logo-2023-02.png",
  "https://media.beckman.com/-/media/flow-cytometry/products/software/kaluza-c/flow-cytometry-kaluza-c-logo.jpg?rev=6e6bbbb786564e1ebc79c70d89cb2a86": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/software/kaluza-c/flow-cytometry-kaluza-c-logo.jpg",
  "https://media.beckman.com/-/media/flow-reagents/products/infrared-fluorescent-dyes/infrared_fluorescent_dye_d20055_cd8_ir870.png?rev=0048dceaa72947dc872b994c4e25b7b0&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/flow-reagents/products/infrared-fluorescent-dyes/infrared_fluorescent_dye_d20055_cd8_ir870.png",
  "https://media.beckman.com/-/media/genomics/content/articles/accelerating-discovery-with-automated-ngs-library-prep/automated-ngs-library-prep-banner-social-media-2024-10.jpg?rev=f0bb398798534f179363fbebeaa32b31&sc_lang=hi&hash=10642233551258A6B4BD9D3BC3E966BC": "/content/dam/demo-ma-aem-coder/mybeckman/genomics/content/articles/accelerating-discovery-with-automated-ngs-library-prep/automated-ngs-library-prep-banner-social-media-2024-10.jpg",
  "https://media.beckman.com/-/media/genomics/content/articles/biomanufacturing-and-ngs/biomanufacturing-ngs-social-media-2024-07.jpg?rev=6e7bf33bdced4694980a28645e43c57f&sc_lang=hi&hash=2D71559EAB9A3B3D24EA0D48760155AB": "/content/dam/demo-ma-aem-coder/mybeckman/genomics/content/articles/biomanufacturing-and-ngs/biomanufacturing-ngs-social-media-2024-07.jpg",
  "https://media.beckman.com/-/media/genomics/content/articles/challenges-with-ffpe-tissue-samples/ngs-ffpe-samples-challenges-social-media-2024-09.jpg?rev=5d76b6349887444f8d4e2033df108d9a&sc_lang=hi&hash=A1AEC69D7AB2D9B0CCFC370E7C132B48": "/content/dam/demo-ma-aem-coder/mybeckman/genomics/content/articles/challenges-with-ffpe-tissue-samples/ngs-ffpe-samples-challenges-social-media-2024-09.jpg",
  "https://media.beckman.com/-/media/genomics/content/articles/ngs-cost-reduction/ngs-cost-reduction-banner-social-media-2024-09.jpg?rev=0f7303cda61849d28c32368c9c3c2844": "/content/dam/demo-ma-aem-coder/mybeckman/genomics/content/articles/ngs-cost-reduction/ngs-cost-reduction-banner-social-media-2024-09.jpg",
  "https://media.beckman.com/-/media/genomics/content/articles/nucleic-acid-cleanup-for-sequencing/nucleic-acid-cleanup-ngs-top-banner-social-media-2-2024-07.jpg?rev=6894a7637877444c900e4e93c7e8682f&sc_lang=hi&hash=76C48267A011A8115A4ABE7271D751E1": "/content/dam/demo-ma-aem-coder/mybeckman/genomics/content/articles/nucleic-acid-cleanup-for-sequencing/nucleic-acid-cleanup-ngs-top-banner-social-media-2-2024-07.jpg",
  "https://media.beckman.com/-/media/genomics/content/articles/optimizing-dna-and-rna-extraction-protocols-for-ngs/optmizing-extraction-protocols-ngs-social-media-2024-05.jpg?rev=ac89cfe5b3af4247a449480ab5ab4e71&sc_lang=hi&hash=4C0DBB2EE77F798870C1E7626C69B657": "/content/dam/demo-ma-aem-coder/mybeckman/genomics/content/articles/optimizing-dna-and-rna-extraction-protocols-for-ngs/optmizing-extraction-protocols-ngs-social-media-2024-05.jpg",
  "https://media.beckman.com/-/media/genomics/content/articles/role-of-ngs-in-cancer-research/ngs-cancer-research-banner-social-media-2024-09.jpg?rev=01ff9b5ca4584f27bcee7b722575aa97": "/content/dam/demo-ma-aem-coder/mybeckman/genomics/content/articles/role-of-ngs-in-cancer-research/ngs-cancer-research-banner-social-media-2024-09.jpg",
  "https://media.beckman.com/-/media/genomics/products/dna-isolation/genomic-dna-extraction-automation-biomek-liquid-handler.jpg?rev=40a3df3265c3499cab1312094dbe17ff&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/genomics/products/dna-isolation/genomic-dna-extraction-automation-biomek-liquid-handler.jpg",
  "https://media.beckman.com/-/media/immunotherapy/manufacturing-processes-for-engineered-t-cell-therapy/biomek.jpg?rev=b71245f0d9bd426a8217c2066ff551c0": "/content/dam/demo-ma-aem-coder/mybeckman/immunotherapy/manufacturing-processes-for-engineered-t-cell-therapy/biomek.jpg",
  "https://media.beckman.com/-/media/immunotherapy/manufacturing-processes-for-engineered-t-cell-therapy/cytoflex-flow-cytometer.jpg?rev=2c6ade0a241f4e9d813937030e6a478b": "/content/dam/demo-ma-aem-coder/mybeckman/immunotherapy/manufacturing-processes-for-engineered-t-cell-therapy/cytoflex-flow-cytometer.jpg",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/echo-comparison-page/liquid-handler-echo-650t-2023-04.jpg?rev=b44efa5bd7a240f6933bcc57a95b08b9": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/echo-comparison-page/liquid-handler-echo-650t-2023-04.jpg",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/automated-ngs-library-prep-biomek-ngenius-2024-09.png?rev=768830ecf054479ca533468635590f7d&sc_lang=hi&hash=75AA33AD986F9F06FF766DF2D7E998A5": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/automated-ngs-library-prep-biomek-ngenius-2024-09.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/automation-biomek-echo-genomic-applications-brochure-cover-2024-08.jpg?rev=b92b30d7eefd4a2892cc2918e3c9c741": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/automation-biomek-echo-genomic-applications-brochure-cover-2024-08.jpg",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/automation-flyer-biomek-na-method-cards-screenshot-2024-08.jpg?rev=9068e6f1cdc3422588b9110f43c22e0d": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/automation-flyer-biomek-na-method-cards-screenshot-2024-08.jpg",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/automation-flyer-biomek-ngs-method-cards-screenshot-2024-08.jpg?rev=bbce183415c04f44b1d56982a71c8a7b": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/automation-flyer-biomek-ngs-method-cards-screenshot-2024-08.jpg",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/cost-icon-2024-08.png?rev=b76e3456824d4405b94956e3cc9db13b": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/cost-icon-2024-08.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ease-of-use-icon-2024-08.png?rev=d02a260ecfb040d8ac2beb7ef9d74881": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ease-of-use-icon-2024-08.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/flexibility-icon-2024-08.png?rev=aab74ba3c3534509a20de02bbaabf25a": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/flexibility-icon-2024-08.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-ampure-xp-dna-cleanup-beads-2024-08.png?rev=09c07d781a094db0a5ad2b207f39e4ca": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-ampure-xp-dna-cleanup-beads-2024-08.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-biomek-i5-i7-automated-liquid-hanlers-2024-08.png?rev=163f56e083f34ccea7534a5c0279e0cf": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-biomek-i5-i7-automated-liquid-hanlers-2024-08.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-biomek-ngenius-library-prep-2024-08.png?rev=7cc41edfadf64bf5aee03ac3b2d920ee": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-biomek-ngenius-library-prep-2024-08.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-data-results-2024-08.jpg?rev=c29a722273e140a98443cc0e4941c249": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-data-results-2024-08.jpg",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-echo-525-acoustic-liquid-handler-2024-08.png?rev=336a06fd0f3248158634eb4b887ce07f": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-echo-525-acoustic-liquid-handler-2024-08.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-formapure-xl-total-nucleic-acid-extraction-kit-2024-08.png?rev=c9e3c841ec1e43949c35c59f6ba80e0d": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-formapure-xl-total-nucleic-acid-extraction-kit-2024-08.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-genfind-v3-dna-extraction-kit-2024-08.png?rev=cd4611bb9c4c4ed38e4454d4d98fa486": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-genfind-v3-dna-extraction-kit-2024-08.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-rnadvance-tissue-rna-extraction-kit-2024-08.png?rev=4723f853bf794f7e9768f6e3cec74861": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-rnadvance-tissue-rna-extraction-kit-2024-08.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-size-selection-cleanup-beads-brochure-front-page.jpg?rev=485a15f5bab34ec2bcba38e5c2652ad3&sc_lang=hi&hash=399FAA13C06D9190DF8C31ED3568DF83": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-size-selection-cleanup-beads-brochure-front-page.jpg",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/precise-data-icon-2024-08.png?rev=5281335a890e4abca48c9edaac8f945f": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/precise-data-icon-2024-08.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/automation-liquid-handler-biomek-i7-i5-2024-04-min.png?rev=b09f217cb9df4ebc84175e00ac41aaf6&sc_lang=hi&hash=A7AA44E48763649FC5F36BDCB2097361": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/automation-liquid-handler-biomek-i7-i5-2024-04-min.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-allegra-v15-r-2024-04-min.png?rev=8ab779354b654f27b30769aac9556004&sc_lang=hi&hash=2603E0B1ACF6A2297EACBE7389629570": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-allegra-v15-r-2024-04-min.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-ampure-xp-2024-02-min.png?rev=66406be37610440090607334c7cdd27a&sc_lang=hi&hash=F1BBFC260EB0C05775F240F467ABF6A9": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-ampure-xp-2024-02-min.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-avanti-jxn-26-2024-04-min.jpg?rev=b0ace3385a0242209533f0b6a556b32d&sc_lang=hi&hash=13E9643F7D29CFEFE9C0CEF6D1E3D48B": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-avanti-jxn-26-2024-04-min.jpg",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-biolector-xt-2024-02-min.png?rev=241ecfd659da4af5bcc5d8158fb729d3&sc_lang=hi&hash=E1F2F959366BE789D63CA05D8840307B": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-biolector-xt-2024-02-min.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-biomek-biolector-2024-02-min.png?rev=a89249b151fa4329ab0b63bedd422f62&sc_lang=hi&hash=78A864EA783134BC75FF3DE4A3BF9BAC": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-biomek-biolector-2024-02-min.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-cosmcprep-2024-02-min.png?rev=5f033570e7174e8796c989734374b5ad&sc_lang=hi&hash=21D3528EA174540FFB58805390111CC4": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-cosmcprep-2024-02-min.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-cytoflex-2024-04-min.png?rev=5ef648b7be424b559407c7e41c58b394&sc_lang=hi&hash=920177D6FD590DBD268DCCBEB95BEA27": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-cytoflex-2024-04-min.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-cytoflex-srt-2024-04-min.jpg?rev=99316335816f4f34b885afaa19c29f29&sc_lang=hi&hash=4064A377D0B36EFBBD921764233DA488": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-cytoflex-srt-2024-04-min.jpg",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-echo-525-2024-02-min.png?rev=0a35be16bfa9491ba5b46b7812cff055&sc_lang=hi&hash=4A4BB5F20DA35DA8117636FE7CF0FF86": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-echo-525-2024-02-min.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-genfind-v3-2024-02-min.png?rev=a0b5c192c8f942688bec05959eb93d28&sc_lang=hi&hash=C033F8CE15AA1F802CE28E837FDED207": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-genfind-v3-2024-02-min.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-harvestline-system-2024-04-min.jpg?rev=2a16d8b097d0448ead349160fa8c1a94&sc_lang=hi&hash=2D18FA2D17CA228E67CF2623F3383FE7": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-harvestline-system-2024-04-min.jpg",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-mechone-2024-04-min.png?rev=3c42f6eee311468caeda30cb2ff070b6&sc_lang=hi&hash=231E25E9D8C48D3A41190593710BF0DC": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-mechone-2024-04-min.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-mulrisizer-4e-2024-04-min.png?rev=9985a52357fd473d83ef8b5636875acc&sc_lang=hi&hash=BCB3A942FE79D5F0C4A19A666E667297": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-mulrisizer-4e-2024-04-min.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-optima-auc-2024-04-min.png?rev=b96c4b374933430fa3713d853254e816&sc_lang=hi&hash=0C4306B3FF348918D7B90306DD760C54": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-optima-auc-2024-04-min.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-optima-xpn-2024-04-min.png?rev=75b293134b4342e5a5c47ab0e41092f3&sc_lang=hi&hash=7725A250986EC5822F69001D982A9DC4": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-optima-xpn-2024-04-min.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-spriselect-2024-02-min.png?rev=b67102a7c56041d8b26e7c0d2303f190&sc_lang=hi&hash=DC4AF09E80B2E8CAFD928A712E9EAFCE": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-spriselect-2024-02-min.png",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/design-biuld-test-learn-cycle.jpg?rev=89dde98d58af4e5ea8c57b42ab584290": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/design-biuld-test-learn-cycle.jpg",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/lesaffre-biofoundry-spotlight-story-front-page.jpg?rev=ac3315a5400e4a5097ec3ad417e406e6": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/lesaffre-biofoundry-spotlight-story-front-page.jpg",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/synbio-page-social-media-banner-2024-07.jpg?rev=2614ad19c0064286aa3bae09d02e8ba1&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/synbio-page-social-media-banner-2024-07.jpg",
  "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/synbio-page-top-banner-large-2024-02.jpg?rev=26376800644a4927ab651bce3798e827&sc_lang=hi&hash=2BF7DEABA4CD4A5F54BC95E21EBCAB38": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/synbio-page-top-banner-large-2024-02.jpg",
  "https://media.beckman.com/-/media/landing-page-support-images/biomanufacturing-ebook/ebook-biomanufacturing-front-page-2025-04.jpg?rev=a99fdd12f99e45f7891066b3d1e3b450": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/biomanufacturing-ebook/ebook-biomanufacturing-front-page-2025-04.jpg",
  "https://media.beckman.com/-/media/landing-page-support-images/centrifugation/cent-ppc-lp/centrifugation-allegra-v-15r-benchtop-centrifuge-2023-04.jpg?rev=9b41cd5f9f2b428786b3ab2d4008af2b": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/centrifugation/cent-ppc-lp/centrifugation-allegra-v-15r-benchtop-centrifuge-2023-04.jpg",
  "https://media.beckman.com/-/media/landing-page-support-images/centrifugation/centrifugation-adenovirus-dge-auc-2023-03.jpg?rev=deffa4590ec3404c9127dfc562118f25&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/centrifugation/centrifugation-adenovirus-dge-auc-2023-03.jpg",
  "https://media.beckman.com/-/media/landing-page-support-images/centrifugation/centrifugation-gene-therapy-dge-2023-03.jpg?rev=e34e101a686e4093beddc459bec92f54&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/centrifugation/centrifugation-gene-therapy-dge-2023-03.jpg",
  "https://media.beckman.com/-/media/landing-page-support-images/genomics/collaboration-program/genomics-customer-spotlight-palanisamy-formapure-xl-rna-screenshot-2024-02-min.png?rev=06a6773b99be4691ba69a0114d217754&sc_lang=hi&hash=1385A624D49BA4259BD7A8BFC19F0FB3": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/genomics/collaboration-program/genomics-customer-spotlight-palanisamy-formapure-xl-rna-screenshot-2024-02-min.png",
  "https://media.beckman.com/-/media/pdf-thumbnails/automating-the-valita-titer-igg-quantification-assay-on-a-biomek-i-series-liquid-handling-system/thumbnail_automating-valita-titer?rev=feb85a78d638420087db0fe934269979": "/content/dam/demo-ma-aem-coder/mybeckman/pdf-thumbnails/automating-the-valita-titer-igg-quantification-assay-on-a-biomek-i-series-liquid-handling-system/thumbnail_automating-valita-titer.jpg",
  "https://media.beckman.com/-/media/pdf-thumbnails/cydemvt/cover_cydem-vt-system-product-brochure.jpg?h=251&w=195&rev=1b4034fd64914355bc4e9d377813e4fb&sc_lang=hi&hash=1F75A93238CD74434BF2E227ED3AE8CC": "/content/dam/demo-ma-aem-coder/mybeckman/pdf-thumbnails/cydemvt/cover_cydem-vt-system-product-brochure.jpg",
  "https://media.beckman.com/-/media/pdf-thumbnails/cydemvt/thumbnail_introducing-cydem-vt?rev=f794b31eda22467ca03f060bdea4feb0": "/content/dam/demo-ma-aem-coder/mybeckman/pdf-thumbnails/cydemvt/thumbnail_introducing-cydem-vt.jpg",
  "https://media.beckman.com/-/media/product-applications/process-development-manufacturing/protein-production.png?rev=f6e0d5a5a46442f48461cde9df645d5c": "/content/dam/demo-ma-aem-coder/mybeckman/product-applications/process-development-manufacturing/protein-production.png",
  "https://media.beckman.com/-/media/research-areas/cell-line-development/cell-line-development-valita-titer.gif?h=312&w=550&rev=33a29a00c4614cb7b27282a981a08262&sc_lang=hi&hash=090B4F199D3A18EFAA82957825410C97": "/content/dam/demo-ma-aem-coder/mybeckman/research-areas/cell-line-development/cell-line-development-valita-titer.gif",
  "https://media.beckman.com/-/media/research-areas/cell-line-development/valita-titer-assay-for-igg-quantification.jpg?rev=8110c9f6e6c84ed2bb68ee971e0c0cc4": "/content/dam/demo-ma-aem-coder/mybeckman/research-areas/cell-line-development/valita-titer-assay-for-igg-quantification.jpg",
  "https://media.beckman.com/-/media/research-areas/extracellular-vesicles/2024_future_ev.jpg?rev=b826cc1551f04f5d95625050bb84ccd6&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/research-areas/extracellular-vesicles/2024_future_ev.jpg",
  "https://media.beckman.com/-/media/research-areas/monoclonal-antibodies/chc_monoclonal_antibodies_antidrug_conjugates_final_2560x600.jpg": "/content/dam/demo-ma-aem-coder/mybeckman/research-areas/monoclonal-antibodies/chc_monoclonal_antibodies_antidrug_conjugates_final_2560x600.jpg",
  "https://media.beckman.com/-/media/research-areas/monoclonal-antibodies/monoclonalantibodies-600x400-1.jpg?rev=e1fe238506964b85a228241f21effda3&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/research-areas/monoclonal-antibodies/monoclonalantibodies-600x400-1.jpg",
  "https://media.beckman.com/-/media/research-areas/monoclonal-antibodies/monoclonalantibodies-600x400-2.jpg?rev=4350adba757440f2a9446fce89d5bd36&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/research-areas/monoclonal-antibodies/monoclonalantibodies-600x400-2.jpg",
  "https://media.beckman.com/-/media/research-areas/monoclonal-antibodies/monoclonalantibodies-600x400-3.jpg?rev=3068bf61a7014e40a488c85f427167d7&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/research-areas/monoclonal-antibodies/monoclonalantibodies-600x400-3.jpg",
  "https://media.beckman.com/-/media/resources/disease-research/mabs-dev-ecosystem-v14?rev=af6420a01162440d805e645c4151e9a5": "/content/dam/demo-ma-aem-coder/mybeckman/resources/disease-research/mabs-dev-ecosystem-v14.jpg",
  "https://media.beckman.com/-/media/resources/technologies/auc-pages/blackandwhite_auc-homepage-banner-2560x600-v1-sw": "/content/dam/demo-ma-aem-coder/mybeckman/resources/technologies/auc-pages/blackandwhite_auc-homepage-banner-2560x600-v1-sw.png",
  "https://media.beckman.com/-/media/resources/technologies/auc-pages/evs": "/content/dam/demo-ma-aem-coder/mybeckman/resources/technologies/auc-pages/evs.png",
  "https://media.beckman.com/-/media/resources/technologies/auc-pages/interaction-studies": "/content/dam/demo-ma-aem-coder/mybeckman/resources/technologies/auc-pages/interaction-studies.png",
  "https://media.beckman.com/-/media/resources/technologies/auc-pages/lnp": "/content/dam/demo-ma-aem-coder/mybeckman/resources/technologies/auc-pages/lnp.png",
  "https://media.beckman.com/-/media/resources/technologies/auc-pages/mabs": "/content/dam/demo-ma-aem-coder/mybeckman/resources/technologies/auc-pages/mabs.png",
  "https://media.beckman.com/-/media/resources/technologies/auc-pages/thumbnails/dge-analysis.jpg?h=251&w=195&rev=4cdde9d6f3a4454d8d13f49f177e03b8&sc_lang=hi&hash=C93C53A9AC8B2768C0D372C158135BD9": "/content/dam/demo-ma-aem-coder/mybeckman/resources/technologies/auc-pages/thumbnails/dge-analysis.jpg",
  "https://media.beckman.com/-/media/resources/technologies/auc-pages/thumbnails/multiwavelenght?rev=f7470c16874e4bd0a6af9860bb226c57": "/content/dam/demo-ma-aem-coder/mybeckman/resources/technologies/auc-pages/thumbnails/multiwavelenght.jpg",
  "https://media.beckman.com/-/media/resources/technologies/auc-pages/thumbnails/sample-concentration?rev=97049503003343bca2c5f06f448cfa5b": "/content/dam/demo-ma-aem-coder/mybeckman/resources/technologies/auc-pages/thumbnails/sample-concentration.jpg",
  "https://media.beckman.com/-/media/resources/technologies/auc-pages/viral-vector": "/content/dam/demo-ma-aem-coder/mybeckman/resources/technologies/auc-pages/viral-vector.png",
  "https://media.beckman.com/-/media/service/media/vi-cell-metaflex.jpg?rev=1cdd2eea12c94ad3bcccc82851f62ffd": "/content/dam/demo-ma-aem-coder/mybeckman/service/media/vi-cell-metaflex.jpg"
};
