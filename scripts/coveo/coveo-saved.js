/*
 * Saved-data fallback for the dynamic listing blocks. The live APIs (Coveo for
 * Sitecore proxy, Sitecore resource controller) only answer on the source's own
 * domain; on any other domain (preview, aem.page) the blocks load a recorded copy
 * of the real API responses (tools/fallback-data/build-fallback-data.mjs) and run
 * the same query rules on it in the browser:
 *  - Coveo facets: values of one facet OR-ed, facets AND-ed; a facet's counts
 *    leave out its own selection (advancedQueryOverride); values sorted by count
 *    then name, at most `maximumNumberOfValues`; results keep the recorded
 *    relevancy order and are paged by firstResult / numberOfResults.
 *  - Resources: items whose type GUID is in the filter value, 5 per page.
 * Responses have the same shape as the live ones, so rendering is unchanged.
 */

const cache = new Map();

/**
 * Loads (once) a saved-data JSON file.
 * @param {string} url
 * @returns {Promise<object>}
 */
export function loadSavedData(url) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url, { headers: { Accept: 'application/json' } }).then((resp) => {
      if (!resp.ok) throw new Error(`Saved data not available (${resp.status})`);
      return resp.json();
    }).catch((e) => {
      cache.delete(url);
      throw e;
    }));
  }
  return cache.get(url);
}

/**
 * Values of a facet field on a result (raw fields hold arrays).
 * @param {object} result
 * @param {string} field e.g. @licensez32xterm
 * @returns {string[]}
 */
function fieldValues(result, field) {
  const value = (result.raw || {})[field.replace(/^@/, '').toLowerCase()];
  if (value === undefined || value === null) return [];
  return (Array.isArray(value) ? value : [value]).map(String);
}

/**
 * @param {object[]} results
 * @param {import('./coveo-facets.js').FacetState} facets
 * @param {string} [excludeField] facet whose own selection is ignored
 * @returns {object[]}
 */
function applySelections(results, facets, excludeField) {
  return results.filter((r) => facets.definitions.every((d) => {
    if (d.field === excludeField) return true;
    const selected = facets.selected.get(d.field) || [];
    if (!selected.length) return true;
    const values = fieldValues(r, d.field);
    return selected.some((v) => values.includes(v));
  }));
}

/**
 * Product Table search on saved results; returns a Coveo-shaped response.
 * @param {object} data saved licenses file
 * @param {object} options
 * @param {import('./coveo-facets.js').FacetState} options.facets
 * @param {number} options.firstResult
 * @param {number} options.numberOfResults
 * @returns {{totalCount: number, results: object[], groupByResults: object[]}}
 */
export function searchSaved(data, { facets, firstResult, numberOfResults }) {
  const all = data.results || [];
  const matching = applySelections(all, facets);
  const groupByResults = facets.definitions.map((d) => {
    const counts = new Map();
    applySelections(all, facets, d.field).forEach((r) => {
      fieldValues(r, d.field).forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
    });
    const values = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, facets.maximumNumberOfValues)
      .map(([value, count]) => ({ value, numberOfResults: count }));
    return { field: d.field.replace(/^@/, ''), values };
  });
  return {
    totalCount: matching.length,
    totalCountFiltered: matching.length,
    results: matching.slice(firstResult, firstResult + numberOfResults),
    groupByResults,
  };
}

/**
 * Resource list page on saved items; same shape as the resource client.
 * @param {object} data saved resources file
 * @param {string} filterValue type GUIDs joined with "|"
 * @param {number} pageNumber 1-based
 * @returns {{items: object[], count: number, totalPages: number}}
 */
export function resourcesSaved(data, filterValue, pageNumber) {
  const types = new Set((filterValue || '').split('|').map((v) => v.trim().toUpperCase()));
  const size = data.pageSize || 5;
  const matching = (data.items || [])
    .filter((item) => types.has((item.ContentTypeTaxonomyFacet || '').toUpperCase()));
  return {
    items: matching.slice((pageNumber - 1) * size, pageNumber * size),
    count: matching.length,
    totalPages: Math.ceil(matching.length / size),
  };
}
