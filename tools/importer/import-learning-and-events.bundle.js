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

  // tools/importer/import-learning-and-events.js
  var import_learning_and_events_exports = {};
  __export(import_learning_and_events_exports, {
    default: () => import_learning_and_events_default
  });

  // tools/importer/parsers/cards-media-list.js
  var clean = (str) => (str || "").replace(/\s+/g, " ").trim();
  var isUsableHref = (href) => !!href && href.trim() !== "" && href.trim() !== "#";
  var isVideoHref = (href) => /vidyard\.com|youtube\.com|youtu\.be|vimeo\.com/i.test(href || "");
  function parse(element, { document }) {
    const rows = element.matches("div.media-showcase-simple") ? [element] : [...element.querySelectorAll(":scope > div.media-showcase-simple")];
    const items = rows.length ? rows : [...element.querySelectorAll("div.media-showcase-simple")];
    const cells = [];
    items.forEach((row) => {
      const imageWrap = row.querySelector(".content-container > .image, .image");
      const content = row.querySelector(".content-container > .content, .content");
      const titleHeading = content ? content.querySelector("h1, h2, h3, h4, h5, h6") : null;
      const titleLink = titleHeading ? titleHeading.closest("a") : null;
      const ctaLink = content ? content.querySelector("a.btn-cta, a.ui.button") : null;
      const imageLink = imageWrap ? imageWrap.querySelector("a.media-link-image, a[href]") : null;
      const linkCandidates = [titleLink, ctaLink, imageLink].filter(Boolean);
      const primaryHref = linkCandidates.map((a) => a.getAttribute("href")).find(isUsableHref) || "";
      const isVideo = !!row.querySelector(".type-video, .vidyard-player-container, img.vidyard-lightbox-image") || isVideoHref(primaryHref);
      const mediaCell = [];
      let srcImg = imageWrap ? imageWrap.querySelector("img.vidyard-lightbox-image, img") : null;
      if (!srcImg) srcImg = row.querySelector("img");
      let img = null;
      if (srcImg && srcImg.getAttribute("src")) {
        img = document.createElement("img");
        img.src = srcImg.getAttribute("src");
        img.alt = srcImg.getAttribute("alt") || "";
      } else if (isVideo && /vidyard\.com\/([^/?#.]+)/i.test(primaryHref)) {
        const id = primaryHref.match(/vidyard\.com\/([^/?#.]+)/i)[1];
        img = document.createElement("img");
        img.src = `https://play.vidyard.com/${id}.jpg`;
        img.alt = clean(titleHeading ? titleHeading.textContent : "");
      }
      if (img) {
        mediaCell.push(document.createComment(" field:media_image "));
        mediaCell.push(img);
      }
      if (isVideo && isUsableHref(primaryHref)) {
        const videoLink = document.createElement("a");
        videoLink.href = primaryHref;
        videoLink.textContent = primaryHref;
        mediaCell.push(document.createComment(" field:media_link "));
        mediaCell.push(videoLink);
      }
      const textCell = [];
      const badgeEl = row.querySelector(".card-tag:not(.hide) span, .card-tag span");
      const badgeText = clean(badgeEl ? badgeEl.textContent : "");
      if (badgeText) {
        const p = document.createElement("p");
        p.textContent = badgeText;
        textCell.push(p);
      }
      let titleText = "";
      if (titleHeading) {
        const label = titleHeading.querySelector(".label");
        const eyebrowText = clean(label ? label.textContent : "");
        if (eyebrowText) {
          const p = document.createElement("p");
          p.textContent = eyebrowText;
          textCell.push(p);
        }
        const headingClone = titleHeading.cloneNode(true);
        headingClone.querySelectorAll(".label").forEach((l) => l.remove());
        titleText = clean(headingClone.textContent);
      }
      if (titleText) {
        const h3 = document.createElement("h3");
        const titleHref = titleLink ? titleLink.getAttribute("href") : "";
        if (isUsableHref(titleHref)) {
          const a = document.createElement("a");
          a.href = titleHref;
          a.textContent = titleText;
          h3.append(a);
        } else {
          h3.textContent = titleText;
        }
        textCell.push(h3);
      }
      if (content) {
        content.querySelectorAll("p, blockquote").forEach((el) => {
          if (el.closest("a")) return;
          if (el.tagName === "P" && el.closest("blockquote")) return;
          if (!clean(el.textContent)) return;
          if (el.tagName === "BLOCKQUOTE") {
            const bq = document.createElement("blockquote");
            bq.innerHTML = el.innerHTML;
            textCell.push(bq);
            return;
          }
          const p = document.createElement("p");
          const onlyChild = el.children.length === 1 && el.firstElementChild.tagName === "SPAN" && clean(el.textContent) === clean(el.firstElementChild.textContent);
          p.innerHTML = (onlyChild ? el.firstElementChild.innerHTML : el.innerHTML).trim();
          p.querySelectorAll('a[href="#"], a:not([href])').forEach((a) => {
            a.replaceWith(document.createTextNode(a.textContent));
          });
          p.querySelectorAll("em, i, strong, b").forEach((el2) => {
            const prev = el2.previousSibling;
            const next = el2.nextSibling;
            const prevWord = prev && prev.nodeType === 3 && /\w$/.test(prev.textContent);
            const nextWord = next && next.nodeType === 3 && /^\w/.test(next.textContent);
            if (prevWord || nextWord) el2.replaceWith(document.createTextNode(el2.textContent));
          });
          p.normalize();
          textCell.push(p);
        });
      }
      if (ctaLink) {
        const ctaText = clean(ctaLink.textContent);
        const ctaHref = ctaLink.getAttribute("href");
        if (ctaText) {
          const p = document.createElement("p");
          if (isUsableHref(ctaHref)) {
            const a = document.createElement("a");
            a.href = ctaHref;
            a.textContent = ctaText;
            if (ctaLink.getAttribute("title")) a.title = ctaLink.getAttribute("title");
            p.append(a);
          } else {
            p.textContent = ctaText;
          }
          textCell.push(p);
        }
      }
      if (textCell.length) textCell.unshift(document.createComment(" field:text "));
      cells.push([mediaCell.length ? mediaCell : "", textCell.length ? textCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-media-list", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/beckmancoulter-cleanup.js
  var CHROME_SELECTORS = [
    // accessibility widget (UserWay)
    ".uw-sl",
    ".uwy",
    '[class*="userway"]',
    '[class^="uw-s"]',
    // header / navigation / search
    "header",
    "nav",
    ".nav-container",
    "#universal-navigation",
    "#mobile-universal-nav",
    "#dx-navigation",
    ".primary-navigation",
    ".mobile-subnav-header",
    "#mobile-language-select-btn",
    ".global-search-spacer",
    ".coveo-global-search",
    // modals
    ".country-language-modal",
    ".country-language-selector",
    ".gigya-prefs-modal",
    "#gigya-prefs-modal",
    // breadcrumb + share bar
    ".photo-header-container",
    ".breadcrumb-container",
    ".breadcrumbs",
    ".share-container",
    // footer
    "footer",
    ".footer-container",
    ".universal-footer",
    ".universal-footer-text",
    // cookie banner / feedback widgets
    "#onetrust-consent-sdk",
    ".onetrust-pc-dark-filter",
    ".kampyle_button",
    // spacers
    ".line-break"
  ];
  function safeQueryAll(root, selector) {
    try {
      return [...root.querySelectorAll(selector)];
    } catch (e) {
      return [];
    }
  }
  function removeChrome(element) {
    const main = element.querySelector("#main-container");
    CHROME_SELECTORS.forEach((sel) => {
      safeQueryAll(element, sel).forEach((el) => {
        if (!el.isConnected) return;
        if (main && el !== main && el.contains(main)) return;
        if (el === main) return;
        el.remove();
      });
    });
    safeQueryAll(element, ".ui.modal").forEach((el) => {
      if (/Choose your country\/region and language/i.test(el.textContent || "")) {
        el.remove();
      }
    });
  }
  function unwrapSubHeaders(element) {
    safeQueryAll(element, "h2").forEach((h2) => {
      const sub = h2.querySelector(":scope > span.sub-header");
      if (!sub) return;
      const idEl = sub.querySelector("[id]");
      const text = (sub.textContent || "").replace(/\s+/g, " ").trim();
      if (idEl && idEl.id && !h2.id) h2.id = idEl.id;
      h2.textContent = text;
    });
  }
  function convertButtonTables(element) {
    const { document } = element.ownerDocument ? { document: element.ownerDocument } : { document };
    safeQueryAll(element, "table").forEach((table) => {
      const links = [...table.querySelectorAll("a")];
      if (!links.length) return;
      const text = (table.textContent || "").replace(/\s+/g, "");
      const linkText = links.map((a) => (a.textContent || "").replace(/\s+/g, "")).join("");
      if (text !== linkText) return;
      const paragraphs = links.map((a) => {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        const link = document.createElement("a");
        link.href = a.getAttribute("href");
        link.textContent = (a.textContent || "").trim();
        strong.append(link);
        p.append(strong);
        return p;
      });
      table.replaceWith(...paragraphs);
    });
  }
  function rewriteHeadingAnchors(element) {
    const slug = (text) => (text || "").toLowerCase().replace(/[^0-9a-z]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    safeQueryAll(element, 'a[href^="#"]').forEach((a) => {
      const id = a.getAttribute("href").slice(1);
      if (!id) return;
      const heading = safeQueryAll(element, "h1, h2, h3, h4, h5, h6").find((h) => h.id === id);
      if (heading) a.setAttribute("href", `#${slug(heading.textContent)}`);
    });
  }
  function groupMediaShowcases(element) {
    const { document } = element.ownerDocument ? { document: element.ownerDocument } : { document };
    const rows = safeQueryAll(element, "div.media-showcase-simple");
    const handled = /* @__PURE__ */ new Set();
    rows.forEach((row) => {
      if (handled.has(row)) return;
      if (row.parentElement && row.parentElement.classList.contains("media-showcase-group")) {
        handled.add(row);
        return;
      }
      const run = [row];
      handled.add(row);
      let next = row.nextElementSibling;
      while (next && next.matches("div.media-showcase-simple")) {
        run.push(next);
        handled.add(next);
        next = next.nextElementSibling;
      }
      const group = document.createElement("div");
      group.className = "media-showcase-group";
      row.before(group);
      run.forEach((r) => group.append(r));
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      removeChrome(element);
      unwrapSubHeaders(element);
      convertButtonTables(element);
      rewriteHeadingAnchors(element);
      groupMediaShowcases(element);
    }
    if (hookName === "afterTransform") {
      WebImporter.DOMUtils.remove(element, [
        "script",
        "noscript",
        "style",
        "link",
        "iframe",
        "input",
        "form",
        "button",
        ".uw-sl",
        ".uwy",
        "#onetrust-consent-sdk",
        ".kampyle_button",
        ".line-break"
      ]);
      safeQueryAll(element, "*").forEach((el) => {
        [...el.attributes].forEach(({ name }) => {
          if (name.startsWith("data-gtm") || name.startsWith("data-uw") || name.startsWith("data-track") || name === "onclick") {
            el.removeAttribute(name);
          }
        });
      });
    }
  }

  // tools/importer/transformers/beckmancoulter-sections.js
  var MARKER_ATTR = "data-excat-section-id";
  function norm(text) {
    return (text || "").replace(/\s+/g, " ").trim().toLowerCase();
  }
  function safeQuery(root, selector) {
    try {
      return root.querySelector(selector);
    } catch (e) {
      return null;
    }
  }
  function headingMatches(el, name) {
    if (!el || !name) return false;
    const h = el.matches("h1, h2, h3, h4, h5, h6") ? el : el.querySelector("h1, h2, h3, h4, h5, h6");
    if (!h) return false;
    return norm(h.textContent).startsWith(norm(name));
  }
  function findByHeading(element, name) {
    const headings = [...element.querySelectorAll("h1, h2, h3, h4, h5, h6")];
    const h = headings.find((hd) => norm(hd.textContent).startsWith(norm(name)));
    if (!h) return null;
    return h.closest("div.page-content") || h;
  }
  function findSectionElement(element, section, index) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      const el = safeQuery(element, sel);
      if (!el) continue;
      if (index === 0 || headingMatches(el, section.name)) return el;
    }
    if (index === 0) {
      const intro = element.querySelector(".intro-content");
      return intro ? intro.closest("div.sublayout") || intro : null;
    }
    return findByHeading(element, section.name);
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = findSectionElement(element, section, i);
        if (!el) continue;
        if (i === 0) {
          if (section.style) {
            const hr2 = document.createElement("hr");
            hr2.setAttribute(MARKER_ATTR, section.id);
            el.before(hr2);
          }
          continue;
        }
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(MARKER_ATTR, section.id);
        el.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const marker = element.querySelector(`hr[${MARKER_ATTR}="${section.id}"]`);
        if (!section.style) {
          if (marker) marker.removeAttribute(MARKER_ATTR);
          continue;
        }
        const metadata = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        let anchor = marker;
        if (!anchor) {
          const el = findSectionElement(element, section, i);
          if (!el) continue;
          anchor = el;
        }
        let end = anchor.nextElementSibling;
        while (end && end.tagName !== "HR") end = end.nextElementSibling;
        if (end) end.before(metadata);
        else anchor.parentElement.append(metadata);
        if (marker) {
          if (i === 0) marker.remove();
          else marker.removeAttribute(MARKER_ATTR);
        }
      }
    }
  }

  // tools/importer/import-learning-and-events.js
  var PAGE_TEMPLATE = {
    "name": "learning-and-events",
    "urls": [
      "https://www.beckmancoulter.com/en/learning-and-events/case-studies"
    ],
    "representativeUrl": "https://www.beckmancoulter.com/en/learning-and-events/case-studies",
    "description": "Learning & events listing pages: intro with anchor jump buttons, then category headings each followed by a vertical list of media-showcase rows (case studies, videos, posters, webinars).",
    "blocks": [
      {
        "name": "cards-media-list",
        "instances": [
          "div.media-showcase-group"
        ]
      }
    ],
    "urlPattern": "/en/learning-and-events/*",
    "sections": [
      {
        "id": "intro",
        "name": "Page intro",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(1)",
          "div.sublayout.ui.one.column.stackable.grid.container:first-of-type"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          ".intro-content h1",
          ".intro-content .content-container",
          "table a.ui.button"
        ]
      },
      {
        "id": "high-volume",
        "name": "High-volume Hospital Laboratory",
        "selector": [
          "div.page-content:has(#High)",
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(2) > div.lazyload.page-content.nested-padding:nth-of-type(2)"
        ],
        "style": "divider",
        "blocks": [
          "cards-media-list"
        ],
        "defaultContent": [
          "div.page-content:has(#High) h2"
        ]
      },
      {
        "id": "mid-volume",
        "name": "Mid-volume Hospital Laboratory",
        "selector": [
          "div.page-content:has(#Mid)",
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(2) > div.lazyload.page-content.nested-padding:nth-of-type(9)"
        ],
        "style": "divider",
        "blocks": [
          "cards-media-list"
        ],
        "defaultContent": [
          "div.page-content:has(#Mid) h2"
        ]
      },
      {
        "id": "small-volume",
        "name": "Small-volume Physician Office or Small Hospital Laboratory",
        "selector": [
          "div.page-content:has(#Low)",
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(2) > div.lazyload.page-content.nested-padding:nth-of-type(17)"
        ],
        "style": "divider",
        "blocks": [],
        "defaultContent": [
          "div.page-content:has(#Low) h2"
        ]
      },
      {
        "id": "reference-lab",
        "name": "Reference Laboratory",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(2) > div.lazyload.page-content.nested-padding:nth-of-type(19)"
        ],
        "style": "divider",
        "blocks": [
          "cards-media-list"
        ],
        "defaultContent": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(2) > div.lazyload.page-content.nested-padding:nth-of-type(19) h2"
        ]
      },
      {
        "id": "other-labs",
        "name": "Other Clinical Diagnostics Laboratories",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(2) > div.lazyload.page-content.nested-padding:nth-of-type(24)"
        ],
        "style": "divider",
        "blocks": [
          "cards-media-list"
        ],
        "defaultContent": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(2) > div.lazyload.page-content.nested-padding:nth-of-type(24) h2"
        ]
      }
    ]
  };
  var parsers = {
    "cards-media-list": parse
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
  var import_learning_and_events_default = {
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
  return __toCommonJS(import_learning_and_events_exports);
})();
