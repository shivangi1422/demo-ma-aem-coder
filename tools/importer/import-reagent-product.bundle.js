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

  // tools/importer/import-reagent-product.js
  var import_reagent_product_exports = {};
  __export(import_reagent_product_exports, {
    default: () => import_reagent_product_default
  });

  // tools/importer/parsers/content-product-detail.js
  function parse(element, { document }) {
    const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
    const BLOCK_TAGS = /* @__PURE__ */ new Set(["H1", "H2", "H3", "H4", "H5", "H6", "P", "UL", "OL", "BLOCKQUOTE", "TABLE"]);
    const makeLinkPara = (a) => {
      const text = clean(a.textContent);
      const href = a.getAttribute("href");
      if (!text || !href) return null;
      const p = document.createElement("p");
      const link = document.createElement("a");
      link.setAttribute("href", href);
      link.textContent = text;
      p.appendChild(link);
      return p;
    };
    const textNodes = [];
    const rt = element.querySelector(".rt-holder");
    if (rt) {
      Array.from(rt.children).forEach((child) => {
        const tag = child.tagName;
        if (BLOCK_TAGS.has(tag)) {
          if (!clean(child.textContent) && !child.querySelector("img")) return;
          const clone = child.cloneNode(true);
          clone.querySelectorAll("input, script, style").forEach((n) => n.remove());
          clone.removeAttribute("style");
          clone.querySelectorAll("[style]").forEach((n) => n.removeAttribute("style"));
          clone.querySelectorAll("a").forEach((a) => {
            if (!clean(a.textContent)) a.remove();
          });
          textNodes.push(clone);
          return;
        }
        if (tag === "A") {
          const p = makeLinkPara(child);
          if (p) textNodes.push(p);
          return;
        }
        if (child.classList.contains("resource-tool-table-wrapper")) {
          const heading = child.querySelector(".resource-tool-table-links-heading");
          const links = Array.from(child.querySelectorAll(".resource-tool-table-links-wrapper a[href]")).map(makeLinkPara).filter(Boolean);
          if (!links.length) return;
          const headText = clean(heading && heading.textContent);
          if (headText) {
            const h = document.createElement("h4");
            h.textContent = headText;
            textNodes.push(h);
          }
          links.forEach((p) => textNodes.push(p));
          return;
        }
        if (tag === "DIV") {
          Array.from(child.querySelectorAll("a[href]")).forEach((a) => {
            const p = makeLinkPara(a);
            if (p) textNodes.push(p);
          });
        }
      });
    }
    const cells = [];
    if (textNodes.length) {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(" field:text "));
      textNodes.forEach((n) => frag.appendChild(n));
      cells.push([frag]);
    } else {
      cells.push([""]);
    }
    const seen = /* @__PURE__ */ new Set();
    Array.from(element.querySelectorAll(".product-gallery-carousel .slideset .slide img")).forEach((src) => {
      const url = src.getAttribute("src");
      if (!url) return;
      const key = url.split("?")[0];
      if (seen.has(key)) return;
      seen.add(key);
      const img = document.createElement("img");
      img.setAttribute("src", url);
      img.setAttribute("alt", clean(src.getAttribute("alt")));
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(" field:image "));
      frag.appendChild(img);
      cells.push([frag]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "content-product-detail", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-features.js
  function parse2(element, { document }) {
    const clean = (s) => (s || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
    let columns = Array.from(element.querySelectorAll(":scope > .bc-column"));
    if (!columns.length) columns = Array.from(element.querySelectorAll(".bc-column"));
    const row = [];
    columns.forEach((col) => {
      const nodes = [];
      const heading = col.querySelector("h1, h2, h3, h4, h5, h6");
      if (heading && clean(heading.textContent)) {
        const h = document.createElement("h4");
        h.innerHTML = heading.innerHTML;
        nodes.push(h);
      }
      const desc = col.querySelector(".bc-rich-text-desc") || col;
      Array.from(desc.querySelectorAll("ul, ol, p")).forEach((src) => {
        if (src.parentElement.closest("ul, ol, p") && desc.contains(src.parentElement.closest("ul, ol, p"))) return;
        const clone = src.cloneNode(true);
        clone.querySelectorAll("input, script, style").forEach((n) => n.remove());
        clone.querySelectorAll("div").forEach((d) => {
          if (!clean(d.textContent)) d.remove();
        });
        clone.querySelectorAll("li").forEach((li) => {
          while (li.lastChild && (li.lastChild.nodeName === "BR" || li.lastChild.nodeType === 3 && !clean(li.lastChild.textContent))) {
            li.lastChild.remove();
          }
        });
        if (clean(clone.textContent)) nodes.push(clone);
      });
      if (!nodes.length) return;
      const frag = document.createDocumentFragment();
      nodes.forEach((n) => frag.appendChild(n));
      row.push(frag);
    });
    const cells = row.length ? [row] : [[""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-features", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero.js
  function parse3(element, { document }) {
    const clean = (s) => (s || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
    const banner = element.querySelector(".banner-val") || element;
    let imgSrc = "";
    let imgAlt = "";
    const srcImg = banner.querySelector(":scope > img") || banner.querySelector("img");
    if (srcImg && srcImg.getAttribute("src")) {
      imgSrc = srcImg.getAttribute("src");
      imgAlt = clean(srcImg.getAttribute("alt"));
    } else {
      const style = banner.getAttribute("style") || "";
      const m = style.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
      if (m) imgSrc = m[1];
    }
    if (imgSrc) {
      const [path, query] = imgSrc.split("?");
      if (/\/-\/media\//.test(path) && !/\.[a-z0-9]{2,5}$/i.test(path)) {
        imgSrc = `${path}.jpg${query ? `?${query}` : ""}`;
      }
    }
    let imageCell = "";
    if (imgSrc) {
      const img = document.createElement("img");
      img.setAttribute("src", imgSrc);
      img.setAttribute("alt", imgAlt);
      imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:image "));
      imageCell.appendChild(img);
    }
    const textNodes = [];
    const content = Array.from(banner.children).find((c) => c.tagName === "DIV") || banner;
    Array.from(content.children).forEach((child) => {
      const tag = child.tagName;
      if (/^H[1-6]$/.test(tag)) {
        if (!clean(child.textContent)) return;
        const h = document.createElement(tag.toLowerCase());
        h.textContent = clean(child.textContent);
        textNodes.push(h);
      } else if (tag === "P") {
        if (!clean(child.textContent)) return;
        const p = child.cloneNode(true);
        p.removeAttribute("style");
        textNodes.push(p);
      } else if (tag === "A") {
        const text = clean(child.textContent);
        const href = child.getAttribute("href");
        if (!text || !href) return;
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.setAttribute("href", href);
        a.textContent = text;
        p.appendChild(a);
        textNodes.push(p);
      }
    });
    let textCell = "";
    if (textNodes.length) {
      textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      textNodes.forEach((n) => textCell.appendChild(n));
    }
    const cells = [[imageCell], [textCell]];
    const block = WebImporter.Blocks.createBlock(document, { name: "hero", variants: ["home"], cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/embed-video.js
  function parse4(element, { document }) {
    let mediaId = "";
    const asyncEl = element.querySelector('[class*="wistia_async_"]');
    if (asyncEl) {
      const m = asyncEl.className.match(/wistia_async_([a-z0-9]+)/i);
      if (m) mediaId = m[1];
    }
    if (!mediaId) {
      const src = Array.from(element.querySelectorAll("iframe[src], a[href]")).map((el) => el.getAttribute("src") || el.getAttribute("href")).find((u) => /wistia\.(net|com)/i.test(u || ""));
      const m = src && src.match(/\/(?:embed\/iframe|medias|embed\/medias)\/([a-z0-9]+)/i);
      if (m) mediaId = m[1];
    }
    if (!mediaId) {
      Array.from(element.querySelectorAll('script[type="application/ld+json"]')).some((s) => {
        const m = (s.textContent || "").match(/wistia\.(?:net|com)\/(?:embed\/iframe|medias|embed\/medias)\/([a-z0-9]+)/i);
        if (m) mediaId = m[1];
        return !!mediaId;
      });
    }
    let linkCell = "";
    if (mediaId) {
      const url = `https://fast.wistia.net/embed/iframe/${mediaId}`;
      const a = document.createElement("a");
      a.setAttribute("href", url);
      a.textContent = url;
      linkCell = document.createDocumentFragment();
      linkCell.appendChild(document.createComment(" field:link "));
      linkCell.appendChild(a);
    }
    const cells = [[""], [linkCell]];
    const block = WebImporter.Blocks.createBlock(document, { name: "embed-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-icon-list.js
  function parse5(element, { document }) {
    const clean = (s) => (s || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
    const makeImg = (src) => {
      if (!src || !src.getAttribute("src")) return null;
      const img = document.createElement("img");
      img.setAttribute("src", src.getAttribute("src"));
      img.setAttribute("alt", clean(src.getAttribute("alt")));
      return img;
    };
    const cols = Array.from(element.querySelectorAll(":scope > div"));
    const left = cols[0];
    const right = cols[1] || null;
    let imageCell = "";
    const big = left && left.querySelector("img");
    const bigImg = makeImg(big);
    if (bigImg) imageCell = bigImg;
    const listCell = document.createDocumentFragment();
    const items = right ? Array.from(right.querySelectorAll(".vertical-align-vk")) : [];
    items.forEach((item) => {
      const icon = makeImg(item.querySelector("img"));
      if (icon) {
        const p2 = document.createElement("p");
        p2.appendChild(icon);
        listCell.appendChild(p2);
      }
      const srcP = Array.from(item.querySelectorAll("p")).find((p2) => clean(p2.textContent));
      if (!srcP) return;
      const p = document.createElement("p");
      let label = "";
      for (const node of Array.from(srcP.childNodes)) {
        if (node.nodeName === "BR" || node.nodeName === "STRONG" || node.nodeName === "A") break;
        label += node.textContent;
      }
      label = clean(label);
      if (label) {
        p.appendChild(document.createTextNode(label));
        p.appendChild(document.createElement("br"));
      }
      const a = srcP.querySelector("a[href]");
      if (a && clean(a.textContent)) {
        const strong = document.createElement("strong");
        const link = document.createElement("a");
        link.setAttribute("href", a.getAttribute("href"));
        link.textContent = clean(a.textContent);
        strong.appendChild(link);
        p.appendChild(strong);
      }
      if (clean(p.textContent)) listCell.appendChild(p);
    });
    const cells = [[imageCell, listCell.childNodes.length ? listCell : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-icon-list", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-grid.js
  function parse6(element, { document }) {
    const INLINE_TAGS = /* @__PURE__ */ new Set([
      "A",
      "ABBR",
      "B",
      "BR",
      "CITE",
      "CODE",
      "EM",
      "I",
      "MARK",
      "S",
      "SMALL",
      "SPAN",
      "STRONG",
      "SUB",
      "SUP",
      "U"
    ]);
    const DROP_SELECTOR = "input, button, script, style, noscript, iframe, form, select, textarea";
    const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;
    const pickImage = (scope) => {
      if (!scope) return null;
      const wrap = scope.querySelector(".product-series-callouts__image-wrap") || scope;
      const imgs = Array.from(wrap.querySelectorAll("img")).filter((i) => i.getAttribute("src"));
      if (!imgs.length) return null;
      const src = imgs.find((i) => i.hasAttribute("alt")) || imgs[0];
      const img = document.createElement("img");
      img.setAttribute("src", src.getAttribute("src"));
      const alt = imgs.map((i) => i.getAttribute("alt")).find((a) => a && a.trim());
      img.setAttribute("alt", alt ? alt.trim() : "");
      return img;
    };
    const buildDescription = (container) => {
      const nodes = [];
      if (!container) return nodes;
      const clone = container.cloneNode(true);
      clone.querySelectorAll(DROP_SELECTOR).forEach((el) => el.remove());
      let para = null;
      const flush = () => {
        if (para && para.textContent.trim()) nodes.push(para);
        para = null;
      };
      Array.from(clone.childNodes).forEach((node) => {
        if (node.nodeType === 3) {
          if (!node.textContent.replace(ZERO_WIDTH, "").trim()) {
            if (para) para.appendChild(document.createTextNode(" "));
            return;
          }
          if (!para) para = document.createElement("p");
          para.appendChild(document.createTextNode(
            node.textContent.replace(ZERO_WIDTH, "").replace(/\s+/g, " ")
          ));
          return;
        }
        if (node.nodeType !== 1) return;
        if (INLINE_TAGS.has(node.tagName)) {
          if (!node.textContent.trim()) return;
          if (!para) para = document.createElement("p");
          para.appendChild(node);
          return;
        }
        flush();
        if (node.tagName === "DIV") {
          buildDescription(node).forEach((n) => nodes.push(n));
          return;
        }
        if (node.textContent.trim() || node.querySelector("img")) nodes.push(node);
      });
      flush();
      return nodes;
    };
    const isHeading = (el) => /^H[1-6]$/.test(el.tagName);
    const cells = [];
    cells.push([""]);
    const items = Array.from(element.querySelectorAll(".product-series-callouts__item"));
    items.forEach((item) => {
      const link = item.querySelector("a.product-series-callouts__block[href]") || item.querySelector("a[href]");
      const href = link ? link.getAttribute("href") : "";
      let desc = item.querySelector(".product-series-callouts__description") || item.querySelector(".product-series-callouts__description-wrap");
      while (desc && !Array.from(desc.children).some(isHeading) && desc.children.length === 1 && desc.firstElementChild.tagName === "DIV" && desc.querySelector("h1, h2, h3, h4, h5, h6")) {
        desc = desc.firstElementChild;
      }
      let titleEl = null;
      if (desc) titleEl = Array.from(desc.children).find(isHeading) || null;
      if (!titleEl) titleEl = item.querySelector("h2, h3, h4, h5");
      const titleText = titleEl ? titleEl.textContent.replace(ZERO_WIDTH, "").replace(/\s+/g, " ").trim() : "";
      const bodyNodes = [];
      if (desc) {
        Array.from(desc.children).filter((c) => c.tagName === "DIV").forEach((div) => buildDescription(div).forEach((n) => bodyNodes.push(n)));
      }
      const img = pickImage(item.querySelector(".product-series-callouts__image-holder") || item.querySelector(".product-series-callouts__image-wrap") || item);
      let imageCell = "";
      if (img) {
        imageCell = document.createDocumentFragment();
        imageCell.appendChild(document.createComment(" field:image "));
        imageCell.appendChild(img);
      }
      let textCell = "";
      if (titleText || bodyNodes.length) {
        textCell = document.createDocumentFragment();
        textCell.appendChild(document.createComment(" field:text "));
        if (titleText) {
          const h = document.createElement("h4");
          if (href) {
            const a = document.createElement("a");
            a.setAttribute("href", href);
            a.textContent = titleText;
            h.appendChild(a);
          } else {
            h.textContent = titleText;
          }
          textCell.appendChild(h);
        }
        bodyNodes.forEach((n) => textCell.appendChild(n));
      }
      if (!imageCell && !textCell) return;
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "cards-grid",
      variants: ["productlines"],
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/content-reversed.js
  function parse7(element, { document }) {
    const clean = (s) => (s || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
    const left = element.querySelector(".cell-left");
    const right = element.querySelector(".cell-right");
    let imageCell = "";
    const srcImg = (left || element).querySelector("img");
    if (srcImg && srcImg.getAttribute("src")) {
      const img = document.createElement("img");
      img.setAttribute("src", srcImg.getAttribute("src"));
      img.setAttribute("alt", clean(srcImg.getAttribute("alt")));
      imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:image "));
      imageCell.appendChild(img);
    }
    const textNodes = [];
    if (right) {
      Array.from(right.children).forEach((child) => {
        const tag = child.tagName;
        if (/^H[1-6]$/.test(tag)) {
          if (!clean(child.textContent)) return;
          const h = document.createElement(tag.toLowerCase());
          h.textContent = clean(child.textContent);
          textNodes.push(h);
        } else if (tag === "P" || tag === "UL" || tag === "OL") {
          if (!clean(child.textContent)) return;
          const clone = child.cloneNode(true);
          clone.removeAttribute("style");
          clone.querySelectorAll("[style]").forEach((n) => n.removeAttribute("style"));
          textNodes.push(clone);
        } else if (tag === "A") {
          const text = clean(child.textContent);
          const href = child.getAttribute("href");
          if (!text || !href) return;
          const p = document.createElement("p");
          const a = document.createElement("a");
          a.setAttribute("href", href);
          a.textContent = text;
          p.appendChild(a);
          textNodes.push(p);
        }
      });
    }
    let textCell = "";
    if (textNodes.length) {
      textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      textNodes.forEach((n) => textCell.appendChild(n));
    }
    const cells = [[imageCell], [textCell]];
    const block = WebImporter.Blocks.createBlock(document, { name: "content-reversed", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-resource-list.js
  function parse8(element, { document }) {
    const clean = (s) => (s || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
    const toFormat = (child) => {
      const icon = child.querySelector('.content-resource-list-icon i, .content-resource-list-icon [class*="fa-"]');
      const cls = icon ? icon.className : "";
      if (/\bfa-video\b/.test(cls)) return "video";
      if (/\bfa-file-pdf\b/.test(cls)) return "pdf";
      return "document";
    };
    const cells = [];
    Array.from(element.querySelectorAll(".content-resource-list-child")).forEach((child) => {
      const src = child.querySelector("a.content-resource-list-heading[href]") || child.querySelector("a[href]");
      if (!src) return;
      const title = clean(src.textContent);
      const href = src.getAttribute("href");
      if (!title || !href) return;
      const formatCell = document.createDocumentFragment();
      formatCell.appendChild(document.createComment(" field:format "));
      formatCell.appendChild(document.createTextNode(toFormat(child)));
      const a = document.createElement("a");
      a.setAttribute("href", href);
      a.textContent = title;
      const linkCell = document.createDocumentFragment();
      linkCell.appendChild(document.createComment(" field:link "));
      linkCell.appendChild(a);
      cells.push([formatCell, linkCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-resource-list", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-doc-table.js
  function parse9(element, { document }) {
    const clean = (s) => (s || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
    const hinted = (field, content) => {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(` field:${field} `));
      frag.appendChild(typeof content === "string" ? document.createTextNode(content) : content);
      return frag;
    };
    const cells = [];
    const headings = Array.from(element.querySelectorAll(".coveo-result-list-table-header th")).map((th) => clean(th.textContent)).filter(Boolean);
    cells.push([headings.length ? hinted("headings", headings.join(", ")) : ""]);
    const rows = Array.from(element.querySelectorAll("tr.CoveoResult"));
    rows.forEach((tr) => {
      const tds = Array.from(tr.querySelectorAll(":scope > td"));
      if (!tds.length) return;
      const srcLink = tds[0] && tds[0].querySelector("a[href]") || tr.querySelector("a.CoveoResultLink[href]");
      const title = clean(srcLink ? srcLink.textContent : tds[0] && tds[0].textContent);
      let linkCell = "";
      if (srcLink && title) {
        const a = document.createElement("a");
        a.setAttribute("href", srcLink.getAttribute("href"));
        a.textContent = title;
        linkCell = hinted("link", a);
      }
      const textCell = (field, td) => {
        const value = clean(td && td.textContent);
        return value ? hinted(field, value) : "";
      };
      const row = [
        linkCell,
        textCell("category", tds[1]),
        textCell("documentId", tds[2]),
        textCell("lotNumbers", tds[3])
      ];
      if (row.every((c) => c === "")) return;
      cells.push(row);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-doc-table", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/beckman-cleanup.js
  var remove = (root, selectors) => {
    selectors.forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => el.remove());
    });
  };
  var MEDIA = "img, picture, video, iframe, svg";
  var isBlank = (el) => !el.textContent.replace(/ /g, " ").trim() && !el.querySelector(MEDIA);
  function convertDisclaimer(rt) {
    const doc = rt.ownerDocument;
    rt.querySelectorAll("h5").forEach((h5) => {
      const p = doc.createElement("p");
      const children = [...h5.childNodes].filter((n) => n.nodeType !== 3 || n.textContent.trim());
      const onlyEm = children.length === 1 && children[0].nodeType === 1 && ["EM", "I"].includes(children[0].tagName);
      const em = doc.createElement("em");
      em.innerHTML = onlyEm ? children[0].innerHTML : h5.innerHTML;
      p.append(em);
      h5.replaceWith(p);
    });
    rt.querySelectorAll("p").forEach((p) => {
      if (!p.textContent.replace(/ /g, "").trim() && !p.querySelector("img, picture, a")) p.remove();
    });
  }
  function cleanupProductPage(product) {
    remove(product, [
      "#intrenal-page-link-wrapper",
      ".feature-holder > .sticky"
    ]);
    remove(product, [
      ".bc-rich-text style",
      'input[type="hidden"]',
      'input[id^="context-"]'
    ]);
    remove(product, [
      ".coveo-search-interface-mandatory-section",
      "#resource-table-pagination",
      ".coveo-visible-to-screen-reader-only",
      "#coveo-techdocs-error",
      ".CoveoLogo",
      ".CoveoPager",
      ".coveo-footer",
      ".coveo-header",
      ".CoveoForSitecoreContext"
    ]);
    product.querySelectorAll("#product-table-wrapper .product-table__container").forEach((c) => {
      if (isBlank(c)) c.remove();
    });
    product.querySelectorAll(".embeded-video > h2, .embeded-video p.embeded-video__caption").forEach((el) => {
      if (isBlank(el)) el.remove();
    });
    product.querySelectorAll("a").forEach((a) => {
      if (isBlank(a)) a.remove();
    });
    product.querySelectorAll("p").forEach((p) => {
      if (isBlank(p)) p.remove();
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      remove(element, [
        "#consent_blackbar",
        "#truste-consent-track",
        "#teconsent",
        "#mainNav",
        "div.footer2023",
        "a.skip-to-main-content-link",
        "#ModalPopup",
        ".flash-message",
        ".MaskOverlay",
        "#mktoStyleLoaded",
        "#MktoForms2XDIframe",
        '[id^="font-resize-frame-"]',
        "#hippowiz-ass-injected",
        "#hvmessage-toextension-listener",
        "#userId",
        "#contextItemId",
        "#csrfToken"
      ]);
      element.querySelectorAll("form.mktoForm").forEach((form) => {
        if (!form.closest("#main")) form.remove();
      });
      element.querySelectorAll("#main > .main-holder > .container.custome-container").forEach((c) => {
        if (c.classList.contains("product-spotlight-wrapper")) return;
        if (c.querySelector(".breadcrumbs")) c.remove();
      });
      remove(element, [".breadcrumbs"]);
      element.querySelectorAll(".series-category-promotional-wrapper").forEach((el) => {
        if (!el.textContent.trim() && !el.querySelector("img, picture, video, iframe, a")) el.remove();
      });
      element.querySelectorAll(".product-series-selector-wrapper > div > .bc-rich-text").forEach(convertDisclaimer);
      element.querySelectorAll(".product-spotlight-wrapper").forEach(cleanupProductPage);
    }
    if (hookName === "afterTransform") {
      element.querySelectorAll(".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text").forEach((rt) => {
        if ([...rt.children].some((c) => c.tagName === "H5")) convertDisclaimer(rt);
      });
      remove(element, [
        "header",
        "footer",
        "script",
        "style",
        "noscript",
        "link",
        "iframe",
        "input",
        "#consent_blackbar",
        "#mainNav",
        "div.footer2023",
        ".breadcrumbs",
        '[id^="font-resize-frame-"]'
      ]);
      element.querySelectorAll("[onclick], [onload], [onerror]").forEach((el) => {
        el.removeAttribute("onclick");
        el.removeAttribute("onload");
        el.removeAttribute("onerror");
      });
    }
  }

  // tools/importer/transformers/beckman-sections.js
  var MARKER = "data-excat-section-id";
  function findSectionElement(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (let i = 0; i < selectors.length; i += 1) {
      const sel = selectors[i];
      if (sel) {
        try {
          const el = root.querySelector(sel);
          if (el) return el;
        } catch (e) {
        }
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections;
    if (!Array.isArray(sections) || sections.length < 2) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      const found = sections.map((section) => findSectionElement(element, section));
      const firstIdx = found.findIndex((el) => el);
      const seen = /* @__PURE__ */ new Set();
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = found[i];
        if (el && !seen.has(el)) {
          seen.add(el);
          if (i !== firstIdx || section.style) {
            const hr = document.createElement("hr");
            if (section.style) hr.setAttribute(MARKER, section.id);
            if (i === firstIdx) hr.setAttribute("data-excat-first-section", "");
            el.before(hr);
          }
        }
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (section.style) {
          const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
          const meta = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          if (marker) {
            let end = marker.nextElementSibling;
            while (end && end.tagName !== "HR") end = end.nextElementSibling;
            if (end) end.before(meta);
            else marker.parentElement.append(meta);
            marker.removeAttribute(MARKER);
            if (marker.hasAttribute("data-excat-first-section")) marker.remove();
          } else {
            const el = findSectionElement(element, section);
            if (el) el.after(meta);
          }
        }
      }
    }
  }

  // tools/importer/import-reagent-product.js
  var PAGE_TEMPLATE = {
    "name": "reagent-product",
    "urls": [
      "https://www.mybeckman.in/reagents/particle/valita-aggregation-pure",
      "https://www.mybeckman.in/reagents/particle/valita-titer-assays"
    ],
    "representativeUrl": "https://www.mybeckman.in/reagents/particle/valita-titer-assays",
    "description": "Reagent product detail pages (Valita kits): product spotlight intro, rich-text features, embedded video, product callouts, disclaimers",
    "blocks": [
      {
        "name": "content-product-detail",
        "instances": [
          ".product-spotlight-wrapper > .product-intro-wrapper"
        ]
      },
      {
        "name": "columns-features",
        "instances": [
          "#features-wrapper .bc-columns"
        ]
      },
      {
        "name": "hero",
        "instances": [
          ".product-spotlight-wrapper .spotlight-content-wrapper .banner-container"
        ]
      },
      {
        "name": "embed-video",
        "instances": [
          ".product-spotlight-wrapper .spotlight-content-wrapper > .embeded-video"
        ]
      },
      {
        "name": "columns-icon-list",
        "instances": [
          ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text > .row"
        ]
      },
      {
        "name": "cards-grid",
        "instances": [
          ".product-spotlight-wrapper .spotlight-content-wrapper > .product-series-callouts"
        ]
      },
      {
        "name": "content-reversed",
        "instances": [
          ".product-spotlight-wrapper .spotlight-content-wrapper .custom-container"
        ]
      },
      {
        "name": "cards-resource-list",
        "instances": [
          "#product-documentation-wrapper .content-resource-list-wrapper"
        ]
      },
      {
        "name": "cards-doc-table",
        "instances": [
          "#techdocs-wrapper .techdocs-table"
        ]
      }
    ],
    "urlPattern": "/reagents/particle/valita-*",
    "sections": [
      {
        "id": "section-1",
        "name": "Product intro",
        "selector": [
          ".product-spotlight-wrapper > .product-intro-wrapper"
        ],
        "style": null,
        "blocks": [
          "content-product-detail"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "Features",
        "selector": [
          "#features-wrapper"
        ],
        "style": null,
        "blocks": [
          "columns-features"
        ],
        "defaultContent": [
          "#features-wrapper > .product-page-sub-heading-wrapper",
          "#features-wrapper > p"
        ]
      },
      {
        "id": "section-3",
        "name": "Promo banner",
        "selector": [
          ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(.banner-container)"
        ],
        "style": null,
        "blocks": [
          "hero"
        ],
        "defaultContent": []
      },
      {
        "id": "section-4",
        "name": "Video",
        "selector": [
          ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(+ .embeded-video)",
          ".product-spotlight-wrapper .spotlight-content-wrapper > .embeded-video"
        ],
        "style": null,
        "blocks": [
          "embed-video"
        ],
        "defaultContent": [
          ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(+ .embeded-video) .product-page-sub-heading-wrapper",
          ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(+ .embeded-video) > p"
        ]
      },
      {
        "id": "section-5",
        "name": "Quantify IgG in minutes",
        "selector": [
          ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(> .row)"
        ],
        "style": null,
        "blocks": [
          "columns-icon-list"
        ],
        "defaultContent": [
          ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(> .row) > .product-page-sub-heading-wrapper",
          ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(> .row) > p"
        ]
      },
      {
        "id": "section-6",
        "name": "Learn more callouts",
        "selector": [
          ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(+ .product-series-callouts)",
          ".product-spotlight-wrapper .spotlight-content-wrapper > .product-series-callouts"
        ],
        "style": null,
        "blocks": [
          "cards-grid"
        ],
        "defaultContent": [
          ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(+ .product-series-callouts) .product-page-sub-heading-wrapper"
        ]
      },
      {
        "id": "section-7",
        "name": "Explore product table",
        "selector": [
          "#product-table-wrapper"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          "#product-table-wrapper .product-page-sub-heading-wrapper"
        ]
      },
      {
        "id": "section-8",
        "name": "Plate reader bundle banner",
        "selector": [
          ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(> .custom-container)"
        ],
        "style": null,
        "blocks": [
          "content-reversed"
        ],
        "defaultContent": []
      },
      {
        "id": "section-9",
        "name": "Content and Resources",
        "selector": [
          "#product-documentation-wrapper"
        ],
        "style": null,
        "blocks": [
          "cards-resource-list"
        ],
        "defaultContent": [
          "#product-documentation-wrapper .product-page-sub-heading-wrapper"
        ]
      },
      {
        "id": "section-10",
        "name": "Technical Documents",
        "selector": [
          "#techdocs-wrapper"
        ],
        "style": null,
        "blocks": [
          "cards-doc-table"
        ],
        "defaultContent": [
          "#techdocs-wrapper > .product-page-sub-heading-wrapper",
          "#coveo-techdocs-more-results"
        ]
      },
      {
        "id": "section-11",
        "name": "Disclaimer",
        "selector": [
          ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(> h5)"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          ".product-spotlight-wrapper .spotlight-content-wrapper > .bc-rich-text:has(> h5)"
        ]
      }
    ]
  };
  var parsers = {
    "content-product-detail": parse,
    "columns-features": parse2,
    "hero": parse3,
    "embed-video": parse4,
    "columns-icon-list": parse5,
    "cards-grid": parse6,
    "content-reversed": parse7,
    "cards-resource-list": parse8,
    "cards-doc-table": parse9
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
  var import_reagent_product_default = {
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
  return __toCommonJS(import_reagent_product_exports);
})();
