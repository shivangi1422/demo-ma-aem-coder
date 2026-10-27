/* eslint-disable */
/* global WebImporter */

/**
 * Beckman Coulter link rules (runs after the block parsers).
 *
 * - Links to www.beckmancoulter.com pages that are already migrated become
 *   site-relative paths (e.g. /en/products/hematology).
 * - Links to pages not migrated yet become absolute live-site URLs, so they
 *   keep working until those pages exist.
 * - In-page anchors (#id) are re-pointed to the heading the source id belongs
 *   to, using the id the delivery pipeline generates from heading text.
 *   template.linkRules.anchorOverrides can map an anchor to a heading text
 *   when the source id sits on a non-heading element.
 *
 * Config comes from payload.template.linkRules:
 *   { siteOrigin, migratedPaths: [...], anchorOverrides: { '#id': 'Heading text' } }
 */

// Site hosts come from linkRules.siteOrigin (www and bare host).
let anchorTargets = new Map();

function slugify(text) {
  return (text || '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-');
}

const hasText = (h) => h.textContent.trim() && h.textContent.trim() !== 'Empty heading';

function headingFor(el) {
  if (!el) return null;
  if (/^H[1-6]$/.test(el.tagName) && hasText(el)) return el.textContent.trim();
  const inner = Array.from(el.querySelectorAll('h1,h2,h3,h4,h5,h6')).find(hasText);
  if (inner) return inner.textContent.trim();
  // Target sits inside a section: use the first heading of the nearest ancestor that has one
  // (stop at #main-container so we never jump to an unrelated page heading).
  for (let p = el.parentElement; p && p.id !== 'main-container' && p.tagName !== 'BODY'; p = p.parentElement) {
    const h = Array.from(p.querySelectorAll('h1,h2,h3,h4,h5,h6')).find(hasText);
    if (h) return h.textContent.trim();
  }
  // Otherwise use the next real heading after it.
  const next = Array.from(el.ownerDocument.querySelectorAll('h1,h2,h3,h4,h5,h6'))
    // eslint-disable-next-line no-bitwise
    .find((h) => hasText(h) && (el.compareDocumentPosition(h) & 4));
  return next ? next.textContent.trim() : null;
}

function normalizePath(pathname) {
  return pathname.replace(/\.html?$/, '').replace(/\/$/, '').toLowerCase() || '/';
}

export default function transform(hookName, element, payload) {
  const rules = (payload.template && payload.template.linkRules) || {};
  const origin = rules.siteOrigin || 'https://www.beckmancoulter.com';
  const document = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    anchorTargets = new Map();
    // Overrides: { '#id': 'Heading' } for the whole template, or { '/page/path': { '#id': 'Heading' } } per page.
    const all = rules.anchorOverrides || {};
    let pagePath = '';
    try { pagePath = new URL((payload.params && payload.params.originalURL) || payload.url).pathname.replace(/\/$/, ''); } catch (e) { pagePath = ''; }
    const overrides = { ...all, ...(typeof all[pagePath] === 'object' ? all[pagePath] : {}) };
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      const hash = a.getAttribute('href');
      if (hash.length < 2 || anchorTargets.has(hash)) return;
      let text = typeof overrides[hash] === 'string' ? overrides[hash] : null;
      if (!text) {
        let target = null;
        try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) { target = null; }
        text = headingFor(target);
      }
      if (text) anchorTargets.set(hash, text);
    });
    return;
  }

  if (hookName !== 'afterTransform') return;

  const migrated = new Set((rules.migratedPaths || []).map(normalizePath));
  const pathMap = Object.fromEntries(Object.entries(rules.pathMap || {}).map(([k, v]) => [normalizePath(k), v]));
  const hosts = [new URL(origin).host, new URL(origin).host.replace(/^www\./, '')];
  const headingIds = new Set(Array.from(element.querySelectorAll('h1,h2,h3,h4,h5,h6'))
    .map((h) => slugify(h.textContent)));

  // Approved fixes for broken/expiring source links: [{ startsWith: '<source href prefix>', to: '<replacement>' }].
  const hrefOverrides = rules.hrefOverrides || [];

  element.querySelectorAll('a[href]').forEach((a) => {
    let href = a.getAttribute('href').trim();
    const fix = hrefOverrides.find((o) => href.startsWith(o.startsWith));
    if (fix) { href = fix.to; a.setAttribute('href', href); }
    if (/^tel:/i.test(href)) { a.setAttribute('href', href.replace(/[\s().-]/g, '')); return; }
    if (!href || /^(mailto:|javascript:)/i.test(href)) return;

    if (href.startsWith('#')) {
      const text = anchorTargets.get(href);
      if (text && headingIds.has(slugify(text))) a.setAttribute('href', `#${slugify(text)}`);
      return;
    }

    let url;
    try { url = new URL(href, origin); } catch (e) { return; }
    if (!hosts.includes(url.host)) return;

    const path = normalizePath(url.pathname);
    // Keep the fragment exactly as written in the source (URL() re-encodes characters like [ ]).
    const hash = href.includes('#') ? href.slice(href.indexOf('#')) : '';
    if (pathMap[path]) {
      a.setAttribute('href', `${pathMap[path]}${url.search}${hash}`);
    } else if (migrated.has(path) && path !== '/') {
      a.setAttribute('href', `${url.pathname.replace(/\/$/, '')}${url.search}${hash}`);
    } else {
      a.setAttribute('href', `${origin}${url.pathname}${url.search}${hash}`);
    }
  });
}
