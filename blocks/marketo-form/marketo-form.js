const scripts = new Map();

/**
 * Loads a script once; concurrent callers share the same promise.
 * @param {string} src
 * @returns {Promise<void>}
 */
function loadScript(src) {
  if (!scripts.has(src)) {
    scripts.set(src, new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => {
        scripts.delete(src);
        script.remove();
        reject(new Error(`failed to load ${src}`));
      };
      document.head.append(script);
    }));
  }
  return scripts.get(src);
}

/**
 * Reads the Marketo form config from the authored form URL, e.g.
 * https://pages.example.com/index.php/form/getForm?munchkinId=123-ABC-456&form=1024
 * Only https URLs with a well-formed munchkin id and numeric form id are accepted.
 * @param {Element} block
 * @returns {{origin: string, munchkinId: string, formId: string}|null}
 */
function readConfig(block) {
  const link = block.querySelector('a[href]');
  const raw = link ? link.href : block.textContent.trim();
  try {
    const url = new URL(raw);
    const munchkinId = url.searchParams.get('munchkinId') || '';
    const formId = url.searchParams.get('form') || '';
    if (url.protocol !== 'https:' || !/^[\w-]+$/.test(munchkinId) || !/^\d+$/.test(formId)) {
      return null;
    }
    return { origin: url.origin, munchkinId, formId };
  } catch {
    return null;
  }
}

/**
 * Makes the rendered form fluid: drops Marketo's inline widths and its theme styles
 * (layout and colours come from marketo-form.css). Inline display styles stay, as
 * Marketo uses them for visibility rules.
 * @param {HTMLFormElement} formEl
 */
function makeFluid(formEl) {
  document.getElementById('mktoForms2ThemeStyle')?.remove();
  // the form's own theme CSS ("simple" button etc.) is injected inside the form
  formEl.querySelectorAll('style').forEach((style) => style.remove());
  formEl.classList.remove('mktoLayoutLeft', 'mktoLayoutAbove');
  // reCAPTCHA sizes its own badge; leave it alone
  const own = [...formEl.querySelectorAll('[style]')].filter((el) => !el.closest('.grecaptcha-badge'));
  [formEl, ...own].forEach((el) => {
    el.style.removeProperty('width');
    if (!el.getAttribute('style')) el.removeAttribute('style');
  });
  // the form's inline Helvetica/13px/#333 would override the block's typography
  ['font-family', 'font-size', 'color'].forEach((prop) => formEl.style.removeProperty(prop));
  if (!formEl.getAttribute('style')) formEl.removeAttribute('style');
}

/**
 * Hides the block when the form can't be rendered (bad URL, script blocked).
 * @param {Element} block
 */
function hide(block) {
  block.replaceChildren();
  block.hidden = true;
}

/**
 * Decorates the marketo-form block: one cell holding the Marketo form URL becomes
 * an embedded Marketo form, loaded when the block nears the viewport.
 * Style option "two-column": labels beside fields.
 * @param {Element} block
 */
export default function decorate(block) {
  const config = readConfig(block);
  if (!config) {
    hide(block);
    return;
  }
  const { origin, munchkinId, formId } = config;

  const form = document.createElement('form');
  form.id = `mktoForm_${formId}`;
  block.replaceChildren(form);

  const load = async () => {
    try {
      await loadScript(`${origin}/js/forms2/js/forms2.min.js`);
      const { MktoForms2 } = window;
      if (!MktoForms2) throw new Error('MktoForms2 unavailable');
      MktoForms2.whenRendered((mkto) => {
        const el = mkto.getFormElem()[0];
        if (block.contains(el)) makeFluid(el);
      });
      MktoForms2.loadForm(origin, munchkinId, formId);
    } catch {
      hide(block);
    }
  };

  if (!('IntersectionObserver' in window)) {
    load();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      load();
    }
  }, { rootMargin: '200px' });
  observer.observe(block);
}
