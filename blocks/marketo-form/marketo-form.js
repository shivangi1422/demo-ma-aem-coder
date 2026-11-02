import { loadScript } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Reads the Marketo base URL, munchkin id and form id from the authored form URL,
 * e.g. https://pages.beckman.com/index.php/form/getForm?munchkinId=682-XWP-826&form=1361
 * @param {string} value
 */
function readConfig(value) {
  try {
    const url = new URL(value.trim(), window.location.href);
    const munchkinId = url.searchParams.get('munchkinId');
    const formId = Number(url.searchParams.get('form'));
    if (!munchkinId || !formId) return null;
    return { base: url.origin, munchkinId, formId };
  } catch (e) {
    return null;
  }
}

/**
 * Loads the site's field localization (labels, radio/select options, rich-text
 * notices and validation messages), as applied by the live site's Marketo localizer.
 * @returns {Promise<Object<string, object>>} overrides keyed by Marketo field name
 */
async function loadLocalization() {
  try {
    const resp = await fetch(`${window.hlx.codeBasePath}/blocks/marketo-form/form-localization.json`);
    if (!resp.ok) return {};
    const all = await resp.json();
    const lang = (document.documentElement.lang || 'en').split('-')[0];
    const fields = all[lang] || all.en || Object.values(all)[0] || [];
    return Object.fromEntries(fields.map((f) => [f.Name, f]));
  } catch (e) {
    return {};
  }
}

/** Applies the overrides to a Marketo form descriptor in place. */
function localize(descriptor, byName) {
  const apply = (field) => {
    const override = byName[field.Name];
    if (!override) return;
    ['InputLabel', 'ValidationMessage', 'Htmltext'].forEach((key) => {
      if (override[key] !== undefined) field[key] = override[key];
    });
    if (override.PicklistValues && Array.isArray(field.PicklistValues)) {
      field.PicklistValues = field.PicklistValues.map((option) => {
        const match = override.PicklistValues.find((o) => o.value === option.value);
        return match ? { ...option, label: match.label } : option;
      });
    }
  };
  [...(descriptor.rows || []), ...(descriptor.fieldsetRows || [])].flat().forEach((field) => {
    apply(field);
    (field.rows || []).flat().forEach(apply);
  });
}

/**
 * Loads the Marketo forms API and renders the (localized) form into the given element.
 * loadForm's descriptor is localized by intercepting its single newForm call.
 * Marketo sets fixed pixel widths inline; they are cleared so the form fits its column.
 */
async function renderForm(holder, config) {
  const [overrides] = await Promise.all([
    loadLocalization(),
    loadScript(`${config.base}/js/forms2/js/forms2.min.js`),
  ]);
  const form = document.createElement('form');
  form.id = `mktoForm_${config.formId}`;
  holder.replaceChildren(form);
  const { MktoForms2 } = window;
  const { newForm } = MktoForms2;
  MktoForms2.newForm = (descriptor, callback) => {
    MktoForms2.newForm = newForm;
    if (descriptor && descriptor.Id === config.formId) localize(descriptor, overrides);
    return newForm.call(MktoForms2, descriptor, callback);
  };
  MktoForms2.loadForm(config.base, config.munchkinId, config.formId, (mkto) => {
    if (!mkto) return;
    const el = mkto.getFormElem()[0];
    el.removeAttribute('style');
    el.querySelectorAll('[style]').forEach((node) => {
      node.style.removeProperty('width');
    });
    holder.closest('.marketo-form').dataset.formStatus = 'loaded';
  });
}

/**
 * Decorates the marketo-form block: heading | form URL.
 * The form loads when the block scrolls near the viewport.
 * @param {Element} block
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const urlCell = cells.find((cell) => readConfig(cell.querySelector('a')?.href || cell.textContent));
  const titleCell = cells.find((cell) => cell !== urlCell && cell.textContent.trim());
  const config = urlCell ? readConfig(urlCell.querySelector('a')?.href || urlCell.textContent) : null;

  const children = [];
  if (titleCell) {
    const heading = document.createElement('h3');
    heading.className = 'marketo-form-title';
    moveInstrumentation(titleCell.querySelector('[data-aue-prop]') || titleCell, heading);
    heading.textContent = titleCell.textContent.trim();
    children.push(heading);
  }
  const panel = document.createElement('div');
  panel.className = 'marketo-form-panel';
  children.push(panel);
  block.replaceChildren(...children);
  if (!config) return;

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    renderForm(panel, config);
  }, { rootMargin: '300px' });
  observer.observe(block);
}
