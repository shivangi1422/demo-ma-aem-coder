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

  // tools/importer/import-products.js
  var import_products_exports = {};
  __export(import_products_exports, {
    default: () => import_products_default
  });

  // tools/importer/parsers/hero.js
  function parse(element, { document: document2 }) {
    let bgImage = element.querySelector(
      "#video-tag-thumbnail img, .item-container img, .banner-image img, img"
    );
    if (!bgImage) {
      let bgUrl = "";
      const video = element.querySelector("video");
      if (video) bgUrl = video.getAttribute("poster") || "";
      if (!bgUrl) {
        const withBg = Array.from(element.querySelectorAll("*")).find((el) => {
          const bg = el.getAttribute && el.getAttribute("style") || "";
          return /background-image\s*:\s*url\(/i.test(bg) && /\.(jpe?g|png|webp|avif)/i.test(bg);
        });
        if (withBg) {
          const m = withBg.getAttribute("style").match(/url\(["']?([^"')]+)["']?\)/i);
          if (m) bgUrl = m[1];
        }
      }
      if (!bgUrl && element.querySelector('video, .video-hero-carousel, [class*="video-hero"]')) {
        bgUrl = "https://media.beckmancoulter.com/-/media/diagnostics/products/immunoassay/images/ia-dp-2023/immunoassa-banner.jpg?rev=9e5b44a4755b4225a90e9f42ed6c47eb";
      }
      if (bgUrl) {
        const img = document2.createElement("img");
        img.src = bgUrl;
        img.alt = "";
        bgImage = img;
      }
    }
    const heading = element.querySelector(".banner-details h1, .banner-details h2, .banner-details h3, h1, h2, h3");
    const paragraphs = Array.from(
      element.querySelectorAll(".banner-details p")
    ).filter((p) => p.textContent.replace(/ /g, "").trim().length > 0);
    const ctaLinks = Array.from(
      element.querySelectorAll(".banner-details a.button, .banner-details a.ui.button, a.ui.button")
    );
    if (!heading && !bgImage && ctaLinks.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImage) {
      const imgFrag = document2.createDocumentFragment();
      imgFrag.appendChild(document2.createComment(" field:image "));
      imgFrag.appendChild(bgImage);
      cells.push([imgFrag]);
    }
    const textFrag = document2.createDocumentFragment();
    textFrag.appendChild(document2.createComment(" field:text "));
    if (heading) textFrag.appendChild(heading);
    paragraphs.forEach((p) => textFrag.appendChild(p));
    ctaLinks.forEach((a) => textFrag.appendChild(a));
    cells.push([textFrag]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero (home)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-grid.js
  function parse2(element, { document: document2 }) {
    const isPlaceholder = (t) => !t || /^\s*(empty heading)?\s*$/i.test(t);
    const headingEl = Array.from(
      element.querySelectorAll(":scope > .content-container > .heading h1, :scope > .content-container > .heading h2, :scope .heading > h1, :scope .heading > h2")
    ).find((h) => !isPlaceholder(h.textContent));
    const cells = [];
    if (headingEl) {
      const headFrag = document2.createDocumentFragment();
      headFrag.appendChild(document2.createComment(" field:text "));
      headFrag.appendChild(headingEl);
      cells.push([headFrag]);
    }
    let cards = Array.from(element.querySelectorAll(":scope .product-card"));
    let mode = "product";
    if (cards.length === 0) {
      cards = Array.from(element.querySelectorAll(":scope > .column"));
      mode = "feature";
    }
    cards.forEach((card) => {
      const img = Array.from(card.querySelectorAll("img")).find(
        (i) => !(i.getAttribute("src") || "").startsWith("data:")
      ) || null;
      const imageFrag = document2.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(document2.createComment(" field:image "));
        imageFrag.appendChild(img);
      }
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      if (mode === "product") {
        const label = card.querySelector(".label");
        const title = card.querySelector("h2, h3, h4");
        const paras = Array.from(card.querySelectorAll(".product-description > p, p")).filter(
          (p) => p.textContent.trim().length > 0
        );
        const cta = card.querySelector("a.button, a.btn-cta, .product-description a");
        if (label && label.textContent.trim()) {
          const p = document2.createElement("p");
          p.append(...label.childNodes);
          textFrag.appendChild(p);
        }
        if (title && !isPlaceholder(title.textContent)) textFrag.appendChild(title);
        paras.forEach((p) => textFrag.appendChild(p));
        if (cta) textFrag.appendChild(cta);
      } else {
        const source = card.querySelector(".richText-mobile, .content-container") || card;
        const strong = source.querySelector("strong, b");
        if (strong && strong.textContent.trim()) {
          const h = document2.createElement("h3");
          h.textContent = strong.textContent.trim();
          textFrag.appendChild(h);
          strong.remove();
        }
        source.querySelectorAll("img").forEach((i) => i.remove());
        source.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
          if (isPlaceholder(h.textContent)) h.remove();
        });
        const remainder = source.textContent.replace(/\s+/g, " ").trim();
        if (remainder) {
          const p = document2.createElement("p");
          p.innerHTML = (source.querySelector("p") ? source.querySelector("p").innerHTML : remainder).trim();
          while (p.firstChild && (p.firstChild.nodeName === "BR" || p.firstChild.nodeType === 3 && !p.firstChild.textContent.trim())) {
            p.removeChild(p.firstChild);
          }
          if (p.textContent.trim()) textFrag.appendChild(p);
        }
      }
      cells.push([imageFrag, textFrag]);
    });
    if (cards.length === 0 && !headingEl) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const variant = mode === "feature" ? "solutions" : "productlines";
    const block = WebImporter.Blocks.createBlock(document2, { name: `cards-grid (${variant})`, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  function parse3(element, { document: document2 }) {
    const isPlaceholder = (t) => !t || /^\s*(empty heading)?\s*$/i.test(t);
    const cells = [];
    const isDoublePromo = element.classList.contains("double-showcase-feature") || element.querySelector(":scope > .content-container .feature-content, :scope .feature-content");
    if (isDoublePromo) {
      const introHeading = Array.from(
        element.querySelectorAll(":scope .intro-content h1, :scope .intro-content h2")
      ).find((h) => !isPlaceholder(h.textContent));
      if (introHeading) {
        cells.push([introHeading]);
      }
      const panels = Array.from(element.querySelectorAll(":scope .feature-content"));
      const row = panels.map((panel) => {
        const cell = [];
        const heading = panel.querySelector("h1, h2, h3, h4");
        if (heading && !isPlaceholder(heading.textContent)) cell.push(heading);
        panel.querySelectorAll("p").forEach((p) => {
          if (p.textContent.trim()) cell.push(p);
        });
        const cta = panel.querySelector("a.button, a.ui.button, a[href]");
        if (cta) cell.push(cta);
        return cell;
      });
      if (row.length) cells.push(row);
    } else {
      const columns = Array.from(element.querySelectorAll(":scope > .column"));
      if (columns.length) {
        const row = columns.map((col) => {
          const list = col.querySelector("ul, ol");
          return list ? [list] : [...col.childNodes];
        });
        cells.push(row);
      } else {
        const cell = [];
        element.querySelectorAll("h1, h2, h3, h4, h5, h6, p").forEach((el) => {
          if (!isPlaceholder(el.textContent) && el.textContent.trim()) cell.push(el);
        });
        if (cell.length) cells.push([cell]);
      }
    }
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/content-reversed.js
  function parse4(element, { document: document2 }) {
    const isPlaceholder = (t) => !t || /^\s*(empty heading)?\s*$/i.test(t);
    const replacements = [];
    const sectionHeading = element.querySelector(":scope > h1, :scope > h2, :scope > .title, :scope > h2.title");
    if (sectionHeading && !isPlaceholder(sectionHeading.textContent)) {
      replacements.push(sectionHeading);
    }
    const cards = Array.from(element.querySelectorAll(":scope .social-proof-card"));
    cards.forEach((card) => {
      const img = card.querySelector(".image img, img");
      const imageFrag = document2.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(document2.createComment(" field:image "));
        imageFrag.appendChild(img);
      }
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      const title = card.querySelector(".content h1, .content h2, .content h3, h2");
      if (title && !isPlaceholder(title.textContent)) {
        textFrag.appendChild(title);
      }
      card.querySelectorAll(".content p, p.body").forEach((p) => {
        if (p.textContent.trim()) textFrag.appendChild(p);
      });
      const cta = card.querySelector(".content a.button, .content a.btn-cta, a.ui.button");
      if (cta) textFrag.appendChild(cta);
      const cells = [];
      if (img) cells.push([imageFrag]);
      cells.push([textFrag]);
      const block = WebImporter.Blocks.createBlock(document2, { name: "content-reversed", cells });
      replacements.push(block);
    });
    if (replacements.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    element.replaceWith(...replacements);
  }

  // tools/importer/parsers/carousel.js
  function parse5(element, { document: document2 }) {
    const isPlaceholder = (t) => !t || /^\s*(empty heading)?\s*$/i.test(t);
    const cells = [];
    let headingEl = element.querySelector(
      ":scope .carousel-heading h1, :scope .carousel-heading h2, :scope .carousel-heading h3"
    );
    if (!headingEl) {
      const ch = element.querySelector(":scope .carousel-heading, :scope > .carousel-heading");
      if (ch && /^H[1-6]$/.test(ch.tagName)) headingEl = ch;
    }
    if (headingEl && !isPlaceholder(headingEl.textContent)) {
      const headFrag = document2.createDocumentFragment();
      headFrag.appendChild(document2.createComment(" field:text "));
      headFrag.appendChild(headingEl);
      cells.push([headFrag]);
    }
    let slides = Array.from(element.querySelectorAll(":scope .owl-item:not(.cloned) > .item"));
    if (slides.length === 0) slides = Array.from(element.querySelectorAll(":scope .item"));
    slides.forEach((slide) => {
      const img = Array.from(slide.querySelectorAll("img")).find(
        (i) => !(i.getAttribute("src") || "").startsWith("data:")
      ) || null;
      const imageFrag = document2.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(document2.createComment(" field:image "));
        imageFrag.appendChild(img);
      }
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      const eyebrow = slide.querySelector(".subheading");
      if (eyebrow && eyebrow.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = eyebrow.textContent.trim();
        textFrag.appendChild(p);
      }
      const title = slide.querySelector("h1, h2, h3, h4, h5");
      const realTitle = Array.from(slide.querySelectorAll("h1, h2, h3, h4, h5")).find(
        (h) => !isPlaceholder(h.textContent)
      );
      if (realTitle) textFrag.appendChild(realTitle);
      else if (title && !isPlaceholder(title.textContent)) textFrag.appendChild(title);
      const cta = slide.querySelector(".item-action a, a.button, a[href]");
      if (cta) textFrag.appendChild(cta);
      cells.push([imageFrag, textFrag]);
    });
    if (slides.length === 0 && !headingEl) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel (instruments)", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/beckmancoulter-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        // OneTrust cookie consent banner/dialog (cleaned.html:2185 #onetrust-consent-sdk)
        "#onetrust-consent-sdk",
        // UserWay accessibility skip-links bar (cleaned.html:2 .uw-sl — closed before .uwy)
        ".uw-sl",
        // UserWay widget's own children only — NOT the .uwy wrapper (see header note)
        ".userway_buttons_wrapper",
        // cleaned.html:38
        ".uwaw-dictionary-tooltip",
        // cleaned.html:58
        ".uw-s10-bottom-ruler-guide",
        // cleaned.html:64
        ".uw-s10-right-ruler-guide",
        // cleaned.html:66
        ".uw-s10-left-ruler-guide",
        // cleaned.html:68
        ".uw-s10-reading-guide",
        // cleaned.html:70
        ".uw-s12-tooltip"
        // cleaned.html:74
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Universal navigation + scroll-to-top + mobile nav + global search
        // (cleaned.html:78 .nav-container — sibling of #main-container, wraps all nav chrome)
        ".nav-container",
        // Breadcrumb trail inside main-container (cleaned.html:915 .breadcrumbs.breadcrumb-ui)
        ".breadcrumbs.breadcrumb-ui",
        // Global footer (cleaned.html:1787/1790 .footer-container / .universal-footer)
        ".universal-footer",
        ".universal-footer-text",
        ".footer-container",
        // Non-authorable / non-rendering elements
        "iframe",
        "link",
        "noscript",
        "script"
      ]);
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

  // tools/importer/import-products.js
  var parsers = {
    hero: parse,
    "cards-grid": parse2,
    columns: parse3,
    "content-reversed": parse4,
    carousel: parse5
  };
  var PAGE_TEMPLATE = {
    name: "products",
    description: "Beckman Coulter product overview page (immunoassay)",
    urls: ["https://www.beckmancoulter.com/en/products/immunoassay"],
    blocks: [
      { name: "hero", instances: ["#main-container > div.sublayout.ui.aligned.segment.grid > div.lazyload.fade.video-hero-carousel.ui.container.active"] },
      { name: "cards-grid", instances: ["#main-container > div.sublayout.ui.three.column.stackable.equal.height.grid.container.col-3-default-padding:nth-of-type(3)", "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(4) > div.product-list.lazyload.active"] },
      { name: "columns", instances: ["#main-container > div.sublayout.ui.aligned.segment.grid > div.wysiwyg-content.lazyload.gtm-page-body-link.active", "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(4) > div.lazyload.page-content.nested-padding.active:nth-of-type(1)", "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(4) > div.lazyload.page-content.nested-padding.active:nth-of-type(3)", "#main-container > div.sublayout.ui.three.column.stackable.equal.height.grid.container.col-3-default-padding:nth-of-type(5)", "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(6) > div.double-showcase-feature"] },
      { name: "content-reversed", instances: ["#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(6) > div.social-proof-section"] },
      { name: "carousel", instances: ["#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(6) > div.lazyload.page-content.education-filter-carousel.active"] }
    ],
    sections: [
      { id: "1", selector: "#main-container > div.sublayout.ui.aligned.segment.grid > div.lazyload.fade.video-hero-carousel.ui.container.active", style: null },
      { id: "2", selector: "#main-container > div.sublayout.ui.aligned.segment.grid > div.wysiwyg-content.lazyload.gtm-page-body-link.active", style: null },
      { id: "3", selector: "#main-container > div.sublayout.ui.three.column.stackable.equal.height.grid.container.col-3-default-padding:nth-of-type(3)", style: null },
      { id: "4", selector: "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(4) > div.lazyload.page-content.nested-padding.active:nth-of-type(1)", style: null },
      { id: "5", selector: "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(4) > div.product-list.lazyload.active", style: null },
      { id: "6", selector: "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(4) > div.lazyload.page-content.nested-padding.active:nth-of-type(3)", style: null },
      { id: "7", selector: "#main-container > div.sublayout.ui.three.column.stackable.equal.height.grid.container.col-3-default-padding:nth-of-type(5)", style: null },
      { id: "8", selector: "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(6) > div.double-showcase-feature", style: null },
      { id: "9", selector: "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(6) > div.social-proof-section", style: null },
      { id: "10", selector: "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(6) > div.lazyload.page-content.education-filter-carousel.active", style: null },
      { id: "11", selector: "#main-container > div.sublayout.ui.one.column.stackable.grid.container:nth-of-type(6) > div.disclaimer-text.lazyload.active", style: null }
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
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_products_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
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
  return __toCommonJS(import_products_exports);
})();
