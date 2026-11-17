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

  // tools/importer/import-resources-industries.js
  var import_resources_industries_exports = {};
  __export(import_resources_industries_exports, {
    default: () => import_resources_industries_default
  });

  // tools/importer/parsers/hero-centered-banner.js
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
  var norm = (s) => (s || "").replace(/[\s ]+/g, " ").trim();
  function parse(element, { document: document2 }) {
    const text = element.querySelector("#topbannertext") || element;
    const h1 = text.querySelector("h1");
    const title = norm(h1 && h1.textContent);
    const sub = text.querySelector("h2, h3, p");
    const tagline = norm(sub && sub.textContent);
    const alt = title || "Banner";
    const imageCell = (img, field) => {
      const frag = document2.createDocumentFragment();
      if (img && img.getAttribute("src")) {
        const out = document2.createElement("img");
        out.setAttribute("src", cleanImageSrc(img.getAttribute("src")));
        out.setAttribute("alt", img.getAttribute("alt") || alt);
        frag.appendChild(document2.createComment(` field:${field} `));
        frag.appendChild(out);
      }
      return frag;
    };
    const cells = [];
    cells.push([imageCell(element.querySelector(".largebanner img") || element.querySelector("img"), "image")]);
    const textFrag = document2.createDocumentFragment();
    if (title || tagline) textFrag.appendChild(document2.createComment(" field:text "));
    if (title) {
      const h = document2.createElement("h1");
      h.textContent = title;
      textFrag.appendChild(h);
    }
    if (tagline) {
      const p = document2.createElement("p");
      p.textContent = tagline;
      textFrag.appendChild(p);
    }
    cells.push([textFrag]);
    cells.push([imageCell(element.querySelector(".smallbanner img"), "mobileImage")]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "Hero Centered", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  var COLUMN_SELECTOR = ':scope > .Section__two-column-left, :scope > .Section__two-column-right, :scope > .Section__two-column-item, :scope > [class*="col-md-6"]';
  var KEEP_TAGS = ["H1", "H2", "H3", "H4", "H5", "H6", "P", "UL", "OL", "IMG", "PICTURE", "TABLE", "BLOCKQUOTE"];
  function buttonParagraph(a, document2) {
    const link = document2.createElement("a");
    link.setAttribute("href", a.getAttribute("href"));
    link.textContent = a.textContent.trim();
    const strong = document2.createElement("strong");
    strong.appendChild(link);
    const p = document2.createElement("p");
    p.appendChild(strong);
    return p;
  }
  function collect(container, out, document2) {
    Array.from(container.children).forEach((child) => {
      const tag = child.tagName;
      if (tag === "BR") return;
      if (tag === "A") {
        if (!child.getAttribute("href") || !child.textContent.trim()) return;
        out.push(buttonParagraph(child, document2));
        return;
      }
      if (tag === "P") {
        const links = child.querySelectorAll("a[href]");
        if (links.length === 1 && links[0].classList.contains("btn") && child.textContent.trim() === links[0].textContent.trim()) {
          out.push(buttonParagraph(links[0], document2));
          return;
        }
        if (!child.textContent.trim() && !child.querySelector("img, picture")) return;
        out.push(child);
        return;
      }
      if (KEEP_TAGS.includes(tag)) {
        if (tag !== "IMG" && tag !== "PICTURE" && !child.textContent.trim() && !child.querySelector("img, picture")) return;
        out.push(child);
        return;
      }
      if (tag === "DIV" || tag === "SECTION" || tag === "ARTICLE" || tag === "SPAN") {
        collect(child, out, document2);
      }
    });
  }
  function videoParagraph(col, document2) {
    const embed = col.querySelector('[class*="wistia_async_"]');
    if (!embed) return null;
    const match = (embed.getAttribute("class") || "").match(/wistia_async_([a-z0-9]+)/i);
    if (!match) return null;
    const src = `https://fast.wistia.net/embed/iframe/${match[1]}`;
    const a = document2.createElement("a");
    a.setAttribute("href", src);
    a.textContent = src;
    const p = document2.createElement("p");
    p.appendChild(a);
    return p;
  }
  function parse2(element, { document: document2 }) {
    let columns = Array.from(element.querySelectorAll(COLUMN_SELECTOR));
    if (!columns.length) columns = Array.from(element.querySelectorAll(":scope > div"));
    const row = columns.map((col) => {
      const video = videoParagraph(col, document2);
      if (video) return [video];
      const content = [];
      collect(col, content, document2);
      return content.length ? content : "";
    });
    const rowHeading = element.querySelector("h1, h2, h3, h4, h5, h6");
    row.forEach((cell2) => {
      if (!Array.isArray(cell2)) return;
      cell2.forEach((node) => {
        const imgs = node.tagName === "IMG" ? [node] : Array.from(node.querySelectorAll("img"));
        imgs.forEach((img) => {
          if (!img.getAttribute("alt") && rowHeading) img.setAttribute("alt", rowHeading.textContent.trim());
        });
      });
    });
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document2, { name: "Columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-wide-first.js
  function parse3(element, { document: document2, url, params }) {
    const marker = document2.createComment("columns-wide-first");
    element.before(marker);
    parse2(element, { document: document2, url, params });
    const block = marker.nextElementSibling;
    marker.remove();
    if (!block) return;
    const header = block.querySelector("tr:first-child > th, tr:first-child > td");
    if (header && header.textContent.trim() === "Columns") header.textContent = "Columns (wide-first)";
  }

  // tools/importer/parsers/tabs-workflow.js
  var norm2 = (s) => (s || "").replace(/[\u200b\u00a0\s]+/g, " ").trim();
  var toRelative = (href) => {
    if (!href) return "";
    const m = href.match(/^https?:\/\/(?:www\.)?mybeckman\.in(\/.*)?$/i);
    if (m) return m[1] || "/";
    return href;
  };
  var cleanImageSrc2 = (src) => {
    if (!src) return src;
    let abs = src.trim();
    if (abs.startsWith("//")) abs = `https:${abs}`;
    else if (abs.startsWith("/-/media/")) abs = `https://media.beckman.com${abs}`;
    if (!/^https?:/i.test(abs)) return abs;
    try {
      const url = new URL(abs);
      ["h", "w", "iar", "hash", "sc_lang"].forEach((p) => url.searchParams.delete(p));
      return url.toString();
    } catch (e) {
      return abs;
    }
  };
  var pageCss = (document2) => Array.from(document2.querySelectorAll("style")).map((s) => s.textContent || "").join("\n").replace(/\/\*[\s\S]*?\*\//g, "");
  var readMapping = (css) => {
    const map = {};
    const re = /\.(stepname-\d+)\.active-stepname\s*~\s*\.(stepimg-\d+)/g;
    let m;
    while (m = re.exec(css)) {
      (map[m[1]] = map[m[1]] || /* @__PURE__ */ new Set()).add(m[2]);
    }
    return map;
  };
  var readGreyed = (css) => {
    const greyed = /* @__PURE__ */ new Set();
    const re = /([^{}]+)\{[^{}]*background(?:-color)?\s*:\s*#f0f0f0[^{}]*\}/gi;
    let m;
    while (m = re.exec(css)) {
      (m[1].match(/\.stepname-\d+/g) || []).forEach((c) => greyed.add(c.slice(1)));
    }
    return greyed;
  };
  var classOf = (el, prefix) => Array.from(el.classList).find((c) => new RegExp(`^${prefix}-\\d+$`).test(c));
  var cell = (document2, hint, content) => {
    const frag = document2.createDocumentFragment();
    frag.appendChild(document2.createComment(` field:${hint} `));
    if (typeof content === "string") frag.appendChild(document2.createTextNode(content));
    else if (content) frag.appendChild(content);
    return frag;
  };
  function parse4(element, { document: document2 }) {
    const css = pageCss(document2);
    const mapping = readMapping(css);
    const greyed = readGreyed(css);
    const tabs = element.querySelector(".tabs") || element;
    const rows = [];
    Array.from(tabs.querySelectorAll(":scope > label")).forEach((label) => {
      const descEl = label.querySelector("span");
      const description = norm2(descEl && descEl.textContent);
      const clone = label.cloneNode(true);
      clone.querySelectorAll("span").forEach((s) => s.remove());
      const title = norm2(clone.textContent);
      const panelId = label.getAttribute("data-content-id");
      const panel = panelId && tabs.querySelector(`#${panelId}`);
      const inactive = label.classList.contains("inactive") || !panel;
      rows.push([
        "tabs-workflow-stage",
        cell(document2, "title", title),
        cell(document2, "description", description),
        cell(document2, "state", inactive ? "stage-inactive" : "stage")
      ]);
      if (inactive) return;
      const steps = Array.from(panel.querySelectorAll('[class*="stepname-"]')).map((el) => ({
        cls: classOf(el, "stepname"),
        label: norm2(el.textContent)
      })).filter((s) => s.cls);
      steps.forEach((step) => {
        const off = greyed.has(step.cls) || !mapping[step.cls];
        rows.push([
          "tabs-workflow-step",
          cell(document2, "label", step.label),
          cell(document2, "state", off ? "step-inactive" : "step")
        ]);
      });
      Array.from(panel.querySelectorAll('[class*="stepimg-"]')).forEach((tile) => {
        const cls = classOf(tile, "stepimg");
        const img = tile.querySelector("img");
        const nameEl = tile.querySelector(".productname, .productname2");
        const link = nameEl && nameEl.querySelector("a[href]") || tile.querySelector("a[href]");
        const name = norm2((nameEl || link || tile).textContent);
        const href = toRelative(link && link.getAttribute("href"));
        const height = img && ((img.getAttribute("style") || "").match(/height\s*:\s*(\d+)px/i) || [])[1];
        const lit = steps.filter((s) => mapping[s.cls] && mapping[s.cls].has(cls)).map((s) => s.label);
        let imageFrag = "";
        if (img && img.getAttribute("src")) {
          const pic = document2.createElement("img");
          pic.setAttribute("src", cleanImageSrc2(img.getAttribute("src")));
          pic.setAttribute("alt", "");
          imageFrag = cell(document2, "image", pic);
        }
        let linkFrag = cell(document2, "link", name);
        if (href) {
          const a = document2.createElement("a");
          a.setAttribute("href", href);
          a.textContent = name;
          linkFrag = cell(document2, "link", a);
        }
        rows.push([
          "tabs-workflow-product",
          imageFrag,
          linkFrag,
          cell(document2, "steps", lit.join(", ")),
          cell(document2, "imageHeight", height || "")
        ]);
      });
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "Tabs Workflow", cells: rows });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-two-column.js
  var absHref = (href) => {
    if (!href) return href;
    if (/^-\/media\//i.test(href)) return `https://www.mybeckman.in/${href}`;
    if (/^\/-\/media\//i.test(href)) return `https://www.mybeckman.in${href}`;
    return href;
  };
  function parse5(element, { document: document2 }) {
    const cols = Array.from(element.querySelectorAll(':scope > [class*="col-"]'));
    const items = (cols.length ? cols : [element]).flatMap((col) => Array.from(col.querySelectorAll(".accordion-item")));
    const cells = [];
    items.forEach((item) => {
      const header = item.querySelector(".accordion-header");
      const titleEl = header ? header.cloneNode(true) : null;
      if (titleEl) titleEl.querySelectorAll(".accordion-icon").forEach((i) => i.remove());
      const title = (titleEl ? titleEl.textContent : "").replace(/\s+/g, " ").trim();
      const titleFrag = document2.createDocumentFragment();
      titleFrag.appendChild(document2.createComment(" field:summary "));
      titleFrag.appendChild(document2.createTextNode(title));
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      const content = item.querySelector(".accordion-content") || item;
      const rows = Array.from(content.querySelectorAll(".apps"));
      (rows.length ? rows : Array.from(content.querySelectorAll("p"))).forEach((row) => {
        const link = row.querySelector("a[href]");
        if (!link) return;
        const p = document2.createElement("p");
        const icon = row.querySelector("img");
        const src = icon ? icon.getAttribute("src") || "" : "";
        if (src) {
          p.appendChild(document2.createTextNode(`:${/webpage/i.test(src) ? "webpage-view" : "pdf-download"}: `));
        }
        const a = document2.createElement("a");
        a.setAttribute("href", absHref(link.getAttribute("href")));
        a.textContent = link.textContent.replace(/\s+/g, " ").trim();
        p.appendChild(a);
        textFrag.appendChild(p);
      });
      cells.push([titleFrag, textFrag]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "Accordion (two-column)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-grid-videos.js
  var norm3 = (s) => (s || "").replace(/\s+/g, " ").trim();
  function parse6(element, { document: document2 }) {
    const cells = [[""]];
    const seen = /* @__PURE__ */ new Set();
    element.querySelectorAll('a.w-video-card[href*="wmediaid="], a[href*="wmediaid="]').forEach((card) => {
      const m = (card.getAttribute("href") || "").match(/wmediaid=([a-z0-9]+)/i);
      if (!m || seen.has(m[1])) return;
      const id = m[1];
      seen.add(id);
      const h3 = card.querySelector("h3");
      const title = norm3(h3 && (h3.getAttribute("title") || h3.textContent) || card.textContent);
      const durationEl = Array.from(card.querySelectorAll("div, span")).find((el) => !el.children.length && /^\d+\s*(MIN|SEC)$/i.test(norm3(el.textContent)));
      const duration = durationEl ? norm3(durationEl.textContent) : "";
      const imageFrag = document2.createDocumentFragment();
      const img = document2.createElement("img");
      img.setAttribute("src", `https://fast.wistia.net/embed/medias/${id}/thumbnail-640.webp`);
      img.setAttribute("alt", "");
      imageFrag.appendChild(document2.createComment(" field:image "));
      imageFrag.appendChild(img);
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      const heading = document2.createElement("h3");
      const a = document2.createElement("a");
      a.setAttribute("href", `https://fast.wistia.net/embed/iframe/${id}`);
      a.textContent = title;
      heading.appendChild(a);
      textFrag.appendChild(heading);
      if (duration) {
        const p = document2.createElement("p");
        p.textContent = duration;
        textFrag.appendChild(p);
      }
      cells.push([imageFrag, textFrag]);
    });
    if (cells.length < 2) return;
    const block = WebImporter.Blocks.createBlock(document2, { name: "Cards Grid (videos)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-media-wide.js
  function parse7(element, { document: document2, url, params }) {
    element.querySelectorAll('wistia-player[media-id], [class*="wistia_async_"]').forEach((player) => {
      const id = player.getAttribute("media-id") || ((player.getAttribute("class") || "").match(/wistia_async_([a-z0-9]+)/i) || [])[1];
      if (!id) return;
      const src = `https://fast.wistia.net/embed/iframe/${id}`;
      const p = document2.createElement("p");
      const a = document2.createElement("a");
      a.setAttribute("href", src);
      a.textContent = src;
      p.appendChild(a);
      player.replaceWith(p);
    });
    element.querySelectorAll("style").forEach((s) => s.remove());
    Array.from(element.children).forEach((col) => {
      if (!col.textContent.trim() && !col.querySelector("img, picture, a[href], iframe")) col.remove();
    });
    const marker = document2.createComment("columns-media-wide");
    element.before(marker);
    parse2(element, { document: document2, url, params });
    const block = marker.nextElementSibling;
    marker.remove();
    if (!block) return;
    const header = block.querySelector("tr:first-child > th, tr:first-child > td");
    if (header && header.textContent.trim() === "Columns") header.textContent = "Columns (media-wide)";
  }

  // tools/importer/parsers/marketo-form.js
  function parse8(element, { document: document2 }) {
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
    let name = "Marketo Form (stacked)";
    if (element.classList.contains("marketo-two-column")) name = "Marketo Form (two-column)";
    else if (element.closest(".two-columns-holder__right")) name = "Marketo Form";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/marketo-form-compact.js
  function parse9(element, { document: document2, url, params }) {
    const marker = document2.createComment("marketo-form-compact");
    element.before(marker);
    parse8(element, { document: document2, url, params });
    const block = marker.nextElementSibling;
    marker.remove();
    if (!block || block === element) return;
    const header = block.querySelector("tr:first-child > th, tr:first-child > td");
    if (header && /^Marketo Form/.test(header.textContent.trim())) header.textContent = "Marketo Form (compact)";
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
      element.querySelectorAll('a[href*="/sitecore/service/notfound.aspx"]').forEach((a) => {
        if (/office locations/i.test(a.textContent)) a.setAttribute("href", "/contact-us");
      });
      removeAll(element, [".container-overlay-full-width > .overlay"]);
      element.querySelectorAll('sup > a[href^="#ref"]').forEach((a) => {
        a.replaceWith(...a.childNodes);
      });
      element.querySelectorAll("a[href] > button.btn:only-child").forEach((button) => {
        const a = button.parentElement;
        const label = button.textContent.replace(/\s+/g, " ").trim();
        if (!label) return;
        a.textContent = label;
        a.classList.add("btn", "btn-primary");
      });
      element.querySelectorAll(".bc-rich-text a[name]:not([href])").forEach((a) => {
        const name = a.getAttribute("name");
        const band = a.closest(".bc-rich-text");
        if (name && !a.textContent.trim() && !element.querySelector(`[id="${name}"]`) && !band.id) band.id = name;
        if (!a.textContent.trim()) a.remove();
      });
      removeAll(element, ['a[name="Courses"]:not([href])']);
      element.querySelectorAll("#content-holder > br").forEach((br) => br.remove());
      element.querySelectorAll("#content-holder .bcls-aeo-published").forEach((el) => {
        if (isEmpty(el)) el.remove();
      });
      element.querySelectorAll("#content-holder a:not([href])").forEach((a) => {
        if (isEmpty(a)) a.remove();
      });
      element.querySelectorAll("#content-holder > p").forEach((p) => {
        if (!p.textContent.replace(/ /g, " ").trim() && !p.querySelector("img, a[href]")) p.remove();
      });
      element.querySelectorAll("aside.faq-sidebar").forEach((el) => {
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
        entry.anchor = entry.section.anchor || findAnchor(element, entry.el);
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

  // tools/importer/import-resources-industries.js
  var PAGE_TEMPLATE = {
    "name": "resources-industries",
    "urls": [
      "https://www.mybeckman.in/resources/industries/synthetic-biology"
    ],
    "representativeUrl": "https://www.mybeckman.in/resources/industries/synthetic-biology",
    "description": "Industry landing page (Synthetic Biology): full-width banner with centered title, intro text|graphic, interactive workflow (stages, steps, highlighted products), two-column featured-resources accordion, Wistia video gallery, testimonial video + spotlight download, grey contact form band, footnote",
    "urlPattern": "/resources/industries/*",
    "blocks": [
      {
        "name": "hero-centered-banner",
        "instances": [
          ".bc-rich-text > .outimg:has(#topbannertext)"
        ]
      },
      {
        "name": "columns-wide-first",
        "instances": [
          ".intro:has(> .intro-text):has(> .intro-image)"
        ]
      },
      {
        "name": "tabs-workflow",
        "instances": [
          ".tab-scroll"
        ]
      },
      {
        "name": "accordion-two-column",
        "instances": [
          '.row:has(> [class*="col-sm-6"] > .accordion)'
        ]
      },
      {
        "name": "cards-grid-videos",
        "instances": [
          ".wistia_channel"
        ]
      },
      {
        "name": "columns-media-wide",
        "instances": [
          ".row:has(> .col-md-8 wistia-player):has(> .col-md-3)"
        ]
      },
      {
        "name": "marketo-form-compact",
        "instances": [
          "#main .formassembly-container.marketo-two-column"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Banner",
        "selector": [
          ".bc-rich-text:has(> .outimg)"
        ],
        "style": null,
        "blocks": [
          "hero-centered-banner"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "Intro",
        "selector": [
          ".bc-rich-text:has(.intro)"
        ],
        "style": null,
        "blocks": [
          "columns-wide-first"
        ],
        "defaultContent": []
      },
      {
        "id": "section-3",
        "name": "Interactive workflow",
        "selector": [
          ".bc-rich-text:has(.tab-scroll)"
        ],
        "style": null,
        "blocks": [
          "tabs-workflow"
        ],
        "defaultContent": [
          ".containercustom > h2",
          ".containercustom > p",
          ".containercustom > div > a.btn"
        ]
      },
      {
        "id": "section-4",
        "name": "Featured resources",
        "selector": [
          ".bc-rich-text:has(.accordion)"
        ],
        "style": null,
        "blocks": [
          "accordion-two-column"
        ],
        "defaultContent": [
          ".containercustom > h2"
        ]
      },
      {
        "id": "section-5",
        "name": "Video gallery",
        "selector": [
          ".bc-rich-text:has(.wistia_channel)"
        ],
        "style": null,
        "blocks": [
          "cards-grid-videos"
        ],
        "defaultContent": [
          ".containercustom > h2"
        ]
      },
      {
        "id": "section-6",
        "name": "Customer testimonial",
        "selector": [
          ".bc-rich-text:has(.col-md-8)"
        ],
        "style": null,
        "blocks": [
          "columns-media-wide"
        ],
        "defaultContent": [
          ".containercustom > h2"
        ]
      },
      {
        "id": "section-7",
        "name": "Contact form",
        "selector": [
          "#form",
          '.bc-rich-text:has(> a[name="form"])',
          ".bc-rich-text:has(+ .formassembly-container)"
        ],
        "style": "grey",
        "blocks": [
          "marketo-form-compact"
        ],
        "defaultContent": [
          ".containercustom > h2",
          ".containercustom > p"
        ],
        "anchor": "form"
      },
      {
        "id": "section-8",
        "name": "Footnote",
        "selector": [
          ".formassembly-container + .bc-rich-text"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          ".containercustom > p"
        ]
      }
    ]
  };
  var parsers = {
    "hero-centered-banner": parse,
    "columns-wide-first": parse3,
    "tabs-workflow": parse4,
    "accordion-two-column": parse5,
    "cards-grid-videos": parse6,
    "columns-media-wide": parse7,
    "marketo-form-compact": parse9
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
  var import_resources_industries_default = {
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
      meta.template = "industries";
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
  return __toCommonJS(import_resources_industries_exports);
})();
