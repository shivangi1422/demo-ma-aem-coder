/*
 * Builds the search/v2 form parameters the source's Coveo JSUI interfaces send
 * (values verified against captured requests on www.mybeckman.in). Page-specific
 * values (hub, pipeline, aq, cq, page size) come from the block configuration.
 */

const DEFAULTS = {
  isGuestUser: 'false',
  locale: 'en',
  maximumAge: '900000',
  excerptLength: '200',
  enableDidYouMean: 'false',
  sortCriteria: 'relevancy',
  queryFunctions: [],
  rankingFunctions: [],
  facetOptions: {},
  categoryFacets: [],
  retrieveFirstSentences: 'true',
  enableQuerySyntax: 'false',
  enableDuplicateFiltering: 'false',
  enableCollaborativeRating: 'false',
  debug: 'false',
  allowQueriesWithoutKeywords: 'true',
};

/**
 * @returns {string} the browser's IANA time zone (sent as `timezone`)
 */
function timezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * @param {object} options
 * @param {string} options.searchHub
 * @param {string} options.pipeline
 * @param {string} [options.aq] base advanced query (facet selections are added by `facets`)
 * @param {string} [options.cq] constant query
 * @param {string} [options.q] basic query text
 * @param {number} [options.firstResult]
 * @param {number} [options.numberOfResults]
 * @param {string} [options.locale]
 * @param {import('./coveo-facets.js').FacetState} [options.facets]
 * @param {object} [options.groupBy] explicit groupBy (when no FacetState is used)
 * @returns {object} parameters for coveo-client search()
 */
export default function buildSearchParams({
  searchHub, pipeline, aq = '', cq = '', q = '', firstResult = 0, numberOfResults = 10,
  locale, facets, groupBy,
}) {
  const params = {
    ...DEFAULTS,
    actionsHistory: [],
    aq: facets ? facets.advancedQuery(aq) : aq,
    cq,
    searchHub,
    pipeline,
    firstResult: String(firstResult),
    numberOfResults: String(numberOfResults),
    timezone: timezone(),
    groupBy: facets ? facets.groupBy(aq, cq) : (groupBy || []),
  };
  if (locale) params.locale = locale;
  if (q) params.q = q;
  return params;
}
