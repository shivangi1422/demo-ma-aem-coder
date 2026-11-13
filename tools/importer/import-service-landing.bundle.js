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

  // tools/importer/import-service-landing.js
  var import_service_landing_exports = {};
  __export(import_service_landing_exports, {
    default: () => import_service_landing_default
  });

  // tools/importer/parsers/hero-centered.js
  function isTall(document2, ctx) {
    const css = Array.from(document2.querySelectorAll("style")).map((s) => s.textContent || "").join("\n").replace(/\/\*[\s\S]*?\*\//g, "");
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let found = false;
    let tall = false;
    let m;
    while (m = re.exec(css)) {
      const selectors = m[1].split(",").map((x) => x.replace(/\s+/g, " ").trim().toLowerCase());
      if (selectors.includes(".hero")) {
        found = true;
        if (/min-height\s*:\s*450px\b/i.test(m[2])) tall = true;
      }
    }
    if (found) return tall;
    const params = ctx && ctx.params || {};
    const url = String(params.originalURL || ctx && ctx.url || "");
    return /\/service\/plans\/(?:flow-cytometry|particle-analysis)(?:[/?#.]|$)/i.test(url);
  }
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
    const name = isTall(document2, arguments[1]) ? "Hero Centered (tall)" : "hero-centered";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
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
      removeAll(element, ['a[name="Courses"]:not([href])']);
      element.querySelectorAll("#content-holder > br").forEach((br) => br.remove());
      element.querySelectorAll("#content-holder .bcls-aeo-published").forEach((el) => {
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

  // tools/importer/import-service-landing.js
  var PAGE_TEMPLATE = {
    name: "service-landing",
    urls: [
      "https://www.mybeckman.in/service"
    ],
    representativeUrl: "https://www.mybeckman.in/service",
    description: "Service landing page: photo hero, blue stats band, service offering cards and a blue Get in Touch contact band",
    urlPattern: "/service",
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
  var import_service_landing_default = {
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
      meta.template = "service-landing";
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
  return __toCommonJS(import_service_landing_exports);
})();
