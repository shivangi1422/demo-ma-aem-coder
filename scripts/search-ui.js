/*
 * Small UI helpers shared by the dynamic listing blocks (coveo-products,
 * coveo-techdocs, resource-list): pager and loading / empty / error states.
 * Markup only; each block styles it under its own class.
 */

/**
 * @param {string} tag
 * @param {object} [attrs]
 * @param {...(Node|string)} children
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value === true ? '' : value);
  });
  children.forEach((child) => {
    if (child !== undefined && child !== null) node.append(child);
  });
  return node;
}

/**
 * Plain text of an HTML snippet returned by an API (tags dropped, entities decoded).
 * @param {string} html
 * @returns {string}
 */
export function htmlToText(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const text = doc.body.textContent.replace(/\s+/g, ' ').trim();
  // some source strings are double-encoded (e.g. "20&ndash;color")
  if (!/&[a-z#0-9]+;/i.test(text)) return text;
  return new DOMParser().parseFromString(`<body>${text}</body>`, 'text/html').body.textContent;
}

/**
 * Pager: optional previous/next buttons around page number buttons.
 * @param {object} options
 * @param {number} options.page zero-based current page
 * @param {number} options.pages total pages
 * @param {(page: number) => void} options.onSelect
 * @param {string} options.className block-specific class
 * @param {{previous?: string, next?: string, page?: string}} [options.labels]
 * @param {boolean} [options.hideDisabled] leave out previous/next when unavailable
 *   (Coveo pager) instead of rendering them disabled
 * @param {number} [options.window] max page numbers shown
 * @returns {HTMLElement|null} null when there is a single page
 */
export function renderPager({
  page, pages, onSelect, className, labels = {}, hideDisabled = false, window: size = 5,
}) {
  if (pages <= 1) return null;
  const nav = el('nav', { className, 'aria-label': labels.nav || 'Pagination' });
  const list = el('ul');
  const button = (target, content, extra = {}) => {
    const b = el('button', { type: 'button', ...extra }, content);
    if (!extra.disabled) b.addEventListener('click', () => onSelect(target));
    return el('li', {}, b);
  };
  if (!hideDisabled || page > 0) {
    list.append(button(page - 1, el('span', {}, labels.previous ?? 'Previous'), {
      className: 'pager-previous', disabled: page <= 0, 'aria-label': 'Previous page',
    }));
  }
  const start = Math.max(0, Math.min(page - Math.floor(size / 2), pages - size));
  for (let i = start; i < Math.min(pages, start + size); i += 1) {
    list.append(button(i, String(i + 1), {
      className: i === page ? 'pager-page is-current' : 'pager-page',
      'aria-current': i === page ? 'page' : undefined,
      'aria-label': `${labels.page || 'Page'} ${i + 1}`,
    }));
  }
  if (!hideDisabled || page < pages - 1) {
    list.append(button(page + 1, el('span', {}, labels.next ?? 'Next'), {
      className: 'pager-next', disabled: page >= pages - 1, 'aria-label': 'Next page',
    }));
  }
  nav.append(list);
  return nav;
}

/**
 * Status message (loading, empty or error with a retry button) in a live region.
 * @param {HTMLElement} region element with role="status"
 * @param {{type: 'loading'|'empty'|'error'|'none', message?: string,
 *   onRetry?: () => void, retryLabel?: string}} state
 */
export function renderStatus(region, {
  type, message = '', onRetry, retryLabel = 'Retry',
}) {
  region.dataset.state = type;
  region.replaceChildren();
  if (type === 'none') return;
  region.append(el('span', { className: 'search-status-message' }, message));
  if (type === 'error' && onRetry) {
    const retry = el('button', { type: 'button', className: 'search-status-retry' }, retryLabel);
    retry.addEventListener('click', onRetry);
    region.append(retry);
  }
}
