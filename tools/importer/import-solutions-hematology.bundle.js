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
  var __defNormalProp = (obj, key2, value) => key2 in obj ? __defProp(obj, key2, { enumerable: true, configurable: true, writable: true, value }) : obj[key2] = value;
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
      for (let key2 of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key2) && key2 !== except)
          __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-solutions-hematology.js
  var import_solutions_hematology_exports = {};
  __export(import_solutions_hematology_exports, {
    default: () => import_solutions_hematology_default
  });

  // tools/importer/parsers/hero-left-video.js
  var clean = (str) => (str || "").replace(/[\s ]+/g, " ").trim();
  var isUsableHref = (href) => !!href && href.trim() !== "" && href.trim() !== "#" && !/^javascript:/i.test(href.trim());
  function bgUrl(el) {
    if (!el) return "";
    const style = el.getAttribute("style") || "";
    const m = style.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    return m ? m[1].replace(/&amp;/g, "&").trim() : "";
  }
  function parse(element, { document }) {
    const cells = [];
    const details = element.querySelector(".banner-details") || element;
    const titleEl = details.querySelector("h1") || details.querySelector("h2");
    const title = clean(titleEl && titleEl.textContent);
    const poster = element.querySelector('#video-tag-thumbnail, [id*="thumbnail"]');
    const srcImg = element.querySelector(".item-container img");
    const src = bgUrl(poster) || element.getAttribute("data-bg-src") || srcImg && srcImg.getAttribute("src") || "";
    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = title;
      cells.push([[document.createComment(" field:image "), img]]);
    } else {
      cells.push([""]);
    }
    const text = [];
    if (title) {
      const h1 = document.createElement("h1");
      h1.textContent = title;
      text.push(h1);
    }
    [...details.querySelectorAll("h2, h3, h4, h5, h6, p")].forEach((el) => {
      if (el === titleEl) return;
      const value = clean(el.textContent);
      if (!value) return;
      const link = el.querySelector("a");
      const p = document.createElement("p");
      if (link && clean(link.textContent) === value) {
        const href = link.getAttribute("href");
        if (isUsableHref(href)) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = value;
          if (/\bbutton\b/.test(link.className || "")) {
            const strong = document.createElement("strong");
            strong.append(a);
            p.append(strong);
          } else {
            p.append(a);
          }
        } else {
          p.textContent = value;
        }
      } else {
        p.textContent = value;
      }
      text.push(p);
    });
    if (text.length) {
      cells.push([[document.createComment(" field:text "), ...text]]);
    } else {
      cells.push([""]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero (left)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/embed-vidyard.js
  var clean2 = (str) => (str || "").replace(/[\s ]+/g, " ").trim();
  var VIDYARD_RE = /(?:play|embed|share)\.vidyard\.com\/(?:watch\/)?([A-Za-z0-9_-]+)/i;
  var isGenericTitle = (title) => !title || /^(play[-\s]?vidyard|vidyard|iframe|embed|frame|video|player|untitled)$/i.test(title) || /^https?:\/\//i.test(title);
  function headingBefore(element) {
    let node = element;
    for (let depth = 0; node && depth < 6; depth += 1) {
      let prev = node.previousElementSibling;
      while (prev) {
        const headings = /^H[1-6]$/.test(prev.tagName) ? [prev] : [...prev.querySelectorAll("h1, h2, h3, h4, h5, h6")];
        const h = headings.reverse().find((hd) => clean2(hd.textContent) && !/^empty heading$/i.test(clean2(hd.textContent)));
        if (h) return clean2(h.textContent);
        prev = prev.previousElementSibling;
      }
      node = node.parentElement;
    }
    return "";
  }
  function parse2(element, { document }) {
    const iframe = element.tagName === "IFRAME" ? element : element.querySelector("iframe");
    const src = iframe ? iframe.getAttribute("src") || iframe.getAttribute("data-src") || "" : "";
    const match = src.match(VIDYARD_RE);
    const url = match ? `https://play.vidyard.com/${match[1]}` : src.trim();
    const cells = [];
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.textContent = url;
      cells.push([[document.createComment(" field:url "), a]]);
    } else {
      cells.push([""]);
    }
    const iframeTitle = clean2(iframe && iframe.getAttribute("title"));
    const heading = headingBefore(element);
    const title = !isGenericTitle(iframeTitle) ? iframeTitle : heading ? `Video: ${heading}` : "";
    if (title) {
      cells.push([[document.createComment(" field:title "), document.createTextNode(title)]]);
    } else {
      cells.push([""]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "embed", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote-customer-testimonial.js
  var clean3 = (str) => (str || "").replace(/[\s ]+/g, " ").trim();
  var OPEN_RE = /^[“”"„«‘’']+\s*/;
  var CLOSE_RE = /\s*[“”"„»‘’']+$/;
  function lines(el) {
    const out = [""];
    const walk = (node) => {
      node.childNodes.forEach((child) => {
        if (child.nodeName === "BR") out.push("");
        else if (child.nodeType === 3) out[out.length - 1] += child.textContent;
        else walk(child);
      });
    };
    walk(el);
    return out.map(clean3).filter(Boolean);
  }
  function parse3(element, { document }) {
    const quoteText = element.querySelector(".quoteText") || element.querySelector(".quote") || element;
    const attributionEl = [...quoteText.querySelectorAll("p")].find((p) => p.querySelector("strong") && clean3(p.textContent));
    const clone = quoteText.cloneNode(true);
    const cloneAttribution = [...clone.querySelectorAll("p")].find((p) => p.querySelector("strong") && clean3(p.textContent));
    if (cloneAttribution) cloneAttribution.remove();
    clone.querySelectorAll(".quoteBefore, .quoteAfter, svg, img").forEach((g) => g.remove());
    const blocks = [...clone.querySelectorAll("p, span")].filter((el) => !el.parentElement.closest("p, span") || el.parentElement === clone);
    let texts = blocks.map((el) => clean3(el.textContent)).filter(Boolean);
    if (!texts.length) texts = [clean3(clone.textContent)].filter(Boolean);
    const quoteNodes = texts.map((text, i) => {
      let t = text;
      if (i === 0) t = t.replace(OPEN_RE, "");
      if (i === texts.length - 1) t = t.replace(CLOSE_RE, "");
      const p = document.createElement("p");
      p.textContent = t;
      return p;
    }).filter((p) => p.textContent);
    const cells = [];
    cells.push(quoteNodes.length ? [[document.createComment(" field:quote "), ...quoteNodes]] : [""]);
    const parts = attributionEl ? lines(attributionEl) : [];
    if (parts.length) {
      cells.push([[document.createComment(" field:attribution "), document.createTextNode(parts.join("\\n"))]]);
    } else {
      cells.push([""]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "quote (testimonial-purple)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  var clean4 = (str) => (str || "").replace(/\s+/g, " ").trim();
  var isUsableHref2 = (href) => !!href && href.trim() !== "" && href.trim() !== "#";
  function buildTextColumn(segment, document) {
    const out = [];
    segment.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, a.button, a.ui.button").forEach((el) => {
      if (el.parentElement && el.parentElement.closest("p, ul, ol, h1, h2, h3, h4, h5, h6") && segment.contains(el.parentElement.closest("p, ul, ol, h1, h2, h3, h4, h5, h6"))) return;
      const tag = el.tagName;
      if (/^H[1-6]$/.test(tag)) {
        const text = clean4(el.textContent);
        if (!text || /^empty heading$/i.test(text)) return;
        const h = document.createElement(tag === "H1" ? "h2" : tag.toLowerCase());
        h.textContent = text;
        out.push(h);
        return;
      }
      if (tag === "A") {
        const text = clean4(el.textContent);
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
      if (!clean4(el.textContent)) return;
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
      img.alt = clean4(srcImg.getAttribute("alt"));
      out.push(img);
    });
    return out;
  }
  function parse4(element, { document }) {
    const container = element.querySelector(".content-container") || element;
    let segments = [...container.querySelectorAll(":scope > .segment, :scope > div")];
    if (!segments.length) {
      segments = [
        element.querySelector(".adjustable-two-column-display-content"),
        element.querySelector(".adjustable-two-column-display-image")
      ].filter(Boolean);
    }
    const row = segments.slice(0, 2).map((segment) => {
      const isImage = segment.classList.contains("adjustable-two-column-display-image") || !clean4(segment.textContent) && !!segment.querySelector("img");
      const content = isImage ? buildImageColumn(segment, document) : buildTextColumn(segment, document);
      return content.length ? content : "";
    });
    while (row.length < 2) row.push("");
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-hematology.js
  var clean5 = (str) => (str || "").replace(/[\s ]+/g, " ").trim();
  var isUsableHref3 = (href) => !!href && href.trim() !== "" && href.trim() !== "#" && !/^javascript:/i.test(href.trim());
  var VIDYARD_RE2 = /(?:play|embed|share)\.vidyard\.com\/(?:watch\/)?([A-Za-z0-9_-]+)/i;
  var isEmptyHeading = (text) => !text || /^empty heading$/i.test(text);
  function vidyardUuid(root) {
    const withId = root.querySelector("[videoid], [uuid], [data-uuid]");
    if (withId) {
      const id = withId.getAttribute("videoid") || withId.getAttribute("uuid") || withId.getAttribute("data-uuid");
      if (clean5(id)) return clean5(id);
    }
    const src = [...root.querySelectorAll("iframe[src]")].map((el) => el.getAttribute("src")).find((u) => VIDYARD_RE2.test(u || ""));
    return src ? src.match(VIDYARD_RE2)[1] : "";
  }
  function copyInline(src, dest, document) {
    src.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        dest.append(document.createTextNode(node.textContent));
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName;
      if (/^(SCRIPT|STYLE|NOSCRIPT|IFRAME|VIDEO|IMG|SVG|BR)$/.test(tag)) return;
      if (tag === "A") {
        if (!clean5(node.textContent)) return;
        const href = node.getAttribute("href");
        if (isUsableHref3(href)) {
          const a = document.createElement("a");
          a.href = href.trim();
          copyInline(node, a, document);
          dest.append(a);
        } else {
          copyInline(node, dest, document);
        }
        return;
      }
      if (/^(STRONG|B|EM|I)$/.test(tag)) {
        if (!clean5(node.textContent)) return;
        const el = document.createElement(/^(STRONG|B)$/.test(tag) ? "strong" : "em");
        copyInline(node, el, document);
        dest.append(el);
        return;
      }
      copyInline(node, dest, document);
    });
  }
  function richText(container, document) {
    const out = [];
    let run = null;
    const flush = () => {
      if (run && clean5(run.textContent)) out.push(run);
      run = null;
    };
    const addInline = (node) => {
      if (!run) run = document.createElement("p");
      const holder = document.createElement("span");
      holder.append(node.cloneNode(true));
      copyInline(holder, run, document);
    };
    const visit = (parent) => {
      parent.childNodes.forEach((node) => {
        if (node.nodeType === 3) {
          if (clean5(node.textContent) || run) addInline(node);
          return;
        }
        if (node.nodeType !== 1) return;
        const tag = node.tagName;
        if (/^(SCRIPT|STYLE|NOSCRIPT|IFRAME|VIDEO|IMG|SVG)$/.test(tag)) return;
        if (node.matches(".vidyard-player-container")) return;
        if (tag === "BR") {
          flush();
          return;
        }
        if (/^H[1-6]$/.test(tag)) {
          flush();
          const text = clean5(node.textContent);
          if (isEmptyHeading(text)) return;
          const h = document.createElement(tag === "H1" ? "h2" : tag.toLowerCase());
          h.textContent = text;
          out.push(h);
          return;
        }
        if (tag === "UL" || tag === "OL") {
          flush();
          const list = document.createElement(tag.toLowerCase());
          node.querySelectorAll(":scope > li").forEach((li) => {
            if (!clean5(li.textContent)) return;
            const item = document.createElement("li");
            copyInline(li, item, document);
            list.append(item);
          });
          if (list.children.length) out.push(list);
          return;
        }
        if (tag === "P") {
          flush();
          if (!clean5(node.textContent)) return;
          const p = document.createElement("p");
          copyInline(node, p, document);
          out.push(p);
          return;
        }
        if (tag === "DIV" || node.querySelector("h1, h2, h3, h4, h5, h6, p, ul, ol, div")) {
          flush();
          visit(node);
          flush();
          return;
        }
        addInline(node);
      });
    };
    visit(container);
    flush();
    let prevSource = 2;
    let prev = 2;
    return out.map((node) => {
      if (!/^H[1-6]$/.test(node.tagName)) return node;
      const source = Number(node.tagName[1]);
      let level = source;
      if (source === prevSource) level = prev;
      else if (source > prevSource) level = Math.min(source, prev + 1);
      prevSource = source;
      prev = level;
      if (`H${level}` === node.tagName) return node;
      const h = document.createElement(`h${level}`);
      h.textContent = node.textContent;
      return h;
    });
  }
  function parse5(element, { document }) {
    let segments;
    if (element.matches(".social-proof-section")) {
      const card = element.querySelector(".social-proof-card") || element;
      segments = [card.querySelector(".image"), card.querySelector(".content")];
    } else {
      segments = [element.querySelector(".column-1"), element.querySelector(".column-2")];
    }
    segments = segments.map((seg) => seg || document.createElement("div"));
    const texts = segments.map((seg) => richText(seg, document));
    const isVideo = segments.map((seg, i) => !!vidyardUuid(seg) && !texts[i].some((n) => /^H[1-6]$/.test(n.tagName)));
    const row = segments.map((seg, i) => {
      if (isVideo[i]) {
        const other = texts.find((t, j) => j !== i && !isVideo[j]) || [];
        const heading = other.find((n) => /^H[1-6]$/.test(n.tagName));
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = `https://play.vidyard.com/${vidyardUuid(seg)}`;
        a.textContent = heading ? clean5(heading.textContent) : a.href;
        p.append(a);
        return [p];
      }
      return texts[i].length ? texts[i] : "";
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "columns", cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote-photo-carousel.js
  var clean6 = (str) => (str || "").replace(/[\s ]+/g, " ").trim();
  var OPEN_RE2 = /^[“”"„«‘’']+\s*/;
  var CLOSE_RE2 = /\s*[“”"„»‘’']+$/;
  function lines2(el) {
    const out = [""];
    const walk = (node) => {
      node.childNodes.forEach((child) => {
        if (child.nodeName === "BR") out.push("");
        else if (child.nodeType === 3) out[out.length - 1] += child.textContent;
        else if (child.nodeType === 1) walk(child);
      });
    };
    walk(el);
    return out.map(clean6).filter(Boolean);
  }
  function slideBlock(slide, document) {
    const heading = slide.querySelector(".banner-heading") || slide;
    const paras = [...heading.querySelectorAll("p")].filter((p) => clean6(p.textContent));
    const attributionEl = paras.find((p) => p.querySelector("strong"));
    const quoteParas = paras.filter((p) => p !== attributionEl);
    if (!quoteParas.length) return null;
    const cells = [];
    const quoteNodes = quoteParas.map((para, i) => {
      let t = clean6(para.textContent);
      if (i === 0) t = t.replace(OPEN_RE2, "");
      if (i === quoteParas.length - 1) t = t.replace(CLOSE_RE2, "");
      const p = document.createElement("p");
      p.textContent = t;
      return p;
    }).filter((p) => p.textContent);
    cells.push([[document.createComment(" field:quote "), ...quoteNodes]]);
    const parts = attributionEl ? lines2(attributionEl) : [];
    if (parts.length) {
      cells.push([[document.createComment(" field:attribution "), document.createTextNode(parts.join(", "))]]);
    } else {
      cells.push([""]);
    }
    return WebImporter.Blocks.createBlock(document, { name: "quote (testimonial)", cells });
  }
  function parse6(element, { document }) {
    let slides = [...element.querySelectorAll(".owl-item:not(.cloned)")];
    if (!slides.length) slides = [...element.querySelectorAll(".item")];
    const blocks = slides.map((slide) => slideBlock(slide, document)).filter(Boolean);
    if (!blocks.length) {
      element.remove();
      return;
    }
    element.replaceWith(...blocks);
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
    const slug2 = (text) => (text || "").toLowerCase().replace(/[^0-9a-z]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    safeQueryAll(element, 'a[href^="#"]').forEach((a) => {
      const id = a.getAttribute("href").slice(1);
      if (!id) return;
      const heading = safeQueryAll(element, "h1, h2, h3, h4, h5, h6").find((h) => h.id === id);
      if (heading) a.setAttribute("href", `#${slug2(heading.textContent)}`);
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
  function isEmptyHeading2(h) {
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
      if (isEmptyHeading2(h)) remove(h);
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
    if (/^H[1-6]$/.test(target.tagName) && !isEmptyHeading2(target)) return target;
    const main = element.querySelector("#main-container") || element;
    let node = target;
    while (node && node.parentElement && node.parentElement !== main) {
      const parent = node.parentElement;
      if (parent.matches("div.sublayout") && parent.parentElement === main) break;
      node = parent;
    }
    const headings = safeQueryAll3(node, "h1, h2, h3, h4, h5, h6").filter((h) => !isEmptyHeading2(h));
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
      const slug2 = h && slugify(h.textContent);
      if (slug2) a.setAttribute("href", `#${slug2}`);
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

  // tools/importer/transformers/beckmancoulter-product-cleanup.js
  var PRODUCT_TEMPLATES = [
    "product-detail-informatics",
    "product-detail-automation",
    "product-category"
  ];
  var PREVIEW_PARAMS = ["sc_database", "preview", "country", "lang", "_ga", "_gl"];
  var ALWAYS_PROTECTED = ['iframe[src*="genial.ly"]', 'iframe[src*="genially"]'];
  var ITEM_LINKS = {
    "72F8A13D-4071-49C6-8E5C-2A6948EF4047": "/en/products/immunoassay"
  };
  var REQUEST_INFO_HREF = "https://www.beckmancoulter.com/wsrportal/page/requestQuote";
  var CHROME_SELECTORS4 = [
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
    // breadcrumb + share / print bar (incl. the sublayout that holds it)
    "div.sublayout.photo-header-container",
    ".photo-header-container",
    ".breadcrumb-container",
    ".breadcrumbs",
    ".share-container",
    ".print-container",
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
    '[id^="kampyle"]',
    // spacers
    "div.line-break",
    // slider controls / clones
    ".owl-nav",
    ".owl-prev",
    ".owl-next",
    ".owl-dots",
    ".owl-item.cloned",
    ".slick-prev",
    ".slick-next",
    ".slick-dots",
    ".slick-cloned",
    ".swiper-button-prev",
    ".swiper-button-next",
    ".swiper-pagination",
    // tabs: mobile "Filter By" dropdown duplicates the tab labels
    ".tabs-mobile-dropdown",
    // Documents tab: client-side tech-doc search UI (link is kept)
    ".filters-dropdowns",
    "#sort-dropdown-header",
    ".techdocssearch",
    // rich-text editor toolbar junk inside tab panels
    ".tb_button",
    '[class*="tb_button"]',
    '[id^="ws_toolbar"]',
    '[class*="ws_toolbar"]',
    // shop widget status ("Added" / "Error") and spinners
    ".add-to-quote i.icon",
    ".add-to-quote .loader",
    ".product-links i.checkmark.icon",
    ".product-links i.exclamation.icon",
    // inline code
    "script",
    "style",
    "noscript",
    "link"
  ];
  var TEMP_ATTR_PREFIX = "data-excat-";
  function safeQueryAll4(root, selector) {
    try {
      return [...root.querySelectorAll(selector)];
    } catch (e) {
      return [];
    }
  }
  function norm6(text) {
    return (text || "").replace(/[\s ]+/g, " ").trim().toLowerCase();
  }
  function slugify2(text) {
    return norm6(text).replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }
  function contentRoot3(element) {
    return element.querySelector("#main-container") || element;
  }
  function collectProtected3(element, template) {
    const set = /* @__PURE__ */ new Set();
    ALWAYS_PROTECTED.forEach((sel) => safeQueryAll4(element, sel).forEach((el) => set.add(el)));
    (template && template.blocks || []).forEach((block) => {
      (block.instances || []).forEach((sel) => {
        safeQueryAll4(element, sel).forEach((el) => set.add(el));
      });
    });
    return [...set];
  }
  function makeRemover3(element, protectedEls) {
    const main = element.querySelector("#main-container");
    return (el) => {
      if (!el || !el.isConnected) return;
      if (el === element || el === main || main && el.contains(main)) return;
      if (protectedEls.some((p) => p === el || el.contains(p))) return;
      el.remove();
    };
  }
  function hasMedia3(el) {
    return !!el.querySelector("img, picture, video, iframe, table, svg, input, select, textarea, hr");
  }
  function isEmpty3(el) {
    return !norm6(el.textContent) && !hasMedia3(el);
  }
  function isEmptyHeading3(h) {
    return norm6(h.textContent) === "empty heading" && !hasMedia3(h);
  }
  function hasTempAttr(el) {
    return [...el.attributes].some(({ name }) => name.startsWith(TEMP_ATTR_PREFIX) || name === "data-bg-src" || name === "data-icon-src");
  }
  function renameTag2(el, tagName) {
    const doc = el.ownerDocument;
    const next = doc.createElement(tagName);
    [...el.attributes].forEach(({ name, value }) => next.setAttribute(name, value));
    while (el.firstChild) next.append(el.firstChild);
    el.replaceWith(next);
    return next;
  }
  var URL_RE = /url\(\s*['"]?([^'")]+)['"]?\s*\)/i;
  function bgUrlOf(el) {
    if (!el || !el.getAttribute) return "";
    const inline = (el.getAttribute("style") || "").match(URL_RE);
    if (inline && inline[1]) return inline[1].replace(/&amp;/g, "&").trim();
    try {
      const view = el.ownerDocument && el.ownerDocument.defaultView;
      if (!view || !view.getComputedStyle) return "";
      const computed = (view.getComputedStyle(el).backgroundImage || "").match(URL_RE);
      return computed && computed[1] ? computed[1].trim() : "";
    } catch (e) {
      return "";
    }
  }
  var SHOWCASE_SELECTOR = "div.double-showcase-feature, div.tripple-showcase-feature";
  var PHOTO_FEATURE_SELECTOR = "div.photo-feature";
  var PROMO_SELECTOR = "div.photo-hero-promotional-banner";
  function recordClickTargets(element) {
    safeQueryAll4(contentRoot3(element), "[onclick]").forEach((el) => {
      if (el.getAttribute("data-href")) return;
      const onclick = el.getAttribute("onclick") || "";
      const m = onclick.match(/location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i) || onclick.match(/window\.open\(\s*['"]([^'"]+)['"]/i) || onclick.match(/openUrl\(\s*['"]([^'"]+)['"]/i);
      if (m && m[1]) el.setAttribute("data-href", m[1]);
    });
  }
  function liftProductListHeadings(element) {
    safeQueryAll4(element, "div.product-list").forEach((list) => {
      const heading = list.querySelector(":scope > .content-container > .heading, :scope > .heading");
      if (!heading || !heading.querySelector("h1, h2, h3, h4, h5, h6")) return;
      list.before(heading);
    });
    safeQueryAll4(element, "div.product-list .product-card hr").forEach((hr) => hr.remove());
  }
  var PHOTO_BG_SELECTOR = ".image-container.bg-parallax, .bg-parallax, .image-container";
  function dropRecordedBackgroundImages(element) {
    safeQueryAll4(element, `${PHOTO_FEATURE_SELECTOR}[data-bg-src]`).forEach((el) => {
      const src = el.getAttribute("data-bg-src");
      safeQueryAll4(el, PHOTO_BG_SELECTOR).forEach((holder) => {
        safeQueryAll4(holder, ":scope > img[src]").forEach((img) => {
          const s = (img.getAttribute("src") || "").replace(/&amp;/g, "&");
          if (s === src || s.split("?")[0] === src.split("?")[0]) img.remove();
        });
      });
    });
  }
  var ITEM_SELECTOR = [
    ".chart-feature",
    ".feature-content",
    ".showcase-feature",
    ".product-card",
    ".photo-card",
    ".card",
    ".owl-item",
    ".item",
    "li"
  ].join(", ");
  function preserveBackgrounds(element, protectedEls) {
    safeQueryAll4(element, SHOWCASE_SELECTOR).forEach((el) => {
      if (el.getAttribute("data-bg-src")) return;
      const bgs = [...el.querySelectorAll(".floating-bg")];
      let src = [...bgs, el].map(bgUrlOf).find(Boolean);
      if (!src) {
        const img = bgs.map((b) => b.querySelector("img[src]")).find(Boolean);
        src = img ? img.getAttribute("src") : "";
      }
      if (src) el.setAttribute("data-bg-src", src);
    });
    safeQueryAll4(element, PHOTO_FEATURE_SELECTOR).forEach((el) => {
      if (el.getAttribute("data-bg-src")) return;
      const holders = safeQueryAll4(el, PHOTO_BG_SELECTOR);
      let src = [...holders, el].map(bgUrlOf).find(Boolean);
      if (!src) {
        const img = holders.map((h) => h.querySelector(":scope > img[src]")).find(Boolean);
        src = img ? img.getAttribute("src") : "";
      }
      if (src) el.setAttribute("data-bg-src", src);
    });
    safeQueryAll4(element, PROMO_SELECTOR).forEach((el) => {
      if (el.getAttribute("data-bg-src")) return;
      let src = [el, ...el.querySelectorAll(":scope > .image-container, :scope > .bg-parallax, :scope > .floating-bg")].map(bgUrlOf).find(Boolean);
      if (!src) {
        const img = el.querySelector(":scope > img[src], :scope > picture img[src]");
        src = img ? img.getAttribute("src") : "";
      }
      if (src) el.setAttribute("data-bg-src", src);
    });
    protectedEls.forEach((block) => {
      if (!block.isConnected || block.matches(SHOWCASE_SELECTOR)) return;
      [block, ...block.querySelectorAll("div, span, a, i")].forEach((el) => {
        if (el.closest(SHOWCASE_SELECTOR)) return;
        if (el.getAttribute("data-bg-src") || el.getAttribute("data-icon-src")) return;
        const style = el.getAttribute("style") || "";
        const view = el.ownerDocument && el.ownerDocument.defaultView;
        const liveStyles = !!(view && view.getComputedStyle && el.ownerDocument.styleSheets && el.ownerDocument.styleSheets.length);
        if (!/url\(/i.test(style) && !liveStyles) return;
        const src = bgUrlOf(el);
        if (!src || /^data:/i.test(src)) return;
        if (isEmpty3(el)) {
          let holder = el.parentElement && el.parentElement.closest(ITEM_SELECTOR);
          if (!holder || !block.contains(holder)) holder = el.parentElement || block;
          if (!holder.getAttribute("data-icon-src")) holder.setAttribute("data-icon-src", src);
        } else {
          el.setAttribute("data-bg-src", src);
        }
      });
    });
  }
  function stripPreviewParams(href) {
    if (!href || !/[?&]/.test(href)) return href;
    const hashIdx = href.indexOf("#");
    const hash = hashIdx >= 0 ? href.slice(hashIdx) : "";
    const beforeHash = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
    const qIdx = beforeHash.indexOf("?");
    if (qIdx < 0) return href;
    const base = beforeHash.slice(0, qIdx);
    const query = beforeHash.slice(qIdx + 1);
    const kept = query.split("&").filter((pair) => {
      if (!pair) return false;
      const key2 = decodeURIComponentSafe(pair.split("=")[0]).toLowerCase();
      return !PREVIEW_PARAMS.includes(key2);
    });
    return `${base}${kept.length ? `?${kept.join("&")}` : ""}${hash}`;
  }
  function decodeURIComponentSafe(str) {
    try {
      return decodeURIComponent(str);
    } catch (e) {
      return str;
    }
  }
  function cleanLinks(element) {
    safeQueryAll4(element, "a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      const next = stripPreviewParams(href);
      if (next !== href) a.setAttribute("href", next);
    });
  }
  function headingText(h) {
    const clone = h.cloneNode(true);
    clone.querySelectorAll(".label, .sub-header, .data-uw-rm-autofix-hide").forEach((s) => s.remove());
    return clone.textContent;
  }
  function headingFor2(target, element) {
    if (/^H[1-6]$/.test(target.tagName) && !isEmptyHeading3(target)) return target;
    const inner = safeQueryAll4(target, "h1, h2, h3, h4, h5, h6").find((h) => !isEmptyHeading3(h));
    if (inner) return inner;
    const all = safeQueryAll4(contentRoot3(element), "h1, h2, h3, h4, h5, h6").filter((h) => !isEmptyHeading3(h));
    return all.find(
      (h) => target.compareDocumentPosition(h) & 4
      /* FOLLOWING */
    ) || null;
  }
  function findById(element, id) {
    return safeQueryAll4(element, "[id]").find((el) => el.id === id) || safeQueryAll4(element, "a[name]").find((el) => el.getAttribute("name") === id) || null;
  }
  function rewriteInPageAnchors2(element, url) {
    let pagePath = "";
    try {
      pagePath = url ? new URL(url).pathname.replace(/\/$/, "") : "";
    } catch (e) {
      pagePath = "";
    }
    const tabs = collectTabSlugs(element);
    safeQueryAll4(contentRoot3(element), 'a[href*="#"]').forEach((a) => {
      const href = a.getAttribute("href") || "";
      const hashIdx = href.indexOf("#");
      const before = href.slice(0, hashIdx).split("?")[0].replace(/\/$/, "");
      let samePage = !before;
      if (!samePage && pagePath) {
        try {
          samePage = new URL(before, url).pathname.replace(/\/$/, "") === pagePath;
        } catch (e) {
          samePage = false;
        }
      }
      if (!samePage) return;
      const id = decodeURIComponentSafe(href.slice(hashIdx + 1)).replace(/^\/+/, "");
      if (!id) return;
      const tabSlug = tabs.get(slugify2(id)) || tabs.get(slugify2(id.replace(/^tab-/, "")));
      if (tabSlug) {
        a.setAttribute("href", `#${tabSlug}`);
        return;
      }
      const target = findById(element, id);
      if (!target) {
        if (href !== `#${id}`) a.setAttribute("href", `#${id}`);
        return;
      }
      const h = headingFor2(target, element);
      const slug2 = h && slugify2(headingText(h));
      if (slug2) a.setAttribute("href", `#${slug2}`);
    });
  }
  function collectTabSlugs(element) {
    const map = /* @__PURE__ */ new Map();
    safeQueryAll4(element, ".product-tabs .ui.menu a.item, .product-tabs .tabs .menu a.item").forEach((tab) => {
      const slug2 = slugify2(tab.textContent);
      if (!slug2) return;
      map.set(slug2, slug2);
      if (tab.id) map.set(slugify2(tab.id.replace(/^tab-/, "")), slug2);
    });
    return map;
  }
  function rewriteItemLinks(element) {
    safeQueryAll4(element, 'a[href*="item="]').forEach((a) => {
      const href = a.getAttribute("href") || "";
      const m = decodeURIComponentSafe(href).match(/[?&]item=[^{&]*\{([0-9a-f-]{36})\}/i);
      if (!m) return;
      const path = ITEM_LINKS[m[1].toUpperCase()];
      if (path) a.setAttribute("href", path);
      else console.warn(`[product-cleanup] unmapped Sitecore item link: ${href}`);
    });
  }
  function removeChrome4(element, remove) {
    CHROME_SELECTORS4.forEach((sel) => {
      safeQueryAll4(element, sel).forEach(remove);
    });
    safeQueryAll4(element, "nav").forEach((nav) => {
      if (!nav.closest("#main-container")) remove(nav);
    });
    safeQueryAll4(element, ".ui.modal, .bc-modal").forEach((el) => {
      if (!el.closest("#main-container") || /Choose your country\/region and language/i.test(el.textContent || "")) remove(el);
    });
    safeQueryAll4(element, "body > div, body > span, body > iframe").forEach((el) => {
      if (el.id === "main-container" || el.querySelector("#main-container")) return;
      remove(el);
    });
    const main = element.querySelector("#main-container");
    if (main && main.parentElement && main.parentElement !== element) {
      [...main.parentElement.children].forEach((sib) => {
        if (sib !== main) remove(sib);
      });
    }
  }
  function removeEmptyHeadings3(element, remove) {
    safeQueryAll4(element, "h1, h2, h3, h4, h5, h6").forEach((h) => {
      if (isEmptyHeading3(h)) remove(h);
    });
  }
  function removeEmptyLists(element, remove) {
    safeQueryAll4(contentRoot3(element), "ul, ol").forEach((list) => {
      if (isEmpty3(list)) remove(list);
    });
  }
  function removeEmptySpacers3(element, remove, protectedEls) {
    const root = contentRoot3(element);
    const inBlock = (el) => protectedEls.some((p) => p.contains(el));
    safeQueryAll4(root, "p").forEach((p) => {
      if (!inBlock(p) && isEmpty3(p)) remove(p);
    });
    safeQueryAll4(root, "section, div, span").reverse().forEach((el) => {
      if (el.tagName === "SPAN" && !inBlock(el)) return;
      if (el.tagName === "SPAN" && el.closest("h1, h2, h3, h4, h5, h6, p, a")) return;
      if (el.id || hasTempAttr(el)) return;
      if (isEmpty3(el)) remove(el);
    });
  }
  function heroElements(element, template) {
    const names = /* @__PURE__ */ new Set();
    const sections = template && template.sections || [];
    if (sections.length) {
      (sections[0] && sections[0].blocks || []).forEach((name) => names.add(name));
    } else {
      (template && template.blocks || []).forEach((block) => {
        if (/^hero/i.test(block.name || "")) names.add(block.name);
      });
    }
    const els = /* @__PURE__ */ new Set();
    (template && template.blocks || []).forEach((block) => {
      if (!names.has(block.name)) return;
      (block.instances || []).forEach((sel) => safeQueryAll4(element, sel).forEach((el) => els.add(el)));
    });
    const root = element.querySelector("#main-container");
    const all = [...els];
    if (!root) return all;
    return all.filter((el) => el.parentElement === root);
  }
  function convertHeroWidgets(element, template) {
    const doc = element.ownerDocument;
    heroElements(element, template).forEach((hero) => {
      const col = hero.querySelector(".column-2") || hero;
      safeQueryAll4(col, ".product-variants").forEach((box) => {
        const label = (box.querySelector("label") || {}).textContent || "Product Variants";
        const items = safeQueryAll4(box, ".menu .item").map((i) => (i.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean);
        const unique = [...new Set(items)];
        if (!unique.length) {
          const current = box.querySelector(".dropdown .text");
          if (current && norm6(current.textContent)) unique.push(current.textContent.replace(/\s+/g, " ").trim());
        }
        const container = box.querySelector(".content-container") || box;
        container.textContent = "";
        if (!unique.length) return;
        const labelText = label.replace(/\s+/g, " ").trim().replace(/:$/, "");
        if (unique.length === 1) {
          const p = doc.createElement("p");
          p.textContent = `${labelText}: ${unique[0]}`;
          container.append(p);
        } else {
          const p = doc.createElement("p");
          p.textContent = `${labelText}:`;
          const ul = doc.createElement("ul");
          unique.forEach((t) => {
            const li = doc.createElement("li");
            li.textContent = t;
            ul.append(li);
          });
          container.append(p, ul);
        }
      });
      safeQueryAll4(col, "a.add-to-quote").forEach((btn) => {
        const text = (btn.querySelector("span") || btn).textContent.replace(/\s+/g, " ").trim() || "Request more info";
        const href = btn.getAttribute("href");
        const a = doc.createElement("a");
        a.setAttribute("href", href && href !== "#" ? href : REQUEST_INFO_HREF);
        a.textContent = text;
        const strong = doc.createElement("strong");
        strong.append(a);
        const p = doc.createElement("p");
        p.append(strong);
        btn.replaceWith(p);
      });
      safeQueryAll4(col, ".content-display table, table").forEach((table) => {
        const cells = safeQueryAll4(table, ".tab-icon-container");
        if (!cells.length) return;
        const ul = doc.createElement("ul");
        cells.forEach((cell) => {
          const label = ((cell.querySelector(".info") || cell).textContent || "").replace(/\s+/g, " ").trim();
          const slug2 = slugify2(label);
          if (!slug2) return;
          const li = doc.createElement("li");
          const a = doc.createElement("a");
          a.setAttribute("href", `#${slug2}`);
          a.textContent = label;
          li.append(a);
          ul.append(li);
        });
        if (ul.children.length) table.replaceWith(ul);
      });
    });
  }
  function demoteExtraH1s(element, template) {
    const heroes = heroElements(element, template);
    const h1s = safeQueryAll4(contentRoot3(element), "h1");
    let keep = h1s.find((h) => heroes.some((hero) => hero.contains(h)));
    if (!keep && !heroes.length) keep = h1s[0];
    h1s.forEach((h1) => {
      if (h1 !== keep) renameTag2(h1, "h2");
    });
  }
  function splitHeadingEyebrows(element, protectedEls) {
    const doc = element.ownerDocument;
    const inBlock = (el) => protectedEls.some((p) => p === el || p.contains(el));
    safeQueryAll4(contentRoot3(element), "h1, h2, h3, h4, h5, h6").forEach((h) => {
      if (inBlock(h)) return;
      safeQueryAll4(h, ":scope > .label, :scope > .eyebrow").forEach((label) => {
        const text = (label.textContent || "").replace(/\s+/g, " ").trim();
        label.remove();
        if (!text) return;
        const p = doc.createElement("p");
        p.textContent = text;
        h.before(p);
      });
      const subs = safeQueryAll4(h, ":scope > .sub-header");
      subs.reverse().forEach((sub) => {
        const text = (sub.textContent || "").replace(/\s+/g, " ").trim();
        sub.remove();
        if (!text) return;
        const p = doc.createElement("p");
        p.textContent = text;
        h.after(p);
      });
    });
  }
  function mergeHeroContent(element, template) {
    const doc = element.ownerDocument;
    const INLINE = /^(SUP|SUB|SPAN|STRONG|B|EM|I|U|SMALL|BR|A)$/;
    heroElements(element, template).forEach((hero) => {
      const col = hero.querySelector(".column-2");
      if (!col) return;
      const containers = safeQueryAll4(col, ".content-container").filter((c) => !c.parentElement.closest(".content-container"));
      if (containers.length < 2) return;
      const [first, ...rest] = containers;
      rest.forEach((box) => {
        const out = [];
        const visit = (node) => {
          [...node.children].forEach((child) => {
            if (child.tagName === "P" || /^H[1-6]$/.test(child.tagName) || child.tagName === "UL" || child.tagName === "OL") {
              if (norm6(child.textContent) || hasMedia3(child)) out.push(child);
              return;
            }
            if (child.tagName === "A") {
              if (!norm6(child.textContent)) return;
              const p = doc.createElement("p");
              p.append(child);
              out.push(p);
              return;
            }
            const inlineOnly = [...child.children].every((c) => INLINE.test(c.tagName) && c.tagName !== "A");
            if (inlineOnly && norm6(child.textContent)) {
              const p = doc.createElement("p");
              while (child.firstChild) p.append(child.firstChild);
              out.push(p);
              return;
            }
            visit(child);
          });
        };
        visit(box);
        out.forEach((n) => first.append(n));
      });
    });
  }
  function splitBrLines(element, protectedEls) {
    const doc = element.ownerDocument;
    const inBlock = (el) => protectedEls.some((p) => p === el || p.contains(el));
    safeQueryAll4(contentRoot3(element), "div.disclaimer-text > .content-container, div.disclaimer-text").forEach((box) => {
      if (inBlock(box) || !box.isConnected) return;
      const nodes = [...box.childNodes];
      const isInline = (n) => n.nodeType === 3 || n.nodeType === 1 && /^(SUP|SUB|SPAN|A|STRONG|B|EM|I|U|SMALL)$/.test(n.tagName);
      if (!nodes.some((n) => n.nodeType === 3 && norm6(n.textContent))) return;
      if (!nodes.every((n) => isInline(n) || n.nodeType === 8 || n.nodeType === 1 && n.tagName === "BR")) return;
      const paras = [];
      let current = doc.createElement("p");
      nodes.forEach((n) => {
        if (n.nodeType === 1 && n.tagName === "BR") {
          paras.push(current);
          current = doc.createElement("p");
          n.remove();
          return;
        }
        current.append(n);
      });
      paras.push(current);
      paras.forEach((p) => {
        if (norm6(p.textContent)) {
          if (p.firstChild && p.firstChild.nodeType === 3) p.firstChild.textContent = p.firstChild.textContent.replace(/^\s+/, "");
          if (p.lastChild && p.lastChild.nodeType === 3) p.lastChild.textContent = p.lastChild.textContent.replace(/\s+$/, "");
          box.append(p);
        }
      });
    });
  }
  function splitDoubleBrParagraphs(element, protectedEls) {
    const doc = element.ownerDocument;
    const inBlock = (el) => protectedEls.some((p) => p === el || p.contains(el));
    safeQueryAll4(contentRoot3(element), "p").forEach((p) => {
      if (inBlock(p) || p.querySelectorAll(":scope > br").length < 2) return;
      const parts = [];
      let current = [];
      let lastBr = false;
      [...p.childNodes].forEach((n) => {
        const isBr = n.nodeType === 1 && n.tagName === "BR";
        const isBlank = n.nodeType === 3 && !norm6(n.textContent);
        if (isBr && lastBr) {
          const idx = current.lastIndexOf(lastBr);
          if (idx >= 0) current.splice(idx);
          parts.push(current);
          current = [];
          lastBr = false;
          return;
        }
        if (isBr) {
          lastBr = n;
          current.push(n);
          return;
        }
        if (!isBlank) lastBr = false;
        current.push(n);
      });
      parts.push(current);
      const paras = parts.filter((nodes) => nodes.some((n) => norm6(n.textContent) || n.nodeType === 1 && hasMedia3(n)));
      if (paras.length < 2) return;
      paras.forEach((nodes) => {
        const np = doc.createElement("p");
        nodes.forEach((n) => np.append(n));
        if (np.firstChild && np.firstChild.nodeType === 3) np.firstChild.textContent = np.firstChild.textContent.replace(/^\s+/, "");
        if (np.lastChild && np.lastChild.nodeType === 3) np.lastChild.textContent = np.lastChild.textContent.replace(/\s+$/, "");
        p.before(np);
      });
      p.remove();
    });
  }
  function unwrapLinkHeadingsInCells(element) {
    safeQueryAll4(contentRoot3(element), "td h1, td h2, td h3, td h4, td h5, td h6").forEach((h) => {
      const links = h.querySelectorAll("a[href]");
      if (links.length !== 1) return;
      if (norm6(links[0].textContent) !== norm6(h.textContent)) return;
      renameTag2(h, "p");
    });
  }
  function transform7(hookName, element, payload) {
    const template = payload && payload.template;
    if (!template || !PRODUCT_TEMPLATES.includes(template.name)) return;
    if (!element || !element.querySelectorAll) return;
    if (hookName === "onLoad") {
      preserveBackgrounds(element, collectProtected3(element, template));
      recordClickTargets(element);
      return;
    }
    if (hookName === "beforeTransform") {
      const protectedEls = collectProtected3(element, template);
      const remove = makeRemover3(element, protectedEls);
      preserveBackgrounds(element, protectedEls);
      recordClickTargets(element);
      liftProductListHeadings(element);
      rewriteInPageAnchors2(element, payload && payload.url);
      removeChrome4(element, remove);
      removeEmptyHeadings3(element, remove);
      demoteExtraH1s(element, template);
      convertHeroWidgets(element, template);
      mergeHeroContent(element, template);
      splitHeadingEyebrows(element, protectedEls);
      cleanLinks(element);
      rewriteItemLinks(element);
      splitBrLines(element, protectedEls);
      splitDoubleBrParagraphs(element, protectedEls);
      unwrapLinkHeadingsInCells(element);
      dropRecordedBackgroundImages(element);
      removeEmptyLists(element, remove);
      removeEmptySpacers3(element, remove, protectedEls);
    }
    if (hookName === "afterTransform") {
      WebImporter.DOMUtils.remove(element, [
        "script",
        "noscript",
        "style",
        "link",
        "input",
        "select",
        "textarea",
        "form",
        ".uw-sl",
        ".uwy",
        "#onetrust-consent-sdk",
        "#kampyleButtonContainer",
        ".kampyle_button"
      ]);
      safeQueryAll4(element, "iframe").forEach((frame) => {
        if (ALWAYS_PROTECTED.some((sel) => frame.matches(sel))) return;
        frame.remove();
      });
      cleanLinks(element);
      safeQueryAll4(element, "*").forEach((el) => {
        [...el.attributes].forEach(({ name }) => {
          if (name.startsWith("data-gtm") || name.startsWith("data-uw") || name.startsWith("data-track") || name === "data-bg-src" || name === "data-icon-src" || name === "onclick") {
            el.removeAttribute(name);
          }
        });
      });
    }
  }

  // tools/importer/transformers/beckmancoulter-product-sections.js
  var PRODUCT_TEMPLATES2 = [
    "product-detail-informatics",
    "product-detail-automation",
    "product-category"
  ];
  var MARKER_ATTR4 = "data-excat-section-id";
  var END_ATTR = "data-excat-section-end";
  var FIRST_ATTR = "data-excat-section-first";
  var WRAPPER_SELECTOR = "div.sublayout.grid";
  var BG_ATTR = "data-excat-section-bg";
  var BACKGROUND_STYLES = ["image-panel"];
  var BG_HOLDER_SELECTOR = ".image-container.bg-parallax, .bg-parallax, .image-container, .floating-bg";
  var URL_RE2 = /url\(\s*['"]?([^'")]+)['"]?\s*\)/i;
  function sectionBackground(el) {
    if (!el) return "";
    const recorded = el.getAttribute("data-bg-src") || el.querySelector("[data-bg-src]") && el.querySelector("[data-bg-src]").getAttribute("data-bg-src");
    if (recorded) return recorded;
    const holders = [el, ...safeQueryAll5(el, BG_HOLDER_SELECTOR)];
    for (const h of holders) {
      const m = (h.getAttribute("style") || "").match(URL_RE2);
      if (m && m[1]) return m[1].replace(/&amp;/g, "&").trim();
    }
    const img = safeQueryAll5(el, BG_HOLDER_SELECTOR).map((h) => h.querySelector(":scope > img[src]")).find(Boolean);
    return img ? img.getAttribute("src") : "";
  }
  function safeQueryAll5(root, selector) {
    try {
      return [...root.querySelectorAll(selector)];
    } catch (e) {
      return [];
    }
  }
  function key(text) {
    return (text || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  }
  function contentRoot4(element) {
    return element.querySelector("#main-container") || element;
  }
  function isWrapper(el, root) {
    return el.parentElement === root && el.matches(WRAPPER_SELECTOR);
  }
  function topLevel3(el, element) {
    const root = contentRoot4(element);
    if (!root.contains(el) || el === root) return null;
    let node = el;
    while (node.parentElement && node.parentElement !== root) {
      if (isWrapper(node.parentElement, root)) return node;
      node = node.parentElement;
    }
    return node;
  }
  function headingText2(h) {
    const clone = h.cloneNode(true);
    clone.querySelectorAll(".data-uw-rm-autofix-hide").forEach((s) => s.remove());
    return clone.textContent;
  }
  function matchesName(el, name) {
    const target = key(name);
    if (!target) return false;
    const headings = el.matches("h1, h2, h3, h4, h5, h6") ? [el] : safeQueryAll5(el, "h1, h2, h3, h4, h5, h6");
    if (headings.some((h) => key(headingText2(h)).startsWith(target))) return true;
    if (headings.some((h) => {
      const label = h.querySelector(".label, .eyebrow");
      return label && key(label.textContent).startsWith(target);
    })) return true;
    if (key(el.textContent).startsWith(target)) return true;
    return safeQueryAll5(el, "p, blockquote, .quote").some((p) => key(p.textContent).startsWith(target));
  }
  function findByName3(element, name, used) {
    const target = key(name);
    if (!target) return null;
    const root = contentRoot4(element);
    const pools = ["h1, h2, h3, h4, h5, h6", "p, blockquote, .quote", "div, span"];
    for (const sel of pools) {
      const hits = safeQueryAll5(root, sel).filter((n) => {
        if (sel === "div, span") {
          const own = [...n.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent).join(" ");
          return key(own).startsWith(target) || key(n.textContent).startsWith(target) && !n.querySelector("div");
        }
        return key(sel.startsWith("h") ? headingText2(n) : n.textContent).startsWith(target);
      });
      for (const hit of hits) {
        const top = topLevel3(hit, element);
        if (top && !used.has(top)) return top;
      }
    }
    return null;
  }
  function findSection(element, section, used) {
    const selectors = (Array.isArray(section.selector) ? section.selector : [section.selector]).filter(Boolean);
    for (const sel of selectors) {
      const candidates = safeQueryAll5(element, sel);
      if (!candidates.length) continue;
      const tops = [];
      candidates.forEach((c) => {
        const top = topLevel3(c, element);
        if (top && !tops.some((t) => t.top === top)) tops.push({ el: c, top });
      });
      const free = tops.filter((t) => !used.has(t.top));
      if (!free.length) continue;
      if (free.length === 1 && tops.length === 1) return free[0].top;
      const named = free.find((t) => matchesName(t.el, section.name) || matchesName(t.top, section.name));
      if (named) return named.top;
      const byName = findByName3(element, section.name, used);
      if (byName && free.some((t) => t.top === byName)) return byName;
      return free[0].top;
    }
    return findByName3(element, section.name, used);
  }
  function resolveSections(element, sections) {
    const used = /* @__PURE__ */ new Set();
    const resolved = sections.map(() => null);
    sections.forEach((section, i) => {
      const selectors = (Array.isArray(section.selector) ? section.selector : [section.selector]).filter(Boolean);
      for (const sel of selectors) {
        const tops = [...new Set(safeQueryAll5(element, sel).map((c) => topLevel3(c, element)).filter(Boolean))];
        if (!tops.length) continue;
        if (tops.length === 1 && !used.has(tops[0])) {
          resolved[i] = tops[0];
          used.add(tops[0]);
        }
        break;
      }
    });
    sections.forEach((section, i) => {
      if (resolved[i]) return;
      const el = findSection(element, section, used);
      if (el) {
        resolved[i] = el;
        used.add(el);
      }
    });
    return resolved;
  }
  function docOrder(a, b) {
    if (a === b) return 0;
    return a.compareDocumentPosition(b) & 4 ? -1 : 1;
  }
  function transform8(hookName, element, payload) {
    const template = payload && payload.template;
    if (!template || !PRODUCT_TEMPLATES2.includes(template.name)) return;
    const sections = template.sections || [];
    if (sections.length < 2) return;
    if (!element || !element.querySelectorAll) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      const resolved = resolveSections(element, sections);
      const found = sections.map((section, i) => ({ section, i, el: resolved[i] })).filter((s) => s.el).sort((a, b) => docOrder(a.el, b.el));
      for (let k = found.length - 1; k >= 0; k -= 1) {
        const { section, el } = found[k];
        const isFirst = k === 0;
        const next = found[k + 1];
        if (section.style) {
          const end = document.createElement("div");
          end.setAttribute(END_ATTR, section.id);
          if (BACKGROUND_STYLES.includes(section.style)) {
            const bg = sectionBackground(el);
            if (bg) end.setAttribute(BG_ATTR, bg);
          }
          const nextHr = next && next.el.previousElementSibling && next.el.previousElementSibling.tagName === "HR" ? next.el.previousElementSibling : null;
          if (nextHr) nextHr.before(end);
          else if (next) next.el.before(end);
          else contentRoot4(element).append(end);
        }
        if (isFirst && !section.style) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(MARKER_ATTR4, section.id);
        if (isFirst) hr.setAttribute(FIRST_ATTR, "true");
        el.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`hr[${MARKER_ATTR4}="${section.id}"]`);
        const end = element.querySelector(`[${END_ATTR}="${section.id}"]`);
        if (!marker && !end) continue;
        const cells = { style: section.style };
        const bg = end && end.getAttribute(BG_ATTR);
        if (bg) {
          const img = document.createElement("img");
          img.src = bg;
          img.alt = "";
          cells.background = img;
        }
        const metadata = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells
        });
        if (end) {
          end.replaceWith(metadata);
        } else {
          let next = marker.nextElementSibling;
          while (next && next.tagName !== "HR") next = next.nextElementSibling;
          if (next) next.before(metadata);
          else marker.parentElement.append(metadata);
        }
        if (marker) {
          if (marker.hasAttribute(FIRST_ATTR)) marker.remove();
          else marker.removeAttribute(MARKER_ATTR4);
        }
      }
      safeQueryAll5(element, `hr[${FIRST_ATTR}]`).forEach((hr) => hr.remove());
      safeQueryAll5(element, `[${END_ATTR}]`).forEach((el) => el.remove());
    }
  }

  // tools/importer/transformers/beckmancoulter-hematology-cleanup.js
  var TEMPLATE_NAME5 = "solutions-hematology";
  var CHROME_SELECTORS5 = [
    ".uw-sl",
    ".uwy",
    '[class*="userway"]',
    '[class^="uw-s"]',
    ".uwaw-dictionary-tooltip",
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
    ".country-language-modal",
    ".country-language-selector",
    ".gigya-prefs-modal",
    "#gigya-prefs-modal",
    ".photo-header-container",
    ".breadcrumb-container",
    ".breadcrumbs",
    ".share-container",
    "footer",
    ".footer-container",
    ".universal-footer",
    ".universal-footer-text",
    "#onetrust-consent-sdk",
    ".onetrust-pc-dark-filter",
    "#kampyleButtonContainer",
    ".kampyle_button",
    // Marketo form 1891 (not migrated) + its thank-you message
    "form.mktoForm",
    "div.mktoForm",
    '[id^="mktoForm_"]',
    "#mktoStyleLoaded",
    "#MktoForms2XDIframe",
    "#confirmform",
    // hero scroll chevron, spacers
    ".banner-arrow",
    ".line-break",
    "script",
    "style",
    "noscript",
    "link"
  ];
  function safeQueryAll6(root, selector) {
    try {
      return [...root.querySelectorAll(selector)];
    } catch (e) {
      return [];
    }
  }
  var clean7 = (text) => (text || "").replace(/[\s ]+/g, " ").trim();
  var norm7 = (text) => clean7(text).toLowerCase();
  function slug(text) {
    return clean7(text).toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, "").replace(/ /g, "-");
  }
  function collectProtected4(element, template) {
    const set = /* @__PURE__ */ new Set();
    (template && template.blocks || []).forEach((block) => {
      (block.instances || []).forEach((sel) => {
        safeQueryAll6(element, sel).forEach((el) => set.add(el));
      });
    });
    return [...set];
  }
  function makeRemover4(element, protectedEls) {
    const main = element.querySelector("#main-container");
    return (el) => {
      if (!el || !el.isConnected) return;
      if (el === main || main && el.contains(main)) return;
      if (protectedEls.some((p) => p === el || el.contains(p))) return;
      el.remove();
    };
  }
  var hasMedia4 = (el) => !!el.querySelector("img, picture, video, iframe, table, svg");
  var isEmpty4 = (el) => !norm7(el.textContent) && !hasMedia4(el);
  function removeChrome5(element, remove) {
    CHROME_SELECTORS5.forEach((sel) => safeQueryAll6(element, sel).forEach(remove));
    safeQueryAll6(element, "nav").forEach((nav) => {
      if (!nav.closest("#main-container")) remove(nav);
    });
    safeQueryAll6(element, ".ui.modal").forEach((el) => {
      if (/Choose your country\/region and language/i.test(el.textContent || "")) remove(el);
    });
    safeQueryAll6(element, "body > div, #main-container div").forEach((div) => {
      if (div.id === "main-container") return;
      if (!div.children.length && !norm7(div.textContent)) remove(div);
    });
  }
  function preserveHeroPoster(element) {
    safeQueryAll6(element, ".video-hero-carousel").forEach((hero) => {
      if (hero.getAttribute("data-bg-src")) return;
      const poster = hero.querySelector('#video-tag-thumbnail, [id*="thumbnail"]');
      const m = (poster && poster.getAttribute("style") || "").match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
      if (m) hero.setAttribute("data-bg-src", m[1].replace(/&amp;/g, "&").trim());
    });
  }
  function removeComments(element) {
    const root = element.querySelector("#main-container") || element;
    const doc = element.ownerDocument;
    const walker = doc.createTreeWalker(
      root,
      128
      /* NodeFilter.SHOW_COMMENT */
    );
    const comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach((c) => c.remove());
  }
  function removeEmptyHeadings4(element, remove) {
    safeQueryAll6(element, "h1, h2, h3, h4, h5, h6").forEach((h) => {
      if (norm7(h.textContent) === "empty heading" && !hasMedia4(h)) {
        const link = h.parentElement && h.parentElement.tagName === "A" ? h.parentElement : null;
        remove(link && norm7(link.textContent) === "empty heading" ? link : h);
      }
    });
  }
  function removeEmptyParagraphs(element, remove) {
    safeQueryAll6(element, "#main-container p").forEach((p) => {
      if (isEmpty4(p)) remove(p);
    });
    safeQueryAll6(element, "#main-container div.page-content, #main-container div.wysiwyg-content, #main-container section").forEach((el) => {
      if (isEmpty4(el)) remove(el);
    });
  }
  function rewriteJumpLinks(element) {
    const root = element.querySelector("#main-container") || element;
    const headings = safeQueryAll6(root, "h1, h2, h3, h4, h5, h6").filter((h) => clean7(h.textContent));
    safeQueryAll6(root, 'a[href^="#"]').forEach((a) => {
      const id = a.getAttribute("href").slice(1);
      if (!id) return;
      const target = root.querySelector(`[id="${id.replace(/"/g, "")}"]`);
      if (!target) return;
      let heading = /^H[1-6]$/.test(target.tagName) ? target : null;
      if (!heading) {
        heading = headings.find((h) => !target.contains(h) && target.compareDocumentPosition(h) & 4);
      }
      if (heading) a.setAttribute("href", `#${slug(heading.textContent)}`);
    });
  }
  function renameTag3(el, tagName) {
    const next = el.ownerDocument.createElement(tagName);
    while (el.firstChild) next.append(el.firstChild);
    el.replaceWith(next);
    return next;
  }
  function normalizeStatements(element) {
    const doc = element.ownerDocument;
    safeQueryAll6(element, "#main-container div.intro-content").forEach((intro) => {
      safeQueryAll6(intro, "h1, h2, h3, h4, h5, h6").forEach((h) => {
        const p = doc.createElement("p");
        const strong = doc.createElement("strong");
        strong.textContent = clean7(h.textContent);
        p.append(strong);
        h.replaceWith(p);
      });
    });
    safeQueryAll6(element, "#main-container a.ui.button, #main-container a.button").forEach((a) => {
      if (a.closest(".video-hero-carousel")) return;
      safeQueryAll6(a, "em, i, span").forEach((g) => {
        if (!clean7(g.textContent)) g.remove();
      });
      a.textContent = clean7(a.textContent);
      if (!a.closest("strong, b")) {
        const strong = doc.createElement("strong");
        a.replaceWith(strong);
        strong.append(a);
      }
    });
  }
  function demoteBodyH1s2(element) {
    safeQueryAll6(element, "h1").forEach((h1) => {
      if (h1.closest(".video-hero-carousel")) return;
      renameTag3(h1, "h2");
    });
  }
  function transform9(hookName, element, payload) {
    const template = payload && payload.template;
    if (!template || template.name !== TEMPLATE_NAME5) return;
    if (hookName === "beforeTransform") {
      const protectedEls = collectProtected4(element, template);
      const remove = makeRemover4(element, protectedEls);
      preserveHeroPoster(element);
      removeChrome5(element, remove);
      removeComments(element);
      removeEmptyHeadings4(element, remove);
      rewriteJumpLinks(element);
      normalizeStatements(element);
      demoteBodyH1s2(element);
      removeEmptyParagraphs(element, remove);
    }
    if (hookName === "afterTransform") {
      WebImporter.DOMUtils.remove(element, [
        "script",
        "noscript",
        "style",
        "link",
        "iframe",
        "video",
        "input",
        "form",
        ".uw-sl",
        ".uwy",
        "#onetrust-consent-sdk",
        "#kampyleButtonContainer",
        ".kampyle_button"
      ]);
      safeQueryAll6(element, "*").forEach((el) => {
        [...el.attributes].forEach(({ name }) => {
          if (name.startsWith("data-gtm") || name.startsWith("data-uw") || name.startsWith("data-track") || name === "onclick") {
            el.removeAttribute(name);
          }
        });
      });
    }
  }

  // tools/importer/transformers/beckmancoulter-hematology-sections.js
  var TEMPLATE_NAME6 = "solutions-hematology";
  var MARKER_ATTR5 = "data-excat-section-id";
  var GENERIC_SELECTOR3 = /div\.(page-content|intro-content)\s*(:[\w-]+(\([^)]*\))?)?\s*$/;
  function norm8(text) {
    return (text || "").replace(/\s+/g, " ").trim().toLowerCase();
  }
  function safeQuery4(root, selector) {
    try {
      return root.querySelector(selector);
    } catch (e) {
      return null;
    }
  }
  function contentRoot5(element) {
    return element.querySelector("#main-container") || element;
  }
  function topLevel4(el, element) {
    const root = contentRoot5(element);
    let node = el;
    while (node && node.parentElement && node.parentElement !== root && node.parentElement !== element) {
      const parent = node.parentElement;
      if (parent.matches("div.sublayout") && parent.parentElement === root) return node;
      node = parent;
    }
    return el;
  }
  function findByName4(element, name) {
    const target = norm8(name);
    if (!target) return null;
    const headings = [...contentRoot5(element).querySelectorAll("h1, h2, h3, h4, h5, h6")];
    const h = headings.find((hd) => norm8(hd.textContent).startsWith(target));
    return h ? topLevel4(h, element) : null;
  }
  function findBySelector3(element, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      const el = safeQuery4(element, sel);
      if (el) return topLevel4(el, element);
    }
    return null;
  }
  function isGeneric3(section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    return selectors.every((sel) => !sel || GENERIC_SELECTOR3.test(sel));
  }
  function findSectionElement4(element, section) {
    if (isGeneric3(section)) {
      return findByName4(element, section.name) || findBySelector3(element, section);
    }
    return findBySelector3(element, section) || findByName4(element, section.name);
  }
  function transform10(hookName, element, payload) {
    const template = payload && payload.template;
    if (!template || template.name !== TEMPLATE_NAME6) return;
    const sections = template.sections || [];
    if (sections.length < 2) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = findSectionElement4(element, section);
        if (!el) continue;
        if (i === 0 && !section.style) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(MARKER_ATTR5, section.id);
        el.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`hr[${MARKER_ATTR5}="${section.id}"]`);
        let anchor = marker;
        if (!anchor) {
          anchor = findSectionElement4(element, section);
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
          else marker.removeAttribute(MARKER_ATTR5);
        }
      }
    }
  }

  // tools/importer/import-solutions-hematology.js
  var PAGE_TEMPLATE = {
    "name": "solutions-hematology",
    "description": "Solution story page: video hero, intro with inline Vidyard player, coloured testimonial bands, three pillar sections (heading, text+image columns, video+text columns, statement + button), testimonial slider, contact heading (Marketo form not migrated).",
    "urls": [
      "https://www.beckmancoulter.com/en/solutions/hematology-solution"
    ],
    "blocks": [
      {
        "name": "hero-left-video",
        "instances": [
          "div.video-hero-carousel"
        ]
      },
      {
        "name": "embed-vidyard",
        "instances": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content p.VideoAdj"
        ]
      },
      {
        "name": "quote-customer-testimonial",
        "instances": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.customer-testimonial"
        ]
      },
      {
        "name": "columns",
        "instances": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.adjustable-two-column-display"
        ]
      },
      {
        "name": "columns-hematology",
        "instances": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.social-proof-section",
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.sublayout-two-column-dynamic"
        ]
      },
      {
        "name": "quote-photo-carousel",
        "instances": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.photo-hero-carousel"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Hero",
        "selector": [
          "div.video-hero-carousel"
        ],
        "style": null,
        "blocks": [
          "hero-left-video"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "Find more answers in a single blood draw",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content:has(#WatchVideo)"
        ],
        "style": "centered",
        "blocks": [
          "embed-vidyard"
        ],
        "defaultContent": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content:has(#WatchVideo)"
        ]
      },
      {
        "id": "section-3",
        "name": "Testimonial Joe Meyer",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.customer-testimonial:has(#Intel)"
        ],
        "style": null,
        "blocks": [
          "quote-customer-testimonial"
        ],
        "defaultContent": []
      },
      {
        "id": "section-4",
        "name": "Intelligent Efficiency",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
        ],
        "style": "centered",
        "blocks": [
          "columns",
          "columns-hematology"
        ],
        "defaultContent": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content",
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.intro-content"
        ]
      },
      {
        "id": "section-5",
        "name": "Testimonial John Waugh",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.customer-testimonial:has(#Clinical)"
        ],
        "style": null,
        "blocks": [
          "quote-customer-testimonial"
        ],
        "defaultContent": []
      },
      {
        "id": "section-6",
        "name": "Clinical Confidence",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
        ],
        "style": "centered",
        "blocks": [
          "columns",
          "columns-hematology"
        ],
        "defaultContent": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content",
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.intro-content"
        ]
      },
      {
        "id": "section-7",
        "name": "Testimonial Nima Sarani",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.customer-testimonial:has(#Adapt)"
        ],
        "style": null,
        "blocks": [
          "quote-customer-testimonial"
        ],
        "defaultContent": []
      },
      {
        "id": "section-8",
        "name": "Adaptive Collaboration",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
        ],
        "style": "centered",
        "blocks": [
          "columns-hematology"
        ],
        "defaultContent": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content",
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.intro-content"
        ]
      },
      {
        "id": "section-9",
        "name": "Testimonial slider",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.photo-hero-carousel"
        ],
        "style": null,
        "blocks": [
          "quote-photo-carousel"
        ],
        "defaultContent": []
      },
      {
        "id": "section-10",
        "name": "Let\u2019s talk digital hematology solutions",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
        ],
        "style": "centered",
        "blocks": [],
        "defaultContent": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.page-content"
        ]
      }
    ]
  };
  var parsers = {
    "hero-left-video": parse,
    "embed-vidyard": parse2,
    "quote-customer-testimonial": parse3,
    columns: parse4,
    "columns-hematology": parse5,
    "quote-photo-carousel": parse6
  };
  var transformers = [transform, transform2, transform3, transform4, transform5, transform6, transform7, transform8, transform9, transform10];
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
  var import_solutions_hematology_default = {
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
      const PATH_OVERRIDES = {
        "/en/solutions/hematology-solution": "/en/solutions/hematology-solution1"
      };
      const targetPath = PATH_OVERRIDES[rawPath] || rawPath;
      const path = WebImporter.FileUtils.sanitizePath(targetPath === "" ? "/index" : targetPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_solutions_hematology_exports);
})();
