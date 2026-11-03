/*
 * Normalizes Coveo for Sitecore search responses. Besides the standard Coveo
 * result (title, clickUri, raw fields), the Sitecore proxy adds commerce fields
 * to product results (imageUrl, imageAlt, requestQuoteLink, showBuyingOptions,
 * isSalable, prices, ...); their names are taken from the source's result template.
 */

const truthy = (value) => value === true || String(value).toLowerCase() === 'true';

/**
 * First value of a raw field (Coveo returns multi-value fields as arrays).
 * @param {object} raw
 * @param {string} name
 * @returns {string}
 */
export function rawValue(raw, name) {
  const value = raw ? raw[name] : undefined;
  if (Array.isArray(value)) return value.length ? String(value[0]) : '';
  return value === undefined || value === null ? '' : String(value);
}

/**
 * Resolves a site-relative URL returned by the proxy against the endpoint base.
 * @param {string} url
 * @param {string} base
 * @returns {string}
 */
function resolve(url, base) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (!base) return url;
  try {
    return new URL(url, `${base.replace(/\/+$/, '')}/`).href;
  } catch {
    return url;
  }
}

/**
 * Product Table result -> card data.
 * @param {object} result Coveo result
 * @param {string} [base] endpoint base URL
 * @returns {object}
 */
export function normalizeProduct(result, base = '') {
  const raw = result.raw || {};
  const title = rawValue(raw, 'itemtitle') || result.title || '';
  const productNumber = rawValue(raw, 'z95xname') || rawValue(raw, 'partz32xnumber');
  // the raw image field is an absolute CDN URL; the proxy's imageUrl is site-relative
  const rawImage = rawValue(raw, 'imageurl');
  const image = /^https?:\/\//i.test(rawImage) ? rawImage : resolve(result.imageUrl || rawImage, base);
  return {
    id: result.uniqueId || result.uri || productNumber,
    title,
    url: result.clickUri || rawValue(raw, 'urllink'),
    productNumber,
    image,
    imageAlt: result.imageAlt || title,
    showBuyingOptions: result.showBuyingOptions === undefined
      || truthy(result.showBuyingOptions),
    showPriceSection: truthy(result.showPriceSection),
    listPrice: result.listPrice || '',
    productPrice: result.productPrice || '',
    showLoginForPrice: truthy(result.showLoginForPrice),
    showAddToCartDirect: truthy(result.showAddToCartDirect),
    isSalable: truthy(result.isSalable),
    productRfq: truthy(result.productRfq),
    productRfqLink: result.productRfqLink || '',
    requestQuoteLink: result.requestQuoteLink || '',
  };
}

/**
 * Technical Documents result -> table row data (source result template:
 * /techdocs/{documentname}/{documentid}, category, documentid, lotnumber).
 * @param {object} result
 * @returns {object}
 */
export function normalizeTechDoc(result) {
  const raw = result.raw || {};
  const name = rawValue(raw, 'documentname');
  const id = rawValue(raw, 'documentid');
  return {
    id: result.uniqueId || `${name}/${id}`,
    title: rawValue(raw, 'documenttitle') || result.title || '',
    url: name && id ? `/techdocs/${encodeURIComponent(name)}/${encodeURIComponent(id)}` : result.clickUri,
    category: rawValue(raw, 'category'),
    documentId: id,
    lotNumber: rawValue(raw, 'lotnumber'),
  };
}

/**
 * Pagination info for a response.
 * @param {object} response
 * @param {number} firstResult
 * @param {number} perPage
 * @returns {{total: number, first: number, last: number, page: number, pages: number}}
 */
export function pagination(response, firstResult, perPage) {
  const total = Number(response.totalCountFiltered ?? response.totalCount ?? 0);
  const count = (response.results || []).length;
  return {
    total,
    first: count ? firstResult + 1 : 0,
    last: firstResult + count,
    page: Math.floor(firstResult / perPage),
    pages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/**
 * Drops results already rendered (by id), so a repeated page never shows duplicates.
 * @param {object[]} items normalized results with an `id`
 * @returns {object[]}
 */
export function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item.id || seen.has(item.id)) return !item.id;
    seen.add(item.id);
    return true;
  });
}
