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

  // tools/importer/import-solutions.js
  var import_solutions_exports = {};
  __export(import_solutions_exports, {
    default: () => import_solutions_default
  });

  // tools/importer/parsers/hero-left.js
  var clean = (str) => (str || "").replace(/\s+/g, " ").trim();
  function bgUrl(el) {
    if (!el) return "";
    const style = el.getAttribute("style") || "";
    const m = style.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    return m ? m[1].replace(/&amp;/g, "&").trim() : "";
  }
  function parse(element, { document }) {
    const cells = [];
    const srcImg = element.querySelector(".lbg-banner-wrapper img") || element.querySelector("img.lgb-banner-bg") || element.querySelector("img");
    const src = srcImg && srcImg.getAttribute("src") || bgUrl(element);
    if (src) {
      const altSource = [srcImg, ...element.querySelectorAll("img[alt]")].find((i) => i && clean(i.getAttribute("alt")));
      const img = document.createElement("img");
      img.src = src;
      img.alt = clean(altSource ? altSource.getAttribute("alt") : "");
      cells.push([[document.createComment(" field:image "), img]]);
    } else {
      cells.push([""]);
    }
    const textCell = [];
    const details = element.querySelector(".lgb-banner-details, .lgb-heading-container, .lgb-content-container") || element;
    const title = details.querySelector("h1") || details.querySelector("h2");
    if (title && clean(title.textContent)) {
      const h1 = document.createElement("h1");
      h1.textContent = clean(title.textContent);
      textCell.push(h1);
    }
    details.querySelectorAll("h2, h3, h4, h5, h6, p").forEach((el) => {
      if (el === title) return;
      const text = clean(el.textContent);
      if (!text) return;
      const p = document.createElement("p");
      p.textContent = text;
      textCell.push(p);
    });
    if (textCell.length) {
      textCell.unshift(document.createComment(" field:text "));
      cells.push([textCell]);
    } else {
      cells.push([""]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero (left)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-grid-features.js
  var clean2 = (str) => (str || "").replace(/\s+/g, " ").trim();
  function bgUrl2(el) {
    if (!el) return "";
    const style = el.getAttribute("style") || "";
    const re = /url\(\s*['"]?([^'")]*)['"]?\s*\)/gi;
    let m;
    while (m = re.exec(style)) {
      const url = m[1].replace(/&amp;/g, "&").trim();
      if (url) return url;
    }
    return "";
  }
  function textWithBreaks(el, document) {
    const p = document.createElement("p");
    const lines = (el.innerHTML || "").split(/<br\s*\/?>/i).map((html) => {
      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      return clean2(tmp.textContent);
    }).filter(Boolean);
    lines.forEach((line, i) => {
      if (i) p.append(document.createElement("br"));
      p.append(document.createTextNode(line));
    });
    return lines.length ? p : null;
  }
  function parse2(element, { document }) {
    const cells = [];
    const intro = [];
    const headerWrap = element.querySelector(".dv-header");
    const heading = headerWrap && headerWrap.querySelector("h1, h2, h3, h4") || element.querySelector(".dv-content h2");
    if (heading && clean2(heading.textContent)) {
      const h2 = document.createElement("h2");
      h2.textContent = clean2(heading.textContent);
      intro.push(h2);
    }
    const sub = element.querySelector(".dv-sub-header");
    if (sub && clean2(sub.textContent)) {
      const p = document.createElement("p");
      p.textContent = clean2(sub.textContent);
      intro.push(p);
    }
    if (intro.length) {
      intro.unshift(document.createComment(" field:text "));
      cells.push([intro]);
    } else {
      cells.push([""]);
    }
    element.querySelectorAll(".charts .chart-feature").forEach((feature) => {
      const imageCell = [];
      const icon = feature.querySelector(".custom-icon");
      const iconImg = feature.querySelector(".chart-graph img");
      const src = iconImg && iconImg.getAttribute("src") || feature.getAttribute("data-icon-src") || bgUrl2(icon) || bgUrl2(feature.querySelector(".chart-graph"));
      const titleEl = feature.querySelector(".chart-header");
      const title = clean2(titleEl ? titleEl.textContent : "");
      if (src) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = iconImg && clean2(iconImg.getAttribute("alt")) || title;
        imageCell.push(document.createComment(" field:image "), img);
      }
      const textCell = [];
      if (title) {
        const h3 = document.createElement("h3");
        h3.textContent = title;
        textCell.push(h3);
      }
      const body = feature.querySelector(".chart-body");
      const desc = body ? textWithBreaks(body, document) : null;
      if (desc) textCell.push(desc);
      if (textCell.length) textCell.unshift(document.createComment(" field:text "));
      cells.push([imageCell.length ? imageCell : "", textCell.length ? textCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-grid (features)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-grid-video.js
  var clean3 = (str) => (str || "").replace(/\s+/g, " ").trim();
  var KNOWN_TITLES = {
    "7Ayn48jPCoFoVZ9wtWDX5K": "Decoding the Host Response to Infection with Melissa Naiman",
    W9dMhSdnNBBa28pwZLHtcL: "Diagnostic Directionality with Jean B. Patel",
    "1sXqyegsbnK1n4hD22tEbh": "Precision Medicine with Ephraim Tsalik"
  };
  var GENERIC_TITLE = /^(hospital|vidyard( video| media)? player|video|play video|thumbnail|image)$/i;
  function uuidOf(container) {
    const direct = container.getAttribute("uuid") || container.getAttribute("data-uuid");
    if (direct) return direct;
    const withData = container.querySelector("[data-uuid]");
    if (withData) return withData.getAttribute("data-uuid");
    const src = [...container.querySelectorAll("iframe[src], img[src]")].map((el) => el.getAttribute("src")).find((s) => /vidyard\.com\//i.test(s || ""));
    const m = src && src.match(/vidyard\.com\/(?:watch\/)?([A-Za-z0-9_-]+)/i);
    return m ? m[1] : "";
  }
  function titleOf(container, uuid) {
    if (KNOWN_TITLES[uuid]) return KNOWN_TITLES[uuid];
    const candidates = [];
    container.querySelectorAll("img").forEach((img) => candidates.push(img.getAttribute("alt"), img.getAttribute("title")));
    container.querySelectorAll("iframe").forEach((f) => candidates.push(f.getAttribute("title")));
    const found = candidates.map(clean3).find((t) => t && !GENERIC_TITLE.test(t));
    return found || "Watch video";
  }
  function parse3(element, { document }) {
    const cells = [];
    cells.push([""]);
    const seen = /* @__PURE__ */ new Set();
    element.querySelectorAll('.vidyard-player-container, [class*="vidyard-player-container"]').forEach((container) => {
      const uuid = uuidOf(container);
      if (!uuid || seen.has(uuid)) return;
      seen.add(uuid);
      const title = titleOf(container, uuid);
      const poster = container.querySelector("img.vidyard-player-embed, img[data-uuid], img");
      const posterSrc = poster && poster.getAttribute("src") || `https://play.vidyard.com/${uuid}.jpg`;
      const img = document.createElement("img");
      img.src = posterSrc;
      img.alt = title;
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = `https://play.vidyard.com/${uuid}`;
      a.textContent = title;
      p.append(a);
      cells.push([
        [document.createComment(" field:image "), img],
        [document.createComment(" field:text "), p]
      ]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-grid (video)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-grouped.js
  var clean4 = (str) => (str || "").replace(/\s+/g, " ").trim();
  var isUsableHref = (href) => !!href && href.trim() !== "" && href.trim() !== "#";
  function cellContent(td, document, { bold = false } = {}) {
    const blocks = [...td.querySelectorAll(":scope > p, :scope > ul, :scope > ol")];
    const sources = blocks.length ? blocks : [td];
    const out = [];
    sources.forEach((src) => {
      if (!clean4(src.textContent)) return;
      if (src.tagName === "UL" || src.tagName === "OL") {
        const list = document.createElement(src.tagName.toLowerCase());
        src.querySelectorAll(":scope > li").forEach((li) => {
          const item = document.createElement("li");
          item.textContent = clean4(li.textContent);
          list.append(item);
        });
        out.push(list);
        return;
      }
      const p = document.createElement("p");
      const link = src.querySelector("a[href]");
      const text = clean4(src.textContent);
      if (link && isUsableHref(link.getAttribute("href")) && clean4(link.textContent) === text) {
        const a = document.createElement("a");
        a.href = link.getAttribute("href");
        a.textContent = text;
        p.append(a);
      } else if (link) {
        src.childNodes.forEach((node) => {
          if (node.nodeType === 1 && node.tagName === "A" && isUsableHref(node.getAttribute("href"))) {
            const a = document.createElement("a");
            a.href = node.getAttribute("href");
            a.textContent = clean4(node.textContent);
            p.append(a);
          } else {
            p.append(document.createTextNode(node.textContent.replace(/\s+/g, " ")));
          }
        });
        p.normalize();
      } else {
        p.textContent = text;
      }
      if (bold || src.querySelector("strong, b")) {
        if (clean4(src.querySelector("strong, b") ? src.querySelector("strong, b").textContent : "") === text || bold) {
          const strong = document.createElement("strong");
          while (p.firstChild) strong.append(p.firstChild);
          p.append(strong);
        }
      }
      out.push(p);
    });
    return out;
  }
  function parse4(element, { document }) {
    const table = element.tagName === "TABLE" ? element : element.querySelector("table");
    const cells = [];
    const rows = table ? [...table.querySelectorAll(":scope > tbody > tr, :scope > thead > tr, :scope > tr")] : [];
    rows.forEach((tr) => {
      const tds = [...tr.querySelectorAll(":scope > td, :scope > th")];
      if (!tds.length || !clean4(tr.textContent)) return;
      const isGroup = tds.length === 1 || tds.slice(1).every((td) => !clean4(td.textContent));
      if (isGroup) {
        const name2 = cellContent(tds[0], document, { bold: true });
        cells.push([[document.createComment(" field:name "), ...name2], ""]);
        return;
      }
      const name = cellContent(tds[0], document);
      const desc = cellContent(tds[1], document);
      cells.push([
        name.length ? [document.createComment(" field:name "), ...name] : "",
        desc.length ? [document.createComment(" field:description "), ...desc] : ""
      ]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "table-grouped", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  var clean5 = (str) => (str || "").replace(/\s+/g, " ").trim();
  var isUsableHref2 = (href) => !!href && href.trim() !== "" && href.trim() !== "#";
  function buildTextColumn(segment, document) {
    const out = [];
    segment.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, a.button, a.ui.button").forEach((el) => {
      if (el.parentElement && el.parentElement.closest("p, ul, ol, h1, h2, h3, h4, h5, h6") && segment.contains(el.parentElement.closest("p, ul, ol, h1, h2, h3, h4, h5, h6"))) return;
      const tag = el.tagName;
      if (/^H[1-6]$/.test(tag)) {
        const text = clean5(el.textContent);
        if (!text || /^empty heading$/i.test(text)) return;
        const h = document.createElement(tag === "H1" ? "h2" : tag.toLowerCase());
        h.textContent = text;
        out.push(h);
        return;
      }
      if (tag === "A") {
        const text = clean5(el.textContent);
        if (!text) return;
        const p2 = document.createElement("p");
        const href = el.getAttribute("href");
        if (isUsableHref2(href)) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = text;
          p2.append(a);
        } else {
          p2.textContent = text;
        }
        out.push(p2);
        return;
      }
      if (tag === "UL" || tag === "OL") {
        const list = document.createElement(tag.toLowerCase());
        el.querySelectorAll(":scope > li").forEach((li) => {
          const item = document.createElement("li");
          item.innerHTML = li.innerHTML;
          list.append(item);
        });
        if (list.children.length) out.push(list);
        return;
      }
      if (!clean5(el.textContent)) return;
      const p = document.createElement("p");
      p.innerHTML = el.innerHTML.trim();
      p.querySelectorAll("a").forEach((a) => {
        if (!isUsableHref2(a.getAttribute("href"))) a.replaceWith(document.createTextNode(a.textContent));
      });
      out.push(p);
    });
    return out;
  }
  function buildImageColumn(segment, document) {
    const out = [];
    segment.querySelectorAll("img").forEach((srcImg) => {
      if (!srcImg.getAttribute("src")) return;
      const img = document.createElement("img");
      img.src = srcImg.getAttribute("src");
      img.alt = clean5(srcImg.getAttribute("alt"));
      out.push(img);
    });
    return out;
  }
  function parse5(element, { document }) {
    const container = element.querySelector(".content-container") || element;
    let segments = [...container.querySelectorAll(":scope > .segment, :scope > div")];
    if (!segments.length) {
      segments = [
        element.querySelector(".adjustable-two-column-display-content"),
        element.querySelector(".adjustable-two-column-display-image")
      ].filter(Boolean);
    }
    const row = segments.slice(0, 2).map((segment) => {
      const isImage = segment.classList.contains("adjustable-two-column-display-image") || !clean5(segment.textContent) && !!segment.querySelector("img");
      const content = isImage ? buildImageColumn(segment, document) : buildTextColumn(segment, document);
      return content.length ? content : "";
    });
    while (row.length < 2) row.push("");
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-grid-showcase.js
  var clean6 = (str) => (str || "").replace(/\s+/g, " ").trim();
  var isUsableHref3 = (href) => !!href && href.trim() !== "" && href.trim() !== "#" && !/^javascript:/i.test(href.trim());
  function bgUrl3(el) {
    if (!el) return "";
    const style = el.getAttribute("style") || "";
    const re = /url\(\s*['"]?([^'")]*)['"]?\s*\)/gi;
    let m;
    while (m = re.exec(style)) {
      const url = m[1].replace(/&amp;/g, "&").trim();
      if (url) return url;
    }
    return "";
  }
  function computedBgUrl(el, document) {
    try {
      const view = document.defaultView;
      if (!el || !view || !view.getComputedStyle) return "";
      const value = view.getComputedStyle(el).backgroundImage || "";
      const m = value.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
      return m ? m[1] : "";
    } catch (e) {
      return "";
    }
  }
  function onclickHref(el) {
    const holder = el && (el.matches("[onclick]") ? el : el.closest("[onclick]") || el.querySelector("[onclick]"));
    const onclick = holder ? holder.getAttribute("onclick") || "" : "";
    const m = onclick.match(/location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i);
    return m ? m[1] : "";
  }
  function para(document, text) {
    const p = document.createElement("p");
    p.textContent = text;
    return p;
  }
  function ctaPara(document, text, href) {
    const p = document.createElement("p");
    if (isUsableHref3(href)) {
      const a = document.createElement("a");
      a.href = href;
      a.textContent = text;
      p.append(a);
    } else {
      p.textContent = text;
    }
    return p;
  }
  function parse6(element, { document }) {
    const cells = [];
    const intro = [];
    const introHeading = element.querySelector(".intro-content h1, .intro-content h2, .intro-content h3");
    if (introHeading) {
      const headingClone = introHeading.cloneNode(true);
      headingClone.querySelectorAll(".sub-header, .data-uw-rm-autofix-hide").forEach((s) => s.remove());
      const headingText = clean6(headingClone.textContent);
      if (headingText && !/^empty heading$/i.test(headingText)) {
        const h2 = document.createElement("h2");
        h2.textContent = headingText;
        intro.push(h2);
      }
    }
    element.querySelectorAll(".intro-content .sub-header, .intro-content > p").forEach((sub) => {
      const text = clean6(sub.textContent);
      if (text) intro.push(para(document, text));
    });
    if (intro.length) {
      intro.unshift(document.createComment(" field:text "));
      cells.push([intro]);
    } else {
      cells.push([""]);
    }
    const bgEl = element.querySelector(".floating-bg") || element;
    const bgImg = element.querySelector(".floating-bg img");
    const bgSrc = bgEl.getAttribute("data-bg-src") || element.getAttribute("data-bg-src") || bgUrl3(bgEl) || bgUrl3(element) || bgImg && bgImg.getAttribute("src") || computedBgUrl(bgEl, document);
    let sectionMeta = null;
    if (bgSrc) {
      const img = document.createElement("img");
      img.src = bgSrc;
      img.alt = "";
      sectionMeta = WebImporter.Blocks.createBlock(document, {
        name: "Section Metadata",
        cells: { background: img }
      });
    }
    let features = [...element.querySelectorAll(".feature-container > .feature-content")];
    if (!features.length) features = [...element.querySelectorAll(".showcase-feature, .photo-card")];
    features.forEach((feature) => {
      const card = feature.querySelector(".photo-card, .card") || feature.querySelector(".showcase-feature") || feature;
      const imageCell = [];
      const srcImg = card.querySelector(".image-card-box img, img");
      if (srcImg && srcImg.getAttribute("src")) {
        const img = document.createElement("img");
        img.src = srcImg.getAttribute("src");
        img.alt = clean6(srcImg.getAttribute("alt"));
        imageCell.push(document.createComment(" field:image "), img);
      }
      const textCell = [];
      const titleEl = card.querySelector(".card-header-text, h1, h2, h3, h4");
      const title = clean6(titleEl ? titleEl.textContent : "");
      if (title) {
        const h3 = document.createElement("h3");
        h3.textContent = title;
        textCell.push(h3);
      }
      const descEls = [...card.querySelectorAll(".card-content-text, p")].filter((el) => !el.closest(".explore-link") && !el.querySelector("a.button, a.btn-cta"));
      descEls.forEach((el) => {
        const text = clean6(el.textContent);
        if (text) textCell.push(para(document, text));
      });
      const cta = card.querySelector("a.btn-cta, a.ui.button, .explore-link a");
      const ctaText = clean6(cta ? cta.textContent : "");
      if (ctaText) {
        const href = (cta.getAttribute("href") || "").trim();
        textCell.push(ctaPara(document, ctaText, isUsableHref3(href) ? href : onclickHref(card)));
      }
      if (textCell.length) textCell.unshift(document.createComment(" field:text "));
      if (!imageCell.length && !textCell.length) return;
      cells.push([imageCell.length ? imageCell : "", textCell.length ? textCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-grid (showcase)", cells });
    if (sectionMeta) element.before(sectionMeta);
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-resources.js
  var clean7 = (str) => (str || "").replace(/\s+/g, " ").trim();
  var isUsableHref4 = (href) => !!href && href.trim() !== "" && href.trim() !== "#" && !/^javascript:/i.test(href.trim());
  function bgUrl4(el) {
    if (!el) return "";
    const style = el.getAttribute("style") || "";
    const re = /url\(\s*['"]?([^'")]*)['"]?\s*\)/gi;
    let m;
    while (m = re.exec(style)) {
      const url = m[1].replace(/&amp;/g, "&").trim();
      if (url) return url;
    }
    return "";
  }
  function parse7(element, { document }) {
    const cells = [];
    const headingEl = element.querySelector(":scope > h2, .carousel-heading");
    const headingText = clean7(headingEl ? headingEl.textContent : "");
    let heading = null;
    if (headingText && !/^empty heading$/i.test(headingText)) {
      heading = document.createElement("h2");
      heading.textContent = headingText;
    }
    const ul = document.createElement("ul");
    const seenLabels = /* @__PURE__ */ new Set();
    element.querySelectorAll(".filter-header .filter-button, .owl-filter-bar a, .filter-button").forEach((btn) => {
      const label = clean7(btn.textContent);
      if (!label || seenLabels.has(label.toLowerCase())) return;
      seenLabels.add(label.toLowerCase());
      const li = document.createElement("li");
      li.textContent = label;
      ul.append(li);
    });
    if (ul.children.length) {
      cells.push([[document.createComment(" field:text "), ul]]);
    } else {
      cells.push([""]);
    }
    let items = [...element.querySelectorAll(".owl-item:not(.cloned) > .item")];
    if (!items.length) {
      items = [...element.querySelectorAll("#education-filter-carousel .item, .owl-carousel .item")].filter((it) => !it.closest(".cloned"));
    }
    items.forEach((item) => {
      const imageCell = [];
      const inlineImg = item.querySelector("img");
      const src = bgUrl4(item) || inlineImg && inlineImg.getAttribute("src") || "";
      if (src) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = clean7(inlineImg ? inlineImg.getAttribute("alt") : "");
        imageCell.push(document.createComment(" field:image "), img);
      }
      const textCell = [];
      const sub = item.querySelector(".subheading");
      const category = clean7(sub ? sub.textContent : "");
      if (category) {
        const p = document.createElement("p");
        p.textContent = category;
        textCell.push(p);
      }
      const titleEl = [...item.querySelectorAll("h1, h2, h3, h4, h5, h6")].find((h) => {
        const t = clean7(h.textContent);
        return t && !/^empty heading$/i.test(t);
      });
      if (titleEl) {
        const h3 = document.createElement("h3");
        h3.textContent = clean7(titleEl.textContent);
        textCell.push(h3);
      }
      item.querySelectorAll(".item-action a, .item-action .button").forEach((cta) => {
        const text = clean7(cta.textContent);
        if (!text) return;
        const p = document.createElement("p");
        const href = cta.getAttribute("href");
        if (isUsableHref4(href)) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = text;
          p.append(a);
        } else {
          p.textContent = text;
        }
        textCell.push(p);
      });
      if (textCell.length) textCell.unshift(document.createComment(" field:text "));
      if (!imageCell.length && !textCell.length) return;
      cells.push([imageCell.length ? imageCell : "", textCell.length ? textCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel (resources)", cells });
    if (heading) element.before(heading);
    element.replaceWith(block);
  }

  // tools/importer/parsers/form.js
  var FORM_JSON = {
    "2549": "/forms/speak-to-representative.json"
  };
  var DEFAULT_FORM_JSON = "/forms/speak-to-representative.json";
  function parse8(element, { document }) {
    var _a;
    const visibleFields = element.querySelectorAll('input:not([type="hidden"]), select, textarea');
    if (!visibleFields.length) {
      element.remove();
      return;
    }
    const formId = (element.id || "").replace(/^mktoForm_/, "") || (((_a = element.querySelector('input[name="formid"]')) == null ? void 0 : _a.getAttribute("value")) || "");
    const file = FORM_JSON[formId] || DEFAULT_FORM_JSON;
    const link = document.createElement("a");
    link.href = file;
    link.textContent = file;
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Form",
      cells: [[[document.createComment(" field:reference "), link]]]
    });
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
    if (!payload || !payload.template || payload.template.name !== "learning-and-events") return;
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
    if (!payload || !payload.template || payload.template.name !== "learning-and-events") return;
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

  // tools/importer/transformers/beckmancoulter-solutions-cleanup.js
  var TEMPLATE_NAME = "solutions";
  var CHROME_SELECTORS2 = [
    // UserWay accessibility widget
    ".uw-sl",
    ".uwy",
    '[class*="userway"]',
    '[class^="uw-s"]',
    ".uwaw-dictionary-tooltip",
    // header / navigation / search
    "header",
    ".nav-container",
    "#universal-navigation",
    "#mobile-universal-nav",
    "#dx-navigation",
    ".primary-navigation",
    ".mobile-subnav-header",
    "#mobile-language-select-btn",
    ".global-search-spacer",
    ".coveo-global-search",
    // country selector + profile (gigya) modals
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
    "#kampyleButtonContainer",
    ".kampyle_button",
    // Marketo form (deferred to the forms add-on)
    "form.mktoForm",
    "div.mktoForm",
    '[id^="mktoForm_"]',
    "#mktoStyleLoaded",
    "#MktoForms2XDIframe",
    // inline code
    "script",
    "style",
    "noscript",
    "link"
  ];
  function safeQueryAll2(root, selector) {
    try {
      return [...root.querySelectorAll(selector)];
    } catch (e) {
      return [];
    }
  }
  function norm2(text) {
    return (text || "").replace(/\s+/g, " ").trim().toLowerCase();
  }
  function collectProtected(element, template) {
    const set = /* @__PURE__ */ new Set();
    (template && template.blocks || []).forEach((block) => {
      (block.instances || []).forEach((sel) => {
        safeQueryAll2(element, sel).forEach((el) => set.add(el));
      });
    });
    return [...set];
  }
  function makeRemover(element, protectedEls) {
    const main = element.querySelector("#main-container");
    return (el) => {
      if (!el || !el.isConnected) return;
      if (el === main || main && el.contains(main)) return;
      if (protectedEls.some((p) => p === el || el.contains(p))) return;
      el.remove();
    };
  }
  function hasMedia(el) {
    return !!el.querySelector("img, picture, video, iframe, table, svg");
  }
  function isEmpty(el) {
    return !norm2(el.textContent) && !hasMedia(el);
  }
  function removeChrome2(element, remove) {
    CHROME_SELECTORS2.forEach((sel) => {
      safeQueryAll2(element, sel).forEach(remove);
    });
    safeQueryAll2(element, "nav").forEach((nav) => {
      if (!nav.closest("#main-container")) remove(nav);
    });
    safeQueryAll2(element, ".ui.modal").forEach((el) => {
      if (/Choose your country\/region and language/i.test(el.textContent || "")) remove(el);
    });
    safeQueryAll2(element, "body > div, #main-container div").forEach((div) => {
      if (div.id === "main-container") return;
      if (!div.children.length && !norm2(div.textContent)) remove(div);
    });
  }
  function removeEmptyHeadings(element, remove) {
    safeQueryAll2(element, "h1, h2, h3, h4, h5, h6").forEach((h) => {
      if (norm2(h.textContent) === "empty heading" && !hasMedia(h)) remove(h);
    });
  }
  function removeIntroRules(element) {
    safeQueryAll2(element, "div.intro-content hr").forEach((hr) => hr.remove());
  }
  function renameTag(el, tagName) {
    const doc = el.ownerDocument;
    const next = doc.createElement(tagName);
    [...el.attributes].forEach(({ name, value }) => next.setAttribute(name, value));
    while (el.firstChild) next.append(el.firstChild);
    el.replaceWith(next);
    return next;
  }
  function demoteBodyH1s(element) {
    safeQueryAll2(element, "h1").forEach((h1) => {
      if (h1.closest("div.large-header-banner")) return;
      renameTag(h1, "h2");
    });
  }
  function extractHeadingIcons(element) {
    const doc = element.ownerDocument;
    safeQueryAll2(element, "div.page-content h2, div.page-content h3").forEach((h) => {
      if (h.closest("div.education-filter-carousel")) return;
      const imgs = [...h.querySelectorAll("img")];
      if (!imgs.length || !norm2(h.textContent)) return;
      const p = doc.createElement("p");
      imgs.forEach((img) => p.append(img));
      h.before(p);
      safeQueryAll2(h, "br").forEach((br) => br.remove());
      const text = (h.textContent || "").replace(/\s+/g, " ").trim();
      h.textContent = text;
    });
  }
  function removeEmptySpacers(element, remove) {
    safeQueryAll2(
      element,
      "#main-container div.page-content, #main-container div.wysiwyg-content, #main-container section"
    ).forEach((el) => {
      if (isEmpty(el)) remove(el);
    });
  }
  function preserveShowcaseBackgrounds(element) {
    const view = element.ownerDocument && element.ownerDocument.defaultView;
    const urlOf = (el) => {
      const inline = (el.getAttribute("style") || "").match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
      if (inline) return inline[1].replace(/&amp;/g, "&");
      if (!view || !view.getComputedStyle) return "";
      const computed = (view.getComputedStyle(el).backgroundImage || "").match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
      return computed ? computed[1] : "";
    };
    safeQueryAll2(element, ".double-showcase-feature, .tripple-showcase-feature").forEach((el) => {
      if (el.getAttribute("data-bg-src")) return;
      const src = [el, ...el.querySelectorAll(".floating-bg")].map(urlOf).find(Boolean);
      if (src) el.setAttribute("data-bg-src", src);
    });
    safeQueryAll2(element, ".data-visualization-container .chart-feature").forEach((el) => {
      if (el.getAttribute("data-icon-src")) return;
      const src = [...el.querySelectorAll(".custom-icon, .chart-graph")].map(urlOf).find(Boolean);
      if (src) el.setAttribute("data-icon-src", src);
    });
  }
  function transform3(hookName, element, payload) {
    const template = payload && payload.template;
    if (!template || template.name !== TEMPLATE_NAME) return;
    if (hookName === "onLoad") {
      preserveShowcaseBackgrounds(element);
      return;
    }
    if (hookName === "beforeTransform") {
      preserveShowcaseBackgrounds(element);
      const protectedEls = collectProtected(element, template);
      const remove = makeRemover(element, protectedEls);
      removeChrome2(element, remove);
      removeEmptyHeadings(element, remove);
      removeIntroRules(element);
      demoteBodyH1s(element);
      extractHeadingIcons(element);
      removeEmptySpacers(element, remove);
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
        ".uw-sl",
        ".uwy",
        "#onetrust-consent-sdk",
        "#kampyleButtonContainer",
        ".kampyle_button"
      ]);
      safeQueryAll2(element, "*").forEach((el) => {
        [...el.attributes].forEach(({ name }) => {
          if (name.startsWith("data-gtm") || name.startsWith("data-uw") || name.startsWith("data-track") || name === "onclick") {
            el.removeAttribute(name);
          }
        });
      });
    }
  }

  // tools/importer/transformers/beckmancoulter-solutions-sections.js
  var TEMPLATE_NAME2 = "solutions";
  var MARKER_ATTR2 = "data-excat-section-id";
  var GENERIC_SELECTOR = /div\.(page-content|intro-content)\s*(:[\w-]+(\([^)]*\))?)?\s*$/;
  function norm3(text) {
    return (text || "").replace(/\s+/g, " ").trim().toLowerCase();
  }
  function safeQuery2(root, selector) {
    try {
      return root.querySelector(selector);
    } catch (e) {
      return null;
    }
  }
  function contentRoot(element) {
    return element.querySelector("#main-container") || element;
  }
  function topLevel(el, element) {
    const root = contentRoot(element);
    let node = el;
    while (node && node.parentElement && node.parentElement !== root && node.parentElement !== element) {
      const parent = node.parentElement;
      if (parent.matches("div.sublayout") && parent.parentElement === root) return node;
      node = parent;
    }
    return el;
  }
  function findByName(element, name) {
    const target = norm3(name);
    if (!target) return null;
    const headings = [...contentRoot(element).querySelectorAll("h1, h2, h3, h4, h5, h6")];
    const h = headings.find((hd) => norm3(hd.textContent).startsWith(target));
    return h ? topLevel(h, element) : null;
  }
  function findBySelector(element, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      const el = safeQuery2(element, sel);
      if (el) return topLevel(el, element);
    }
    return null;
  }
  function isGeneric(section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    return selectors.every((sel) => !sel || GENERIC_SELECTOR.test(sel));
  }
  function findSectionElement2(element, section) {
    if (isGeneric(section)) {
      return findByName(element, section.name) || findBySelector(element, section);
    }
    return findBySelector(element, section) || findByName(element, section.name);
  }
  function transform4(hookName, element, payload) {
    const template = payload && payload.template;
    if (!template || template.name !== TEMPLATE_NAME2) return;
    const sections = template.sections || [];
    if (sections.length < 2) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = findSectionElement2(element, section);
        if (!el) continue;
        if (i === 0 && !section.style) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(MARKER_ATTR2, section.id);
        el.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`hr[${MARKER_ATTR2}="${section.id}"]`);
        let anchor = marker;
        if (!anchor) {
          anchor = findSectionElement2(element, section);
          if (!anchor) continue;
        }
        const metadata = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        let end = anchor.nextElementSibling;
        while (end && end.tagName !== "HR") end = end.nextElementSibling;
        if (end) end.before(metadata);
        else anchor.parentElement.append(metadata);
        if (marker) {
          if (i === 0) marker.remove();
          else marker.removeAttribute(MARKER_ATTR2);
        }
      }
    }
  }

  // tools/importer/transformers/beckmancoulter-dxs-cleanup.js
  var TEMPLATE_NAME3 = "dxs-service-and-supports";
  var ANCHOR_OVERRIDES = {
    IntelliServe: "key-benefits-of-remote-desktop-sharing"
  };
  var CHROME_SELECTORS3 = [
    // UserWay accessibility widget
    ".uw-sl",
    ".uwy",
    '[class*="userway"]',
    '[class^="uw-s"]',
    ".uwaw-dictionary-tooltip",
    // header / navigation / search
    "header",
    ".nav-container",
    "#universal-navigation",
    "#mobile-universal-nav",
    "#dx-navigation",
    ".primary-navigation",
    ".mobile-subnav-header",
    "#mobile-language-select-btn",
    ".global-search-spacer",
    ".coveo-global-search",
    // country selector + profile (gigya) modals
    ".country-language-modal",
    ".country-language-selector",
    ".gigya-prefs-modal",
    "#gigya-prefs-modal",
    // breadcrumb + share / print bar
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
    "#kampyleButtonContainer",
    ".kampyle_button",
    // spacers
    "div.line-break",
    // inline code
    "script",
    "style",
    "noscript",
    "link"
  ];
  function safeQueryAll3(root, selector) {
    try {
      return [...root.querySelectorAll(selector)];
    } catch (e) {
      return [];
    }
  }
  function norm4(text) {
    return (text || "").replace(/[\s ]+/g, " ").trim().toLowerCase();
  }
  function slugify(text) {
    return norm4(text).replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }
  function collectProtected2(element, template) {
    const set = /* @__PURE__ */ new Set();
    (template && template.blocks || []).forEach((block) => {
      (block.instances || []).forEach((sel) => {
        safeQueryAll3(element, sel).forEach((el) => set.add(el));
      });
    });
    return [...set];
  }
  function makeRemover2(element, protectedEls) {
    const main = element.querySelector("#main-container");
    return (el) => {
      if (!el || !el.isConnected) return;
      if (el === main || main && el.contains(main)) return;
      if (protectedEls.some((p) => p === el || el.contains(p))) return;
      el.remove();
    };
  }
  function hasMedia2(el) {
    return !!el.querySelector("img, picture, video, iframe, table, svg, input");
  }
  function isEmpty2(el) {
    return !norm4(el.textContent) && !hasMedia2(el);
  }
  function isEmptyHeading(h) {
    return norm4(h.textContent) === "empty heading" && !hasMedia2(h);
  }
  function removeChrome3(element, remove) {
    CHROME_SELECTORS3.forEach((sel) => {
      safeQueryAll3(element, sel).forEach(remove);
    });
    safeQueryAll3(element, "nav").forEach((nav) => {
      if (!nav.closest("#main-container")) remove(nav);
    });
    safeQueryAll3(element, ".ui.modal").forEach((el) => {
      if (/Choose your country\/region and language/i.test(el.textContent || "")) remove(el);
    });
    safeQueryAll3(element, "body > div, body > span").forEach((el) => {
      if (el.querySelector("#main-container")) return;
      if (isEmpty2(el)) remove(el);
    });
  }
  function removeEmptyHeadings2(element, remove) {
    safeQueryAll3(element, "h1, h2, h3, h4, h5, h6").forEach((h) => {
      if (isEmptyHeading(h)) remove(h);
    });
  }
  function removeEmptySpacers2(element, remove, protectedEls) {
    const inBlock = (el) => protectedEls.some((p) => p.contains(el));
    safeQueryAll3(element, "#main-container p").forEach((p) => {
      if (!inBlock(p) && isEmpty2(p)) remove(p);
    });
    safeQueryAll3(
      element,
      "#main-container section, #main-container div.page-content, #main-container div.sublayout, #main-container div.content-container"
    ).forEach((el) => {
      if (isEmpty2(el)) remove(el);
    });
  }
  function headingFor(target, element) {
    if (/^H[1-6]$/.test(target.tagName) && !isEmptyHeading(target)) return target;
    const main = element.querySelector("#main-container") || element;
    let node = target;
    while (node && node.parentElement && node.parentElement !== main) {
      const parent = node.parentElement;
      if (parent.matches("div.sublayout") && parent.parentElement === main) break;
      node = parent;
    }
    const headings = safeQueryAll3(node, "h1, h2, h3, h4, h5, h6").filter((h) => !isEmptyHeading(h));
    return headings[0] || null;
  }
  function rewriteInPageAnchors(element) {
    safeQueryAll3(element, 'a[href^="#"]').forEach((a) => {
      const id = (a.getAttribute("href") || "").slice(1);
      if (!id) return;
      if (ANCHOR_OVERRIDES[id]) {
        a.setAttribute("href", `#${ANCHOR_OVERRIDES[id]}`);
        return;
      }
      let target = null;
      try {
        target = element.querySelector(`#${CSS.escape(id)}`);
      } catch (e) {
        target = safeQueryAll3(element, "[id]").find((el) => el.id === id) || null;
      }
      if (!target) return;
      const h = headingFor(target, element);
      const slug = h && slugify(h.textContent);
      if (slug) a.setAttribute("href", `#${slug}`);
    });
  }
  function fixContactLink(element) {
    const doc = element.ownerDocument;
    safeQueryAll3(element, "#main-container a[href]").forEach((a) => {
      if (norm4(a.textContent) !== "contact us") return;
      const href = a.getAttribute("href") || "";
      if (/[?&](sc_database|preview|country|lang)=/i.test(href)) {
        const hashIdx = href.indexOf("#");
        const hash = hashIdx >= 0 ? href.slice(hashIdx) : "";
        const base = href.split(/[?#]/)[0];
        a.setAttribute("href", `${base}${hash}`);
      }
      a.removeAttribute("class");
      let strong = a.parentElement && a.parentElement.tagName === "STRONG" ? a.parentElement : null;
      if (!strong) {
        strong = doc.createElement("strong");
        a.replaceWith(strong);
        strong.append(a);
      }
      const parent = strong.parentElement;
      const alone = parent && parent.tagName === "P" && [...parent.childNodes].every((n) => n === strong || n.nodeType === 3 && !norm4(n.textContent));
      if (!alone) {
        const p = doc.createElement("p");
        if (parent && parent.tagName === "P") parent.after(p);
        else strong.before(p);
        p.append(strong);
      }
    });
  }
  function transform5(hookName, element, payload) {
    const template = payload && payload.template;
    if (!template || template.name !== TEMPLATE_NAME3) return;
    if (hookName === "beforeTransform") {
      const protectedEls = collectProtected2(element, template);
      const remove = makeRemover2(element, protectedEls);
      rewriteInPageAnchors(element);
      removeChrome3(element, remove);
      removeEmptyHeadings2(element, remove);
      fixContactLink(element);
      removeEmptySpacers2(element, remove, protectedEls);
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
        ".uw-sl",
        ".uwy",
        "#onetrust-consent-sdk",
        "#kampyleButtonContainer",
        ".kampyle_button"
      ]);
      safeQueryAll3(element, "*").forEach((el) => {
        [...el.attributes].forEach(({ name }) => {
          if (name.startsWith("data-gtm") || name.startsWith("data-uw") || name.startsWith("data-track") || name === "onclick") {
            el.removeAttribute(name);
          }
        });
      });
    }
  }

  // tools/importer/transformers/beckmancoulter-dxs-sections.js
  var TEMPLATE_NAME4 = "dxs-service-and-supports";
  var MARKER_ATTR3 = "data-excat-section-id";
  var GENERIC_SELECTOR2 = /div\.(page-content|intro-content)\s*(:[\w-]+(\([^)]*\))?)?\s*$/;
  function norm5(text) {
    return (text || "").replace(/[\s ]+/g, " ").trim().toLowerCase();
  }
  function safeQuery3(root, selector) {
    try {
      return root.querySelector(selector);
    } catch (e) {
      return null;
    }
  }
  function contentRoot2(element) {
    return element.querySelector("#main-container") || element;
  }
  function topLevel2(el, element) {
    const root = contentRoot2(element);
    let node = el;
    while (node && node.parentElement && node.parentElement !== root && node.parentElement !== element) {
      const parent = node.parentElement;
      if (parent.matches("div.sublayout") && parent.parentElement === root) return node;
      node = parent;
    }
    return node || el;
  }
  function findByName2(element, name) {
    const target = norm5(name);
    if (!target) return null;
    const root = contentRoot2(element);
    const pools = ["h1, h2, h3, h4, h5, h6", "p"];
    for (const sel of pools) {
      const match = [...root.querySelectorAll(sel)].find((n) => norm5(n.textContent).startsWith(target));
      if (match) return topLevel2(match, element);
    }
    return null;
  }
  function findBySelector2(element, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      const el = safeQuery3(element, sel);
      if (el) return topLevel2(el, element);
    }
    return null;
  }
  function isGeneric2(section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    return selectors.every((sel) => !sel || GENERIC_SELECTOR2.test(sel));
  }
  function findSectionElement3(element, section) {
    if (isGeneric2(section)) {
      return findByName2(element, section.name) || findBySelector2(element, section);
    }
    return findBySelector2(element, section) || findByName2(element, section.name);
  }
  function transform6(hookName, element, payload) {
    const template = payload && payload.template;
    if (!template || template.name !== TEMPLATE_NAME4) return;
    const sections = template.sections || [];
    if (sections.length < 2) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = findSectionElement3(element, section);
        if (!el) continue;
        if (i === 0 && !section.style) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(MARKER_ATTR3, section.id);
        el.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`hr[${MARKER_ATTR3}="${section.id}"]`);
        let anchor = marker;
        if (!anchor) {
          anchor = findSectionElement3(element, section);
          if (!anchor) continue;
        }
        const metadata = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        let end = anchor.nextElementSibling;
        while (end && end.tagName !== "HR") end = end.nextElementSibling;
        if (end) end.before(metadata);
        else anchor.parentElement.append(metadata);
        if (marker) {
          if (i === 0) marker.remove();
          else marker.removeAttribute(MARKER_ATTR3);
        }
      }
    }
  }

  // tools/importer/import-solutions.js
  var PAGE_TEMPLATE = {
    "name": "solutions",
    "urls": [
      "https://www.beckmancoulter.com/en/solutions/host-response-infection"
    ],
    "representativeUrl": "https://www.beckmancoulter.com/en/solutions/host-response-infection",
    "description": "Solution landing pages: left-aligned hero, intro copy, grey feature band, video row, biomarker table, centered CTA bands, partner showcase over background image, education resources carousel, contact form.",
    "blocks": [
      {
        "name": "hero-left",
        "instances": [
          "div.large-header-banner"
        ]
      },
      {
        "name": "cards-grid-features",
        "instances": [
          "div.data-visualization-container"
        ]
      },
      {
        "name": "cards-grid-video",
        "instances": [
          "div.col-3-default-padding:has(.vidyard-player-container)",
          'div.three.column.grid.container:has([class*="vidyard"])'
        ]
      },
      {
        "name": "table-grouped",
        "instances": [
          "#main-container div.page-content table"
        ]
      },
      {
        "name": "columns",
        "instances": [
          "div.adjustable-two-column-display"
        ]
      },
      {
        "name": "cards-grid-showcase",
        "instances": [
          "div.double-showcase-feature",
          "div.tripple-showcase-feature"
        ]
      },
      {
        "name": "carousel-resources",
        "instances": [
          "div.education-filter-carousel"
        ]
      },
      {
        "name": "form",
        "instances": [
          "form.mktoForm",
          'form[id^="mktoForm_"]'
        ]
      }
    ],
    "urlPattern": "/en/solutions/*",
    "sections": [
      {
        "id": "hero",
        "name": "Host Response to Infection",
        "selector": [
          "div.large-header-banner"
        ],
        "style": null,
        "blocks": [
          "hero-left"
        ],
        "defaultContent": []
      },
      {
        "id": "intro",
        "name": "Decoding the Host Response to Infection",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content:first-child"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          "h2",
          "p"
        ]
      },
      {
        "id": "infection",
        "name": "What Constitutes an Infection?",
        "selector": [
          "div.data-visualization-container"
        ],
        "style": "highlight",
        "blocks": [
          "cards-grid-features"
        ],
        "defaultContent": []
      },
      {
        "id": "story",
        "name": "The Host Response to Infection Tells a Powerful Story",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
        ],
        "style": null,
        "blocks": [
          "cards-grid-video"
        ],
        "defaultContent": [
          "h2",
          "p"
        ]
      },
      {
        "id": "biomarkers",
        "name": "Advancing Diagnostic Biomarkers",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
        ],
        "style": "centered",
        "blocks": [
          "table-grouped"
        ],
        "defaultContent": [
          "h2",
          "h3",
          "p"
        ]
      },
      {
        "id": "memed-cta",
        "name": "Powering the Testing You Need",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.intro-content"
        ],
        "style": "centered",
        "blocks": [],
        "defaultContent": [
          "h1",
          "p",
          "a.button"
        ]
      },
      {
        "id": "partnering",
        "name": "Partnering to Accelerate Clinical Research",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
        ],
        "style": "divider, centered",
        "blocks": [
          "columns"
        ],
        "defaultContent": [
          "h2",
          "p"
        ]
      },
      {
        "id": "companies",
        "name": "Cepheid",
        "selector": [
          "div.double-showcase-feature"
        ],
        "style": null,
        "blocks": [
          "cards-grid-showcase"
        ],
        "defaultContent": []
      },
      {
        "id": "ecosystem",
        "name": "Turn to the Danaher Ecosystem",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.intro-content"
        ],
        "style": "centered",
        "blocks": [],
        "defaultContent": [
          "h1",
          "p"
        ]
      },
      {
        "id": "efficiency",
        "name": "Improved Diagnostic Efficiency",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
        ],
        "style": "divider, centered",
        "blocks": [],
        "defaultContent": [
          "h2",
          "h3",
          "p"
        ]
      },
      {
        "id": "solutions",
        "name": "Innovative Biomarker Solutions",
        "selector": [
          "div.tripple-showcase-feature"
        ],
        "style": null,
        "blocks": [
          "cards-grid-showcase"
        ],
        "defaultContent": []
      },
      {
        "id": "resources",
        "name": "Educational Resources",
        "selector": [
          "div.education-filter-carousel"
        ],
        "style": null,
        "blocks": [
          "carousel-resources"
        ],
        "defaultContent": [
          "h2"
        ]
      },
      {
        "id": "contact",
        "name": "Speak to a Representative about MeMed BV",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
        ],
        "style": "centered",
        "blocks": [
          "form"
        ],
        "defaultContent": [
          "h2"
        ]
      },
      {
        "id": "disclaimer",
        "name": "Job code",
        "selector": [
          "div.disclaimer-text"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          "p"
        ]
      }
    ]
  };
  var parsers = {
    "hero-left": parse,
    "cards-grid-features": parse2,
    "cards-grid-video": parse3,
    "table-grouped": parse4,
    columns: parse5,
    "cards-grid-showcase": parse6,
    "carousel-resources": parse7,
    form: parse8
  };
  var transformers = [transform, transform2, transform3, transform4, transform5, transform6];
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
  var import_solutions_default = {
    // live page, before html2md copies the DOM (computed styles still available)
    onLoad: ({ document }) => {
      executeTransformers("onLoad", document.body, { document });
    },
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
  return __toCommonJS(import_solutions_exports);
})();
