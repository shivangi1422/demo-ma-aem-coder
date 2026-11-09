/* eslint-disable */
/* global WebImporter */

/**
 * Prepare transformer for www.beckman.com product detail pages (template product-detail).
 * Runs in beforeTransform, after mybeckman-links (anchors already point at heading slugs)
 * and BEFORE mybeckman-cleanup. Only acts on product markup (.product-spotlight-wrapper),
 * so it is a no-op for every other template.
 *
 * - Coveo-driven containers left out by decision (page-templates.json "excluded"):
 *   model table container, tech-docs table + error, resource filter UI and pagination.
 * - The "Explore … Models" heading sits INSIDE a .CoveoSearchInterface, which the cleanup
 *   removes via [class*="Coveo"]: the #product-table-wrapper is lifted out first, then the
 *   search interface (and its class-less wrapper div) is dropped.
 * - Product gallery: the (possibly uninitialised) carousel is reduced to the first real image.
 * - .product-page-sub-heading-wrapper is unwrapped (its h3 becomes default content).
 * - Non-authorable leftovers: hidden helper iframe, empty access modal, icon fonts, empty
 *   anchors / paragraphs / headings / lists, inline styles, anchor-nav links with no target.
 * Absolute https://www.beckman.com links are left untouched (site is mybeckman.in-based).
 */

const EXCLUDED = [
  '#product-table-wrapper .product-table__container',
  '#techdocs-wrapper #coveo-center-column',
  '#coveo-techdocs-error',
  '#product-documentation-wrapper #multiselect__container',
  '#multiselect__container',
  '#resource-table-pagination',
];

const PLACEHOLDER_IMG = /(^data:|spacer|blank\.(gif|png)|placeholder|loading|spinner|1x1)/i;

function isBlankText(str) {
  return !(str || '').replace(/ /g, ' ').trim();
}

function hasMedia(el) {
  return !!el.querySelector('img, picture, video, iframe, svg');
}

function unwrap(el) {
  el.replaceWith(...el.childNodes);
}

function slugify(text) {
  return text.replace(/\s+/g, ' ').trim().toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
    .replace(/ /g, '-');
}

function imgSource(img) {
  const candidates = [
    img.getAttribute('src'),
    img.getAttribute('data-src'),
    img.getAttribute('data-lazy'),
    img.getAttribute('data-original'),
    (img.getAttribute('srcset') || '').split(',')[0].trim().split(/\s+/)[0],
  ];
  return candidates.find((s) => s && !PLACEHOLDER_IMG.test(s)) || '';
}

/** Lift #product-table-wrapper out of its Coveo search interface (cleanup would remove it). */
function liftProductTable(scope) {
  const table = scope.querySelector('#product-table-wrapper');
  if (!table) return;
  let outer = null;
  let node = table.parentElement;
  while (node && node !== scope) {
    if (/Coveo/.test(node.getAttribute('class') || '')) outer = node;
    node = node.parentElement;
  }
  if (!outer) return;
  // the plain, class-less <div> wrapping the search interface goes too
  let anchor = outer;
  const parent = outer.parentElement;
  if (parent && parent !== scope && !(parent.getAttribute('class') || '').trim() && !parent.id
    && parent.children.length === 1) anchor = parent;
  anchor.parentElement.insertBefore(table, anchor);
  // what is left is the Coveo search interface only (facets, result list, pager)
  anchor.remove();
}

/** Reduce each product gallery carousel to a single plain <img> of the first real image. */
function prepareGallery(document, scope) {
  scope.querySelectorAll('.product-gallery-carousel').forEach((carousel) => {
    let src = '';
    let alt = '';
    const img = [...carousel.querySelectorAll('img')].find((i) => imgSource(i));
    if (img) {
      src = imgSource(img);
      alt = (img.getAttribute('alt') || '').trim();
    } else {
      // uninitialised lightbox: the image URL only lives on the link
      const link = carousel.querySelector('[data-featherlight], [data-zoom-image], [data-image]');
      if (link) {
        src = link.getAttribute('data-featherlight') || link.getAttribute('data-zoom-image')
          || link.getAttribute('data-image') || '';
        if (PLACEHOLDER_IMG.test(src) || src.startsWith('#')) src = '';
      }
    }
    if (!src) {
      carousel.remove();
      return;
    }
    const clean = document.createElement('img');
    clean.setAttribute('src', src);
    clean.setAttribute('alt', alt);
    carousel.replaceChildren(clean);
  });
}

