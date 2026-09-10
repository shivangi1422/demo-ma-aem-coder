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

  // tools/importer/import-diagnostics.js
  var import_diagnostics_exports = {};
  __export(import_diagnostics_exports, {
    default: () => import_diagnostics_default
  });

  // tools/importer/parsers/hero-blog.js
  function parse(element, { document: document2 }) {
    const image = element.querySelector('.card-image > img, .card-image img[alt]:not([alt=""]), .card-image img');
    const title = element.querySelector("h1.card-title, .card-title, h1");
    const readtime = element.querySelector(".card-readtime");
    const author = element.querySelector(".card-byline .card-author, .card-author");
    const date = element.querySelector(".card-byline .card-date, .card-date");
    const summary = element.querySelector(".card-summary");
    if (!title && !summary && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (image) {
      cells.push([[document2.createComment(" field:image "), image]]);
    }
    const textCell = [document2.createComment(" field:text ")];
    if (readtime && readtime.textContent.trim()) {
      const p = document2.createElement("p");
      p.textContent = readtime.textContent.trim();
      textCell.push(p);
    }
    if (title) textCell.push(title);
    if (author || date) {
      const parts = [];
      if (author) parts.push(author.textContent.trim());
      if (date) parts.push(date.textContent.trim());
      const joined = parts.filter(Boolean).join(" | ");
      if (joined) {
        const p = document2.createElement("p");
        p.textContent = joined;
        textCell.push(p);
      }
    }
    if (summary && summary.textContent.trim()) {
      const p = document2.createElement("p");
      p.textContent = summary.textContent.trim();
      textCell.push(p);
    }
    cells.push([textCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-blog", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/blog-tags.js
  function parse2(element, { document: document2 }) {
    let links = Array.from(element.querySelectorAll("a.blog-tag"));
    if (links.length === 0) {
      links = Array.from(element.querySelectorAll(".thirteen.wide.column a, .ui.column a")).filter((a) => !a.closest(".share-container") && !a.classList.contains("logo-padding"));
    }
    if (links.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cell = [document2.createComment(" field:text ")];
    links.forEach((a, i) => {
      if (i > 0) cell.push(document2.createTextNode(" "));
      cell.push(a);
    });
    const cells = [[cell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "blog-tags", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/author-bio.js
  function parse3(element, { document: document2 }) {
    const image = element.querySelector(".headshot img, .column-left img, img");
    const name = element.querySelector(".contributor-name");
    const bio = element.querySelector(".contributor-bio");
    const cta = element.querySelector(".contributor-link a, a.btn-cta, a.button");
    if (!image && !name && !bio) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (image) {
      cells.push([[document2.createComment(" field:image "), image]]);
    }
    const textCell = [document2.createComment(" field:text ")];
    if (name && name.textContent.trim()) {
      const h = document2.createElement("h3");
      h.textContent = name.textContent.trim();
      textCell.push(h);
    }
    if (bio && bio.textContent.trim()) {
      const p = document2.createElement("p");
      p.textContent = bio.textContent.trim();
      textCell.push(p);
    }
    if (cta) {
      const p = document2.createElement("p");
      p.appendChild(cta);
      textCell.push(p);
    }
    cells.push([textCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "author-bio", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-blog.js
  function parse4(element, { document: document2 }) {
    const cardEls = Array.from(element.querySelectorAll(".blog-card"));
    if (cardEls.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cardEls.forEach((card) => {
      const img = card.querySelector(".card-image img, img");
      const imageCell = [document2.createComment(" field:image ")];
      if (img) imageCell.push(img);
      const textCell = [document2.createComment(" field:text ")];
      const title = card.querySelector(".card-title, h2, h3");
      if (title && title.textContent.trim()) {
        const h = document2.createElement("h3");
        h.textContent = title.textContent.trim();
        textCell.push(h);
      }
      const author = card.querySelector(".card-author");
      const date = card.querySelector(".card-date");
      const readtime = card.querySelector(".card-readtime");
      const bylineParts = [];
      if (author) bylineParts.push(author.textContent.trim());
      if (date) bylineParts.push(date.textContent.trim());
      if (readtime) bylineParts.push(readtime.textContent.trim());
      const byline = bylineParts.filter(Boolean).join(" | ");
      if (byline) {
        const p = document2.createElement("p");
        p.textContent = byline;
        textCell.push(p);
      }
      const summary = card.querySelector(".card-summary");
      if (summary && summary.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = summary.textContent.trim();
        textCell.push(p);
      }
      const cta = card.querySelector(".card-link a, a.btn-cta, a.button");
      if (cta) {
        const p = document2.createElement("p");
        p.appendChild(cta);
        textCell.push(p);
      }
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-blog", cells });
    const subtitle = element.querySelector(".blog-post-subtitle h1, .blog-post-subtitle h2, .blog-post-subtitle h3, .blog-post-subtitle h4");
    const nodes = [];
    if (subtitle && subtitle.textContent.trim()) {
      const h = document2.createElement("h3");
      h.textContent = subtitle.textContent.trim();
      nodes.push(h);
    }
    nodes.push(block);
    element.replaceWith(...nodes);
  }

  // tools/importer/transformers/beckmancoulter-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".uw-sl",
        ".uwy",
        "#userwayLstIcon",
        "#userwayAccessibilityIcon",
        ".uw-s10-bottom-ruler-guide",
        ".uw-s10-right-ruler-guide",
        ".uw-s10-left-ruler-guide",
        ".uw-s10-reading-guide",
        ".uw-s12-tooltip",
        "#onetrust-consent-sdk"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".nav-container",
        "#universal-navigation",
        "#movetop",
        ".global-search",
        ".global-search-spacer",
        "#mobile-search-btn",
        ".footer-container",
        ".universal-footer",
        ".universal-footer-text",
        ".mob-footer-div"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "iframe",
        "link",
        "noscript",
        "script",
        "style"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("onclick");
        el.removeAttribute("data-uw-rm-skl");
        el.removeAttribute("data-uw-rm-autofix-hide");
      });
      element.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
        const text = h.textContent.trim();
        const hasMedia = h.querySelector("img, picture, svg");
        if ((!text || /^empty heading$/i.test(text)) && !hasMedia) {
          h.remove();
        }
      });
    }
  }

  // tools/importer/transformers/beckmancoulter-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function transform2(hookName, element, payload) {
    const sections = payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = element.querySelector(section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || element.querySelector(section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-diagnostics.js
  var parsers = {
    "hero-blog": parse,
    "blog-tags": parse2,
    "author-bio": parse3,
    "cards-blog": parse4
  };
  var PAGE_TEMPLATE = {
    name: "diagnostics",
    description: "Beckman Coulter diagnostics blog article page",
    urls: [
      "https://www.beckmancoulter.com/en/blog/diagnostics/the-value-of-mpv-in-hematology"
    ],
    blocks: [
      {
        name: "hero-blog",
        instances: ["#main-container > div.sublayout.ui.aligned.segment.grid:nth-of-type(1)"]
      },
      {
        name: "blog-tags",
        instances: ["#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.ui.grid.container.blog-post-tag-list"]
      },
      {
        name: "author-bio",
        instances: ["#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.contributor-detail.summary.sixteen.wide.column"]
      },
      {
        name: "cards-blog",
        instances: ["#main-container > div.sublayout.ui.aligned.segment.grid.light-gray"]
      }
    ],
    sections: [
      { id: "rc1", name: "Article Header", selector: "#main-container > div.sublayout.ui.aligned.segment.grid:nth-of-type(1)", style: null, blocks: ["hero-blog"], defaultContent: [] },
      { id: "rc2", name: "Article Body", selector: "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.lazyload.page-content.nested-padding.active", style: null, blocks: [], defaultContent: ["#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.lazyload.page-content.nested-padding.active"] },
      { id: "rc3", name: "References and Disclaimer", selector: "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.disclaimer-text.lazyload.active", style: null, blocks: [], defaultContent: ["#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.disclaimer-text.lazyload.active"] },
      { id: "rc4", name: "Blog Tags", selector: "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.ui.grid.container.blog-post-tag-list", style: null, blocks: ["blog-tags"], defaultContent: [] },
      { id: "rc5", name: "Author Bio", selector: "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.contributor-detail.summary.sixteen.wide.column", style: null, blocks: ["author-bio"], defaultContent: [] },
      { id: "rc6", name: "Related Articles", selector: "#main-container > div.sublayout.ui.aligned.segment.grid.light-gray", style: "light-gray", blocks: ["cards-blog"], defaultContent: [] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_diagnostics_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_diagnostics_exports);
})();
