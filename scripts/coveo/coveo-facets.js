/*
 * Facet selection state for Coveo groupBy facets (JSUI "CoveoFacet" behaviour,
 * verified on the source Product Table): values of one facet are OR-ed, facets
 * are AND-ed, and a facet with a selection is requested with an
 * advancedQueryOverride that leaves out its own selection, so its other values
 * keep their counts.
 */

/**
 * Coveo field expression literal: bare when it is a simple token, quoted otherwise
 * (e.g. (@numberz32xofz32xusers==1), (@licensez32xterm=="1 Year")).
 * @param {string} value
 * @returns {string}
 */
function literal(value) {
  const v = String(value);
  return /^[\w.-]+$/.test(v) ? v : `"${v.replace(/"/g, '\\"')}"`;
}

/**
 * Expression for the selected values of one field.
 * @param {string} field e.g. @licensez32xterm
 * @param {string[]} values
 * @returns {string}
 */
export function fieldExpression(field, values) {
  if (!values.length) return '';
  if (values.length === 1) return `(${field}==${literal(values[0])})`;
  return `(${field}==(${values.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(',')}))`;
}

/**
 * Parses facet definitions authored one per line as "@field | Label", optionally
 * followed by "| Value A, Value B" to limit the facet to those values (the source's
 * allowedValues, e.g. Product Market on the search page).
 * @param {string} text
 * @returns {{field: string, label: string, allowed?: string[]}[]}
 */
export function parseFacetDefinitions(text) {
  return (text || '').split(/\n|;/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('@'))
    .map((line) => {
      const [field, label = '', allowed = ''] = line.split('|').map((part) => part.trim());
      const definition = { field, label: label || field.slice(1) };
      const values = allowed.split(',').map((v) => v.trim()).filter(Boolean);
      if (values.length) definition.allowed = values;
      return definition;
    });
}

export class FacetState {
  /**
   * @param {{field: string, label: string}[]} definitions
   * @param {{maximumNumberOfValues?: number, sortCriteria?: string}} [options]
   */
  constructor(definitions, { maximumNumberOfValues = 6, sortCriteria = 'occurrences' } = {}) {
    this.definitions = definitions;
    this.maximumNumberOfValues = maximumNumberOfValues;
    this.sortCriteria = sortCriteria;
    this.selected = new Map(definitions.map((d) => [d.field, []]));
    // per-facet value limits ("Show all"), default maximumNumberOfValues
    this.limits = new Map();
  }

  /**
   * @param {string} field
   * @returns {number} number of values requested for the facet
   */
  limitFor(field) {
    return this.limits.get(field) || this.maximumNumberOfValues;
  }

  /**
   * @param {string} field
   * @param {number} [limit] values to request; omit to go back to the default
   */
  setLimit(field, limit) {
    if (limit) this.limits.set(field, limit);
    else this.limits.delete(field);
  }

  /**
   * @param {string} field
   * @param {string} value
   * @returns {boolean} whether the value is now selected
   */
  toggle(field, value) {
    const values = this.selected.get(field) || [];
    const index = values.indexOf(value);
    if (index >= 0) values.splice(index, 1);
    else values.push(value);
    this.selected.set(field, values);
    return index < 0;
  }

  isSelected(field, value) {
    return (this.selected.get(field) || []).includes(value);
  }

  clear(field) {
    this.selected.set(field, []);
  }

  clearAll() {
    this.definitions.forEach((d) => this.selected.set(d.field, []));
  }

  hasSelection(field) {
    if (field) return (this.selected.get(field) || []).length > 0;
    return [...this.selected.values()].some((v) => v.length > 0);
  }

  /**
   * Base advanced query prefixed with the selections (facet definition order),
   * optionally leaving out one facet.
   * @param {string} baseAq
   * @param {string} [excludeField]
   * @returns {string}
   */
  advancedQuery(baseAq, excludeField) {
    const parts = this.definitions
      .filter((d) => d.field !== excludeField)
      .map((d) => fieldExpression(d.field, this.selected.get(d.field) || []))
      .filter(Boolean);
    return [...parts, baseAq].filter(Boolean).join(' ');
  }

  /**
   * groupBy request entries.
   * @param {string} baseAq
   * @param {string} cq
   * @returns {object[]}
   */
  groupBy(baseAq, cq) {
    return this.definitions.map((d) => {
      const values = this.selected.get(d.field) || [];
      const entry = {
        field: d.field,
        maximumNumberOfValues: this.limitFor(d.field),
        sortCriteria: this.sortCriteria,
        injectionDepth: 1000,
        completeFacetWithStandardValues: !d.allowed,
        allowedValues: d.allowed ? [...new Set([...d.allowed, ...values])] : [...values],
      };
      if (values.length) {
        entry.advancedQueryOverride = this.advancedQuery(baseAq, d.field);
        entry.constantQueryOverride = cq;
      }
      return entry;
    });
  }

  /**
   * Facet models for rendering from a search response's groupByResults.
   * @param {object[]} groupByResults
   * @returns {{field: string, label: string, values: {value: string, count: number,
   *   selected: boolean}[]}[]}
   */
  facetsFrom(groupByResults = []) {
    return this.definitions.map((d) => {
      const name = d.field.replace(/^@/, '').toLowerCase();
      const result = groupByResults.find((g) => (g.field || g.Field || '').toLowerCase() === name);
      const values = (result ? result.values : []).map((v) => ({
        value: v.value,
        count: v.numberOfResults,
        selected: this.isSelected(d.field, v.value),
      }));
      // keep selected values visible even when the index no longer returns them
      (this.selected.get(d.field) || []).forEach((value) => {
        if (!values.some((v) => v.value === value)) {
          values.push({ value, count: 0, selected: true });
        }
      });
      return { field: d.field, label: d.label, values };
    });
  }
}
