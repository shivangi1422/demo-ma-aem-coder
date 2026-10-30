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

  // tools/importer/import-service.js
  var import_service_exports = {};
  __export(import_service_exports, {
    default: () => import_service_default
  });

  // tools/importer/parsers/hero-centered.js
  function parse(element, { document: document2 }) {
    const img = element.querySelector(":scope > img, :scope > picture img, img");
    const content = element.querySelector(":scope > div") || element;
    const cells = [];
    const imageFrag = document2.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document2.createComment(" field:image "));
      imageFrag.appendChild(img);
    }
    cells.push([imageFrag]);
    const textFrag = document2.createDocumentFragment();
    const heading = content.querySelector("h1, h2, h3");
    const paragraphs = Array.from(content.querySelectorAll(":scope > p"));
    const ctas = Array.from(content.querySelectorAll(":scope > a[href], :scope > p > a.btn[href]"));
    if (heading || paragraphs.length || ctas.length) {
      textFrag.appendChild(document2.createComment(" field:text "));
    }
    if (heading) textFrag.appendChild(heading);
    paragraphs.forEach((p) => {
      if (!ctas.some((a) => p.contains(a))) textFrag.appendChild(p);
    });
    ctas.forEach((a) => {
      const link = document2.createElement("a");
      link.setAttribute("href", a.getAttribute("href"));
      link.textContent = a.textContent.trim();
      const p = document2.createElement("p");
      p.appendChild(link);
      textFrag.appendChild(p);
    });
    cells.push([textFrag]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-centered", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-stats.js
  function parse2(element, { document: document2 }) {
    const items = Array.from(element.querySelectorAll(":scope > div"));
    const cells = [];
    items.forEach((item) => {
      const paragraphs = Array.from(item.querySelectorAll(":scope > p"));
      if (!paragraphs.length && !item.textContent.trim()) return;
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      if (paragraphs.length) {
        paragraphs.forEach((p, i) => {
          const strong = p.querySelector("strong, b");
          const out = document2.createElement("p");
          if (i === 0 && strong) {
            const s = document2.createElement("strong");
            s.textContent = strong.textContent.trim();
            out.appendChild(s);
          } else {
            out.textContent = p.textContent.trim();
          }
          textFrag.appendChild(out);
        });
      } else {
        const out = document2.createElement("p");
        out.textContent = item.textContent.trim();
        textFrag.appendChild(out);
      }
      cells.push([textFrag]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-stats", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-grid.js
  var FA_MODIFIERS = /^fa-(\d+x|lg|xs|sm|fw|spin|pulse|border|pull-left|pull-right|inverse|flip-.*|rotate-.*|stack.*|solid|regular|light|thin|duotone|brands)$/;
  function getIconName(card) {
    const iconEl = card.querySelector('[class*="fa-"]');
    if (!iconEl) return null;
    const cls = Array.from(iconEl.classList).find((c) => c.startsWith("fa-") && !FA_MODIFIERS.test(c));
    return cls ? cls.replace(/^fa-/, "") : null;
  }
  function parse3(element, { document: document2 }) {
    const cards = Array.from(element.querySelectorAll(":scope > .ServiceCard"));
    const cells = [];
    cells.push([""]);
    cards.forEach((card) => {
      const heading = card.querySelector("h1, h2, h3, h4, h5, h6");
      const titleLink = heading ? heading.querySelector("a[href]") : null;
      const anyLink = card.querySelector("a[href]");
      const href = titleLink || anyLink ? (titleLink || anyLink).getAttribute("href") : null;
      const iconName = getIconName(card);
      const iconFrag = document2.createDocumentFragment();
      if (iconName) {
        iconFrag.appendChild(document2.createComment(" field:image "));
        iconFrag.appendChild(document2.createTextNode(`:${iconName}:`));
      }
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      if (heading) {
        const h = document2.createElement(heading.tagName.toLowerCase());
        const title = heading.textContent.trim();
        if (href) {
          const a = document2.createElement("a");
          a.setAttribute("href", href);
          a.textContent = title;
          h.appendChild(a);
        } else {
          h.textContent = title;
        }
        textFrag.appendChild(h);
      }
      Array.from(card.querySelectorAll(":scope > p")).forEach((p) => {
        const text = p.textContent.trim();
        if (!text) return;
        const out = document2.createElement("p");
        out.textContent = text;
        textFrag.appendChild(out);
      });
      cells.push([iconFrag, textFrag]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-grid", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-cta.js
  function parse4(element, { document: document2 }) {
    const columns = Array.from(element.querySelectorAll(":scope > div"));
    const row = [];
    columns.forEach((col) => {
      const content = [];
      Array.from(col.children).forEach((child) => {
        if (child.tagName === "A" && child.getAttribute("href")) {
          const a = document2.createElement("a");
          a.setAttribute("href", child.getAttribute("href"));
          a.textContent = child.textContent.trim();
          const p = document2.createElement("p");
          p.appendChild(a);
          content.push(p);
        } else if (child.textContent.trim()) {
          content.push(child);
        }
      });
      row.push(content.length ? content : "");
    });
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-cta", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/mybeckman-cleanup.js
  var removeAll = (root, selectors) => {
    selectors.forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => el.remove());
    });
  };
  var isEmpty = (el) => !el.textContent.trim() && !el.querySelector("img, picture, video, iframe, svg, a[href], h1, h2, h3, h4, h5, h6");
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      removeAll(element, [
        "#consent_blackbar",
        "#teconsent",
        '[id^="truste-"]',
        '[class*="truste"]',
        "#trustarc-banner-overlay",
        "#ModalPopup",
        ".MaskOverlay",
        ".flash-message",
        "#mktoStyleLoaded",
        "form.mktoForm",
        "#MktoForms2XDIframe",
        "#external_search_box_section",
        ".skip-to-main-content-link"
      ]);
      removeAll(element, [
        "input#userId",
        "input#contextItemId",
        "input#csrfToken",
        'input[type="hidden"]'
      ]);
      element.querySelectorAll("div.container.custome-container").forEach((el) => {
        if (isEmpty(el)) el.remove();
      });
      element.querySelectorAll("div.row.js-component").forEach((el) => {
        if (isEmpty(el)) el.remove();
      });
      element.querySelectorAll("#content-holder").forEach((el) => {
        if (isEmpty(el)) el.remove();
      });
      element.querySelectorAll(".bc-rich-text").forEach((el) => {
        if (isEmpty(el)) el.remove();
      });
    }
    if (hookName === "afterTransform") {
      removeAll(element, [
        "header#mainNav",
        "header",
        "div.footer2023",
        "footer",
        "nav"
      ]);
      removeAll(element, [
        "script",
        "style",
        "noscript",
        "link",
        "iframe",
        "input",
        "form",
        "button"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          if (attr.name.startsWith("data-") && !attr.name.startsWith("data-excat-") || attr.name.startsWith("on") || attr.name === "aria-hidden") {
            el.removeAttribute(attr.name);
          }
        });
      });
    }
  }

  // tools/importer/transformers/mybeckman-sections.js
  var MARKER = "data-excat-section-id";
  var findSectionEl = (root, section) => {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  };
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections;
    if (!sections || sections.length < 2) return;
    const doc = element.ownerDocument || document;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = findSectionEl(element, section);
        if (!el) continue;
        if (i > 0 || section.style) {
          const hr = doc.createElement("hr");
          if (section.style) hr.setAttribute(MARKER, section.id);
          el.before(hr);
        }
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        const sectionEl = marker ? null : findSectionEl(element, section);
        const meta = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        if (marker) {
          let end = marker.nextElementSibling;
          while (end && end.tagName !== "HR") end = end.nextElementSibling;
          if (end) end.before(meta);
          else marker.parentNode.appendChild(meta);
          if (i === 0) marker.remove();
          else marker.removeAttribute(MARKER);
        } else if (sectionEl) {
          sectionEl.after(meta);
        }
      }
    }
  }

  // tools/importer/import-service.js
  var PAGE_TEMPLATE = {
    name: "service",
    urls: [
      "https://www.mybeckman.in/service"
    ],
    representativeUrl: "https://www.mybeckman.in/service",
    description: "Service landing page: photo hero, blue stats band, service offering cards and a blue Get in Touch contact band",
    urlPattern: "/*",
    blocks: [
      {
        name: "hero-centered",
        instances: [".bc-rich-text > .hero", "div.hero"]
      },
      {
        name: "cards-stats",
        instances: [".Section--blue .Section__intro", ".Section__intro"]
      },
      {
        name: "cards-grid",
        instances: [".Section .ServiceCards", ".ServiceCards"]
      },
      {
        name: "columns-cta",
        instances: ["#getInTouch .Contact__body", ".Contact .Contact__body"]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "Hero",
        selector: [".bc-rich-text:has(> .hero)", "div.hero"],
        style: null,
        blocks: ["hero-centered"],
        defaultContent: []
      },
      {
        id: "section-2",
        name: "Service stats",
        selector: [".Section--blue:has(.Section__intro)", ".bc-rich-text:has(.Section__intro)"],
        style: "blue",
        blocks: ["cards-stats"],
        defaultContent: []
      },
      {
        id: "section-3",
        name: "Service offerings",
        selector: [".bc-rich-text:has(.ServiceCards)", ".Section:has(> .ServiceCards)"],
        style: null,
        blocks: ["cards-grid"],
        defaultContent: []
      },
      {
        id: "section-4",
        name: "Get in Touch",
        selector: ["#getInTouch", ".Section--blue:has(.Contact)"],
        style: "blue, centered",
        blocks: ["columns-cta"],
        defaultContent: ["#getInTouch .Contact > h2", "#getInTouch .Contact > p"]
      }
    ]
  };
  var parsers = {
    "hero-centered": parse,
    "cards-stats": parse2,
    "cards-grid": parse3,
    "columns-cta": parse4
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
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        document2.querySelectorAll(selector).forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    return pageBlocks;
  }
  var import_service_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document: document2, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document2.createElement("hr"));
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document2.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_service_exports);
})();
