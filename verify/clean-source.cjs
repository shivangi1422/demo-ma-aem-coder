// Usage: node clean-source.cjs <raw-snapshot.html> <out.html>
// Cleaned copy of a saved mybeckman.in render for local measurement: consent overlay removed, Font Awesome
// CSS restored from the CDN (5.15.4), data-URI SVG images restored inline, footer marked role=contentinfo,
// root-relative asset URLs resolved against the live origin.
const fs = require('fs');
const { JSDOM } = require('/usr/local/lib/node_modules/jsdom');

const [, , src, out] = process.argv;
const FA = 'https:/' + '/cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/';
const ORIGIN = 'https:/' + '/www.mybeckman.in';
const dom = new JSDOM(fs.readFileSync(src, 'utf8'));
const doc = dom.window.document;

doc.querySelectorAll('#consent_blackbar, #trustarc-banner-overlay, iframe, script, .MaskOverlay').forEach((n) => n.remove());
doc.querySelectorAll('link[href*="fontawesome/all.min.css"]').forEach((l) => { l.setAttribute('href', `${FA}all.min.css`); });
doc.querySelectorAll('link[href*="fontawesome/v4-shims"]').forEach((l) => { l.setAttribute('href', `${FA}v4-shims.min.css`); });
doc.querySelectorAll('img[src^="data:image/svg+xml;base64,"]').forEach((img) => {
  const svg = Buffer.from(img.getAttribute('src').split(',')[1], 'base64').toString('utf8');
  if (!/^\s*<svg/i.test(svg)) return;
  const tpl = doc.createElement('template');
  tpl.innerHTML = svg;
  const el = tpl.content.firstElementChild;
  if (img.className) el.setAttribute('class', `${el.getAttribute('class') || ''} ${img.className}`.trim());
  img.replaceWith(el);
});
const footer = doc.querySelector('.footer2023');
if (footer) footer.setAttribute('role', 'contentinfo');
doc.querySelectorAll('[src], link[href]').forEach((n) => {
  const attr = n.hasAttribute('src') ? 'src' : 'href';
  const v = n.getAttribute(attr);
  if (v.startsWith('/') && !v.startsWith('/' + '/')) n.setAttribute(attr, ORIGIN + v);
});
fs.writeFileSync(out, `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`);
