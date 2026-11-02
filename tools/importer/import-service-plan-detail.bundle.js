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

  // tools/importer/import-service-plan-detail.js
  var import_service_plan_detail_exports = {};
  __export(import_service_plan_detail_exports, {
    default: () => import_service_plan_detail_default
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
    const next = heading ? heading.nextElementSibling : null;
    const subheading = next && /^H[2-6]$/.test(next.tagName) ? next : null;
    const paragraphs = Array.from(content.querySelectorAll(":scope > p"));
    const ctas = Array.from(content.querySelectorAll(":scope > a[href], :scope > p > a.btn[href]"));
    if (heading || paragraphs.length || ctas.length) {
      textFrag.appendChild(document2.createComment(" field:text "));
    }
    if (heading) textFrag.appendChild(heading);
    if (subheading) textFrag.appendChild(subheading);
    paragraphs.forEach((p) => {
      if (!ctas.some((a) => p.contains(a))) textFrag.appendChild(p);
    });
    const multi = ctas.length > 1;
    ctas.forEach((a) => {
      const link = document2.createElement("a");
      link.setAttribute("href", a.getAttribute("href"));
      link.textContent = a.textContent.trim();
      const p = document2.createElement("p");
      let wrapper = null;
      if (multi && a.classList.contains("btn-primary")) wrapper = document2.createElement("strong");
      else if (multi && a.classList.contains("btn-secondary")) wrapper = document2.createElement("em");
      if (wrapper) {
        wrapper.appendChild(link);
        p.appendChild(wrapper);
      } else {
        p.appendChild(link);
      }
      textFrag.appendChild(p);
    });
    cells.push([textFrag]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-centered", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-comparison.js
  var COLUMN_COUNT = 6;
  var INCLUDED = "\u25CF";
  var OPTIONAL = "\u25CB";
  var isBlank = (cell) => cell.classList.contains("blank");
  function cellValue(cell) {
    if (cell.querySelector(".circle")) return INCLUDED;
    if (cell.querySelector(".whiteCircle, .emptycircle, .emptyCircle, .white-circle")) return OPTIONAL;
    return cell.textContent.replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function pageUrl(document2, ctx) {
    const params = ctx && ctx.params || {};
    const candidates = [params.originalURL, ctx && ctx.url];
    const meta = document2.querySelector('meta[property="og:url"], link[rel="canonical"]');
    if (meta) candidates.push(meta.getAttribute("content") || meta.getAttribute("href"));
    try {
      candidates.push(document2.location && document2.location.href);
    } catch (e) {
    }
    return candidates.filter(Boolean).map(String).join(" ");
  }
  function parse2(element, { document: document2 }) {
    const ctx = arguments[1] || {};
    const allRows = Array.from(element.querySelectorAll(":scope > thead > tr, :scope > tbody > tr, :scope > tr"));
    if (!allRows.length) return;
    const headRows = Array.from(element.querySelectorAll(":scope > thead > tr"));
    const groupRow = headRows.find((tr) => tr.querySelector(".section-header"));
    const bodyRows = allRows.filter((tr) => tr !== groupRow);
    const planRow = bodyRows[0];
    const featureRows = bodyRows.slice(1);
    const toRow = (values) => {
      const padded = values.slice(0, COLUMN_COUNT);
      while (padded.length < COLUMN_COUNT) padded.push("");
      return padded.map((value, i) => {
        if (!value) return "";
        const frag = document2.createDocumentFragment();
        frag.appendChild(document2.createComment(` field:column${i + 1} `));
        frag.appendChild(document2.createTextNode(value));
        return frag;
      });
    };
    const cells = [];
    if (groupRow && planRow) {
      const planCells = Array.from(planRow.children);
      const groupValues = [""];
      let planIndex = 1;
      Array.from(groupRow.children).slice(1).forEach((th) => {
        const colspanAttr = parseInt(th.getAttribute("colspan") || "", 10);
        if (isBlank(th)) {
          planIndex += Number.isNaN(colspanAttr) ? 1 : colspanAttr;
          return;
        }
        let span;
        if (!Number.isNaN(colspanAttr) && colspanAttr > 0) {
          span = colspanAttr;
        } else {
          span = 0;
          while (planIndex + span < planCells.length && !isBlank(planCells[planIndex + span])) span += 1;
          span = Math.max(span, 1);
        }
        planIndex += span;
        const label = th.textContent.replace(/\s+/g, " ").trim();
        groupValues.push(label);
        for (let s = 1; s < span; s += 1) groupValues.push("");
      });
      cells.push(toRow(groupValues));
    }
    [planRow, ...featureRows].filter(Boolean).forEach((tr, rowIndex) => {
      const values = Array.from(tr.children).filter((cell) => !isBlank(cell)).map((cell, i) => i === 0 && rowIndex === 0 ? cell.textContent.trim() : cellValue(cell));
      if (rowIndex > 0 && !values.some(Boolean)) return;
      cells.push(toRow(values));
    });
    const highlight = /\/service\/plans\/centrifuge(?:[/?#.]|\s|$)/i.test(pageUrl(document2, ctx));
    const name = highlight ? "Table Comparison (highlight)" : "Table Comparison";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
    const wrapper = element.parentElement;
    const footnotes = wrapper ? wrapper.querySelector(":scope > .footnotes") : null;
    const legend = [];
    if (footnotes) {
      footnotes.querySelectorAll("p").forEach((p) => {
        const text = p.textContent.replace(/ /g, " ").replace(/\s+/g, " ").trim();
        if (!text) return;
        let glyph = "";
        if (p.querySelector(".circle")) glyph = INCLUDED;
        else if (p.querySelector(".whiteCircle, .emptycircle, .emptyCircle, .white-circle")) glyph = OPTIONAL;
        else if (/^included$/i.test(text)) glyph = INCLUDED;
        else if (/^optional/i.test(text)) glyph = OPTIONAL;
        const out = document2.createElement("p");
        out.textContent = glyph ? `${glyph} ${text}` : text;
        legend.push(out);
      });
      footnotes.remove();
    }
    element.replaceWith(block);
    if (legend.length) block.after(...legend);
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

  // tools/importer/import-service-plan-detail.js
  var PAGE_TEMPLATE = {
    "name": "service-plan-detail",
    "urls": [
      "https://www.mybeckman.in/service/plans/centrifuge",
      "https://www.mybeckman.in/service/plans/flow-cytometry",
      "https://www.mybeckman.in/service/plans/liquid-handling",
      "https://www.mybeckman.in/service/plans/particle-analysis"
    ],
    "representativeUrl": "https://www.mybeckman.in/service/plans/centrifuge",
    "description": "Product service plan page: breadcrumb, optional photo hero with two CTAs, warranty/post-warranty comparison table with legend, optional two-column info section, blue Get in Touch band",
    "urlPattern": "/service/plans/*",
    "blocks": [
      {
        "name": "hero-centered",
        "instances": [
          ".bc-rich-text > .hero",
          "div.hero"
        ]
      },
      {
        "name": "table-comparison",
        "instances": [
          "#service-plans-table > table",
          "#service-plans-table table"
        ]
      },
      {
        "name": "columns",
        "instances": [
          ".Section > .row:has(> .col-md-6)",
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
        "name": "Hero",
        "selector": [
          ".bc-rich-text:has(> .hero)"
        ],
        "style": null,
        "blocks": [
          "hero-centered"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "Choose a plan",
        "selector": [
          "#choosePlan",
          ".bc-rich-text:has(#service-plans-table)"
        ],
        "style": null,
        "blocks": [
          "table-comparison"
        ],
        "defaultContent": [
          "#choosePlan .firstSection > h2",
          "#service-plans-table .footnotes > div > p"
        ]
      },
      {
        "id": "section-3",
        "name": "Additional services",
        "selector": [
          ".bc-rich-text:has(> .Section > .row > .col-md-6)",
          ".bc-rich-text:has(> .Section > .Section__two-column)"
        ],
        "style": null,
        "blocks": [
          "columns"
        ],
        "defaultContent": []
      },
      {
        "id": "section-4",
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
    "hero-centered": parse,
    "table-comparison": parse2,
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
  var import_service_plan_detail_default = {
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
  return __toCommonJS(import_service_plan_detail_exports);
})();
