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

  // tools/importer/import-service-plans.js
  var import_service_plans_exports = {};
  __export(import_service_plans_exports, {
    default: () => import_service_plans_default
  });

  // tools/importer/parsers/cards-benefits.js
  var FA_MODIFIERS = /^fa-(\d+x|lg|xs|sm|fw|spin|pulse|border|pull-left|pull-right|inverse|flip-.*|rotate-.*|stack.*|solid|regular|light|thin|duotone|brands)$/;
  function getIconName(item) {
    const iconEl = item.querySelector('[class*="fa-"]');
    if (!iconEl) return "check-circle";
    const cls = Array.from(iconEl.classList).find((c) => c.startsWith("fa-") && !FA_MODIFIERS.test(c));
    return cls ? cls.replace(/^fa-/, "") : "check-circle";
  }
  function parse(element, { document: document2 }) {
    const cells = [];
    const intro = element.querySelector(":scope > .Intro__title");
    const introFrag = document2.createDocumentFragment();
    if (intro) {
      const parts = Array.from(intro.querySelectorAll(":scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > p")).filter((el) => el.textContent.trim());
      if (parts.length) {
        introFrag.appendChild(document2.createComment(" field:text "));
        parts.forEach((el) => introFrag.appendChild(el));
      }
    }
    cells.push([introFrag]);
    const items = Array.from(element.querySelectorAll(".Intro__body > .Intro__body-item > div"));
    items.forEach((item) => {
      const strong = item.querySelector("strong, b");
      const titleWrap = item.querySelector(":scope > div");
      const titleText = strong || titleWrap ? (strong || titleWrap).textContent.trim() : "";
      const descriptions = Array.from(item.querySelectorAll(":scope > p")).map((p) => p.textContent.trim()).filter(Boolean);
      if (!titleText && !descriptions.length) return;
      const frag = document2.createDocumentFragment();
      frag.appendChild(document2.createComment(" field:text "));
      if (titleText) {
        const titleP = document2.createElement("p");
        titleP.appendChild(document2.createTextNode(`:${getIconName(item)}: `));
        const s = document2.createElement("strong");
        s.textContent = titleText;
        titleP.appendChild(s);
        frag.appendChild(titleP);
      }
      descriptions.forEach((text) => {
        const p = document2.createElement("p");
        p.textContent = text;
        frag.appendChild(p);
      });
      cells.push([frag]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-benefits", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-grid-products.js
  function parse2(element, { document: document2 }) {
    const cards = Array.from(element.querySelectorAll(":scope > .productCard"));
    const cells = [];
    cells.push([""]);
    cards.forEach((card) => {
      const img = card.querySelector("img.productCardImg, img");
      const heading = card.querySelector(".productCardBody h1, .productCardBody h2, .productCardBody h3, .productCardBody h4, h3");
      const link = card.querySelector(":scope > a[href], a.btn[href]");
      const title = heading ? heading.textContent.trim() : "";
      const imageFrag = document2.createDocumentFragment();
      if (img) {
        if (!img.getAttribute("alt") && title) img.setAttribute("alt", title);
        imageFrag.appendChild(document2.createComment(" field:image "));
        imageFrag.appendChild(img);
      }
      const textFrag = document2.createDocumentFragment();
      if (title || link) textFrag.appendChild(document2.createComment(" field:text "));
      if (title) {
        const h3 = document2.createElement("h3");
        h3.textContent = title;
        textFrag.appendChild(h3);
      }
      if (link) {
        const a = document2.createElement("a");
        a.setAttribute("href", link.getAttribute("href"));
        a.textContent = link.textContent.trim() || "Read More";
        const p = document2.createElement("p");
        p.appendChild(a);
        textFrag.appendChild(p);
      }
      cells.push([imageFrag, textFrag]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "Cards Grid (products)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  var COLUMN_SELECTOR = ':scope > .Section__two-column-left, :scope > .Section__two-column-right, :scope > .Section__two-column-item, :scope > [class*="col-md-6"]';
  var KEEP_TAGS = ["H1", "H2", "H3", "H4", "H5", "H6", "P", "UL", "OL", "IMG", "PICTURE", "TABLE", "BLOCKQUOTE"];
  function buttonParagraph(a, document2) {
    const link = document2.createElement("a");
    link.setAttribute("href", a.getAttribute("href"));
    link.textContent = a.textContent.trim();
    const strong = document2.createElement("strong");
    strong.appendChild(link);
    const p = document2.createElement("p");
    p.appendChild(strong);
    return p;
  }
  function collect(container, out, document2) {
    Array.from(container.children).forEach((child) => {
      const tag = child.tagName;
      if (tag === "BR") return;
      if (tag === "A") {
        if (!child.getAttribute("href") || !child.textContent.trim()) return;
        out.push(buttonParagraph(child, document2));
        return;
      }
      if (tag === "P") {
        const links = child.querySelectorAll("a[href]");
        if (links.length === 1 && links[0].classList.contains("btn") && child.textContent.trim() === links[0].textContent.trim()) {
          out.push(buttonParagraph(links[0], document2));
          return;
        }
        if (!child.textContent.trim() && !child.querySelector("img, picture")) return;
        out.push(child);
        return;
      }
      if (KEEP_TAGS.includes(tag)) {
        if (tag !== "IMG" && tag !== "PICTURE" && !child.textContent.trim() && !child.querySelector("img, picture")) return;
        out.push(child);
        return;
      }
      if (tag === "DIV" || tag === "SECTION" || tag === "ARTICLE" || tag === "SPAN") {
        collect(child, out, document2);
      }
    });
  }
  function videoParagraph(col, document2) {
    const embed = col.querySelector('[class*="wistia_async_"]');
    if (!embed) return null;
    const match = (embed.getAttribute("class") || "").match(/wistia_async_([a-z0-9]+)/i);
    if (!match) return null;
    const src = `https://fast.wistia.net/embed/iframe/${match[1]}`;
    const a = document2.createElement("a");
    a.setAttribute("href", src);
    a.textContent = src;
    const p = document2.createElement("p");
    p.appendChild(a);
    return p;
  }
  function parse3(element, { document: document2 }) {
    let columns = Array.from(element.querySelectorAll(COLUMN_SELECTOR));
    if (!columns.length) columns = Array.from(element.querySelectorAll(":scope > div"));
    const row = columns.map((col) => {
      const video = videoParagraph(col, document2);
      if (video) return [video];
      const content = [];
      collect(col, content, document2);
      return content.length ? content : "";
    });
    const rowHeading = element.querySelector("h1, h2, h3, h4, h5, h6");
    row.forEach((cell) => {
      if (!Array.isArray(cell)) return;
      cell.forEach((node) => {
        const imgs = node.tagName === "IMG" ? [node] : Array.from(node.querySelectorAll("img"));
        imgs.forEach((img) => {
          if (!img.getAttribute("alt") && rowHeading) img.setAttribute("alt", rowHeading.textContent.trim());
        });
      });
    });
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document2, { name: "Columns", cells });
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
    const block = WebImporter.Blocks.createBlock(document2, { name: "Columns (cta)", cells });
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
        if (el.querySelector("nav.breadcrumbs")) el.remove();
      });
      removeAll(element, ["nav.breadcrumbs"]);
      element.querySelectorAll('.wistia_embed, [class*="wistia_async_"]').forEach((embed) => {
        const thumb = embed.querySelector('.w-chrome img[src*="wistia"], img[alt="Video Thumbnail"]');
        embed.querySelectorAll('.w-chrome, [id^="wistia_chrome_"], [id^="wistia_grid_"], video, .w-vulcan-v2').forEach((el) => el.remove());
        if (thumb && !embed.contains(thumb)) embed.appendChild(thumb);
      });
      removeAll(element, [".wistia_video_foam_dummy", "wistia-tag-manager"]);
      element.querySelectorAll(".footnotes > p").forEach((p) => {
        if (!p.textContent.replace(/ /g, " ").trim() && !p.querySelector("img, a[href]")) p.remove();
      });
      element.querySelectorAll(".col-md-6 br").forEach((br) => br.remove());
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
      element.querySelectorAll("a.btn-primary, a.btn-secondary").forEach((a) => {
        if (a.closest("table, strong, em")) return;
        const wrap = element.ownerDocument.createElement(a.classList.contains("btn-secondary") ? "em" : "strong");
        a.replaceWith(wrap);
        wrap.append(a);
        if (!wrap.parentElement || wrap.parentElement.tagName !== "P") {
          const p = element.ownerDocument.createElement("p");
          wrap.replaceWith(p);
          p.append(wrap);
        }
      });
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
  var ANCHOR = "data-excat-section-anchor";
  var FIRST = "data-excat-section-first";
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
  var escapeAttr = (value) => value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  var findAnchor = (root, el) => {
    const candidates = [el, el.firstElementChild].filter(Boolean);
    for (const candidate of candidates) {
      const { id } = candidate;
      if (id && root.querySelector(`a[href="#${escapeAttr(id)}"]`)) return id;
    }
    return "";
  };
  var nextBreak = (root, node) => [...root.querySelectorAll(`hr[${MARKER}]`)].find((hr) => hr !== node && node.compareDocumentPosition(hr) & 4);
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections;
    if (!sections || sections.length < 2) return;
    const doc = element.ownerDocument || document;
    if (hookName === "beforeTransform") {
      const found = sections.map((section) => ({ section, el: findSectionEl(element, section) })).filter(({ el }) => el);
      found.forEach((entry) => {
        entry.anchor = findAnchor(element, entry.el);
      });
      for (let i = found.length - 1; i >= 0; i -= 1) {
        const { section, el, anchor } = found[i];
        if (i === 0 && !section.style && !anchor) continue;
        const hr = doc.createElement("hr");
        hr.setAttribute(MARKER, section.id);
        if (anchor) hr.setAttribute(ANCHOR, anchor);
        if (i === 0) hr.setAttribute(FIRST, "true");
        el.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        const anchor = marker ? marker.getAttribute(ANCHOR) || "" : "";
        if (!section.style && !anchor) continue;
        const cells = {};
        if (section.style) cells.style = section.style;
        if (anchor) cells.anchor = anchor;
        const meta = WebImporter.Blocks.createBlock(doc, { name: "Section Metadata", cells });
        if (marker) {
          const end = nextBreak(element, marker);
          if (end) end.before(meta);
          else marker.parentNode.appendChild(meta);
        } else {
          const sectionEl = findSectionEl(element, section);
          if (sectionEl) sectionEl.after(meta);
        }
      }
      element.querySelectorAll(`hr[${MARKER}]`).forEach((hr) => {
        if (hr.hasAttribute(FIRST)) {
          hr.remove();
        } else {
          hr.removeAttribute(MARKER);
          hr.removeAttribute(ANCHOR);
        }
      });
    }
  }

  // tools/importer/import-service-plans.js
  var PAGE_TEMPLATE = {
    "name": "service-plans",
    "urls": [
      "https://www.mybeckman.in/service/plans"
    ],
    "representativeUrl": "https://www.mybeckman.in/service/plans",
    "description": "Service Plans landing page: breadcrumb, text intro with CTA, blue benefits band, product plan cards, team columns, additional-services columns (video, training) and blue Get in Touch band",
    "urlPattern": "/service/plans",
    "blocks": [
      {
        "name": "cards-benefits",
        "instances": [
          ".Section--blue .Intro",
          ".Intro"
        ]
      },
      {
        "name": "cards-grid-products",
        "instances": [
          ".Section .productCards",
          ".productCards"
        ]
      },
      {
        "name": "columns",
        "instances": [
          ".Section > .Section__two-column"
        ]
      },
      {
        "name": "columns-cta",
        "instances": [
          "#getInTouch .Contact__body",
          ".Contact .Contact__body"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Page header",
        "selector": [
          ".bc-rich-text:has(> .Section__header)",
          ".Section__header"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          ".Section__header > h1",
          ".Section__header > h2",
          ".Section__header .callout > p",
          ".Section__header .callout > a"
        ]
      },
      {
        "id": "section-2",
        "name": "Why choose a service plan",
        "selector": [
          ".bc-rich-text:has(.Section--blue .Intro)",
          ".Section--blue:has(.Intro)"
        ],
        "style": "blue",
        "blocks": [
          "cards-benefits"
        ],
        "defaultContent": []
      },
      {
        "id": "section-3",
        "name": "Product Specific Service Plans",
        "selector": [
          ".bc-rich-text:has(.productCards)"
        ],
        "style": null,
        "blocks": [
          "cards-grid-products"
        ],
        "defaultContent": [
          ".Section:has(> .productCards) > h2"
        ]
      },
      {
        "id": "section-4",
        "name": "Count on our team of experts",
        "selector": [
          ".bc-rich-text:has(> .Section > h2 + p + .Section__two-column)"
        ],
        "style": null,
        "blocks": [
          "columns"
        ],
        "defaultContent": [
          ".Section:has(> .Section__two-column) > h2",
          ".Section:has(> .Section__two-column) > p"
        ]
      },
      {
        "id": "section-5",
        "name": "Additional services",
        "selector": [
          ".bc-rich-text:has(.wistia_embed)",
          ".bc-rich-text:has(.wistia_responsive_padding)"
        ],
        "style": null,
        "blocks": [
          "columns"
        ],
        "defaultContent": []
      },
      {
        "id": "section-6",
        "name": "Training",
        "selector": [
          ".bc-rich-text:has(> .Section > .Section__two-column:first-child > .Section__two-column-left > img)"
        ],
        "style": null,
        "blocks": [
          "columns"
        ],
        "defaultContent": []
      },
      {
        "id": "section-7",
        "name": "Get in Touch",
        "selector": [
          "#getInTouch",
          ".Section--blue:has(.Contact)"
        ],
        "style": "blue, centered",
        "blocks": [
          "columns-cta"
        ],
        "defaultContent": [
          "#getInTouch .Contact > h2",
          "#getInTouch .Contact > p"
        ]
      }
    ]
  };
  var parsers = {
    "cards-benefits": parse,
    "cards-grid-products": parse2,
    "columns": parse3,
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
  var import_service_plans_default = {
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
      const meta = WebImporter.Blocks.getMetadata(document2);
      meta.breadcrumbs = "true";
      meta.template = "service-plans";
      main.append(WebImporter.Blocks.getMetadataBlock(document2, meta));
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
  return __toCommonJS(import_service_plans_exports);
})();
