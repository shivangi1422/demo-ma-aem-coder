/*
 * Client for the source site's "Content and Resources" controller (Sitecore,
 * not Coveo), verified on www.mybeckman.in 2026-11-03:
 *   POST {base}/api/sitecore/ResourceTable/GetContentResources
 *   { filterValue: "<GUID>|<GUID>...", searchValue: "", pageNumber: 1, dataSourceId: "{...}" }
 *   -> { meta: [page items], count, totalPages, completelist }
 * Items: contentTitle, contentDescription (HTML), contentIcon (Font Awesome
 * class), contentUrl, ContentTypeTaxonomyFacet. Same-origin only (no CORS).
 */

const PATH = '/api/sitecore/ResourceTable/GetContentResources';
const TIMEOUT = 15000;

export class ResourceError extends Error {
  constructor(message, { status = 0, aborted = false } = {}) {
    super(message);
    this.name = 'ResourceError';
    this.status = status;
    this.aborted = aborted;
  }
}

/**
 * @param {object} options
 * @param {string} [options.base] endpoint base URL ('' = same origin)
 * @param {string} options.dataSourceId Sitecore datasource item of the resource table
 * @param {string} options.filterValue type GUIDs joined with "|"
 * @param {number} [options.pageNumber] 1-based page
 * @param {string} [options.searchValue]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{items: object[], count: number, totalPages: number}>}
 */
export default async function fetchResources({
  base = '', dataSourceId, filterValue, pageNumber = 1, searchValue = '', signal,
}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal) signal.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, TIMEOUT);
  let resp;
  try {
    resp = await fetch(`${(base || '').replace(/\/+$/, '')}${PATH}`, {
      method: 'POST',
      credentials: base ? 'include' : 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        filterValue, searchValue, pageNumber, dataSourceId,
      }),
      signal: controller.signal,
    });
  } catch {
    if (signal && signal.aborted) throw new ResourceError('Request cancelled', { aborted: true });
    throw new ResourceError('The resource service could not be reached');
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', abort);
  }
  if (!resp.ok) throw new ResourceError(`Resource request failed (${resp.status})`, { status: resp.status });
  let data;
  try {
    data = await resp.json();
  } catch {
    throw new ResourceError('The resource service returned an invalid response');
  }
  return {
    items: Array.isArray(data.meta) ? data.meta : [],
    count: Number(data.count) || 0,
    totalPages: Number(data.totalPages) || 0,
  };
}
