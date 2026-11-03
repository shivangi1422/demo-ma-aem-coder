/* eslint-disable */
/* global WebImporter */

/**
 * Parser for coveo-techdocs (Coveo Technical Documents block, key/value settings).
 * Source: https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise
 * Selector: #coveo-center-column
 * Model: coveo-techdocs (key-value block; one row per setting).
 *
 * advanced query = DOC_LANGUAGE_BOOST + " (" + #currentSiteRankingExpression + ") "
 *                  + TECHDOCS_FILTER + " (" + #currentSiteFilterExpression + ")"
 * constant query = ((@z95xlatestversion==1) (@source=="<index source>")) OR (@source=="Techdocs-Upgrade")
 * The constants and the composition are those of the request the source page sends
 * (captured 2026-11-03, migration-work/cytobank/captured-api-calls.json).
 * fallback = #coveo-techdocs-error, more results = #coveo-techdocs-more-results.
 */

const DOC_LANGUAGE_BOOST = "($qre(expression:'@documentlanguage*=en', modifier:1000))";
const TECHDOCS_FILTER = '((@source=="Techdocs-Upgrade" NOT @z95xtemplate==(ADB6CA4F03EF4F47B9AC9CE2BA53FF97,FE5DD82648C6436DB87A7C4210C7413B)))';

const norm = (s) => (s || '').replace(/[\s ]+/g, ' ').trim();

function itemUri(document) {
  const scripts = Array.from(document.querySelectorAll('script')).map((s) => s.textContent).join('\n');
  const m = scripts.match(/itemUri:\s*"([^"]+)"/);
  if (m) return m[1];
  const ctx = document.querySelector('[data-sc-item-uri]');
  return ctx ? ctx.getAttribute('data-sc-item-uri') : '';
}

function richCell(source, document) {
  const frag = document.createDocumentFragment();
  if (!source) return frag;
  const p = document.createElement('p');
  Array.from(source.childNodes).forEach((n) => p.appendChild(n.cloneNode(true)));
  p.innerHTML = p.innerHTML.replace(/\s+/g, ' ').trim();
  frag.appendChild(p);
  return frag;
}

export default function parse(element, { document }) {
  const iface = element.querySelector('.CoveoSearchInterface[data-pipeline]');
  const analytics = element.querySelector('.CoveoAnalytics[data-search-hub]');
  const hub = analytics ? analytics.getAttribute('data-search-hub') : (iface && iface.getAttribute('data-pipeline'));
  const pipeline = (iface && iface.getAttribute('data-pipeline')) || hub;
  const perPage = (iface && iface.getAttribute('data-results-per-page')) || '5';
  const ranking = document.querySelector('#currentSiteRankingExpression');
  const filter = document.querySelector('#currentSiteFilterExpression');
  const rank = ranking ? norm(ranking.getAttribute('data-sc-ranking-expression')) : '';
  const itemFilter = filter ? norm(filter.getAttribute('data-sc-advanced-filter')) : '';
  const aq = [DOC_LANGUAGE_BOOST, rank && `(${rank})`, TECHDOCS_FILTER, itemFilter && `(${itemFilter})`]
    .filter(Boolean).join(' ');
  const ctx = document.querySelector('.CoveoForSitecoreContext[data-sc-index-source-name]');
  const indexSource = ctx ? ctx.getAttribute('data-sc-index-source-name') : '';
  const cq = `((@z95xlatestversion==1) (@source=="${indexSource}")) OR (@source=="Techdocs-Upgrade")`;

  const fallback = document.createDocumentFragment();
  fallback.appendChild(richCell(element.querySelector('#coveo-techdocs-error'), document));
  const more = document.createDocumentFragment();
  more.appendChild(richCell(document.querySelector('#coveo-techdocs-more-results'), document));

  const cells = [
    ['endpoint', ''],
    ['sitecoreItemUri', itemUri(document)],
    ['siteName', 'website'],
    ['searchHub', hub],
    ['pipeline', pipeline],
    ['advancedQuery', aq],
    ['constantQuery', cq],
    ['locale', 'en'],
    ['resultsPerPage', perPage],
    ['fallback', fallback],
    ['moreResults', more],
  ];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Coveo Techdocs', cells });
  element.replaceWith(block);
}
