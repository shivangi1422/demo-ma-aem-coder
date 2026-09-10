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

  // tools/importer/import-dxs.js
  var import_dxs_exports = {};
  __export(import_dxs_exports, {
    default: () => import_dxs_default
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
          return /background(-image)?\s*:\s*[^;]*url\(/i.test(bg) && /\.(jpe?g|png|webp|avif)/i.test(bg);
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
    const scope = element.querySelector(".banner-details") || element;
    const headings = Array.from(scope.querySelectorAll("h1, h2, h3, h4, h5")).filter((h) => h.textContent && h.textContent.trim().length > 0);
    const heading = headings[0] || null;
    const subtitles = headings.slice(1);
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
    subtitles.forEach((s) => textFrag.appendChild(s));
    paragraphs.forEach((p) => textFrag.appendChild(p));
    ctaLinks.forEach((a) => textFrag.appendChild(a));
    cells.push([textFrag]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero (home)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-grid.js
  function parse2(element, { document: document2 }) {
    const isPlaceholder = (t) => !t || /^\s*(empty heading)?\s*$/i.test(t);
    let headingEl = Array.from(
      element.querySelectorAll(":scope > .content-container > .heading h1, :scope > .content-container > .heading h2, :scope .heading > h1, :scope .heading > h2, :scope .dv-header h1, :scope .dv-header h2, :scope .carousel-heading")
    ).find((h) => !isPlaceholder(h.textContent));
    const introEl = element.querySelector(":scope .dv-sub-header");
    let adoptedHeadingSibling = null;
    if (!headingEl) {
      let prev = element.previousElementSibling;
      let hops = 0;
      while (prev && hops < 4) {
        const isBreak = prev.tagName === "HR" || !prev.textContent.trim();
        if (!isBreak) {
          const h = prev.matches && prev.matches("h1, h2, h3") ? prev : prev.querySelector && Array.from(prev.querySelectorAll("h1, h2, h3")).find((el) => !isPlaceholder(el.textContent));
          let onlyHeadings = false;
          if (h && prev.cloneNode) {
            const clone = prev.cloneNode(true);
            clone.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((el) => el.remove());
            onlyHeadings = clone.textContent.replace(/\s+/g, " ").trim() === "";
          }
          if (h && !isPlaceholder(h.textContent) && onlyHeadings) {
            headingEl = h;
            adoptedHeadingSibling = prev;
          }
          break;
        }
        prev = prev.previousElementSibling;
        hops += 1;
      }
    }
    const cells = [];
    if (headingEl) {
      const headFrag = document2.createDocumentFragment();
      headFrag.appendChild(document2.createComment(" field:text "));
      headFrag.appendChild(headingEl);
      if (introEl && introEl.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = introEl.textContent.replace(/\s+/g, " ").trim();
        headFrag.appendChild(p);
      }
      cells.push([headFrag]);
    }
    let cards = Array.from(element.querySelectorAll(":scope .product-card"));
    let mode = "product";
    if (cards.length === 0) {
      const charts = Array.from(element.querySelectorAll(":scope .chart-feature"));
      const articles = Array.from(element.querySelectorAll(':scope .item[class*="Blog"], :scope .item[class*="Article"], :scope .item[class*="Webinar"], :scope .item[class*="News"]'));
      if (charts.length) {
        cards = charts;
        mode = "chart";
      } else if (articles.length) {
        cards = articles;
        mode = "article";
      } else {
        cards = Array.from(element.querySelectorAll(":scope > .column"));
        mode = "feature";
      }
    }
    const CHART_ICONS = {
      "maximize uptime": "https://media.beckmancoulter.com/-/media/diagnostics/products/dxs-services/icons/mazimize_uptime-1.png",
      "increase confidence": "https://media.beckmancoulter.com/-/media/diagnostics/products/dxs-services/icons/confidence-1.png",
      "gain peace-of-mind": "https://media.beckmancoulter.com/-/media/diagnostics/products/dxs-services/icons/peace_of_mind-1.png"
    };
    cards.forEach((card) => {
      let img = Array.from(card.querySelectorAll("img")).find(
        (i) => !(i.getAttribute("src") || "").startsWith("data:")
      ) || null;
      if (!img && mode === "chart") {
        const header = card.querySelector(".chart-header");
        const key = header ? header.textContent.replace(/\s+/g, " ").trim().toLowerCase() : "";
        if (CHART_ICONS[key]) {
          img = document2.createElement("img");
          img.src = CHART_ICONS[key];
          img.alt = header.textContent.trim();
        }
      }
      const imageFrag = document2.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(document2.createComment(" field:image "));
        imageFrag.appendChild(img);
      }
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      if (mode === "article") {
        const tag = card.querySelector(".subheading");
        const title = Array.from(card.querySelectorAll("h2, h3, h4, h5")).find((el) => el.textContent && el.textContent.trim() && !isPlaceholder(el.textContent));
        const link = card.querySelector(".item-action a, a.button, a[href]");
        if (tag && tag.textContent.trim()) {
          const p = document2.createElement("p");
          p.textContent = tag.textContent.trim();
          textFrag.appendChild(p);
        }
        if (title) {
          const h = document2.createElement("h3");
          h.textContent = title.textContent.trim();
          textFrag.appendChild(h);
        }
        if (link && (link.getAttribute("href") || "").trim()) {
          const p = document2.createElement("p");
          const a = document2.createElement("a");
          a.setAttribute("href", link.getAttribute("href"));
          a.textContent = link.textContent.trim() || "Read more";
          p.appendChild(a);
          textFrag.appendChild(p);
        }
      } else if (mode === "chart") {
        const header = card.querySelector(".chart-header");
        const body = card.querySelector(".chart-body");
        if (header && !isPlaceholder(header.textContent)) {
          const h = document2.createElement("h3");
          h.textContent = header.textContent.trim();
          textFrag.appendChild(h);
        }
        if (body && body.textContent.trim()) {
          const p = document2.createElement("p");
          p.textContent = body.textContent.replace(/\s+/g, " ").trim();
          textFrag.appendChild(p);
        }
      } else if (mode === "product") {
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
    let variant = "productlines";
    if (mode === "feature" || mode === "chart") variant = "solutions";
    else if (mode === "article") variant = "insights";
    const block = WebImporter.Blocks.createBlock(document2, { name: `cards-grid (${variant})`, cells });
    element.replaceWith(block);
    if (adoptedHeadingSibling && adoptedHeadingSibling.parentNode) {
      adoptedHeadingSibling.remove();
    }
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
        const isChrome = (t) => /^\s*feedback\s*$/i.test(t);
        const cell = [];
        element.querySelectorAll("h1, h2, h3, h4, h5, h6, p").forEach((el) => {
          if (isPlaceholder(el.textContent) || !el.textContent.trim()) return;
          if (isChrome(el.textContent)) return;
          cell.push(el);
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
    const showcase = element.classList.contains("media-showcase-simple") ? element : element.querySelector(":scope .media-showcase-simple");
    if (showcase) {
      const img = showcase.querySelector(".image img, img");
      const title = showcase.querySelector(".content h1, .content h2, .content h3, h2");
      const tagline = showcase.querySelector(".content p, p");
      const ctaLinks = Array.from(showcase.querySelectorAll(".content a[href], a[href]"));
      const cta = ctaLinks.find((a) => /\b(button|btn-cta)\b/.test(a.className) && a.textContent.trim()) || ctaLinks.find((a) => {
        const t = a.textContent.trim();
        return t && (!title || t !== title.textContent.trim());
      });
      const imageFrag = document2.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(document2.createComment(" field:image "));
        imageFrag.appendChild(img);
      }
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      if (title && !isPlaceholder(title.textContent)) {
        const h = document2.createElement("h2");
        h.innerHTML = title.innerHTML;
        h.querySelectorAll("span:empty, .label:empty").forEach((s) => s.remove());
        textFrag.appendChild(h);
      }
      if (tagline && tagline.textContent.trim()) {
        const p = document2.createElement("p");
        p.innerHTML = tagline.innerHTML;
        textFrag.appendChild(p);
      }
      if (cta) {
        const p = document2.createElement("p");
        const a = document2.createElement("a");
        a.setAttribute("href", cta.getAttribute("href"));
        a.textContent = cta.textContent.trim();
        p.appendChild(a);
        textFrag.appendChild(p);
      }
      const cells = [];
      if (img) cells.push([imageFrag]);
      cells.push([textFrag]);
      const block = WebImporter.Blocks.createBlock(document2, { name: "content-reversed", cells });
      element.replaceWith(block);
      return;
    }
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

  // tools/importer/parsers/quote.js
  function parse5(element, { document: document2 }) {
    const isPlaceholder = (t) => !t || /^\s*(empty heading)?\s*$/i.test(t);
    const quoteEl = element.querySelector(".quoteText, blockquote, .quote-text") || element.querySelector(".quote");
    const quoteText = quoteEl ? quoteEl.textContent.replace(/\s+/g, " ").trim() : "";
    if (!quoteText || isPlaceholder(quoteText)) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const quoteFrag = document2.createDocumentFragment();
    quoteFrag.appendChild(document2.createComment(" field:quote "));
    const qp = document2.createElement("p");
    qp.textContent = quoteText;
    quoteFrag.appendChild(qp);
    cells.push([quoteFrag]);
    const attribution = [".author", ".title1", ".title2"].map((sel) => {
      const el = element.querySelector(sel);
      return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
    }).filter((t) => t && !isPlaceholder(t)).join(", ");
    if (attribution) {
      const attrFrag = document2.createDocumentFragment();
      attrFrag.appendChild(document2.createComment(" field:attribution "));
      const ap = document2.createElement("p");
      ap.textContent = attribution;
      attrFrag.appendChild(ap);
      cells.push([attrFrag]);
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "quote", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/form-request.js
  function parse6(element, { document: document2 }) {
    const cleanLabel = (t) => (t || "").replace(/\s+/g, " ").replace(/^\*+/, "").replace(/\s*\*\s*$/, "").trim();
    let heading = null;
    let headingSibling = null;
    let prev = element.previousElementSibling;
    let hops = 0;
    const realHeading = (t) => t && t.trim() && !/^\s*(empty heading)?\s*$/i.test(t);
    while (prev && hops < 3 && !heading) {
      const candidates = prev.matches && prev.matches("h1, h2, h3") ? [prev] : Array.from(prev.querySelectorAll && prev.querySelectorAll("h1, h2, h3") || []);
      const h = candidates.find((c) => realHeading(c.textContent));
      if (h) {
        heading = h;
        headingSibling = prev;
      }
      prev = prev.previousElementSibling;
      hops += 1;
    }
    const form = element.matches("form") ? element : element.querySelector("form");
    const scope = form || element;
    const inputs = Array.from(
      scope.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], select, textarea')
    ).filter((inp) => {
      const type = (inp.getAttribute("type") || inp.tagName).toLowerCase();
      if (type === "hidden") return false;
      const name = (inp.getAttribute("name") || "").toLowerCase();
      return name && name !== "q" && name !== "search";
    });
    const cells = [];
    const headFrag = document2.createDocumentFragment();
    headFrag.appendChild(document2.createComment(" field:text "));
    if (heading && heading.textContent && heading.textContent.trim()) {
      const h = document2.createElement("h2");
      h.textContent = heading.textContent.trim();
      headFrag.appendChild(h);
    }
    cells.push([headFrag]);
    const typeFor = (inp) => {
      if (inp.tagName === "TEXTAREA") return "textarea";
      const t = (inp.getAttribute("type") || "").toLowerCase();
      if (t === "email") return "email";
      return "text";
    };
    let halfToggle = false;
    inputs.forEach((inp) => {
      const id = inp.id;
      let label = "";
      if (id) {
        const l = scope.querySelector(`label[for="${id}"]`);
        if (l) label = l.textContent;
      }
      if (!label) label = inp.getAttribute("aria-label") || inp.getAttribute("placeholder") || inp.getAttribute("name") || "";
      label = cleanLabel(label);
      if (!label) return;
      let type = typeFor(inp);
      if (type === "text") {
        type = halfToggle ? "half" : "text";
        halfToggle = !halfToggle;
      } else {
        halfToggle = false;
      }
      const labelCell = document2.createElement("div");
      labelCell.textContent = label;
      const phCell = document2.createElement("div");
      const typeCell = document2.createElement("div");
      typeCell.textContent = type;
      cells.push([labelCell, phCell, typeCell]);
    });
    const consentEl = scope.querySelector("fieldset .mktoHtmlText") || scope.querySelector("fieldset p") || scope.querySelector(".mktoHtmlText");
    let consentText = consentEl ? consentEl.textContent.replace(/\s+/g, " ").trim() : "";
    consentText = consentText.replace(/^Fieldset Label\s*/i, "").trim();
    consentText = consentText.split(/\s*\*?\s*By (?:Email|Phone)\s*:/i)[0].trim();
    if (consentText) {
      const consentCell = document2.createElement("div");
      consentCell.textContent = consentText;
      const typeCell = document2.createElement("div");
      typeCell.textContent = "consent";
      cells.push([consentCell, document2.createElement("div"), typeCell]);
    }
    const submitEl = scope.querySelector('button[type="submit"], .mktoButton, button');
    const submitLabel = submitEl && submitEl.textContent.trim() || "Submit";
    const submitCell = document2.createElement("div");
    submitCell.textContent = submitLabel;
    const submitType = document2.createElement("div");
    submitType.textContent = "submit";
    cells.push([submitCell, document2.createElement("div"), submitType]);
    if (inputs.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "form-request", cells });
    element.replaceWith(block);
    if (headingSibling && headingSibling.parentNode && !headingSibling.contains(block)) {
      headingSibling.remove();
    }
  }

  // tools/importer/parsers/tabs-products.js
  function parse7(element, { document: document2 }) {
    const isPlaceholder = (t) => !t || /^\s*(empty heading)?\s*$/i.test(t);
    const sectionHeading = element.querySelector(".carousel-heading, :scope > h1, :scope > h2");
    let headingClone = null;
    if (sectionHeading && !isPlaceholder(sectionHeading.textContent)) {
      headingClone = document2.createElement("h2");
      headingClone.textContent = sectionHeading.textContent.trim();
    }
    let labels = Array.from(element.querySelectorAll(".owl-filter-bar .filter-button, .filter-header .filter-button")).map((a) => a.textContent.trim()).filter((t) => t.length > 0);
    if (labels.length === 0) {
      labels = [...new Set(Array.from(element.querySelectorAll(".item")).map((c) => {
        const cat = Array.from(c.classList).find((cl) => cl !== "item");
        return cat || (c.querySelector(".subheading") ? c.querySelector(".subheading").textContent.trim() : "");
      }).filter(Boolean))];
    }
    if (labels.length === 0) labels = ["Articles"];
    const cells = [];
    labels.forEach((label) => {
      const cat = label.replace(/\s+/g, "");
      let cards = Array.from(element.querySelectorAll(`.item.${cat}`));
      if (cards.length === 0) {
        cards = Array.from(element.querySelectorAll(".owl-item .item, .item")).filter((c) => {
          const sh = c.querySelector(".subheading");
          return sh && sh.textContent.trim().toLowerCase() === label.toLowerCase();
        });
      }
      const labelFrag = document2.createDocumentFragment();
      labelFrag.appendChild(document2.createComment(" field:label "));
      labelFrag.appendChild(document2.createTextNode(label));
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      cards.forEach((card) => {
        const sub = card.querySelector(".subheading");
        const eyebrow = sub && sub.textContent.trim() || label;
        const title = Array.from(card.querySelectorAll("h2, h3, h4, h5")).find((el) => el.textContent && el.textContent.trim() && !isPlaceholder(el.textContent));
        const link = card.querySelector(".item-action a, a.button, a[href]");
        if (eyebrow) {
          const e = document2.createElement("p");
          e.textContent = eyebrow;
          textFrag.appendChild(e);
        }
        if (title) {
          const h = document2.createElement("h4");
          h.textContent = title.textContent.trim();
          textFrag.appendChild(h);
        }
        if (link && (link.getAttribute("href") || "").trim()) {
          const p = document2.createElement("p");
          const a = document2.createElement("a");
          a.setAttribute("href", link.getAttribute("href"));
          a.textContent = link.textContent.trim() || "Read more";
          p.appendChild(a);
          textFrag.appendChild(p);
        }
      });
      const imageFrag = document2.createDocumentFragment();
      const img = cards.map((c) => c.querySelector("img")).find((i) => i && !(i.getAttribute("src") || "").startsWith("data:"));
      if (img) {
        imageFrag.appendChild(document2.createComment(" field:image "));
        imageFrag.appendChild(img);
      }
      cells.push([labelFrag, textFrag, imageFrag]);
    });
    const hasContent = cells.some((row) => row[1] && row[1].childNodes.length > 1);
    if (!hasContent) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-products", cells });
    if (headingClone) {
      element.replaceWith(headingClone, block);
    } else {
      element.replaceWith(block);
    }
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
        ".uw-s12-tooltip",
        // cleaned.html:74
        // Hidden Marketo confirmation message ("Thank you for your request…") —
        // a display:hidden sibling of the form, not authorable page content.
        "#confirmform"
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
      element.querySelectorAll("p, div, span, a, button").forEach((el) => {
        if (el.children.length === 0 && /^\s*feedback\s*$/i.test(el.textContent || "")) {
          el.remove();
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

  // tools/importer/import-dxs.js
  var parsers = {
    hero: parse,
    "cards-grid": parse2,
    columns: parse3,
    "content-reversed": parse4,
    quote: parse5,
    "form-request": parse6,
    "tabs-products": parse7
  };
  var HERO_SEG = "#main-container > div.sublayout.ui.aligned.segment.grid:nth-of-type(1)";
  var MC = "#main-container > div.sublayout.ui.one.column.stackable.grid.container";
  var S1 = `${HERO_SEG} > div.video-hero-carousel`;
  var S2 = `${MC} > div.data-visualization-container`;
  var S3 = `${MC} > div.media-showcase-simple`;
  var S4 = `${MC} > div.page-content.nested-padding:nth-of-type(4)`;
  var S5 = `${MC} > div.related-products:nth-of-type(5)`;
  var S6 = `${MC} > div.related-products:nth-of-type(6)`;
  var S7 = `${MC} > div.testimonial-slim`;
  var S8 = `${MC} > div.education-filter-carousel`;
  var S9 = "#main-container > form";
  var S10 = "#main-container > div.wysiwyg-content.gtm-page-body-link";
  var PAGE_TEMPLATE = {
    name: "dxs-service-and-supports",
    description: "Beckman Coulter product page \u2014 DxS Service and Support",
    urls: ["https://www.beckmancoulter.com/en/products/dxs-service-and-supports"],
    blocks: [
      { name: "hero", instances: [S1] },
      { name: "cards-grid", instances: [S2, S5, S6] },
      { name: "content-reversed", instances: [S3] },
      { name: "columns", instances: [S10] },
      { name: "quote", instances: [S7] },
      { name: "tabs-products", instances: [S8] },
      { name: "form-request", instances: [S9] }
    ],
    sections: [
      { id: "1", selector: S1, style: null },
      { id: "2", selector: S2, style: null },
      { id: "3", selector: S3, style: "light-gray" },
      { id: "5", selector: S5, style: null },
      { id: "6", selector: S6, style: null },
      { id: "7", selector: S7, style: null },
      { id: "8", selector: S8, style: null },
      { id: "9", selector: S9, style: null },
      { id: "10", selector: S10, style: null }
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
        if (elements.length === 0) console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        elements.forEach((element) => {
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_dxs_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
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
        report: { title: document2.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_dxs_exports);
})();
