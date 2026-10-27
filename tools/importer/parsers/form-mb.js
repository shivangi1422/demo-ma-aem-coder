/* eslint-disable */
/* global WebImporter */

/**
 * Parser for form-mb (base `form` block - forms are never variants).
 * Source: #main div.formassembly-container (1 per page on 7 mybeckman.in pages)
 *   > div.formWrapper > form.mktoForm#mktoForm_<id> (Marketo, rendered client-side).
 * The fields are not read here: they live in the EDS form definitions served
 * with the site code under /forms/ (forms migration). Hidden Marketo fields
 * (utm*, GCLID__c, Consent_Notes__c, munchkinId, honeypot) and reCAPTCHA are
 * not content. The footer newsletter form #mktoForm_3594 is outside #main and
 * removed by the cleanup.
 *
 *   mktoForm_3797 -> /forms/contact-our-team.json      (monoclonal-antibodies, cell-line-development)
 *   mktoForm_3101 -> /forms/contact-request-quote.json (biomanufacturing, synthetic-biology,
 *                                                       analytical-ultracentrifugation, next-generation-sequencing)
 *   mktoForm_1024 -> /forms/contact-talk-to-expert.json (protein-production)
 *
 * Output: the form block - 1 row, link to the form JSON. xwalk model
 * `form-file` (blocks/form/_form-file.json): single aem-content field `reference`.
 * After the block: the form's privacy statement (the .mktoHtmlText holding
 * "By submitting this form") as a default-content paragraph, its two links
 * made absolute (https://www.mybeckman.in/about-us/...).
 */

const ORIGIN = 'https://www.mybeckman.in';

const FORM_JSON = {
  3797: '/forms/contact-our-team.json',
  3101: '/forms/contact-request-quote.json',
  1024: '/forms/contact-talk-to-expert.json',
};
const DEFAULT_FORM_JSON = '/forms/contact-request-quote.json';

const PRIVACY_RE = /By submitting this form/i;

const clean = (str) => (str || '').replace(/[\s ]+/g, ' ').trim();

function formId(element) {
  const form = element.querySelector('form[id^="mktoForm_"], [id^="mktoForm_"]');
  const fromId = form && (form.id.match(/^mktoForm_(\d+)/) || [])[1];
  if (fromId) return fromId;
  const input = element.querySelector('input[name="formid"], input[name="formVid"]');
  return input ? clean(input.getAttribute('value')) : '';
}

function absoluteHref(href) {
  const v = (href || '').trim();
  if (/^\/[^/]/.test(v)) return `${ORIGIN}${v}`;
  return v;
}

/** privacy statement paragraph, links absolute */
function privacyParagraph(element, document) {
  const holder = [...element.querySelectorAll('.mktoHtmlText')]
    .find((el) => PRIVACY_RE.test(el.textContent))
    || [...element.querySelectorAll('p, div, span')].reverse()
      .find((el) => PRIVACY_RE.test(el.textContent) && !el.querySelector('div, p'));
  const p = document.createElement('p');
  if (!holder) {
    // Marketo did not render: same statement on every page
    p.append(
      document.createTextNode('By submitting this form I confirm that I have reviewed and agree with the '),
    );
    const privacy = document.createElement('a');
    privacy.href = `${ORIGIN}/about-us/global-privacy-notice`;
    privacy.textContent = 'Privacy Policy';
    const terms = document.createElement('a');
    terms.href = `${ORIGIN}/about-us/terms-of-use`;
    terms.textContent = 'Terms of Use';
    p.append(privacy, document.createTextNode(' and '), terms, document.createTextNode(
      '. I also understand my privacy choices as they pertain to my personal data as provided in the Privacy Policy under “Your Privacy Choices”.',
    ));
    return p;
  }
  const copy = (src, dest) => {
    src.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        dest.append(document.createTextNode(node.textContent.replace(/[\s ]+/g, ' ')));
        return;
      }
      if (node.nodeType !== 1 || !clean(node.textContent)) return;
      if (node.tagName === 'A' && node.getAttribute('href')) {
        const a = document.createElement('a');
        a.href = absoluteHref(node.getAttribute('href'));
        a.textContent = clean(node.textContent);
        dest.append(a);
        return;
      }
      if (/^(STRONG|B|EM|I)$/.test(node.tagName)) {
        const el = document.createElement(/^(STRONG|B)$/.test(node.tagName) ? 'strong' : 'em');
        copy(node, el);
        dest.append(el);
        return;
      }
      copy(node, dest);
    });
  };
  copy(holder, p);
  const first = p.firstChild;
  if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
  const last = p.lastChild;
  if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
  return p;
}

export default function parse(element, { document }) {
  const id = formId(element);
  const file = FORM_JSON[id] || DEFAULT_FORM_JSON;

  const link = document.createElement('a');
  link.href = file;
  link.textContent = file;

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'form',
    cells: [[[document.createComment(' field:reference '), link]]],
  });
  const privacy = privacyParagraph(element, document);
  element.replaceWith(block);
  block.after(privacy);
}
