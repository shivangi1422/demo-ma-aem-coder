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

  // tools/importer/import-reagents.js
  var import_reagents_exports = {};
  __export(import_reagents_exports, {
    default: () => import_reagents_default
  });

  // tools/importer/parsers/cards-grid.js
  function parse(element, { document }) {
    const INLINE_TAGS = /* @__PURE__ */ new Set([
      "A",
      "ABBR",
      "B",
      "BR",
      "CITE",
      "CODE",
      "EM",
      "I",
      "MARK",
      "S",
      "SMALL",
      "SPAN",
      "STRONG",
      "SUB",
      "SUP",
      "U"
    ]);
    const DROP_SELECTOR = "input, button, script, style, noscript, iframe, form, select, textarea";
    const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;
    const pickImage = (scope) => {
      if (!scope) return null;
      const wrap = scope.querySelector(".product-series-callouts__image-wrap") || scope;
      const imgs = Array.from(wrap.querySelectorAll("img")).filter((i) => i.getAttribute("src"));
      if (!imgs.length) return null;
      const src = imgs.find((i) => i.hasAttribute("alt")) || imgs[0];
      const img = document.createElement("img");
      img.setAttribute("src", src.getAttribute("src"));
      const alt = imgs.map((i) => i.getAttribute("alt")).find((a) => a && a.trim());
      img.setAttribute("alt", alt ? alt.trim() : "");
      return img;
    };
    const buildDescription = (container) => {
      const nodes = [];
      if (!container) return nodes;
      const clone = container.cloneNode(true);
      clone.querySelectorAll(DROP_SELECTOR).forEach((el) => el.remove());
      let para = null;
      const flush = () => {
        if (para && para.textContent.trim()) nodes.push(para);
        para = null;
      };
      Array.from(clone.childNodes).forEach((node) => {
        if (node.nodeType === 3) {
          if (!node.textContent.replace(ZERO_WIDTH, "").trim()) {
            if (para) para.appendChild(document.createTextNode(" "));
            return;
          }
          if (!para) para = document.createElement("p");
          para.appendChild(document.createTextNode(
            node.textContent.replace(ZERO_WIDTH, "").replace(/\s+/g, " ")
          ));
          return;
        }
        if (node.nodeType !== 1) return;
        if (INLINE_TAGS.has(node.tagName)) {
          if (!node.textContent.trim()) return;
          if (!para) para = document.createElement("p");
          para.appendChild(node);
          return;
        }
        flush();
        if (node.tagName === "DIV") {
          buildDescription(node).forEach((n) => nodes.push(n));
          return;
        }
        if (node.textContent.trim() || node.querySelector("img")) nodes.push(node);
      });
      flush();
      return nodes;
    };
    const isHeading = (el) => /^H[1-6]$/.test(el.tagName);
    const cells = [];
    cells.push([""]);
    const items = Array.from(element.querySelectorAll(".product-series-callouts__item"));
    items.forEach((item) => {
      const link = item.querySelector("a.product-series-callouts__block[href]") || item.querySelector("a[href]");
      const href = link ? link.getAttribute("href") : "";
      let desc = item.querySelector(".product-series-callouts__description") || item.querySelector(".product-series-callouts__description-wrap");
      while (desc && !Array.from(desc.children).some(isHeading) && desc.children.length === 1 && desc.firstElementChild.tagName === "DIV" && desc.querySelector("h1, h2, h3, h4, h5, h6")) {
        desc = desc.firstElementChild;
      }
      let titleEl = null;
      if (desc) titleEl = Array.from(desc.children).find(isHeading) || null;
      if (!titleEl) titleEl = item.querySelector("h2, h3, h4, h5");
      const titleText = titleEl ? titleEl.textContent.replace(ZERO_WIDTH, "").replace(/\s+/g, " ").trim() : "";
      const bodyNodes = [];
      if (desc) {
        Array.from(desc.children).filter((c) => c.tagName === "DIV").forEach((div) => buildDescription(div).forEach((n) => bodyNodes.push(n)));
      }
      const img = pickImage(item.querySelector(".product-series-callouts__image-holder") || item.querySelector(".product-series-callouts__image-wrap") || item);
      let imageCell = "";
      if (img) {
        imageCell = document.createDocumentFragment();
        imageCell.appendChild(document.createComment(" field:image "));
        imageCell.appendChild(img);
      }
      let textCell = "";
      if (titleText || bodyNodes.length) {
        textCell = document.createDocumentFragment();
        textCell.appendChild(document.createComment(" field:text "));
        if (titleText) {
          const h = document.createElement("h4");
          if (href) {
            const a = document.createElement("a");
            a.setAttribute("href", href);
            a.textContent = titleText;
            h.appendChild(a);
          } else {
            h.textContent = titleText;
          }
          textCell.appendChild(h);
        }
        bodyNodes.forEach((n) => textCell.appendChild(n));
      }
      if (!imageCell && !textCell) return;
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "cards-grid",
      variants: ["productlines"],
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/transformers/beckman-cleanup.js
  var remove = (root, selectors) => {
    selectors.forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => el.remove());
    });
  };
  var MEDIA = "img, picture, video, iframe, svg";
  var isBlank = (el) => !el.textContent.replace(/ /g, " ").trim() && !el.querySelector(MEDIA);
  function convertDisclaimer(rt) {
    const doc = rt.ownerDocument;
    rt.querySelectorAll("h5").forEach((h5) => {
      const p = doc.createElement("p");
      const children = [...h5.childNodes].filter((n) => n.nodeType !== 3 || n.textContent.trim());
      const onlyEm = children.length === 1 && children[0].nodeType === 1 && ["EM", "I"].includes(children[0].tagName);
      const em = doc.createElement("em");
      em.innerHTML = onlyEm ? children[0].innerHTML : h5.innerHTML;
      p.append(em);
      h5.replaceWith(p);
    });
    rt.querySelectorAll("p").forEach((p) => {
      if (!p.textContent.replace(/ /g, "").trim() && !p.querySelector("img, picture, a")) p.remove();
    });
  }
  function cleanupProductPage(product) {
    remove(product, [
      "#intrenal-page-link-wrapper",
      ".feature-holder > .sticky"
    ]);
    remove(product, [
      ".bc-rich-text style",
      'input[type="hidden"]',
      'input[id^="context-"]'
    ]);
    remove(product, [
      ".coveo-search-interface-mandatory-section",
      "#resource-table-pagination",
      ".coveo-visible-to-screen-reader-only",
      "#coveo-techdocs-error",
      ".CoveoLogo",
      ".CoveoPager",
      ".coveo-footer",
      ".coveo-header",
      ".CoveoForSitecoreContext"
    ]);
    product.querySelectorAll("#product-table-wrapper .product-table__container").forEach((c) => {
      if (isBlank(c)) c.remove();
    });
    product.querySelectorAll(".embeded-video > h2, .embeded-video p.embeded-video__caption").forEach((el) => {
      if (isBlank(el)) el.remove();
    });
    product.querySelectorAll("a").forEach((a) => {
      if (isBlank(a)) a.remove();
    });
    product.querySelectorAll("p").forEach((p) => {
      if (isBlank(p)) p.remove();
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      remove(element, [
        "#consent_blackbar",
        "#truste-consent-track",
        "#teconsent",
        "#mainNav",
        "div.footer2023",
        "a.skip-to-main-content-link",
        "#ModalPopup",
        ".flash-message",
        ".MaskOverlay",
        "#mktoStyleLoaded",
        "#MktoForms2XDIframe",
        '[id^="font-resize-frame-"]',
        "#hippowiz-ass-injected",
        "#hvmessage-toextension-listener",
        "#userId",
        "#contextItemId",
        "#csrfToken"
      ]);
      element.querySelectorAll("form.mktoForm").forEach((form) => {
        if (!form.closest("#main")) form.remove();
      });
      element.querySelectorAll("#main > .main-holder > .container.custome-container").forEach((c) => {
        if (c.classList.contains("product-spotlight-wrapper")) return;
        if (c.querySelector(".breadcrumbs")) c.remove();
      });
      remove(element, [".breadcrumbs"]);
      element.querySelectorAll(".series-category-promotional-wrapper").forEach((el) => {
        if (!el.textContent.trim() && !el.querySelector("img, picture, video, iframe, a")) el.remove();
      });
      element.querySelectorAll(".product-series-selector-wrapper > div > .bc-rich-text").forEach(convertDisclaimer);
      element.querySelectorAll(".product-spotlight-wrapper").forEach(cleanupProductPage);
    }
    if (hookName === "afterTransform") {
      element.querySelectorAll(".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text").forEach((rt) => {
        if ([...rt.children].some((c) => c.tagName === "H5")) convertDisclaimer(rt);
      });
      remove(element, [
        "header",
        "footer",
        "script",
        "style",
        "noscript",
        "link",
        "iframe",
        "input",
        "#consent_blackbar",
        "#mainNav",
        "div.footer2023",
        ".breadcrumbs",
        '[id^="font-resize-frame-"]'
      ]);
      element.querySelectorAll("[onclick], [onload], [onerror]").forEach((el) => {
        el.removeAttribute("onclick");
        el.removeAttribute("onload");
        el.removeAttribute("onerror");
      });
    }
  }

  // tools/importer/transformers/beckman-sections.js
  var MARKER = "data-excat-section-id";
  function findSectionElement(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (let i = 0; i < selectors.length; i += 1) {
      const sel = selectors[i];
      if (sel) {
        try {
          const el = root.querySelector(sel);
          if (el) return el;
        } catch (e) {
        }
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections;
    if (!Array.isArray(sections) || sections.length < 2) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      const found = sections.map((section) => findSectionElement(element, section));
      const firstIdx = found.findIndex((el) => el);
      const seen = /* @__PURE__ */ new Set();
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = found[i];
        if (el && !seen.has(el)) {
          seen.add(el);
          if (i !== firstIdx || section.style) {
            const hr = document.createElement("hr");
            if (section.style) hr.setAttribute(MARKER, section.id);
            if (i === firstIdx) hr.setAttribute("data-excat-first-section", "");
            el.before(hr);
          }
        }
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (section.style) {
          const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
          const meta = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          if (marker) {
            let end = marker.nextElementSibling;
            while (end && end.tagName !== "HR") end = end.nextElementSibling;
            if (end) end.before(meta);
            else marker.parentElement.append(meta);
            marker.removeAttribute(MARKER);
            if (marker.hasAttribute("data-excat-first-section")) marker.remove();
          } else {
            const el = findSectionElement(element, section);
            if (el) el.after(meta);
          }
        }
      }
    }
  }

  // tools/importer/import-reagents.js
  var PAGE_TEMPLATE = {
    "name": "reagents",
    "urls": [
      "https://www.mybeckman.in/reagents",
      "https://www.mybeckman.in/reagents/cell-culture",
      "https://www.mybeckman.in/reagents/centrifugation",
      "https://www.mybeckman.in/reagents/coulter-flow-cytometry",
      "https://www.mybeckman.in/reagents/genomic",
      "https://www.mybeckman.in/reagents/particle"
    ],
    "representativeUrl": "https://www.mybeckman.in/reagents",
    "description": "Reagents landing and reagent category pages: intro, grid of linked product/category cards, disclaimer notes",
    "blocks": [
      {
        "name": "cards-grid",
        "instances": [
          ".product-series-selector-wrapper .product-series-callouts"
        ]
      }
    ],
    "urlPattern": "/*",
    "sections": [
      {
        "id": "section-1",
        "name": "Page intro",
        "selector": [
          ".product-series-selector-wrapper > .product-content-wrap"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          ".product-content-wrap .product-heading-wrap"
        ]
      },
      {
        "id": "section-2",
        "name": "Reagent category cards",
        "selector": [
          ".product-series-selector-wrapper .product-series-callouts"
        ],
        "style": "light-grey",
        "blocks": [
          "cards-grid"
        ],
        "defaultContent": []
      },
      {
        "id": "section-3",
        "name": "Disclaimer",
        "selector": [
          ".product-series-selector-wrapper > div > .bc-rich-text"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          ".product-series-selector-wrapper > div > .bc-rich-text"
        ]
      }
    ]
  };
  var parsers = { "cards-grid": parse };
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
  var import_reagents_default = {
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
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_reagents_exports);
})();
