/* eslint-disable */
/* global WebImporter */

/**
 * Link transformer for www.mybeckman.in (all templates; runs first).
 * beforeTransform (source ids still exist): in-page anchors (#choosePlan, <a name="Courses">,
 *   #account-setup-login …) point at the heading inside / after the source target, written as the
 *   heading id the pipeline generates (github-slugger: lower case, punctuation dropped, space -> -).
 * afterTransform (after the parsers, so links in block tables are covered):
 *  - absolute www.mybeckman.in links become root-relative
 *  - links that are dead on the source (Sitecore notfound.aspx, empty href, bare '#') are unlinked,
 *    keeping their text; links left with no text or media are removed
 *  - FAQ leaf URLs left out of the import (copies of their parent listing on the source) point at
 *    the parent listing (P7 decision; the same 22 URLs are listed as redirects for the content team)
 * Links to pages outside the migrated scope stay root-relative (P7 decision).
 */

const SITE_HOST = /^(www\.)?mybeckman\.in$/i;

const LEAF_PARENTS = {
  '/support/faq/product': [
    'clearllab-ls-ifu-sample-types',
    'clearllab-ls-intended-use',
  ],
  '/support/faq/services': [
    'already-installed-tv-via-email',
    'are-beckmanconnect-servers-gdpr-compliant',
    'bc-installer-provides-network-error',
    'bc-installer-says-my-instrument-is-ineligible',
    'beckmanconnect-differences',
    'beckmanconnect-file-transfers',
    'beckmanconnect-installation',
    'beckmanconnect-installer',
    'beckmanconnect-installer-not-running',
    'beckmanconnect-instrument-controller-pc',
    'beckmanconnect-medical-devices',
    'beckmanconnect-which-instruments',
    'completed-registration-but-no-email-with-link',
    'content-for-2-acknowledge-boxes-not-loading',
    'do-i-need-to-remove-tv-if-installed',
    'i-want-to-remove-beckmanconnect',
    'is-download-link-for-bc-installer-or-teamviewer',
    'is-info-collected-from-bc-installer',
    'what-is-installed-with-the-installer',
    'why-did-i-receive-a-download-link-for-tv',
  ],
};

const LEAF_REDIRECTS = {};
Object.keys(LEAF_PARENTS).forEach((parent) => {
  LEAF_PARENTS[parent].forEach((leaf) => { LEAF_REDIRECTS[`${parent}/${leaf}`] = parent; });
});

function slugify(text) {
  return text.replace(/\s+/g, ' ').trim().toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
    .replace(/ /g, '-');
}

function findHeading(document, target) {
  if (/^H[1-6]$/.test(target.tagName)) return target;
  const inside = target.querySelector('h1, h2, h3, h4, h5, h6');
  if (inside) return inside;
  return [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .find((h) => target.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING);
}

function rewriteAnchors(document, root) {
  root.querySelectorAll('a[href^="#"]').forEach((a) => {
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (!id) return;
    const target = document.getElementById(id);
    // the importer drops empty <a name> targets (e.g. <a name="Courses">) before the transformers run:
    // fall back to the first heading holding the anchor's words (Courses -> "Course Catalog")
    const words = id.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[\s_-]+/)
      .filter(Boolean).map((w) => w.replace(/s$/, ''));
    const heading = target ? findHeading(document, target)
      : [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
        .find((h) => words.every((w) => h.textContent.toLowerCase().includes(w)));
    const slug = heading ? slugify(heading.textContent) : '';
    if (slug) a.setAttribute('href', `#${slug}`);
  });
}

function isEmpty(a) {
  return !a.textContent.replace(/\u00a0/g, ' ').trim() && !a.children.length;
}

function unlink(a) {
  if (isEmpty(a)) a.remove();
  else a.replaceWith(...a.childNodes);
}

function rewriteLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href').trim();
    if (href === '' || href === '#' || /\/sitecore\/service\/notfound\.aspx/i.test(href)) {
      unlink(a);
      return;
    }
    if (/^(mailto|tel|javascript):/i.test(href) || href.startsWith('#')) return;
    let url;
    try { url = new URL(href, 'https://www.mybeckman.in'); } catch (e) { return; }
    if (!SITE_HOST.test(url.hostname)) return;
    const path = url.pathname.replace(/\/$/, '') || '/';
    const target = LEAF_REDIRECTS[path] || path;
    a.setAttribute('href', `${target}${LEAF_REDIRECTS[path] ? '' : url.search + url.hash}`);
  });
  // empty links, no text and no child elements (e.g. Sitecore panel wrappers around a mailto)
  root.querySelectorAll('a[href]').forEach((a) => { if (isEmpty(a)) a.remove(); });
}

export default function transform(hookName, element, payload) {
  const document = element.ownerDocument || (payload && payload.document);
  if (hookName === 'beforeTransform') rewriteAnchors(document, element);
  if (hookName === 'afterTransform') rewriteLinks(element);
}
