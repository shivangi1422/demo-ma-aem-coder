/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-software-product.js
  var import_software_product_exports = {};
  __export(import_software_product_exports, {
    default: () => import_software_product_default
  });

  // tools/importer/parsers/link-list.js
  function parse(element, { document }) {
    const label = element.querySelector(":scope > p");
    const links = Array.from(element.querySelectorAll("li a[href]"));
    const cell = document.createDocumentFragment();
    cell.appendChild(document.createComment(" field:text "));
    if (label && label.textContent.trim()) {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = label.textContent.replace(/\s+/g, " ").trim();
      p.appendChild(strong);
      cell.appendChild(p);
    }
    if (links.length) {
      const ul = document.createElement("ul");
      links.forEach((link) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.setAttribute("href", link.getAttribute("href"));
        a.textContent = link.textContent.replace(/\s+/g, " ").trim();
        li.appendChild(a);
        ul.appendChild(li);
      });
      cell.appendChild(ul);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "link-list", cells: [[cell]] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/marketo-form.js
  var MARKETO_BASE = "https://pages.beckman.com";
  var DEFAULT_MUNCHKIN = "682-XWP-826";
  function parse2(element, { document }) {
    let headingHost = element.previousElementSibling;
    while (headingHost && !headingHost.querySelector("h2, h3") && headingHost.classList.contains("js-component")) {
      headingHost = headingHost.previousElementSibling;
    }
    const heading = headingHost && headingHost.querySelector("h2, h3");
    const form = element.querySelector('form[id^="mktoForm_"]');
    const formId = form ? form.id.replace("mktoForm_", "") : "";
    const munchkin = (element.innerHTML.match(/\d{3}-[A-Z]{3}-\d{3}/) || [DEFAULT_MUNCHKIN])[0];
    const titleCell = document.createDocumentFragment();
    titleCell.appendChild(document.createComment(" field:title "));
    if (heading) titleCell.appendChild(document.createTextNode(heading.textContent.replace(/\s+/g, " ").trim()));
    const urlCell = document.createDocumentFragment();
    urlCell.appendChild(document.createComment(" field:formUrl "));
    if (formId) urlCell.appendChild(document.createTextNode(`${MARKETO_BASE}/index.php/form/getForm?munchkinId=${munchkin}&form=${formId}`));
    const block = WebImporter.Blocks.createBlock(document, { name: "marketo-form", cells: [[titleCell], [urlCell]] });
    element.replaceWith(block);
    if (heading && headingHost && headingHost.textContent.trim() === heading.textContent.trim()) headingHost.remove();
  }

  // tools/importer/transformers/beckman-cleanup.js
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      WebImporter.DOMUtils.remove(element, [
        "#consent_blackbar",
        // cookie consent banner
        "#ModalPopup.access-restriced-login-modal",
        // empty login modal
        "#ModalPopup",
        ".MaskOverlay"
      ]);
      const crumbs = [...element.querySelectorAll("nav.breadcrumbs li")].map((li) => li.textContent.replace(/\s+/g, " ").trim()).filter(Boolean).slice(1);
      if (crumbs.length) {
        element.ownerDocument.documentElement.dataset.breadcrumbLabels = crumbs.join(" | ");
      }
      WebImporter.DOMUtils.remove(element, [
        "#main .main-holder > .container.custome-container:not(.product-spotlight-wrapper)",
        "nav.breadcrumbs"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".product-spotlight-wrapper .rt-holder > div:has(> .product-table-link-btn)",
        ".product-spotlight-wrapper .twobuttons > div:not(:has(a))",
        '.product-spotlight-wrapper input[type="hidden"]',
        ".product-spotlight-wrapper .CoveoSearchInterface",
        ".product-spotlight-wrapper .product-table",
        "#coveo-center-column",
        "#multiselect__container",
        "#resource-table-pagination",
        ".related-parts .slick-cloned",
        ".related-parts > button"
      ]);
      const iconClasses = [];
      (payload && payload.html || "").replace(
        /content-resource-list-icon"[^>]*>\s*<(?:i|em|svg)[^>]*class="([^"]*)"/g,
        (m, cls) => {
          iconClasses.push(cls);
          return m;
        }
      );
      element.querySelectorAll(".content-resource-list-child").forEach((item, i) => {
        if (iconClasses[i]) item.dataset.icon = iconClasses[i];
      });
      element.querySelectorAll("#coveo-techdocs-more-results").forEach((div) => {
        const p = element.ownerDocument.createElement("p");
        p.append(...div.childNodes);
        div.replaceWith(p);
      });
      element.querySelectorAll(".product-series-callouts").forEach((band) => {
        if (!band.querySelector(".product-series-callouts__item")) band.remove();
      });
      WebImporter.DOMUtils.remove(element, [
        ".series-category-promotional-wrapper",
        "#main .main-holder > .row.js-component",
        ".two-columns-holder .row.js-component",
        ".bcls-aeo-published"
      ]);
      element.querySelectorAll("#main a[href]").forEach((a) => {
        if (a.textContent.trim()) return;
        const next = a.nextElementSibling;
        if (next && next.tagName === "A" && !next.hasAttribute("href") && next.textContent.trim()) {
          a.replaceChildren(...next.childNodes);
          next.remove();
        }
      });
      const raw = payload && payload.html || "";
      const recovered = {};
      raw.replace(/<a href="([^"]+)">(?:\s*<span[^>]*>\s*<\/span>\s*)?<\/a>\s*<a>([^<]+)<\/a>/g, (m, href, text) => {
        recovered[text.trim()] = href;
        return m;
      });
      element.querySelectorAll("#main a:not([href])").forEach((a) => {
        const href = recovered[a.textContent.trim()];
        if (href) a.setAttribute("href", href);
      });
      element.querySelectorAll("#main a:not([href])").forEach((a) => {
        if (!a.textContent.trim() && !a.querySelector("img")) a.remove();
        else a.replaceWith(...a.childNodes);
      });
      element.querySelectorAll('#main a[href="#"]').forEach((a) => {
        if (a.querySelector("img")) a.replaceWith(...a.childNodes);
      });
      element.querySelectorAll('#main .bc-rich-text > ul[style*="margin-left"]').forEach((sub) => {
        var _a;
        const prev = sub.previousElementSibling;
        if (!prev || prev.tagName !== "UL" || !prev.lastElementChild) return;
        const next = sub.nextElementSibling;
        sub.removeAttribute("style");
        prev.lastElementChild.append(sub);
        if (next && next.tagName === "UL" && !((_a = next.getAttribute("style")) == null ? void 0 : _a.includes("margin-left"))) {
          while (next.firstElementChild) prev.append(next.firstElementChild);
          next.remove();
        }
      });
    }
    if (hookName === "afterTransform") {
      WebImporter.DOMUtils.remove(element, [
        "header#mainNav",
        "#mainNav",
        "header",
        "div.footer2023",
        "#navScrollContainer"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "a.skip-to-main-content-link",
        "input#userId",
        "input#contextItemId",
        "#mktoStyleLoaded",
        "form.mktoForm",
        "iframe",
        "script",
        "style",
        "noscript",
        "link",
        'img[width="1"][height="1"]'
        // tracking pixels
      ]);
      const SITE_ROOT = "/sai";
      const MIGRATED = [
        "/software",
        "/flow-cytometry/software",
        "/flow-cytometry/software/cytobank-enterprise",
        "/liquid-handlers/software",
        "/microbioreactor/biolector-xt/software"
      ];
      element.querySelectorAll('a[href^="/"]').forEach((a) => {
        const href = a.getAttribute("href");
        const [, pathname, rest] = href.match(/^([^?#]*)(.*)$/);
        if (MIGRATED.includes(pathname.replace(/\/$/, ""))) a.setAttribute("href", `${SITE_ROOT}${pathname}${rest}`);
      });
      element.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach(({ name }) => {
          if (/^on/i.test(name) || /^data-(track|gtm|analytics|ga)/i.test(name)) {
            el.removeAttribute(name);
          }
        });
      });
    }
  }

  // tools/importer/transformers/beckman-sections.js
  var MARKER = "data-excat-section-id";
  function findSectionElement(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (let i = 0; i < selectors.length; i += 1) {
      const el = selectors[i] && root.querySelector(selectors[i]);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    const document = element.ownerDocument || payload.document;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const sectionEl = findSectionElement(element, section);
        if (!sectionEl) continue;
        if (i > 0 || section.style) {
          const hr = document.createElement("hr");
          if (section.style) hr.setAttribute(MARKER, section.id);
          sectionEl.parentNode.insertBefore(hr, sectionEl);
        }
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        const metadata = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        if (marker) {
          let end = marker.nextElementSibling;
          while (end && end.nextElementSibling && end.nextElementSibling.tagName !== "HR") {
            end = end.nextElementSibling;
          }
          if (end) end.after(metadata);
          else marker.after(metadata);
          if (i === 0) marker.remove();
          else marker.removeAttribute(MARKER);
        } else {
          const sectionEl = findSectionElement(element, section);
          if (sectionEl) sectionEl.after(metadata);
        }
      }
    }
  }

  // tools/importer/import-software-product.js
  var PAGE_TEMPLATE = {
    "name": "software-product",
    "urls": [
      "https://www.mybeckman.in/microbioreactor/biolector-xt/software"
    ],
    "representativeUrl": "https://www.mybeckman.in/microbioreactor/biolector-xt/software",
    "description": "Software product detail: title, then rich content with a sidebar of related links and a Marketo request form",
    "urlPattern": "/*/*/software",
    "blocks": [
      {
        "name": "link-list",
        "instances": [
          ".two-columns-holder__right > .bc-rich-text:has(ul)"
        ]
      },
      {
        "name": "marketo-form",
        "instances": [
          ".two-columns-holder__right .formassembly-container"
        ]
      }
    ],
    "sections": [
      {
        "id": "s1",
        "name": "Title",
        "selector": [
          "#content-holder",
          ".generic-content-heading"
        ],
        "style": "contained",
        "blocks": [],
        "defaultContent": [
          "#content-holder > h1"
        ]
      },
      {
        "id": "s2",
        "name": "Content with sidebar",
        "selector": [
          ".two-columns-holder"
        ],
        "style": "contained, sidebar",
        "blocks": [
          "link-list",
          "marketo-form"
        ],
        "defaultContent": [
          ".two-columns-holder__left .bc-rich-text"
        ]
      }
    ]
  };
  var parsers = {
    "link-list": parse,
    "marketo-form": parse2
  };
  var transformers = [transform, transform2];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element) => {
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    return pageBlocks;
  }
  function createMetadata(main, document) {
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    const labels = document.documentElement.dataset.breadcrumbLabels;
    if (labels) meta["Breadcrumb Labels"] = labels;
    delete document.documentElement.dataset.breadcrumbLabels;
    if (Object.keys(meta).length) main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
  }
  var import_software_product_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(`/sai${rawPath === "" ? "/index" : rawPath}`);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_software_product_exports);
})();
