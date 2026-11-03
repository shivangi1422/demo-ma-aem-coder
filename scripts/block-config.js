/**
 * Normalizes a config key so "Search Hub", "searchHub" and "search-hub" match.
 * @param {string} key
 * @returns {string}
 */
export function configKey(key) {
  return (key || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Reads a key/value block (one row per setting: key cell, value cell) without
 * rewriting values: the text is kept verbatim (queries contain quotes and
 * parentheses) and the value cell is returned for settings that hold markup.
 * Keys are normalized with configKey().
 * @param {Element} block
 * @returns {Map<string, {text: string, cell: Element, row: Element}>}
 */
export function readConfigRows(block) {
  const config = new Map();
  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = row.children;
    if (!keyCell || !valueCell) return;
    const key = configKey(keyCell.textContent);
    if (!key) return;
    config.set(key, { text: valueCell.textContent.trim(), cell: valueCell, row });
  });
  return config;
}

/**
 * Text value of a setting, or the fallback when it is missing or empty.
 * @param {Map} config result of readConfigRows()
 * @param {string} key
 * @param {string} [fallback]
 * @returns {string}
 */
export function configText(config, key, fallback = '') {
  const entry = config.get(configKey(key));
  return entry && entry.text ? entry.text : fallback;
}
