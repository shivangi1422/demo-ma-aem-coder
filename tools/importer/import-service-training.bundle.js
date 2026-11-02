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

  // tools/importer/import-service-training.js
  var import_service_training_exports = {};
  __export(import_service_training_exports, {
    default: () => import_service_training_default
  });

  // tools/importer/parsers/hero-centered-left.js
  var cleanImageSrc = (src) => {
    if (!src || !/^https?:/i.test(src)) return src;
    try {
      const url = new URL(src);
      ["h", "w", "iar", "hash", "sc_lang"].forEach((p) => url.searchParams.delete(p));
      return url.toString();
    } catch (e) {
      return src;
    }
  };
  var norm = (s) => (s || "").replace(/[\s ]+/g, " ").trim();
  var ANCHOR_MAP = { "#courses": "#course-catalog" };
  function parse(element, { document: document2 }) {
    const bgImg = element.querySelector(".largebanner img") || element.querySelector(":scope > div:not(#innertext1) img");
    const inner = element.querySelector("#innertext1") || element;
    const titleImg = Array.from(inner.querySelectorAll("img")).find((img) => img !== bgImg && !img.closest(".largebanner, .smallbanner"));
    const ctas = Array.from(inner.querySelectorAll("a[href]")).map((a) => ({ href: a.getAttribute("href"), label: norm(a.textContent) })).filter((c) => c.label);
    const cells = [];
    const imageFrag = document2.createDocumentFragment();
    if (bgImg) {
      const img = document2.createElement("img");
      img.setAttribute("src", cleanImageSrc(bgImg.getAttribute("src")));
      img.setAttribute("alt", bgImg.getAttribute("alt") || "MyBeckman Learning training classroom");
      imageFrag.appendChild(document2.createComment(" field:image "));
      imageFrag.appendChild(img);
    }
    cells.push([imageFrag]);
    const textFrag = document2.createDocumentFragment();
    if (titleImg || ctas.length) textFrag.appendChild(document2.createComment(" field:text "));
    if (titleImg) {
      const p = document2.createElement("p");
      const img = document2.createElement("img");
      img.setAttribute("src", cleanImageSrc(titleImg.getAttribute("src")));
      img.setAttribute("alt", titleImg.getAttribute("alt") || "MyBeckman Learning - Knowledge Awaits");
      p.appendChild(img);
      textFrag.appendChild(p);
    }
    ctas.forEach(({ href, label }) => {
      const p = document2.createElement("p");
      const a = document2.createElement("a");
      a.setAttribute("href", ANCHOR_MAP[(href || "").toLowerCase()] || href);
      a.textContent = label;
      p.appendChild(a);
      textFrag.appendChild(p);
    });
    cells.push([textFrag]);
    const mobileImg = element.querySelector(".smallbanner img");
    const mobileFrag = document2.createDocumentFragment();
    if (mobileImg) {
      const img = document2.createElement("img");
      img.setAttribute("src", cleanImageSrc(mobileImg.getAttribute("src")));
      img.setAttribute("alt", mobileImg.getAttribute("alt") || "MyBeckman Learning training classroom");
      mobileFrag.appendChild(document2.createComment(" field:mobileImage "));
      mobileFrag.appendChild(img);
    }
    cells.push([mobileFrag]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "Hero Centered (left)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-grid-icon-left.js
  var cleanImageSrc2 = (src) => {
    if (!src || !/^https?:/i.test(src)) return src;
    try {
      const url = new URL(src);
      ["h", "w", "iar", "hash", "sc_lang"].forEach((p) => url.searchParams.delete(p));
      return url.toString();
    } catch (e) {
      return src;
    }
  };
  var norm2 = (s) => (s || "").replace(/\s+/g, " ").trim();
  var PARAGRAPH_BREAKS = ["For those courses that are VR-enabled"];
  var splitParagraphs = (text) => {
    let parts = [text];
    PARAGRAPH_BREAKS.forEach((marker) => {
      parts = parts.flatMap((part) => {
        const i = part.indexOf(marker);
        if (i <= 0) return [part];
        return [part.slice(0, i).trim(), part.slice(i).trim()];
      });
    });
    return parts.filter(Boolean);
  };
  function parse2(element, { document: document2 }) {
    const iconCols = Array.from(element.querySelectorAll(":scope > .col-md-1"));
    const textCols = Array.from(element.querySelectorAll(":scope > .col-md-5"));
    const cells = [];
    cells.push([""]);
    const count = Math.max(iconCols.length, textCols.length);
    for (let i = 0; i < count; i += 1) {
      const iconCol = iconCols[i];
      const textCol = textCols[i];
      const img = iconCol ? iconCol.querySelector("img") : null;
      let title = "";
      const descParts = [];
      const ctas = [];
      if (textCol) {
        const strong = textCol.querySelector("strong, b");
        title = norm2(strong && strong.textContent);
        textCol.querySelectorAll("a[href]").forEach((a) => {
          const label = norm2(a.textContent);
          if (label) ctas.push({ href: a.getAttribute("href"), label });
        });
        const clone = textCol.cloneNode(true);
        clone.querySelectorAll("strong, b, a, button, p.pcenter").forEach((el) => el.remove());
        const desc = norm2(clone.textContent);
        if (desc) descParts.push(...splitParagraphs(desc));
      }
      const imageFrag = document2.createDocumentFragment();
      if (img) {
        const newImg = document2.createElement("img");
        newImg.setAttribute("src", cleanImageSrc2(img.getAttribute("src")));
        newImg.setAttribute("alt", img.getAttribute("alt") || title);
        imageFrag.appendChild(document2.createComment(" field:image "));
        imageFrag.appendChild(newImg);
      }
      const textFrag = document2.createDocumentFragment();
      if (title || descParts.length || ctas.length) {
        textFrag.appendChild(document2.createComment(" field:text "));
      }
      if (title) {
        const p = document2.createElement("p");
        const strong = document2.createElement("strong");
        strong.textContent = title;
        p.appendChild(strong);
        textFrag.appendChild(p);
      }
      descParts.forEach((d) => {
        const p = document2.createElement("p");
        p.textContent = d;
        textFrag.appendChild(p);
      });
      ctas.forEach(({ href, label }) => {
        const p = document2.createElement("p");
        const a = document2.createElement("a");
        a.setAttribute("href", href);
        a.textContent = label;
        p.appendChild(a);
        textFrag.appendChild(p);
      });
      cells.push([imageFrag, textFrag]);
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Cards Grid (icon-left)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-grid-buttons.js
  var cleanImageSrc3 = (src) => {
    if (!src || !/^https?:/i.test(src)) return src;
    try {
      const url = new URL(src);
      ["h", "w", "iar", "hash", "sc_lang"].forEach((p) => url.searchParams.delete(p));
      return url.toString();
    } catch (e) {
      return src;
    }
  };
  var norm3 = (s) => (s || "").replace(/[\s ]+/g, " ").trim();
  function parse3(element, { document: document2 }) {
    const links = Array.from(element.querySelectorAll(":scope > a[href]"));
    const allImgs = Array.from(element.querySelectorAll("img"));
    const allButtons = Array.from(element.querySelectorAll("button"));
    const cells = [];
    cells.push([""]);
    links.forEach((link, i) => {
      const img = link.querySelector("img") || allImgs[i] || null;
      let label = norm3(link.textContent);
      if (!label && allButtons[i]) label = norm3(allButtons[i].textContent);
      const href = link.getAttribute("href");
      const imageFrag = document2.createDocumentFragment();
      if (img) {
        const newImg = document2.createElement("img");
        newImg.setAttribute("src", cleanImageSrc3(img.getAttribute("src")));
        newImg.setAttribute("alt", img.getAttribute("alt") || label);
        imageFrag.appendChild(document2.createComment(" field:image "));
        imageFrag.appendChild(newImg);
      }
      const textFrag = document2.createDocumentFragment();
      if (label) {
        textFrag.appendChild(document2.createComment(" field:text "));
        const p = document2.createElement("p");
        const a = document2.createElement("a");
        a.setAttribute("href", href);
        a.textContent = label;
        p.appendChild(a);
        textFrag.appendChild(p);
      }
      cells.push([imageFrag, textFrag]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "Cards Grid (buttons)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/marketo-form.js
  function parse4(element, { document: document2 }) {
    const origin = element.getAttribute("data-excat-mkto-origin");
    const munchkin = element.getAttribute("data-excat-mkto-munchkin");
    const formId = element.getAttribute("data-excat-mkto-form");
    if (!origin || !munchkin || !formId) return;
    const url = `${origin.replace(/\/+$/, "")}/index.php/form/getForm?munchkinId=${munchkin}&form=${formId}`;
    const frag = document2.createDocumentFragment();
    frag.appendChild(document2.createComment(" field:form "));
    const a = document2.createElement("a");
    a.setAttribute("href", url);
    a.textContent = url;
    frag.appendChild(a);
    const cells = [[frag]];
    const name = element.classList.contains("marketo-two-column") ? "Marketo Form (two-column)" : "Marketo Form";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
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

  // tools/importer/import-service-training.js
  var PAGE_TEMPLATE = {
    "name": "service-training",
    "urls": [
      "https://www.mybeckman.in/service/training"
    ],
    "representativeUrl": "https://www.mybeckman.in/service/training",
    "description": "Training page: breadcrumb, MyBeckman Learning hero with images, Learn Your Way list, training method image/text sections with Sign Up CTAs, course catalog links, Knowledge Awaits callout, legal note",
    "urlPattern": "/service/training",
    "blocks": [
      {
        "name": "hero-centered-left",
        "instances": [
          ".bc-rich-text > .outimg",
          ".outimg"
        ]
      },
      {
        "name": "cards-grid-icon-left",
        "instances": [
          ".containercustom > .row:has(> .col-md-1 img)"
        ]
      },
      {
        "name": "cards-grid-buttons",
        "instances": [
          ".containercustom > .menu"
        ]
      },
      {
        "name": "marketo-form",
        "instances": [
          "#main .formassembly-container"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "MyBeckman Learning hero",
        "selector": [
          ".bc-rich-text:has(> .outimg)"
        ],
        "style": null,
        "blocks": [
          "hero-centered-left"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "Intro, training methods and Course Catalog",
        "selector": [
          ".bc-rich-text:has(> .containercustom > h1)"
        ],
        "style": null,
        "blocks": [
          "cards-grid-icon-left",
          "cards-grid-buttons"
        ],
        "defaultContent": [
          ".containercustom > h1",
          ".containercustom > p",
          ".containercustom > h2",
          ".containercustom > ul"
        ]
      },
      {
        "id": "section-3",
        "name": "Knowledge Awaits",
        "selector": [
          ".bc-rich-text > div:has(> .containercustom > h3)"
        ],
        "style": "grey, centered",
        "blocks": [
          "marketo-form"
        ],
        "defaultContent": [
          ".containercustom > h3",
          ".containercustom > h3 + p"
        ]
      },
      {
        "id": "section-4",
        "name": "Legal note",
        "selector": [
          ".bc-rich-text > div:has(> .containercustom > p > em)"
        ],
        "style": "grey",
        "blocks": [],
        "defaultContent": [
          ".containercustom > p:has(> em)"
        ]
      }
    ]
  };
  var parsers = {
    "hero-centered-left": parse,
    "cards-grid-icon-left": parse2,
    "cards-grid-buttons": parse3,
    "marketo-form": parse4
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
  var import_service_training_default = {
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
      meta.template = "service-training";
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
  return __toCommonJS(import_service_training_exports);
})();
