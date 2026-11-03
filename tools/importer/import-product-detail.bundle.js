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

  // tools/importer/import-product-detail.js
  var import_product_detail_exports = {};
  __export(import_product_detail_exports, {
    default: () => import_product_detail_default
  });

  // tools/importer/parsers/columns-product-hero.js
  var cleanImageSrc = (src) => {
    if (!src || !/^https?:/i.test(src)) return src;
    try {
      const url = new URL(src);
      ["h", "w", "iar", "hash", "la", "sc_lang"].forEach((p) => url.searchParams.delete(p));
      return url.toString();
    } catch (e) {
      return src;
    }
  };
  var norm = (s) => (s || "").replace(/[\s ]+/g, " ").trim();
  function buttonParagraph(a, wrapTag, document2) {
    const link = document2.createElement("a");
    link.setAttribute("href", a.getAttribute("href"));
    link.textContent = norm(a.textContent);
    const wrap = document2.createElement(wrapTag);
    wrap.appendChild(link);
    const p = document2.createElement("p");
    p.appendChild(wrap);
    return p;
  }
  function parse(element, { document: document2 }) {
    const text = element.querySelector(".rt-holder") || element;
    const galleryImg = element.querySelector(".lt-holder img, .product-gallery-carousel img");
    const imageCell = [];
    if (galleryImg) {
      const img = document2.createElement("img");
      img.setAttribute("src", cleanImageSrc(galleryImg.getAttribute("src")));
      const alt = galleryImg.getAttribute("alt") || "";
      const h1 = text.querySelector("h1");
      img.setAttribute("alt", /^product image/i.test(alt) && h1 ? norm(h1.textContent) : alt);
      imageCell.push(img);
    }
    const textCell = [];
    Array.from(text.children).forEach((child) => {
      if (["H1", "H2", "H3", "P", "UL", "OL"].includes(child.tagName)) {
        if (norm(child.textContent)) textCell.push(child);
        return;
      }
      if (child.classList.contains("twobuttons")) {
        child.querySelectorAll("a.btn[href]").forEach((a) => {
          textCell.push(buttonParagraph(a, a.classList.contains("btn-default") ? "em" : "strong", document2));
        });
        return;
      }
      if (child.classList.contains("resource-tool-table-wrapper")) {
        const heading = child.querySelector(".resource-tool-table-links-heading");
        if (heading) {
          const h = document2.createElement("h2");
          h.textContent = norm(heading.textContent);
          textCell.push(h);
        }
        const ul = document2.createElement("ul");
        child.querySelectorAll(".resource-tool-table-links-wrapper a[href]").forEach((a) => {
          const li = document2.createElement("li");
          const link = document2.createElement("a");
          link.setAttribute("href", a.getAttribute("href"));
          link.textContent = norm(a.textContent);
          li.appendChild(link);
          ul.appendChild(li);
        });
        if (ul.children.length) textCell.push(ul);
      }
    });
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "Columns",
      cells: [[imageCell, textCell]]
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/product-nav.js
  var norm2 = (s) => (s || "").replace(/[\s ]+/g, " ").trim();
  function parse2(element, { document: document2 }) {
    const ul = document2.createElement("ul");
    element.querySelectorAll('a[href^="#"]').forEach((a) => {
      const li = document2.createElement("li");
      const link = document2.createElement("a");
      link.setAttribute("href", a.getAttribute("href"));
      link.textContent = norm2(a.textContent);
      li.appendChild(link);
      ul.appendChild(li);
    });
    const cell = document2.createDocumentFragment();
    cell.appendChild(document2.createComment(" field:links "));
    cell.appendChild(ul);
    const block = WebImporter.Blocks.createBlock(document2, { name: "Product Nav", cells: [[cell]] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-features.js
  function parse3(element, { document: document2 }) {
    const cols = Array.from(element.querySelectorAll(":scope > .bc-column"));
    const row = cols.map((col) => {
      const cell = [];
      col.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol").forEach((node) => {
        if (node.parentElement.closest("ul, ol")) return;
        if (!node.textContent.trim()) return;
        if (/^H[4-6]$/.test(node.tagName)) {
          const h = document2.createElement("h3");
          h.innerHTML = node.innerHTML;
          cell.push(h);
          return;
        }
        cell.push(node);
      });
      return cell;
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "Columns", cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/coveo-products.js
  var PRODUCT_TABLE_FILTER = "((((@alltemplates==3E1B00AD02A545A992D75AE6C1F7505E @itemtypetaz120xonomyfacetselected==products) ((((@oraclez32xstatus==ACTCONTROL OR @oraclez32xstatus==ACTNONCONT) OR @oraclez32xstatus==ACTNONINV) OR @oraclez32xstatus==BOMNONINV) OR @oraclez32xstatus==PREOBSOLET)) NOT @z95xtemplate==(ADB6CA4F03EF4F47B9AC9CE2BA53FF97,FE5DD82648C6436DB87A7C4210C7413B)))";
  var norm3 = (s) => (s || "").replace(/[\s ]+/g, " ").trim();
  function itemUri(document2) {
    const scripts = Array.from(document2.querySelectorAll("script")).map((s) => s.textContent).join("\n");
    const m = scripts.match(/itemUri:\s*"([^"]+)"/);
    if (m) return m[1];
    const ctx = document2.querySelector("[data-sc-item-uri]");
    return ctx ? ctx.getAttribute("data-sc-item-uri") : "";
  }
  function fallbackPath(params, file) {
    try {
      const pagePath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      return `/fallback-data${pagePath}/${file}`;
    } catch (e) {
      return "";
    }
  }
  function parse4(element, { document: document2, params }) {
    const hub = (element.querySelector(".CoveoAnalytics[data-search-hub]") || {}).getAttribute ? element.querySelector(".CoveoAnalytics[data-search-hub]").getAttribute("data-search-hub") : element.getAttribute("data-pipeline");
    const pipeline = element.getAttribute("data-pipeline") || hub;
    const perPage = element.getAttribute("data-results-per-page") || "8";
    const ctx = document2.querySelector(".CoveoForSitecoreContext[data-sc-index-source-name]");
    const language = ctx ? ctx.getAttribute("data-sc-current-language") : "en";
    const indexSource = ctx ? ctx.getAttribute("data-sc-index-source-name") : "";
    const jsFilter = element.querySelector("#JSFilterExpression") || document2.querySelector("#JSFilterExpression");
    const pageFilter = jsFilter ? norm3(jsFilter.getAttribute("data-sc-advanced-filter")) : "";
    const aq = pageFilter ? `${PRODUCT_TABLE_FILTER} (${pageFilter})` : PRODUCT_TABLE_FILTER;
    const cq = `(@forlanguages==${language}) (@z95xlatestversion==1) (@source=="${indexSource}")`;
    const facets = Array.from(element.querySelectorAll(".CoveoFacet[data-field]")).map((f) => `${f.getAttribute("data-field")} | ${f.getAttribute("data-title") || f.getAttribute("data-id")}`).join("; ");
    const cells = [
      ["endpoint", ""],
      ["sitecoreItemUri", itemUri(document2)],
      ["siteName", "website"],
      ["searchHub", hub],
      ["pipeline", pipeline],
      ["advancedQuery", aq],
      ["constantQuery", cq],
      ["locale", "en"],
      ["facets", facets],
      ["resultsPerPage", perPage],
      ["storeUrl", "https://store.beckman.com/hi"],
      ["countryCode", "IN"],
      ["filterHeading", "Filter by:"],
      ["quoteLabel", "Add to Quote"],
      ["fallbackData", fallbackPath(params, "licenses.json")]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "Coveo Products", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/specifications.js
  var norm4 = (s) => (s || "").replace(/[\s ]+/g, " ").trim();
  function parse5(element, { document: document2 }) {
    const cells = [];
    element.querySelectorAll("tr").forEach((tr) => {
      const tds = tr.querySelectorAll(":scope > td, :scope > th");
      if (tds.length < 2) return;
      const label = document2.createDocumentFragment();
      label.appendChild(document2.createComment(" field:label "));
      label.appendChild(document2.createTextNode(norm4(tds[0].textContent)));
      const value = document2.createDocumentFragment();
      value.appendChild(document2.createComment(" field:value "));
      const list = tds[1].querySelector("ul, ol");
      if (list) {
        const ul = document2.createElement("ul");
        list.querySelectorAll("li").forEach((li) => {
          if (!norm4(li.textContent)) return;
          const item = document2.createElement("li");
          item.textContent = norm4(li.textContent);
          ul.appendChild(item);
        });
        value.appendChild(ul);
      } else {
        const p = document2.createElement("p");
        p.textContent = norm4(tds[1].textContent);
        value.appendChild(p);
      }
      cells.push([label, value]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "Specifications", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/resource-list.js
  var norm5 = (s) => (s || "").replace(/[\s ]+/g, " ").trim();
  function scriptValue(document2, key) {
    const text = Array.from(document2.querySelectorAll("script")).map((s) => s.textContent).join("\n");
    const m = text.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`));
    return m ? m[1] : "";
  }
  function fallbackPath2(params, file) {
    try {
      const pagePath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      return `/fallback-data${pagePath}/${file}`;
    } catch (e) {
      return "";
    }
  }
  function parse6(element, { document: document2, params }) {
    const options = Array.from(element.querySelectorAll(".multiselect-checkbox-label-wrapper")).map((w) => {
      const input = w.querySelector("input");
      const label = w.querySelector("label");
      return input && label ? `${norm5(label.textContent)} = ${input.getAttribute("value")}` : "";
    }).filter(Boolean);
    const heading = element.querySelector(".ms-filter-heading");
    const dropdown = element.querySelector(".resource-type-dropdown-heading");
    const done = element.querySelector(".multiselect-checkbox-done-wrapper");
    const cells = [
      ["endpoint", ""],
      ["dataSourceId", element.getAttribute("data-excat-datasource-id") || scriptValue(document2, "dataSourceId")],
      ["filterOptions", options.join("; ")],
      ["filterByLabel", heading ? norm5(heading.textContent) : scriptValue(document2, "filterByText")],
      ["dropdownLabel", dropdown ? norm5(dropdown.textContent) : scriptValue(document2, "defaultText")],
      ["doneLabel", done ? norm5(done.textContent) : "Done"],
      ["noMatchingMessage", scriptValue(document2, "noMatching") || "No matching records found"],
      ["fallbackData", fallbackPath2(params, "resources.json")]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "Resource List", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/coveo-techdocs.js
  var DOC_LANGUAGE_BOOST = "($qre(expression:'@documentlanguage*=en', modifier:1000))";
  var TECHDOCS_FILTER = '((@source=="Techdocs-Upgrade" NOT @z95xtemplate==(ADB6CA4F03EF4F47B9AC9CE2BA53FF97,FE5DD82648C6436DB87A7C4210C7413B)))';
  var norm6 = (s) => (s || "").replace(/[\s ]+/g, " ").trim();
  function itemUri2(document2) {
    const scripts = Array.from(document2.querySelectorAll("script")).map((s) => s.textContent).join("\n");
    const m = scripts.match(/itemUri:\s*"([^"]+)"/);
    if (m) return m[1];
    const ctx = document2.querySelector("[data-sc-item-uri]");
    return ctx ? ctx.getAttribute("data-sc-item-uri") : "";
  }
  function richCell(source, document2) {
    const frag = document2.createDocumentFragment();
    if (!source) return frag;
    const p = document2.createElement("p");
    Array.from(source.childNodes).forEach((n) => p.appendChild(n.cloneNode(true)));
    p.innerHTML = p.innerHTML.replace(/\s+/g, " ").trim();
    frag.appendChild(p);
    return frag;
  }
  function parse7(element, { document: document2 }) {
    const iface = element.querySelector(".CoveoSearchInterface[data-pipeline]");
    const analytics = element.querySelector(".CoveoAnalytics[data-search-hub]");
    const hub = analytics ? analytics.getAttribute("data-search-hub") : iface && iface.getAttribute("data-pipeline");
    const pipeline = iface && iface.getAttribute("data-pipeline") || hub;
    const perPage = iface && iface.getAttribute("data-results-per-page") || "5";
    const ranking = document2.querySelector("#currentSiteRankingExpression");
    const filter = document2.querySelector("#currentSiteFilterExpression");
    const rank = ranking ? norm6(ranking.getAttribute("data-sc-ranking-expression")) : "";
    const itemFilter = filter ? norm6(filter.getAttribute("data-sc-advanced-filter")) : "";
    const aq = [DOC_LANGUAGE_BOOST, rank && `(${rank})`, TECHDOCS_FILTER, itemFilter && `(${itemFilter})`].filter(Boolean).join(" ");
    const ctx = document2.querySelector(".CoveoForSitecoreContext[data-sc-index-source-name]");
    const indexSource = ctx ? ctx.getAttribute("data-sc-index-source-name") : "";
    const cq = `((@z95xlatestversion==1) (@source=="${indexSource}")) OR (@source=="Techdocs-Upgrade")`;
    const fallback = document2.createDocumentFragment();
    fallback.appendChild(richCell(element.querySelector("#coveo-techdocs-error"), document2));
    const more = document2.createDocumentFragment();
    more.appendChild(richCell(document2.querySelector("#coveo-techdocs-more-results"), document2));
    const cells = [
      ["endpoint", ""],
      ["sitecoreItemUri", itemUri2(document2)],
      ["siteName", "website"],
      ["searchHub", hub],
      ["pipeline", pipeline],
      ["advancedQuery", aq],
      ["constantQuery", cq],
      ["locale", "en"],
      ["resultsPerPage", perPage],
      ["fallback", fallback],
      ["moreResults", more]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "Coveo Techdocs", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-grid-related.js
  var norm7 = (s) => (s || "").replace(/[\s ]+/g, " ").trim();
  var imageUrl = (src) => (src || "").replace(/^\/pimassets\//, "https://files.plytix.com/");
  function parse8(element, { document: document2 }) {
    const cells = [[""]];
    element.querySelectorAll(".related-part").forEach((part) => {
      if (part.classList.contains("slick-cloned")) return;
      const img = part.querySelector(".related-part__img img");
      const titleLink = part.querySelector(".related-part__title > a:not(.related-part__desc)");
      const desc = part.querySelector(".related-part__desc");
      const imageCell = document2.createDocumentFragment();
      if (img) {
        const image = document2.createElement("img");
        image.setAttribute("src", imageUrl(img.getAttribute("src")));
        image.setAttribute("alt", norm7(titleLink ? titleLink.textContent : img.getAttribute("alt")));
        imageCell.appendChild(document2.createComment(" field:image "));
        imageCell.appendChild(image);
      }
      const textCell = document2.createDocumentFragment();
      textCell.appendChild(document2.createComment(" field:text "));
      if (titleLink) {
        const h3 = document2.createElement("h3");
        const a = document2.createElement("a");
        a.setAttribute("href", titleLink.getAttribute("href"));
        a.textContent = norm7(titleLink.textContent);
        h3.appendChild(a);
        textCell.appendChild(h3);
      }
      if (desc) {
        const p = document2.createElement("p");
        p.textContent = norm7(desc.textContent);
        textCell.appendChild(p);
      }
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "Cards Grid (related)", cells });
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

  // tools/importer/import-product-detail.js
  var PAGE_TEMPLATE = {
    "name": "product-detail",
    "urls": [
      "https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise"
    ],
    "representativeUrl": "https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise",
    "description": "Product detail page: intro with image and buttons, sticky in-page nav, features columns, Coveo license table, specifications, Content and Resources list (Sitecore API), Coveo technical documents, related products carousel",
    "urlPattern": "/flow-cytometry/software/*",
    "blocks": [
      {
        "name": "columns-product-hero",
        "instances": [
          ".product-spotlight-wrapper > .product-intro-wrapper"
        ]
      },
      {
        "name": "product-nav",
        "instances": [
          "#intrenal-page-link-wrapper"
        ]
      },
      {
        "name": "columns-features",
        "instances": [
          "#features-wrapper .bc-columns"
        ]
      },
      {
        "name": "coveo-products",
        "instances": [
          '.CoveoSearchInterface[data-pipeline="Product Table"]'
        ]
      },
      {
        "name": "specifications",
        "instances": [
          "#product-specification-wrapper .specification-holder"
        ]
      },
      {
        "name": "resource-list",
        "instances": [
          "#product-documentation-wrapper #multiselect__container"
        ]
      },
      {
        "name": "coveo-techdocs",
        "instances": [
          "#techdocs-wrapper #coveo-center-column"
        ]
      },
      {
        "name": "cards-grid-related",
        "instances": [
          "#related-parts-wrapper .related-parts"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Product intro",
        "selector": [
          ".product-spotlight-wrapper > .product-intro-wrapper"
        ],
        "style": null,
        "blocks": [
          "columns-product-hero"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "In-page navigation",
        "selector": [
          "#intrenal-page-link-wrapper"
        ],
        "style": null,
        "blocks": [
          "product-nav"
        ],
        "defaultContent": []
      },
      {
        "id": "section-3",
        "name": "Features",
        "selector": [
          "#features-wrapper"
        ],
        "style": null,
        "blocks": [
          "columns-features"
        ],
        "defaultContent": [
          "#features-wrapper .product-page-sub-heading-wrapper > h2"
        ]
      },
      {
        "id": "section-4",
        "name": "Explore Licenses",
        "selector": [
          ".spotlight-content-wrapper > .bc-rich-text:has(> #product-table-wrapper)"
        ],
        "style": null,
        "blocks": [
          "coveo-products"
        ],
        "defaultContent": [
          "#product-table-wrapper > h2"
        ]
      },
      {
        "id": "section-5",
        "name": "Specifications",
        "selector": [
          ".spotlight-content-wrapper > .bc-rich-text:has(#product-specification-wrapper)"
        ],
        "style": null,
        "blocks": [
          "specifications"
        ],
        "defaultContent": [
          "#product-specification-wrapper .product-page-sub-heading-wrapper > h2"
        ]
      },
      {
        "id": "section-6",
        "name": "Content and Resources",
        "selector": [
          "#product-documentation-wrapper"
        ],
        "style": null,
        "blocks": [
          "resource-list"
        ],
        "defaultContent": [
          "#product-documentation-wrapper .product-page-sub-heading-wrapper > h2"
        ]
      },
      {
        "id": "section-7",
        "name": "Technical Documents",
        "selector": [
          "#techdocs-wrapper"
        ],
        "style": null,
        "blocks": [
          "coveo-techdocs"
        ],
        "defaultContent": [
          "#techdocs-wrapper .product-page-sub-heading-wrapper > h2"
        ]
      },
      {
        "id": "section-8",
        "name": "Related Products",
        "selector": [
          "#related-parts-wrapper"
        ],
        "style": null,
        "blocks": [
          "cards-grid-related"
        ],
        "defaultContent": [
          "#related-parts-wrapper .product-page-sub-heading-wrapper > h2",
          "p:has(> em)"
        ]
      }
    ]
  };
  var parsers = {
    "columns-product-hero": parse,
    "product-nav": parse2,
    "columns-features": parse3,
    "coveo-products": parse4,
    "specifications": parse5,
    "resource-list": parse6,
    "coveo-techdocs": parse7,
    "cards-grid-related": parse8
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
  var import_product_detail_default = {
    // html2md hands the transform a document without <script> elements; copy the
    // Content and Resources widget's init settings (data source id) onto its
    // container first, so the resource-list parser can read them.
    onLoad: ({ document: document2 }) => {
      const container = document2.querySelector("#product-documentation-wrapper #multiselect__container");
      if (!container) return;
      const text = Array.from(document2.querySelectorAll("script")).map((s) => s.textContent).join("\n");
      const match = text.match(/"dataSourceId"\s*:\s*"([^"]*)"/);
      if (match) container.setAttribute("data-excat-datasource-id", match[1]);
    },
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      const crumbs = Array.from(document2.querySelectorAll("nav.breadcrumbs li")).map((li) => li.textContent.replace(/\s+/g, " ").trim()).filter(Boolean).slice(1);
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
      meta.template = "product-detail";
      if (crumbs.length) meta["breadcrumb-titles"] = crumbs.join(" | ");
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
  return __toCommonJS(import_product_detail_exports);
})();
