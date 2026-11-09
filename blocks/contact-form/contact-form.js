import { loadScript } from '../../scripts/aem.js';

const MARKETO = /\/index\.php\/form\/getForm/;
const FORMASSEMBLY = /\.tfaforms\.(net|com)$/;

/**
 * Marketo form link: https://<instance>/index.php/form/getForm?form=<formId>#munchkinId=<id>
 * (munchkinId may also be a query parameter; in AEM content it stays after '#', since the
 * content converter does not escape a second query parameter)
 * @param {URL} url form link
 * @returns {{ base: string, munchkinId: string, formId: string } | null}
 */
function marketoConfig(url) {
  if (!MARKETO.test(url.pathname)) return null;
  const munchkinId = url.searchParams.get('munchkinId')
    || new URLSearchParams(url.hash.slice(1)).get('munchkinId');
  const formId = url.searchParams.get('form');
  if (!munchkinId || !formId) return null;
  return { base: `//${url.host}`, munchkinId, formId };
}

async function embedMarketo(container, { base, munchkinId, formId }) {
  const form = document.createElement('form');
  form.id = `mktoForm_${formId}`;
  container.append(form);
  await loadScript(`${base}/js/forms2/js/forms2.min.js`);
  window.MktoForms2.loadForm(base, munchkinId, Number(formId), (mkto) => {
    // the source shows labels without the trailing colon of the Marketo descriptor
    mkto.getFormElem()[0].querySelectorAll('.mktoLabel').forEach((label) => {
      const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
      let last = null;
      while (walker.nextNode()) {
        if (walker.currentNode.textContent.trim()) last = walker.currentNode;
      }
      if (last) last.textContent = last.textContent.replace(/:\s*$/, '');
    });
  });
}

function embedFormAssembly(container, url) {
  const iframe = document.createElement('iframe');
  iframe.src = url.href;
  iframe.className = 'contact-form-frame';
  iframe.title = 'Form';
  iframe.loading = 'lazy';
  container.append(iframe);
}

/**
 * Contact form: optional heading / intro text and a link to a Marketo or FormAssembly form.
 * The form is loaded when the block comes near the viewport.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const link = [...block.querySelectorAll('a[href]')].find((a) => {
    try {
      const url = new URL(a.href);
      return MARKETO.test(url.pathname) || FORMASSEMBLY.test(url.hostname);
    } catch (e) {
      return false;
    }
  });

  // rows: text (heading / intro) and the form link; the link row becomes the form container
  [...block.children].forEach((row) => {
    if (link && row.contains(link)) {
      row.className = 'contact-form-form';
      row.replaceChildren();
    } else if (row.textContent.trim()) {
      row.className = 'contact-form-text';
    } else {
      row.remove();
    }
  });
  if (!link) return;
  const container = block.querySelector('.contact-form-form');

  const url = new URL(link.href);
  const load = () => {
    const marketo = marketoConfig(url);
    if (marketo) embedMarketo(container, marketo);
    else embedFormAssembly(container, url);
  };
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      load();
    }
  }, { rootMargin: '300px' });
  observer.observe(block);
}
