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

  // tools/importer/import-reagents-category.js
  var import_reagents_category_exports = {};
  __export(import_reagents_category_exports, {
    default: () => import_reagents_category_default
  });

  // tools/importer/parsers/cards-grid.js
  function parse(element, { document }) {
    const clean2 = (s) => (s || "").replace(/ /g, " ").replace(/​/g, "").replace(/\s+/g, " ").trim();
    const BLOCK_TAGS = /* @__PURE__ */ new Set(["P", "UL", "OL", "H4", "H5", "H6"]);
    const rows = [[""]];
    element.querySelectorAll(".product-series-callouts__item").forEach((item) => {
      var _a, _b, _c;
      const href = ((_a = item.querySelector("a.product-series-callouts__block[href]")) == null ? void 0 : _a.getAttribute("href")) || "";
      const desc = item.querySelector(".product-series-callouts__description, .product-series-callouts__description-wrap");
      const titleEl = desc && desc.querySelector("h4");
      const title = clean2(titleEl && titleEl.textContent);
      const imgs = [...item.querySelectorAll(".product-series-callouts__image-wrap img, .product-series-callouts__image-holder img")].filter((i) => i.getAttribute("src"));
      const src = (_b = imgs[0]) == null ? void 0 : _b.getAttribute("src");
      const alt = clean2((_c = imgs.find((i) => clean2(i.getAttribute("alt"))) || imgs[0]) == null ? void 0 : _c.getAttribute("alt"));
      const textCell = document.createDocumentFragment();
      if (title) {
        textCell.append(document.createComment(" field:text "));
        const h4 = document.createElement("h4");
        if (href) {
          const a = document.createElement("a");
          a.setAttribute("href", href);
          a.textContent = title;
          h4.append(a);
        } else {
          h4.textContent = title;
        }
        textCell.append(h4);
      }
      const body = desc && (desc.querySelector(".display-print") || desc);
      if (body) {
        let para = null;
        [...body.childNodes].forEach((node) => {
          if (node === titleEl) return;
          if (node.nodeType === 1 && BLOCK_TAGS.has(node.tagName)) {
            para = null;
            if (!clean2(node.textContent)) return;
            const copy = node.cloneNode(true);
            copy.querySelectorAll("[style]").forEach((n) => n.removeAttribute("style"));
            textCell.append(copy);
          } else if (node.nodeType === 3 || node.nodeType === 1) {
            if (!clean2(node.textContent)) return;
            if (!para) {
              para = document.createElement("p");
              textCell.append(para);
            }
            para.append(node.nodeType === 3 ? document.createTextNode(node.textContent.replace(/\s+/g, " ")) : node.cloneNode(true));
          }
        });
      }
      let imageCell = "";
      if (src) {
        imageCell = document.createDocumentFragment();
        imageCell.append(document.createComment(" field:image "));
        const img = document.createElement("img");
        img.setAttribute("src", src);
        img.setAttribute("alt", alt);
        imageCell.append(img);
      }
      if (!src && !title) return;
      rows.push([imageCell, textCell.childNodes.length ? textCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-grid (productlines)", cells: rows });
    element.replaceWith(block);
  }

  // tools/importer/transformers/beckman-cleanup.js
  var remove = (root, selectors) => selectors.forEach((sel) => root.querySelectorAll(sel).forEach((el) => el.remove()));
  var clean = (s) => (s || "").replace(/ /g, " ").replace(/[​﻿]/g, "").trim();
  function wrapLooseText(container) {
    const doc = container.ownerDocument;
    let para = null;
    [...container.childNodes].forEach((node) => {
      const inline = node.nodeType === 3 || node.nodeType === 1 && ["A", "EM", "STRONG", "B", "I", "SPAN", "SUP", "SUB", "BR"].includes(node.tagName);
      if (!inline) {
        para = null;
        return;
      }
      if (!para) {
        if (!clean(node.textContent)) return;
        para = doc.createElement("p");
        node.before(para);
      }
      para.append(node);
    });
  }
  function convertNotes(rt) {
    const doc = rt.ownerDocument;
    rt.querySelectorAll("h5").forEach((h5) => {
      const p = doc.createElement("p");
      const em = h5.querySelector(":scope > em, :scope > i");
      const inner = doc.createElement("em");
      inner.innerHTML = em && clean(h5.textContent) === clean(em.textContent) ? em.innerHTML : h5.innerHTML;
      p.append(inner);
      h5.replaceWith(p);
    });
    rt.querySelectorAll("p").forEach((p) => {
      if (!clean(p.textContent) && !p.querySelector("img, a")) p.remove();
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      const current = element.querySelector(".breadcrumbs li.active, .breadcrumbs li:last-child");
      if (current && clean(current.textContent)) element.setAttribute("data-excat-breadcrumb-title", clean(current.textContent));
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
        '[id^="font-resize-frame-"]',
        'input[type="hidden"]',
        ".breadcrumbs"
      ]);
      element.querySelectorAll("#main > .main-holder > .container.custome-container").forEach((c) => {
        if (!clean(c.textContent)) c.remove();
      });
      element.querySelectorAll(".series-category-promotional-wrapper").forEach((el) => {
        if (!clean(el.textContent) && !el.querySelector("img, a")) el.remove();
      });
      element.querySelectorAll("#main a").forEach((a) => {
        if (!clean(a.textContent) && !a.querySelector("img, picture")) a.remove();
      });
      element.querySelectorAll(".product-heading-wrap").forEach(wrapLooseText);
      element.querySelectorAll(".product-series-selector-wrapper > div > .bc-rich-text").forEach(convertNotes);
      element.querySelectorAll("#main a.btn").forEach((a) => {
        if (!clean(a.textContent) || a.closest("strong, b, em, i")) return;
        const doc = a.ownerDocument;
        const wrap = doc.createElement(a.classList.contains("btn-red") ? "strong" : "em");
        a.replaceWith(wrap);
        wrap.append(a);
        if (wrap.parentElement.tagName !== "P") {
          const p = doc.createElement("p");
          wrap.replaceWith(p);
          p.append(wrap);
        }
      });
    }
    if (hookName === "afterTransform") {
      remove(element, ["header", "footer", "script", "style", "noscript", "link", "iframe", "input", "form"]);
    }
  }

  // tools/importer/transformers/beckman-sections.js
  var MARKER = "data-excat-style";
  var find = (root, selectors) => {
    for (const sel of [].concat(selectors || [])) {
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  };
  var insetStyles = (el) => {
    const styled = el.matches('[style*="margin"]') ? el : el.querySelector('[style*="margin"]');
    const css = (styled == null ? void 0 : styled.getAttribute("style")) || "";
    return ["left", "right"].map((side) => {
      const m = css.match(new RegExp(`margin-${side}\\s*:\\s*(\\d+)%`));
      return m && Number(m[1]) ? `inset-${side}-${m[1]}` : null;
    }).filter(Boolean);
  };
  function transform2(hookName, element, payload) {
    var _a;
    const sections = ((_a = payload == null ? void 0 : payload.template) == null ? void 0 : _a.sections) || [];
    if (!sections.length) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      const found = sections.map((s) => find(element, s.selector));
      const first = found.findIndex(Boolean);
      found.forEach((el, i) => {
        if (!el) return;
        const hr = document.createElement("hr");
        const style = [sections[i].style, ...sections[i].insets ? insetStyles(el) : []].filter(Boolean).join(", ");
        if (style) hr.setAttribute(MARKER, style);
        if (i === first) hr.setAttribute("data-excat-first", "");
        el.before(hr);
      });
    }
    if (hookName === "afterTransform") {
      const markers = [...element.querySelectorAll("hr")];
      markers.forEach((hr, i) => {
        const style = hr.getAttribute(MARKER);
        if (style) {
          const meta = WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { style } });
          const next = markers[i + 1];
          if (next) next.before(meta);
          else element.append(meta);
        }
        hr.removeAttribute(MARKER);
        if (hr.hasAttribute("data-excat-first")) hr.remove();
      });
    }
  }

  // tools/importer/import-reagents-category.js
  var PAGE_TEMPLATE = {
    "name": "reagents-category",
    "description": "mybeckman.in reagent category pages: intro (heading + copy), light-grey band of linked product cards, optional disclaimer notes",
    "urls": [
      "https://www.mybeckman.in/reagents/particle"
    ],
    "blocks": [
      {
        "name": "cards-grid",
        "instances": [
          ".product-series-selector-wrapper .product-series-callouts"
        ]
      }
    ],
    "sections": [
      {
        "id": "intro",
        "name": "Intro",
        "selector": [
          ".product-series-selector-wrapper > .product-content-wrap"
        ],
        "style": "intro",
        "blocks": [],
        "defaultContent": [
          ".product-heading-wrap"
        ]
      },
      {
        "id": "cards",
        "name": "Product cards",
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
        "id": "disclaimer",
        "name": "Disclaimer",
        "selector": [
          ".product-series-selector-wrapper > div > .bc-rich-text:has(h5, p)"
        ],
        "style": "disclaimer",
        "insets": true,
        "blocks": [],
        "defaultContent": [
          ".bc-rich-text"
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
  function addBreadcrumbTitle(main, document) {
    const label = main.getAttribute("data-excat-breadcrumb-title");
    main.removeAttribute("data-excat-breadcrumb-title");
    const table = [...main.querySelectorAll("table")].find((t) => {
      var _a;
      return ((_a = t.querySelector("th, td")) == null ? void 0 : _a.textContent.trim().toLowerCase()) === "metadata";
    });
    if (!label || !table) return;
    const tr = document.createElement("tr");
    ["breadcrumb-title", label].forEach((text) => {
      const td = document.createElement("td");
      td.textContent = text;
      tr.append(td);
    });
    (table.querySelector("tbody") || table).append(tr);
  }
  var import_reagents_category_default = {
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
      addBreadcrumbTitle(main, document);
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
  return __toCommonJS(import_reagents_category_exports);
})();