function removeEmpty(scope) {
  // anchors without href and without content (e.g. <a></a> before the sub heading)
  scope.querySelectorAll('a:not([href])').forEach((a) => {
    if (isBlankText(a.textContent) && !hasMedia(a)) a.remove();
  });
  // icon-font glyphs
  scope.querySelectorAll('i[class*="fa-"], i.fa, i.far, i.fas, i.fab').forEach((i) => {
    if (isBlankText(i.textContent)) i.remove();
  });
  // empty text elements, innermost first
  [...scope.querySelectorAll('li, ul, ol, p, h1, h2, h3, h4, h5, h6')].reverse().forEach((el) => {
    if (isBlankText(el.textContent) && !hasMedia(el)) el.remove();
  });
  // empty layout leftovers (e.g. <div class="container"></div> after the FAQs)
  scope.querySelectorAll('div.container:not(.custome-container)').forEach((div) => {
    if (isBlankText(div.textContent) && !hasMedia(div)) div.remove();
  });
}

/** Anchor-nav entries whose target is gone (e.g. #related-parts-wrapper is not on the page). */
function removeDeadNavLinks(document, scope) {
  const slugs = new Set([...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .map((h) => slugify(h.textContent)).filter(Boolean));
  scope.querySelectorAll('#intrenal-page-link-wrapper a[href^="#"]').forEach((a) => {
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (!id) { a.remove(); return; }
    if (document.getElementById(id) || slugs.has(id)) return;
    a.remove();
  });
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  const document = element.ownerDocument || (payload && payload.document);
  const scope = element.querySelector('.product-spotlight-wrapper');
  if (!scope) return;

  // 1. the models heading must leave the Coveo interface before anything is removed
  liftProductTable(scope);

  // 2. Coveo-driven / client-side widgets left out by decision
  WebImporter.DOMUtils.remove(scope, EXCLUDED);
  scope.querySelectorAll('input').forEach((i) => i.remove());

  // 3. "Didn't find what you are looking for? … click here." becomes a paragraph
  scope.querySelectorAll('#coveo-techdocs-more-results').forEach((div) => {
    const p = document.createElement('p');
    p.append(...div.childNodes);
    div.replaceWith(p);
  });

  // 4. product image
  prepareGallery(document, scope);

  // 5. sub-heading wrappers -> plain h3
  scope.querySelectorAll('.product-page-sub-heading-wrapper').forEach(unwrap);

  // 6. presentational spans inside the "Explore … Models" button
  scope.querySelectorAll('a.product-table-link-btn span').forEach((span) => {
    if (span.attributes.length === 0) unwrap(span);
  });

  // 7. non-authorable leftovers in the product area
  removeEmpty(scope);
  scope.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));
  scope.querySelectorAll('[tabindex]').forEach((el) => el.removeAttribute('tabindex'));
  scope.querySelectorAll('[data-featherlight]').forEach((el) => el.removeAttribute('data-featherlight'));
  removeDeadNavLinks(document, scope);

  // 8. hidden helper iframe(s) and the empty access-restricted modal (outside the scope)
  element.querySelectorAll('iframe#MktoForms2XDIframe, iframe[name^="mktoFormsXDIframe"]').forEach((f) => f.remove());
  element.querySelectorAll('iframe[style*="display: none"], iframe[style*="display:none"]').forEach((f) => f.remove());
  element.querySelectorAll('#ModalPopup.access-restriced-login-modal').forEach((m) => {
    if (isBlankText(m.textContent) && !hasMedia(m)) m.remove();
  });
}
