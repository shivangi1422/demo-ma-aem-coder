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

  // tools/importer/import-dxs-service-and-supports.js
  var import_dxs_service_and_supports_exports = {};
  __export(import_dxs_service_and_supports_exports, {
    default: () => import_dxs_service_and_supports_default
  });

  // tools/importer/parsers/hero-split-left.js
  var clean = (str) => (str || "").replace(/\s+/g, " ").trim();
  var isUsableHref = (href) => !!href && href.trim() !== "" && href.trim() !== "#" && !/^javascript:/i.test(href.trim());
  var isMeaningfulAlt = (alt) => !!alt && !/^(next|prev|previous|image|img)$/i.test(alt);
  function parse(element, { document }) {
    const cells = [];
    const col1 = element.querySelector(".column-1") || element;
    const col2 = element.querySelector(".column-2") || element;
    const srcImg = [...col1.querySelectorAll("img")].find((i) => i.getAttribute("src") && !i.closest(".cloned"));
    const titleEl = col2.querySelector("h1") || col2.querySelector("h2");
    const title = clean(titleEl ? titleEl.textContent : "");
    if (srcImg) {
      const img = document.createElement("img");
      img.src = srcImg.getAttribute("src");
      const alt = clean(srcImg.getAttribute("alt"));
      img.alt = isMeaningfulAlt(alt) ? alt : "Remote connectivity";
      cells.push([[document.createComment(" field:image "), img]]);
    } else {
      cells.push([""]);
    }
    const textCell = [];
    if (title) {
      const h1 = document.createElement("h1");
      h1.textContent = title;
      textCell.push(h1);
    }
    const content = col2.querySelector(".content-container") || col2;
    content.querySelectorAll(".subhead-regular, p").forEach((el) => {
      if (el === titleEl) return;
      const text = clean(el.textContent);
      if (!text) return;
      const p = document.createElement("p");
      if (el.classList.contains("subhead-regular")) {
        const strong = document.createElement("strong");
        strong.textContent = text;
        p.append(strong);
        textCell.push(p);
        return;
      }
      const link = el.querySelector("a");
      if (link && clean(link.textContent) === text) {
        const href = link.getAttribute("href");
        if (isUsableHref(href) || href && href.startsWith("#") && href.length > 1) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = text;
          p.append(a);
        } else {
          p.textContent = text;
        }
        textCell.push(p);
        return;
      }
      p.textContent = text;
      textCell.push(p);
    });
    if (textCell.length) {
      textCell.unshift(document.createComment(" field:text "));
      cells.push([textCell]);
    } else {
      cells.push([""]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero (split-left)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-grid-features-purple.js
  var clean2 = (str) => (str || "").replace(/\s+/g, " ").trim();
  function bgUrl(el) {
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
      const iconImg = feature.querySelector(".chart-graph img");
      const src = iconImg && iconImg.getAttribute("src") || bgUrl(feature.querySelector(".custom-icon")) || bgUrl(feature.querySelector(".chart-graph"));
      if (src) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        imageCell.push(document.createComment(" field:image "), img);
      }
      const textCell = [];
      const titleEl = feature.querySelector(".chart-header");
      const title = clean2(titleEl ? titleEl.textContent : "");
      if (title) {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = title;
        p.append(strong);
        textCell.push(p);
      }
      const body = feature.querySelector(".chart-body");
      const desc = clean2(body ? body.textContent : "");
      if (desc) {
        const p = document.createElement("p");
        p.textContent = desc;
        textCell.push(p);
      }
      if (textCell.length) textCell.unshift(document.createComment(" field:text "));
      if (!imageCell.length && !textCell.length) return;
      cells.push([imageCell.length ? imageCell : "", textCell.length ? textCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-grid (features-purple)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-video.js
  var clean3 = (str) => (str || "").replace(/\s+/g, " ").trim();
  var isUsableHref2 = (href) => !!href && href.trim() !== "" && href.trim() !== "#" && !/^javascript:/i.test(href.trim());
  var VIDYARD_RE = /(?:play|embed|share)\.vidyard\.com\/(?:watch\/)?([A-Za-z0-9_-]+)/i;
  function vidyardUuid(root) {
    const withId = root.querySelector("[videoid], [uuid], [data-uuid]");
    if (withId) {
      const id = withId.getAttribute("videoid") || withId.getAttribute("uuid") || withId.getAttribute("data-uuid");
      if (clean3(id)) return clean3(id);
    }
    const link = [...root.querySelectorAll("a[href], iframe[src]")].map((el) => el.getAttribute("href") || el.getAttribute("src")).find((u) => VIDYARD_RE.test(u || ""));
    if (link) return link.match(VIDYARD_RE)[1];
    const cls = [...root.querySelectorAll('[class*="vidyard-div-"]')].map((el) => (el.className.match(/vidyard-div-([A-Za-z0-9_-]+)/) || [])[1]).find(Boolean);
    return cls || "";
  }
  function parse3(element, { document }) {
    const card = element.querySelector(".social-proof-card") || element;
    const mediaWrap = card.querySelector(".image") || card;
    const contentWrap = card.querySelector(".content") || card;
    const textCol = [];
    const titleEl = contentWrap.querySelector("h1, h2, h3");
    if (titleEl) {
      const labels = [...titleEl.querySelectorAll(".label")].map((l) => clean3(l.textContent)).filter(Boolean);
      if (labels.length) {
        const eyebrow = document.createElement("p");
        eyebrow.textContent = labels.join(" ");
        textCol.push(eyebrow);
      }
      const clone = titleEl.cloneNode(true);
      clone.querySelectorAll(".label").forEach((l) => l.remove());
      const titleText = clean3(clone.textContent);
      if (titleText) {
        const h2 = document.createElement("h2");
        h2.textContent = titleText;
        textCol.push(h2);
      }
    }
    contentWrap.querySelectorAll("p").forEach((srcP) => {
      const text = clean3(srcP.textContent);
      if (!text) return;
      const p = document.createElement("p");
      const link = srcP.querySelector("a");
      if (link && clean3(link.textContent) === text) {
        const href = link.getAttribute("href");
        if (isUsableHref2(href)) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = text;
          p.append(a);
        } else {
          p.textContent = text;
        }
      } else {
        p.textContent = text;
      }
      textCol.push(p);
    });
    const videoCol = [];
    const uuid = vidyardUuid(mediaWrap) || vidyardUuid(card);
    const posterSrc = [...mediaWrap.querySelectorAll("img")].map((i) => i.getAttribute("src")).find((s) => s && !/^data:/i.test(s));
    const videoTitle = clean3([
      titleEl && [...titleEl.querySelectorAll(".label")].map((l) => clean3(l.textContent)).filter(Boolean).join(" "),
      textCol.find((n) => n.tagName === "H2") && textCol.find((n) => n.tagName === "H2").textContent
    ].filter(Boolean).join(": "));
    if (uuid) {
      const img = document.createElement("img");
      img.src = posterSrc || `https://play.vidyard.com/${uuid}.jpg`;
      img.alt = videoTitle ? `${videoTitle.split(":")[0]} video` : "Video";
      videoCol.push(img);
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = `https://play.vidyard.com/${uuid}`;
      a.textContent = videoTitle || a.href;
      p.append(a);
      videoCol.push(p);
    } else if (posterSrc) {
      const img = document.createElement("img");
      img.src = posterSrc;
      img.alt = "";
      videoCol.push(img);
    }
    const cells = [[textCol.length ? textCol : "", videoCol.length ? videoCol : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/content-reversed.js
  var clean4 = (str) => (str || "").replace(/\s+/g, " ").trim();
  var isUsableHref3 = (href) => !!href && href.trim() !== "" && href.trim() !== "#" && !/^javascript:/i.test(href.trim());
  function parse4(element, { document }) {
    const cells = [];
    const imageSeg = element.querySelector(".adjustable-two-column-display-image");
    const textSeg = element.querySelector(".adjustable-two-column-display-content") || element;
    const srcImg = (imageSeg || element).querySelector("img[src]");
    if (srcImg) {
      const img = document.createElement("img");
      img.src = srcImg.getAttribute("src");
      img.alt = clean4(srcImg.getAttribute("alt"));
      cells.push([[document.createComment(" field:image "), img]]);
    } else {
      cells.push([""]);
    }
    const textCell = [];
    textSeg.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, a.button").forEach((el) => {
      if (imageSeg && imageSeg.contains(el)) return;
      const tag = el.tagName;
      if (/^H[1-6]$/.test(tag)) {
        const labels = [...el.querySelectorAll(".label")].map((l) => clean4(l.textContent)).filter(Boolean);
        if (labels.length) {
          const eyebrow = document.createElement("p");
          eyebrow.textContent = labels.join(" ");
          textCell.push(eyebrow);
        }
        const clone = el.cloneNode(true);
        clone.querySelectorAll(".label").forEach((l) => l.remove());
        const text2 = clean4(clone.textContent);
        if (!text2 || /^empty heading$/i.test(text2)) return;
        const h = document.createElement(tag === "H1" ? "h2" : tag.toLowerCase());
        h.textContent = text2;
        textCell.push(h);
        return;
      }
      if (tag === "UL" || tag === "OL") {
        if (el.parentElement.closest("ul, ol")) return;
        const list = document.createElement(tag.toLowerCase());
        el.querySelectorAll(":scope > li").forEach((li) => {
          const text2 = clean4(li.textContent);
          if (!text2) return;
          const item = document.createElement("li");
          item.textContent = text2;
          list.append(item);
        });
        if (list.children.length) textCell.push(list);
        return;
      }
      if (tag === "A") {
        if (el.closest("p")) return;
        const text2 = clean4(el.textContent);
        if (!text2) return;
        const p2 = document.createElement("p");
        const href = el.getAttribute("href");
        if (isUsableHref3(href)) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = text2;
          p2.append(a);
        } else {
          p2.textContent = text2;
        }
        textCell.push(p2);
        return;
      }
      if (el.closest("li")) return;
      const text = clean4(el.textContent);
      if (!text) return;
      const p = document.createElement("p");
      const link = el.querySelector("a");
      if (link && clean4(link.textContent) === text && isUsableHref3(link.getAttribute("href"))) {
        const a = document.createElement("a");
        a.href = link.getAttribute("href");
        a.textContent = text;
        p.append(a);
      } else {
        p.textContent = text;
      }
      textCell.push(p);
    });
    if (textCell.length) {
      textCell.unshift(document.createComment(" field:text "));
      cells.push([textCell]);
    } else {
      cells.push([""]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "content-reversed", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-resources.js
  var clean5 = (str) => (str || "").replace(/\s+/g, " ").trim();
  var isUsableHref4 = (href) => !!href && href.trim() !== "" && href.trim() !== "#" && !/^javascript:/i.test(href.trim());
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
  function parse5(element, { document }) {
    const cells = [];
    const headingEl = element.querySelector(":scope > h2, .carousel-heading");
    const headingText = clean5(headingEl ? headingEl.textContent : "");
    let heading = null;
    if (headingText && !/^empty heading$/i.test(headingText)) {
      heading = document.createElement("h2");
      heading.textContent = headingText;
    }
    const ul = document.createElement("ul");
    const seenLabels = /* @__PURE__ */ new Set();
    element.querySelectorAll(".filter-header .filter-button, .owl-filter-bar a, .filter-button").forEach((btn) => {
      const label = clean5(btn.textContent);
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
      const src = bgUrl2(item) || inlineImg && inlineImg.getAttribute("src") || "";
      if (src) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = clean5(inlineImg ? inlineImg.getAttribute("alt") : "");
        imageCell.push(document.createComment(" field:image "), img);
      }
      const textCell = [];
      const sub = item.querySelector(".subheading");
      const category = clean5(sub ? sub.textContent : "");
      if (category) {
        const p = document.createElement("p");
        p.textContent = category;
        textCell.push(p);
      }
      const titleEl = [...item.querySelectorAll("h1, h2, h3, h4, h5, h6")].find((h) => {
        const t = clean5(h.textContent);
        return t && !/^empty heading$/i.test(t);
      });
      if (titleEl) {
        const h3 = document.createElement("h3");
        h3.textContent = clean5(titleEl.textContent);
        textCell.push(h3);
      }
      item.querySelectorAll(".item-action a, .item-action .button").forEach((cta) => {
        const text = clean5(cta.textContent);
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

  // tools/importer/parsers/quote-banner.js
  var clean6 = (str) => (str || "").replace(/\s+/g, " ").trim();
  function parse6(element, { document }) {
    const cells = [];
    const quoteEl = element.querySelector(".quoteText") || element.querySelector(".quote");
    const quoteText = clean6(quoteEl ? quoteEl.textContent : "");
    if (quoteText) {
      const p = document.createElement("p");
      p.textContent = quoteText;
      cells.push([[document.createComment(" field:quote "), p]]);
    } else {
      cells.push([""]);
    }
    const attribution = [".author", ".title1", ".title2"].map((sel) => clean6((element.querySelector(sel) || {}).textContent)).filter(Boolean).join(", ");
    if (attribution) {
      cells.push([[document.createComment(" field:attribution "), document.createTextNode(attribution)]]);
    } else {
      cells.push([""]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "quote (banner)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-grid-solutions.js
  var clean7 = (str) => (str || "").replace(/\s+/g, " ").trim();
  var isUsableHref5 = (href) => !!href && href.trim() !== "" && href.trim() !== "#" && !/^javascript:/i.test(href.trim());
  function onclickUrl(el) {
    const onclick = el && el.getAttribute("onclick") || "";
    const m = onclick.match(/location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i) || onclick.match(/window\.open\(\s*['"]([^'"]+)['"]/i);
    return m ? m[1].trim() : "";
  }
  function buildTitle(titleEl, document) {
    const h3 = document.createElement("h3");
    [...titleEl.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        h3.append(document.createTextNode(node.textContent.replace(/\s+/g, " ")));
      } else if (node.nodeType === 1 && /^(EM|I|STRONG|B)$/.test(node.tagName)) {
        const tag = /^(EM|I)$/.test(node.tagName) ? "em" : "strong";
        const inline = document.createElement(tag);
        inline.textContent = clean7(node.textContent);
        if (inline.textContent) h3.append(inline);
      } else if (node.nodeType === 1) {
        h3.append(document.createTextNode(node.textContent.replace(/\s+/g, " ")));
      }
    });
    const first = h3.firstChild;
    if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, "");
    const last = h3.lastChild;
    if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, "");
    return clean7(h3.textContent) ? h3 : null;
  }
  function parse7(element, { document }) {
    const cells = [];
    cells.push([""]);
    const cards = [...element.querySelectorAll(":scope > .column .card, :scope > .column > .card")].filter((c, i, arr) => arr.indexOf(c) === i);
    cards.forEach((card) => {
      const url = onclickUrl(card) || card.querySelector("a[href]") && card.querySelector("a[href]").getAttribute("href") || "";
      const imageCell = [];
      const srcImg = card.querySelector(".image img[src], img[src]");
      const titleEl = card.querySelector(".card-header-text, .content .header");
      const titleText = clean7(titleEl ? titleEl.textContent : "");
      if (srcImg) {
        const img = document.createElement("img");
        img.src = srcImg.getAttribute("src");
        const alt = clean7(srcImg.getAttribute("alt"));
        const squash = (s) => s.replace(/\s+/g, "").toLowerCase();
        const truncated = !alt || alt.length <= 3 || squash(titleText).startsWith(squash(alt));
        img.alt = truncated ? titleText || alt : alt;
        imageCell.push(document.createComment(" field:image "), img);
      }
      const textCell = [];
      const tag = card.querySelector(".card-tag span");
      const tagText = clean7(tag ? tag.textContent : "");
      if (tagText && !card.querySelector(".card-tag.hide")) {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = tagText;
        p.append(strong);
        textCell.push(p);
      }
      if (titleEl) {
        const h3 = buildTitle(titleEl, document);
        if (h3) textCell.push(h3);
      }
      const desc = card.querySelector(".card-content-text");
      const descText = clean7(desc ? desc.textContent : "");
      if (descText) {
        const p = document.createElement("p");
        p.textContent = descText;
        textCell.push(p);
      }
      const cta = card.querySelector(".btn-cta, .explore-link a, .explore-link .button");
      const ctaText = clean7(cta ? cta.textContent : "");
      if (ctaText) {
        const p = document.createElement("p");
        const href = cta && cta.getAttribute("href") || url;
        if (isUsableHref5(href)) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = ctaText;
          p.append(a);
        } else {
          p.textContent = ctaText;
        }
        textCell.push(p);
      }
      if (textCell.length) textCell.unshift(document.createComment(" field:text "));
      if (!imageCell.length && !textCell.length) return;
      cells.push([imageCell.length ? imageCell : "", textCell.length ? textCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-grid (solutions)", cells });
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

  // tools/importer/import-dxs-service-and-supports.js
  var PAGE_TEMPLATE = {
    "name": "dxs-service-and-supports",
    "urls": [
      "https://www.beckmancoulter.com/en/products/dxs-service-and-supports/remote-services-and-diagnostics"
    ],
    "representativeUrl": "https://www.beckmancoulter.com/en/products/dxs-service-and-supports/remote-services-and-diagnostics",
    "description": "DxS service & support product pages: split hero, purple key-benefits band, video and image feature rows, resources carousel, dark quote banner, solution cards, centered contact CTA and disclaimer.",
    "blocks": [
      {
        "name": "hero-split-left",
        "instances": [
          "div.sublayout-two-column-dynamic"
        ]
      },
      {
        "name": "cards-grid-features-purple",
        "instances": [
          "div.data-visualization-container"
        ]
      },
      {
        "name": "columns-video",
        "instances": [
          "div.social-proof-section"
        ]
      },
      {
        "name": "content-reversed",
        "instances": [
          "div.adjustable-two-column-display"
        ]
      },
      {
        "name": "carousel-resources",
        "instances": [
          "div.education-filter-carousel"
        ]
      },
      {
        "name": "quote-banner",
        "instances": [
          "div.testimonial-slim"
        ]
      },
      {
        "name": "cards-grid-solutions",
        "instances": [
          'div.col-3-default-padding:not(:has([class*="vidyard"]))'
        ]
      }
    ],
    "urlPattern": "/en/products/dxs-service-and-supports/*",
    "sections": [
      {
        "id": "hero",
        "name": "Remote Services and Diagnostics",
        "selector": [
          "div.sublayout-two-column-dynamic"
        ],
        "style": null,
        "blocks": [
          "hero-split-left"
        ],
        "defaultContent": []
      },
      {
        "id": "key-benefits",
        "name": "Key Benefits of Remote Desktop Sharing",
        "selector": [
          "div.data-visualization-container"
        ],
        "style": null,
        "blocks": [
          "cards-grid-features-purple"
        ],
        "defaultContent": []
      },
      {
        "id": "intelliserve",
        "name": "DxS IntelliServe",
        "selector": [
          "div.social-proof-section"
        ],
        "style": null,
        "blocks": [
          "columns-video"
        ],
        "defaultContent": []
      },
      {
        "id": "proservice",
        "name": "DxS PROService",
        "selector": [
          "div.adjustable-two-column-display"
        ],
        "style": null,
        "blocks": [
          "content-reversed"
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
        "id": "tagline",
        "name": "Increase uptime and improve productivity with remote connectivity",
        "selector": [
          "div.testimonial-slim"
        ],
        "style": null,
        "blocks": [
          "quote-banner"
        ],
        "defaultContent": []
      },
      {
        "id": "solutions",
        "name": "Solutions designed for your laboratory needs",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
        ],
        "style": "centered",
        "blocks": [
          "cards-grid-solutions"
        ],
        "defaultContent": [
          "h2"
        ]
      },
      {
        "id": "contact-cta",
        "name": "Speak to a Representative about Remote Connectivity",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
        ],
        "style": "centered",
        "blocks": [],
        "defaultContent": [
          "h2",
          "a.button"
        ]
      },
      {
        "id": "disclaimer",
        "name": "This product may not be available",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
        ],
        "style": "divider, centered",
        "blocks": [],
        "defaultContent": [
          "p"
        ]
      }
    ]
  };
  var parsers = {
    "hero-split-left": parse,
    "cards-grid-features-purple": parse2,
    "columns-video": parse3,
    "content-reversed": parse4,
    "carousel-resources": parse5,
    "quote-banner": parse6,
    "cards-grid-solutions": parse7
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
  var import_dxs_service_and_supports_default = {
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
  return __toCommonJS(import_dxs_service_and_supports_exports);
})();
