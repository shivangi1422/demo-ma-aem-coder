/*
 * Coveo for Sitecore client. The source site does not call Coveo Cloud directly:
 * it gets a short-lived search token from the Sitecore proxy and posts searches
 * through it (verified on www.mybeckman.in, 2026-11-03):
 *   GET  {base}/coveo/rest/token?t=<timestamp>            -> { token }
 *   POST {base}/coveo/rest/search/v2?sitecoreItemUri=..&siteName=..
 *        Authorization: Bearer <token>, form-urlencoded body
 * The endpoints send no CORS headers, so `base` must be same-origin with the
 * page (default '') or a proxy that forwards to the Sitecore origin.
 * No credentials are stored in code; the token comes from the proxy at runtime.
 */

const TOKEN_PATH = '/coveo/rest/token';
const SEARCH_PATH = '/coveo/rest/search/v2';
const DEFAULT_TIMEOUT = 15000;
// refresh a token this long before it expires
const TOKEN_MARGIN = 60000;

const tokens = new Map();

export class CoveoError extends Error {
  /**
   * @param {string} message
   * @param {{status?: number, aborted?: boolean, cause?: Error}} [details]
   */
  constructor(message, { status = 0, aborted = false, cause } = {}) {
    super(message);
    this.name = 'CoveoError';
    this.status = status;
    this.aborted = aborted;
    if (cause) this.cause = cause;
  }
}

/**
 * @param {string} base endpoint base URL ('' = same origin)
 * @param {string} path
 * @returns {string}
 */
export function endpointUrl(base, path) {
  return `${(base || '').trim().replace(/\/+$/, '')}${path}`;
}

/**
 * Expiry (ms since epoch) from a JWT's exp claim; 0 when unknown.
 * @param {string} token
 * @returns {number}
 */
function tokenExpiry(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload));
    return exp ? exp * 1000 : 0;
  } catch {
    return 0;
  }
}

/**
 * fetch with a timeout that also honours an external AbortSignal.
 * @param {string} url
 * @param {RequestInit} init
 * @param {{signal?: AbortSignal, timeout?: number}} options
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, init, { signal, timeout = DEFAULT_TIMEOUT } = {}) {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (signal && signal.aborted) throw new CoveoError('Request cancelled', { aborted: true, cause: e });
    if (controller.signal.aborted) throw new CoveoError('The search service did not respond in time', { cause: e });
    throw new CoveoError('The search service could not be reached', { cause: e });
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}

/**
 * Credentials mode: the proxy relies on the site session cookie, so send
 * cookies to a configured (proxy) origin as well as to our own.
 * @param {string} base
 * @returns {RequestCredentials}
 */
function credentialsFor(base) {
  return base ? 'include' : 'same-origin';
}

/**
 * Search token from the Sitecore proxy, cached per endpoint until shortly
 * before it expires. Concurrent callers share one request.
 * @param {string} base
 * @param {{force?: boolean, signal?: AbortSignal}} [options]
 * @returns {Promise<string>}
 */
export async function getSearchToken(base, { force = false, signal } = {}) {
  const cached = tokens.get(base);
  if (!force && cached) {
    if (cached.pending) return cached.pending;
    if (!cached.expires || cached.expires - TOKEN_MARGIN > Date.now()) return cached.token;
  }
  const pending = (async () => {
    const url = `${endpointUrl(base, TOKEN_PATH)}?t=${Date.now()}`;
    const resp = await fetchWithTimeout(url, {
      method: 'GET',
      credentials: credentialsFor(base),
      headers: { Accept: 'application/json' },
    }, { signal });
    if (!resp.ok) throw new CoveoError(`Search token request failed (${resp.status})`, { status: resp.status });
    const data = await resp.json().catch(() => ({}));
    if (!data.token) throw new CoveoError('The search service returned no token');
    tokens.set(base, { token: data.token, expires: tokenExpiry(data.token) });
    return data.token;
  })();
  tokens.set(base, { pending });
  try {
    return await pending;
  } catch (e) {
    tokens.delete(base);
    throw e;
  }
}

/**
 * Runs a search through the Coveo for Sitecore proxy. Retries once with a
 * fresh token when the proxy rejects the current one.
 * @param {object} options
 * @param {string} [options.base] endpoint base URL ('' = same origin)
 * @param {string} options.itemUri Sitecore item URI of the page (sitecoreItemUri)
 * @param {string} [options.siteName] Sitecore site name
 * @param {object} options.params search parameters (objects/arrays are JSON-encoded)
 * @param {AbortSignal} [options.signal]
 * @param {number} [options.timeout]
 * @returns {Promise<object>} Coveo search response
 */
export async function search({
  base = '', itemUri, siteName = 'website', params, signal, timeout,
}) {
  const query = new URLSearchParams({ sitecoreItemUri: itemUri || '', siteName });
  const url = `${endpointUrl(base, SEARCH_PATH)}?${query}`;
  const body = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    body.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  });

  const attempt = async (force) => {
    const token = await getSearchToken(base, { force, signal });
    return fetchWithTimeout(url, {
      method: 'POST',
      credentials: credentialsFor(base),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded; charset="UTF-8"',
        Accept: 'application/json',
      },
      body: body.toString(),
    }, { signal, timeout });
  };

  let resp = await attempt(false);
  if (resp.status === 401 || resp.status === 419) resp = await attempt(true);
  if (!resp.ok) throw new CoveoError(`Search request failed (${resp.status})`, { status: resp.status });
  try {
    return await resp.json();
  } catch (e) {
    throw new CoveoError('The search service returned an invalid response', { cause: e });
  }
}
