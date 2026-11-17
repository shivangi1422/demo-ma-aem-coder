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

  // tools/importer/import-resources-disease-research.js
  var import_resources_disease_research_exports = {};
  __export(import_resources_disease_research_exports, {
    default: () => import_resources_disease_research_default
  });

  // tools/importer/parsers/columns-jumplinks.js
  var slug = (text) => (text || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  function parse(element, { document: document2 }) {
    const links = Array.from(element.querySelectorAll("a[href]"));
    const row = links.map((a) => {
      let href = a.getAttribute("href");
      if (href.startsWith("#")) {
        const target = document2.getElementById(href.slice(1));
        const heading = target && target.querySelector("h1, h2, h3");
        if (heading) href = `#${slug(heading.textContent)}`;
      }
      const link = document2.createElement("a");
      link.setAttribute("href", href);
      link.textContent = a.textContent.trim();
      const p = document2.createElement("p");
      p.appendChild(link);
      return [p];
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "Columns (jumplinks)", cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-centered-strip.js
  function parse2(element, { document: document2 }) {
    const img = element.querySelector(":scope > img, img");
    const heading = element.querySelector(".overlay_vk h2, h2, h3");
    const cells = [];
    const imageFrag = document2.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document2.createComment(" field:image "));
      imageFrag.appendChild(img);
    }
    cells.push([imageFrag]);
    const textFrag = document2.createDocumentFragment();
    if (heading) {
      const h2 = document2.createElement("h2");
      h2.textContent = heading.textContent.replace(/\s+/g, " ").trim();
      textFrag.appendChild(document2.createComment(" field:text "));
      textFrag.appendChild(h2);
    }
    cells.push([textFrag]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "Hero Centered (strip)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-grid-callouts.js
  var toRelative = (href) => {
    if (!href) return "";
    const m = href.match(/^https?:\/\/(?:www\.)?mybeckman\.in(\/.*)?$/i);
    if (m) return m[1] || "/";
    return href;
  };
  var cleanImageSrc = (src) => {
    if (!src) return src;
    let abs = src.trim();
    if (abs.startsWith("//")) abs = `https:${abs}`;
    else if (abs.startsWith("/-/media/")) abs = `https://media.beckman.com${abs}`;
    if (!/^https?:/i.test(abs)) return abs;
    try {
      const url = new URL(abs);
      ["h", "w", "iar", "hash", "sc_lang"].forEach((p) => url.searchParams.delete(p));
      return url.toString();
    } catch (e) {
      return abs;
    }
  };
  var imageOf = (item) => {
    const img = item.querySelector("img");
    if (img && img.getAttribute("src")) return { src: img.getAttribute("src"), alt: img.getAttribute("alt") || "" };
    const bg = item.querySelector('[style*="background-image"]');
    if (bg) {
      const m = (bg.getAttribute("style") || "").match(/background-image\s*:\s*url\(\s*(?:&quot;|['"])?([^'")&]+)/i);
      if (m) return { src: m[1], alt: "" };
    }
    return null;
  };
  var norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  var previousHeadingLevel = (document2, element) => {
    let level = 2;
    Array.from(document2.querySelectorAll("h1, h2, h3, h4, h5, h6")).forEach((h) => {
      if (!element.contains(h) && h.compareDocumentPosition(element) & 4) level = Number(h.tagName[1]);
    });
    return level;
  };
  function parse3(element, { document: document2 }) {
    const level = Math.min(Math.max(previousHeadingLevel(document2, element) + 1, 2), 4);
    const cells = [[""]];
    element.querySelectorAll(".product-series-callouts__item").forEach((item) => {
      const link = item.querySelector("a[href]");
      const href = toRelative(link && link.getAttribute("href"));
      const heading = item.querySelector("h4, h3, h5, h2");
      const title = norm(heading && heading.textContent);
      const descEl = item.querySelector(".product-series-callouts__description > div, .product-series-callouts__description > p");
      const description = norm(descEl && descEl.textContent);
      const image = imageOf(item);
      const imageFrag = document2.createDocumentFragment();
      if (image && image.src) {
        const img = document2.createElement("img");
        img.setAttribute("src", cleanImageSrc(image.src));
        img.setAttribute("alt", image.alt);
        imageFrag.appendChild(document2.createComment(" field:image "));
        imageFrag.appendChild(img);
      }
      const textFrag = document2.createDocumentFragment();
      if (title || description) textFrag.appendChild(document2.createComment(" field:text "));
      if (title) {
        const h = document2.createElement(`h${level}`);
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
      if (description) {
        const p = document2.createElement("p");
        p.textContent = description;
        textFrag.appendChild(p);
      }
      cells.push([imageFrag, textFrag]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "Cards Grid (callouts)", cells });
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
  function parse4(element, { document: document2 }) {
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

  // tools/importer/parsers/columns-text-first.js
  function parse5(element, { document: document2, url, params }) {
    const marker = document2.createComment("columns-text-first");
    element.before(marker);
    parse4(element, { document: document2, url, params });
    const block = marker.nextElementSibling;
    marker.remove();
    if (!block) return;
    const header = block.querySelector("tr:first-child > th, tr:first-child > td");
    if (header && header.textContent.trim() === "Columns") header.textContent = "Columns (text-first)";
  }

  // tools/importer/parsers/accordion.js
  var KEEP = ["P", "UL", "OL", "H3", "H4", "H5", "H6", "IMG", "PICTURE", "TABLE"];
  function parse6(element, { document: document2 }) {
    const items = [element];
    let next = element.nextElementSibling;
    while (next && next.classList.contains("wrap-collabsible")) {
      items.push(next);
      next = next.nextElementSibling;
    }
    const cells = [];
    items.forEach((item) => {
      const label = item.querySelector(".lbl-toggle, label");
      const title = (label ? label.textContent : "").replace(/\s+/g, " ").trim();
      const inner = item.querySelector(".collapsible-content .content-inner") || item.querySelector(".collapsible-content") || item;
      const titleFrag = document2.createDocumentFragment();
      titleFrag.appendChild(document2.createComment(" field:summary "));
      titleFrag.appendChild(document2.createTextNode(title));
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      Array.from(inner.children).forEach((child) => {
        if (!KEEP.includes(child.tagName)) return;
        if (!child.textContent.trim() && !child.querySelector("img, picture")) return;
        child.querySelectorAll("a.btn").forEach((a) => a.removeAttribute("class"));
        textFrag.appendChild(child);
      });
      cells.push([titleFrag, textFrag]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "Accordion", cells });
    items.slice(1).forEach((item) => item.remove());
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
      const doc = element.ownerDocument || document;
      let mktoOrigin = "https://pages.beckman.com";
      const mktoStyle = doc.querySelector("link#mktoForms2BaseStyle[href]");
      if (mktoStyle) {
        try {
          mktoOrigin = new URL(mktoStyle.getAttribute("href"), "https://pages.beckman.com").origin;
        } catch (e) {
        }
      }
      element.querySelectorAll("#main .formassembly-container").forEach((container) => {
        if (container.closest(".footer2023")) return;
        const form = container.querySelector('form.mktoForm[id^="mktoForm_"]');
        if (!form) return;
        const formId = form.id.replace("mktoForm_", "");
        if (!formId) return;
        const munchkinInput = container.querySelector('input[name="munchkinId"]');
        const munchkin = munchkinInput && munchkinInput.value || "682-XWP-826";
        container.setAttribute("data-excat-mkto-form", formId);
        container.setAttribute("data-excat-mkto-munchkin", munchkin);
        container.setAttribute("data-excat-mkto-origin", mktoOrigin);
      });
      element.querySelectorAll('a[href*="/sitecore/service/notfound.aspx"]').forEach((a) => {
        if (/office locations/i.test(a.textContent)) a.setAttribute("href", "/contact-us");
      });
      removeAll(element, [".container-overlay-full-width > .overlay"]);
      element.querySelectorAll('sup > a[href^="#ref"]').forEach((a) => {
        a.replaceWith(...a.childNodes);
      });
      removeAll(element, ['a[name="Courses"]:not([href])']);
      element.querySelectorAll("#content-holder > br").forEach((br) => br.remove());
      element.querySelectorAll("#content-holder .bcls-aeo-published").forEach((el) => {
        if (isEmpty(el)) el.remove();
      });
      element.querySelectorAll("#content-holder a:not([href])").forEach((a) => {
        if (isEmpty(a)) a.remove();
      });
      element.querySelectorAll("#content-holder > p").forEach((p) => {
        if (!p.textContent.replace(/ /g, " ").trim() && !p.querySelector("img, a[href]")) p.remove();
      });
      element.querySelectorAll("aside.faq-sidebar").forEach((el) => {
        if (isEmpty(el)) el.remove();
      });
      removeAll(element, ["#product-documentation-wrapper .content-resource-list-child"]);
      element.querySelectorAll("#product-documentation-wrapper .content-pagination-next-btn").forEach((btn) => btn.parentElement.remove());
      element.querySelectorAll(".product-spotlight-wrapper .product-page-sub-heading-wrapper > h3").forEach((h3) => {
        const h2 = element.ownerDocument.createElement("h2");
        h2.innerHTML = h3.innerHTML;
        h3.replaceWith(h2);
      });
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
      removeAll(element, ["#coveo-techdocs-more-results"]);
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

  // tools/importer/import-resources-disease-research.js
  var PAGE_TEMPLATE = {
    "name": "resources-disease-research",
    "urls": [
      "https://www.mybeckman.in/resources/disease-research/leukemia-and-lymphoma"
    ],
    "representativeUrl": "https://www.mybeckman.in/resources/disease-research/leukemia-and-lymphoma",
    "description": "Disease research gateway page (Leukemia and Lymphoma): H1 + intro, sticky jump-link bar, contained strip banners per topic, bordered callout tile grids, text|infographic columns, expandable advantages (accordion), bordered workflow diagrams, references",
    "urlPattern": "/resources/disease-research/*",
    "blocks": [
      {
        "name": "columns-jumplinks",
        "instances": [
          ".bc-rich-text > .sticky"
        ]
      },
      {
        "name": "hero-centered-strip",
        "instances": [
          ".image_wrapper_vk"
        ]
      },
      {
        "name": "cards-grid-callouts",
        "instances": [
          ".product-series-callouts"
        ]
      },
      {
        "name": "columns-text-first",
        "instances": [
          '.bc-rich-text > .row:has(> [class*="col-md-6"] .container-overlay-full-width)'
        ]
      },
      {
        "name": "accordion",
        "instances": [
          ".wrap-collabsible:not(.wrap-collabsible + .wrap-collabsible)"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Main content",
        "selector": [
          "#main > div.main-holder > div.container:nth-of-type(2)",
          "#main .main-holder"
        ],
        "style": null,
        "blocks": [
          "columns-jumplinks",
          "hero-centered-strip",
          "cards-grid-callouts",
          "columns-text-first",
          "accordion"
        ],
        "defaultContent": [
          "#content-holder > h1",
          "#content-holder > p",
          ".bc-rich-text > h3",
          ".bc-rich-text > p",
          ".bc-rich-text > ul",
          ".bc-rich-text > h2",
          ".bc-rich-text > ol",
          ".container-overlay-full-width > img"
        ]
      }
    ]
  };
  var parsers = {
    "columns-jumplinks": parse,
    "hero-centered-strip": parse2,
    "cards-grid-callouts": parse3,
    "columns-text-first": parse5,
    "accordion": parse6
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
  var import_resources_disease_research_default = {
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
      meta.template = "disease-research";
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
  return __toCommonJS(import_resources_disease_research_exports);
})();
