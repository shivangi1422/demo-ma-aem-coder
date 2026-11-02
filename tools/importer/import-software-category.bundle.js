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

  // tools/importer/import-software-category.js
  var import_software_category_exports = {};
  __export(import_software_category_exports, {
    default: () => import_software_category_default
  });

  // tools/importer/parsers/product-tiles.js
  function toRichText(source, document) {
    const fragment = document.createDocumentFragment();
    let paragraph = null;
    const flush = () => {
      if (paragraph && paragraph.textContent.trim()) fragment.appendChild(paragraph);
      paragraph = null;
    };
    [...source.childNodes].forEach((node) => {
      const isBlock = node.nodeType === 1 && /^(P|UL|OL|DIV|H[1-6]|TABLE)$/.test(node.tagName);
      if (isBlock) {
        flush();
        if (node.tagName === "DIV") {
          fragment.appendChild(toRichText(node, document));
        } else if (node.textContent.trim()) {
          fragment.appendChild(node.cloneNode(true));
        }
        return;
      }
      if (node.nodeType === 3 && !node.textContent.trim()) {
        if (paragraph) paragraph.appendChild(document.createTextNode(" "));
        return;
      }
      if (!paragraph) paragraph = document.createElement("p");
      paragraph.appendChild(node.nodeType === 3 ? document.createTextNode(node.textContent.replace(/\s+/g, " ").trim()) : node.cloneNode(true));
    });
    flush();
    return fragment;
  }
  function parse(element, { document }) {
    const items = Array.from(element.querySelectorAll(":scope > .product-series-callouts__item"));
    const cells = items.map((item) => {
      const link = item.querySelector("a.product-series-callouts__block");
      const wrap = item.querySelector(".product-series-callouts__image-wrap");
      const hiddenImg = item.querySelector(".product-series-callouts__image-wrap img, img");
      const bg = wrap && (wrap.getAttribute("style") || "").match(/url\(['"]?([^'")]+)['"]?\)/);
      const src = bg && bg[1] || hiddenImg && hiddenImg.getAttribute("src");
      const heading = item.querySelector(".product-series-callouts__description h4, .product-series-callouts__description h3");
      const description = item.querySelector(".product-series-callouts__description .hidden-xs, .product-series-callouts__description > div");
      const imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:image "));
      if (src) {
        const img = document.createElement("img");
        img.setAttribute("src", src);
        img.setAttribute("alt", hiddenImg && hiddenImg.getAttribute("alt") || "");
        imageCell.appendChild(img);
      }
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      if (heading) {
        const h2 = document.createElement("h2");
        h2.textContent = heading.textContent.replace(/\s+/g, " ").trim();
        textCell.appendChild(h2);
      }
      if (description) textCell.appendChild(toRichText(description, document));
      const bareText = description && [...description.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim());
      const sizeCell = document.createDocumentFragment();
      sizeCell.appendChild(document.createComment(" field:textSize "));
      sizeCell.appendChild(document.createTextNode(bareText ? "regular" : "small"));
      const linkCell = document.createDocumentFragment();
      linkCell.appendChild(document.createComment(" field:link "));
      if (link && link.getAttribute("href")) {
        const a = document.createElement("a");
        a.setAttribute("href", link.getAttribute("href"));
        a.textContent = link.getAttribute("href");
        linkCell.appendChild(a);
      }
      return [imageCell, textCell, sizeCell, linkCell];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "product-tiles", cells });
    element.replaceWith(block);
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
        "#main .main-holder > .container.custome-container",
        "nav.breadcrumbs"
      ]);
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

  // tools/importer/import-software-category.js
  var PAGE_TEMPLATE = {
    "name": "software-category",
    "urls": [
      "https://www.mybeckman.in/flow-cytometry/software",
      "https://www.mybeckman.in/liquid-handlers/software"
    ],
    "representativeUrl": "https://www.mybeckman.in/flow-cytometry/software",
    "description": "Software category listing: title and intro, then a grey band of linked product tiles (image, title, description)",
    "urlPattern": "/*/software",
    "blocks": [
      {
        "name": "product-tiles",
        "instances": [
          ".product-series-selector-wrapper .product-series-callouts > .row",
          ".product-series-callouts > .row"
        ]
      }
    ],
    "sections": [
      {
        "id": "s1",
        "name": "Title and intro",
        "selector": [
          ".product-series-selector-wrapper > .product-content-wrap"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          ".product-heading-wrap > h1",
          ".product-heading-wrap > p",
          ".product-heading-wrap > ul"
        ]
      },
      {
        "id": "s2",
        "name": "Product tiles",
        "selector": [
          ".product-series-selector-wrapper .product-series-callouts"
        ],
        "style": "light-grey",
        "blocks": [
          "product-tiles"
        ],
        "defaultContent": []
      }
    ]
  };
  var parsers = {
    "product-tiles": parse
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
  var import_software_category_default = {
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
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_software_category_exports);
})();
