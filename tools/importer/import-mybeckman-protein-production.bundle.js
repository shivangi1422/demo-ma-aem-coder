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

  // tools/importer/import-mybeckman-protein-production.js
  var import_mybeckman_protein_production_exports = {};
  __export(import_mybeckman_protein_production_exports, {
    default: () => import_mybeckman_protein_production_default
  });

  // tools/importer/parsers/table-striped-mb.js
  var clean = (str) => (str || "").replace(/[\s ]+/g, " ").trim();
  var isUsableHref = (href) => !!href && href.trim() !== "" && href.trim() !== "#" && !/^javascript:/i.test(href.trim());
  function copyInline(src, dest, document) {
    src.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        dest.append(document.createTextNode(node.textContent.replace(/[\s ]+/g, " ")));
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName;
      if (tag === "BR") {
        dest.append(document.createTextNode(" "));
        return;
      }
      if (/^(SCRIPT|STYLE|IMG|SVG)$/.test(tag) || !clean(node.textContent)) return;
      if (tag === "A" && isUsableHref(node.getAttribute("href"))) {
        const a = document.createElement("a");
        a.href = node.getAttribute("href").trim();
        copyInline(node, a, document);
        dest.append(a);
        return;
      }
      if (/^(STRONG|B|EM|I|SUP|SUB)$/.test(tag)) {
        const el = document.createElement({ B: "strong", I: "em" }[tag] || tag.toLowerCase());
        copyInline(node, el, document);
        const last = el.lastChild;
        const trailing = last && last.nodeType === 3 && /\s$/.test(last.textContent);
        if (trailing) last.textContent = last.textContent.replace(/\s+$/, "");
        dest.append(el);
        if (trailing) dest.append(document.createTextNode(" "));
        return;
      }
      copyInline(node, dest, document);
    });
  }
  function tidy(el) {
    const first = el.firstChild;
    if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, "");
    const last = el.lastChild;
    if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, "");
    [...el.childNodes].forEach((n) => {
      if (n.nodeType === 3 && !n.textContent) n.remove();
    });
    return el;
  }
  function parse(element, { document }) {
    const table = element.matches("table") ? element : element.querySelector("table");
    const rows = table ? [...table.querySelectorAll("tr")] : [];
    const width = Math.min(4, Math.max(0, ...rows.map((tr) => tr.querySelectorAll(":scope > th, :scope > td").length)));
    const cells = [];
    rows.forEach((tr) => {
      const srcCells = [...tr.querySelectorAll(":scope > th, :scope > td")];
      if (!srcCells.some((c) => clean(c.textContent))) return;
      const row = [];
      for (let i = 0; i < width; i += 1) {
        const src = srcCells[i];
        const p = document.createElement("p");
        if (src) copyInline(src, p, document);
        tidy(p);
        row.push(clean(p.textContent) ? [document.createComment(` field:column${i + 1} `), p] : "");
      }
      cells.push(row);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "table-striped", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-grid-accent-mb.js
  var clean2 = (str) => (str || "").replace(/[\s ]+/g, " ").trim();
  var isUsableHref2 = (href) => !!href && href.trim() !== "" && href.trim() !== "#" && !/^javascript:/i.test(href.trim());
  function copyInline2(src, dest, document) {
    src.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        dest.append(document.createTextNode(node.textContent.replace(/\s+/g, " ")));
        return;
      }
      if (node.nodeType !== 1 || !clean2(node.textContent)) return;
      const tag = node.tagName;
      if (/^(SCRIPT|STYLE|IMG|SVG|BUTTON)$/.test(tag)) return;
      if (tag === "A" && isUsableHref2(node.getAttribute("href"))) {
        const a = document.createElement("a");
        a.href = node.getAttribute("href").trim();
        copyInline2(node, a, document);
        dest.append(a);
        return;
      }
      if (/^(STRONG|B|EM|I|SUP|SUB)$/.test(tag)) {
        const el = document.createElement({ B: "strong", I: "em" }[tag] || tag.toLowerCase());
        copyInline2(node, el, document);
        dest.append(el);
        return;
      }
      copyInline2(node, dest, document);
    });
  }
  function trimEdges(el) {
    const first = el.firstChild;
    if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, "");
    const last = el.lastChild;
    if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, "");
    return el;
  }
  function parse2(element, { document }) {
    const cells = [];
    cells.push([""]);
    let cards = [...element.querySelectorAll(".benefit-card, .related-cleanroom-topic-card")];
    if (!cards.length) cards = [...element.querySelectorAll("article, :scope > div")];
    cards.forEach((card) => {
      const text = [];
      const titleEl = card.querySelector("h1, h2, h3, h4, h5, h6");
      if (titleEl && clean2(titleEl.textContent)) {
        const h3 = document.createElement("h3");
        h3.textContent = clean2(titleEl.textContent);
        text.push(h3);
      }
      card.querySelectorAll("p").forEach((p) => {
        if (!clean2(p.textContent)) return;
        const out = document.createElement("p");
        copyInline2(p, out, document);
        text.push(trimEdges(out));
      });
      const cta = card.querySelector("a.related-topic-button, :scope > a[href]");
      if (cta && clean2(cta.textContent) && !cta.closest("p")) {
        const p = document.createElement("p");
        if (isUsableHref2(cta.getAttribute("href"))) {
          const a = document.createElement("a");
          a.href = cta.getAttribute("href").trim();
          a.textContent = clean2(cta.textContent);
          p.append(a);
        } else {
          p.textContent = clean2(cta.textContent);
        }
        text.push(p);
      }
      if (!text.length) return;
      cells.push(["", [document.createComment(" field:text "), ...text]]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-grid (accent)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-toggle-mb.js
  var ORIGIN = "https://www.mybeckman.in";
  var clean3 = (str) => (str || "").replace(/[\s ]+/g, " ").trim();
  var isUsableHref3 = (href) => !!href && href.trim() !== "" && href.trim() !== "#" && !/^javascript:/i.test(href.trim());
  function absolutize(href) {
    const v = (href || "").trim();
    if (/^\/?[-~]\/media\//i.test(v)) return `${ORIGIN}/-/media/${v.replace(/^\/?[-~]\/media\//i, "")}`;
    return v;
  }
  var isButton = (a) => /\b(btn|primary-btn|redbtn|button)\b/i.test(a.className || "") || !!a.querySelector("button");
  var isPrimary = (a) => /\b(btn-primary|btn-red|primary-btn|redbtn)\b/i.test(`${a.className} ${[...a.querySelectorAll("button")].map((b) => b.className).join(" ")}`);
  function matchesSafe(el, selector) {
    try {
      return el.matches(selector);
    } catch (e) {
      return false;
    }
  }
  function copyInline3(src, dest, document) {
    src.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        dest.append(document.createTextNode(node.textContent.replace(/\s+/g, " ")));
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName;
      if (tag === "BR") {
        dest.append(document.createElement("br"));
        return;
      }
      if (/^(SCRIPT|STYLE|NOSCRIPT|IFRAME|VIDEO|IMG|PICTURE|SVG|INPUT|SELECT|TEXTAREA)$/.test(tag)) return;
      if (!clean3(node.textContent)) return;
      if (tag === "A") {
        const href = node.getAttribute("href");
        if (isUsableHref3(href)) {
          const a = document.createElement("a");
          a.href = absolutize(href);
          copyInline3(node, a, document);
          dest.append(a);
        } else {
          copyInline3(node, dest, document);
        }
        return;
      }
      if (/^(STRONG|B|EM|I|SUP|SUB)$/.test(tag)) {
        const el = document.createElement({ B: "strong", I: "em" }[tag] || tag.toLowerCase());
        copyInline3(node, el, document);
        dest.append(el);
        return;
      }
      copyInline3(node, dest, document);
    });
  }
  function tidy2(el) {
    const trim = (side) => {
      let n = side === "start" ? el.firstChild : el.lastChild;
      while (n && (n.nodeType === 3 && !n.textContent.trim() || n.nodeName === "BR")) {
        const next = side === "start" ? n.nextSibling : n.previousSibling;
        n.remove();
        n = next;
      }
      if (n && n.nodeType === 3) {
        n.textContent = side === "start" ? n.textContent.replace(/^\s+/, "") : n.textContent.replace(/\s+$/, "");
      }
    };
    trim("start");
    trim("end");
    return clean3(el.textContent) ? el : null;
  }
  function linkParagraph(href, text, document, wrapTag) {
    const p = document.createElement("p");
    const a = document.createElement("a");
    a.href = absolutize(href);
    a.textContent = text;
    if (wrapTag) {
      const w = document.createElement(wrapTag);
      w.append(a);
      p.append(w);
    } else {
      p.append(a);
    }
    return p;
  }
  var IMAGE_EXT = /\.(?:png|jpe?g|webp|gif|avif|svg)$/i;
  function imageFileUrl(src) {
    const raw = (src || "").trim();
    if (!raw || /^data:/i.test(raw)) return "";
    const m = raw.match(/^([^?#]*)(.*)$/);
    return IMAGE_EXT.test(m[1]) ? raw : `${m[1]}.jpg${m[2]}`;
  }
  function imageLink(img, fallbackAlt, document) {
    const src = imageFileUrl(img.getAttribute("src"));
    if (!src) return null;
    return linkParagraph(src, clean3(img.getAttribute("alt")) || fallbackAlt || "Image", document);
  }
  function productNodes(item, document) {
    const out = [];
    const nameEl = item.querySelector("h1, h2, h3, h4, h5, h6");
    const name = clean3(nameEl && nameEl.textContent);
    const link = item.matches("a[href]") ? item : item.querySelector("a[href]");
    const href = link && link.getAttribute("href");
    const img = [...item.querySelectorAll("img[src]")].find((i) => !/display:\s*none/i.test(i.getAttribute("style") || ""));
    if (img) {
      const p = imageLink(img, name, document);
      if (p) out.push(p);
    }
    if (name) {
      const h3 = document.createElement("h3");
      if (isUsableHref3(href)) {
        const a = document.createElement("a");
        a.href = absolutize(href);
        a.textContent = name;
        h3.append(a);
      } else {
        h3.textContent = name;
      }
      out.push(h3);
    }
    const descEl = item.querySelector(".product-series-callouts__description > div, .product-series-callouts__description > p");
    const desc = clean3(descEl && descEl.textContent);
    if (desc) {
      const p = document.createElement("p");
      p.textContent = desc;
      out.push(p);
    }
    return out;
  }
  function richContent(container, document) {
    const out = [];
    let run = null;
    let list = null;
    const flush = () => {
      if (run && tidy2(run)) out.push(run);
      run = null;
    };
    const endList = () => {
      list = null;
    };
    const addInline = (node) => {
      if (!run) run = document.createElement("p");
      const holder = document.createElement("span");
      holder.append(node.cloneNode(true));
      copyInline3(holder, run, document);
    };
    const visit = (parent) => {
      parent.childNodes.forEach((node) => {
        if (node.nodeType === 3) {
          if (clean3(node.textContent) || run) addInline(node);
          return;
        }
        if (node.nodeType !== 1) return;
        const tag = node.tagName;
        if (/^(SCRIPT|STYLE|NOSCRIPT|IFRAME|VIDEO|SVG|HR|INPUT|BUTTON|LABEL)$/.test(tag)) return;
        if (node.matches(".product-series-callouts__item")) {
          flush();
          endList();
          out.push(...productNodes(node, document));
          return;
        }
        if (node.matches(".apps")) {
          flush();
          const li = document.createElement("li");
          copyInline3(node, li, document);
          if (!tidy2(li)) return;
          if (!list) {
            list = document.createElement("ul");
            out.push(list);
          }
          list.append(li);
          return;
        }
        if (tag === "BR") {
          if (run) run.append(document.createElement("br"));
          return;
        }
        endList();
        if (tag === "IMG") {
          flush();
          const p = imageLink(node, "", document);
          if (p) out.push(p);
          return;
        }
        if (/^H[1-6]$/.test(tag)) {
          flush();
          const h = document.createElement(tag === "H1" || tag === "H2" ? "h3" : tag.toLowerCase());
          h.textContent = clean3(node.textContent);
          if (h.textContent) out.push(h);
          return;
        }
        if (tag === "UL" || tag === "OL") {
          flush();
          const l = document.createElement(tag.toLowerCase());
          node.querySelectorAll(":scope > li").forEach((li) => {
            if (!clean3(li.textContent)) return;
            const item = document.createElement("li");
            copyInline3(li, item, document);
            if (tidy2(item)) l.append(item);
          });
          if (l.children.length) out.push(l);
          return;
        }
        if (tag === "P") {
          flush();
          if (!clean3(node.textContent) && !node.querySelector("img")) return;
          node.querySelectorAll("img[src]").forEach((img) => {
            const p2 = imageLink(img, "", document);
            if (p2) out.push(p2);
          });
          if (!clean3(node.textContent)) return;
          const links = [...node.querySelectorAll("a[href]")];
          if (links.length === 1 && clean3(links[0].textContent) === clean3(node.textContent) && isButton(links[0])) {
            out.push(linkParagraph(links[0].getAttribute("href"), clean3(links[0].textContent), document, isPrimary(links[0]) ? "strong" : "em"));
            return;
          }
          const p = document.createElement("p");
          copyInline3(node, p, document);
          if (tidy2(p)) out.push(p);
          return;
        }
        if (tag === "A" && isButton(node) && clean3(node.textContent)) {
          flush();
          out.push(linkParagraph(node.getAttribute("href"), clean3(node.textContent), document, isPrimary(node) ? "strong" : "em"));
          return;
        }
        if (/^(DIV|SECTION|ARTICLE|ASIDE|FIGURE|HEADER|FOOTER|BLOCKQUOTE|DETAILS)$/.test(tag) || node.querySelector("div, p, h1, h2, h3, h4, h5, h6, ul, ol, img")) {
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
    return out;
  }
  function titleText(el) {
    if (!el) return "";
    const copy = el.cloneNode(true);
    copy.querySelectorAll('.accordion-icon, [class*="icon"], i, svg, img').forEach((n) => n.remove());
    return clean3(copy.textContent);
  }
  function itemsOf(element, roots) {
    const items = [];
    roots.forEach((root) => {
      if (root.matches("details")) {
        const summary = root.querySelector(":scope > summary");
        const body = root.cloneNode(true);
        const s = body.querySelector(":scope > summary");
        if (s) s.remove();
        items.push({ title: titleText(summary), content: body });
        return;
      }
      if (root.matches(".wrap-collabsible")) {
        items.push({
          title: titleText(root.querySelector("label, .lbl-toggle")),
          content: root.querySelector(".content-inner") || root.querySelector(".collapsible-content") || root
        });
        return;
      }
      root.querySelectorAll(".accordion-item").forEach((item) => {
        items.push({
          title: titleText(item.querySelector(".accordion-header")),
          content: item.querySelector(".accordion-content") || item
        });
      });
    });
    return items;
  }
  function parse3(element, { document }) {
    const roots = [element];
    if (matchesSafe(element, "div.wrap-collabsible")) {
      let next = element.nextElementSibling;
      while (next && matchesSafe(next, "div.wrap-collabsible")) {
        roots.push(next);
        next = next.nextElementSibling;
      }
    }
    const cells = [];
    itemsOf(element, roots).forEach(({ title, content }) => {
      const nodes = richContent(content, document);
      if (!title && !nodes.length) return;
      cells.push([
        title ? [document.createComment(" field:title "), document.createTextNode(title)] : "",
        nodes.length ? [document.createComment(" field:content "), ...nodes] : ""
      ]);
    });
    roots.slice(1).forEach((root) => root.remove());
    const boxed = !!element.querySelector(".accordion-item");
    const block = WebImporter.Blocks.createBlock(document, { name: boxed ? "accordion-toggle (boxed)" : "accordion-toggle", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-toggle-open-mb.js
  var clean4 = (str) => (str || "").replace(/[\s ]+/g, " ").trim();
  var isUsableHref4 = (href) => !!href && href.trim() !== "" && href.trim() !== "#" && !/^javascript:/i.test(href.trim());
  function matchesSafe2(el, selector) {
    try {
      return el.matches(selector);
    } catch (e) {
      return false;
    }
  }
  function copyInline4(src, dest, document) {
    src.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        dest.append(document.createTextNode(node.textContent.replace(/\s+/g, " ")));
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName;
      if (tag === "BR") {
        dest.append(document.createElement("br"));
        return;
      }
      if (/^(SCRIPT|STYLE|IMG|SVG|IFRAME)$/.test(tag) || !clean4(node.textContent)) return;
      if (tag === "A" && isUsableHref4(node.getAttribute("href"))) {
        const a = document.createElement("a");
        a.href = node.getAttribute("href").trim();
        copyInline4(node, a, document);
        dest.append(a);
        return;
      }
      if (/^(STRONG|B|EM|I|SUP|SUB)$/.test(tag)) {
        const el = document.createElement({ B: "strong", I: "em" }[tag] || tag.toLowerCase());
        copyInline4(node, el, document);
        dest.append(el);
        return;
      }
      copyInline4(node, dest, document);
    });
  }
  function tidy3(el) {
    const trim = (side) => {
      let n = side === "start" ? el.firstChild : el.lastChild;
      while (n && (n.nodeType === 3 && !n.textContent.trim() || n.nodeName === "BR")) {
        const next = side === "start" ? n.nextSibling : n.previousSibling;
        n.remove();
        n = next;
      }
      if (n && n.nodeType === 3) {
        n.textContent = side === "start" ? n.textContent.replace(/^\s+/, "") : n.textContent.replace(/\s+$/, "");
      }
    };
    trim("start");
    trim("end");
    return clean4(el.textContent) ? el : null;
  }
  function answerNodes(faq, question, document) {
    const out = [];
    [...faq.children].forEach((child) => {
      if (child === question) return;
      const tag = child.tagName;
      if (tag === "UL" || tag === "OL") {
        const list = document.createElement(tag.toLowerCase());
        child.querySelectorAll(":scope > li").forEach((li) => {
          const item = document.createElement("li");
          copyInline4(li, item, document);
          if (tidy3(item)) list.append(item);
        });
        if (list.children.length) out.push(list);
        return;
      }
      if (!clean4(child.textContent)) return;
      const p = document.createElement("p");
      copyInline4(child, p, document);
      if (tidy3(p)) out.push(p);
    });
    return out;
  }
  function parse4(element, { document }) {
    const roots = [element];
    let next = element.nextElementSibling;
    while (next && matchesSafe2(next, "div.bcls-aeo-faq")) {
      roots.push(next);
      next = next.nextElementSibling;
    }
    const cells = [];
    roots.forEach((faq) => {
      const question = faq.querySelector(":scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6") || faq.querySelector("h1, h2, h3, h4, h5, h6");
      const title = clean4(question && question.textContent);
      const answer = answerNodes(faq, question, document);
      if (!title && !answer.length) return;
      cells.push([
        title ? [document.createComment(" field:title "), document.createTextNode(title)] : "",
        answer.length ? [document.createComment(" field:content "), ...answer] : ""
      ]);
    });
    roots.slice(1).forEach((root) => root.remove());
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-toggle (open)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-mb.js
  var clean5 = (str) => (str || "").replace(/[\s ]+/g, " ").trim();
  var isUsableHref5 = (href) => !!href && href.trim() !== "" && href.trim() !== "#" && !/^javascript:/i.test(href.trim());
  var WISTIA_RE = /wistia\.(?:net|com)\/(?:embed\/(?:iframe|medias)|medias)\/([A-Za-z0-9]+)/i;
  var WISTIA = {
    y4ridq7qlo: { poster: "https://embed-ssl.wistia.com/deliveries/c8c2e5649c0cfa1f9611c505461c2801.jpg?image_crop_resized=960x480" },
    lm6gb0wei1: { poster: "https://embed-ssl.wistia.com/deliveries/3209e680127f6a5d15ce62a55bfc6498.jpg?image_crop_resized=960x480" },
    "14y6u3fqdf": { poster: "https://embed-ssl.wistia.com/deliveries/224144afcbc9d6ca19521b03e49533d5.jpg?image_crop_resized=960x480" },
    fdbmwymdzr: {
      title: "Biomanufacturing: Lesaffre Testimonial",
      poster: "https://embed-ssl.wistia.com/deliveries/4995dc25d6fa8976480ea4c9558f75dd.jpg?image_crop_resized=960x540"
    }
  };
  var PLAYER_SELECTOR = '[data-video-id], wistia-player[media-id], iframe[src*="wistia"], .wistia_embed';
  var ALT_FIXES = [[/\bBiuld\b/g, "Build"]];
  var fixAlt = (alt) => ALT_FIXES.reduce((a, [re, to]) => a.replace(re, to), clean5(alt));
  function videoId(root) {
    const holder = root.matches && root.matches("[data-video-id]") ? root : root.querySelector("[data-video-id]");
    if (holder && clean5(holder.getAttribute("data-video-id"))) return clean5(holder.getAttribute("data-video-id"));
    const player = root.querySelector("wistia-player[media-id]");
    if (player && /^[a-z0-9]+$/i.test(clean5(player.getAttribute("media-id")))) return clean5(player.getAttribute("media-id"));
    const iframe = [...root.querySelectorAll("iframe[src]")].find((f) => WISTIA_RE.test(f.getAttribute("src")));
    if (iframe) return iframe.getAttribute("src").match(WISTIA_RE)[1];
    const async = root.querySelector('[class*="wistia_async_"]');
    const m = async && async.className.match(/wistia_async_([a-z0-9]+)/i);
    return m ? m[1] : "";
  }
  var isButton2 = (a) => /\b(btn|primary-btn|redbtn|button)\b/i.test(a.className || "") || !!a.querySelector("button");
  var isPrimary2 = (a) => /\b(btn-primary|btn-red|primary-btn|redbtn)\b/i.test(`${a.className} ${[...a.querySelectorAll("button")].map((b) => b.className).join(" ")}`);
  function copyInline5(src, dest, document) {
    src.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        dest.append(document.createTextNode(node.textContent.replace(/\s+/g, " ")));
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName;
      if (tag === "BR") {
        dest.append(document.createElement("br"));
        return;
      }
      if (/^(SCRIPT|STYLE|NOSCRIPT|IFRAME|VIDEO|IMG|PICTURE|SVG|INPUT|SELECT|TEXTAREA)$/.test(tag)) return;
      if (!clean5(node.textContent)) return;
      if (tag === "A") {
        const href = node.getAttribute("href");
        if (isUsableHref5(href)) {
          const a = document.createElement("a");
          a.href = href.trim();
          copyInline5(node, a, document);
          dest.append(a);
        } else {
          copyInline5(node, dest, document);
        }
        return;
      }
      if (/^(STRONG|B|EM|I|SUP|SUB|U)$/.test(tag)) {
        const name = { B: "strong", I: "em", U: "span" }[tag] || tag.toLowerCase();
        if (name === "span") {
          copyInline5(node, dest, document);
          return;
        }
        const el = document.createElement(name);
        copyInline5(node, el, document);
        dest.append(el);
        return;
      }
      copyInline5(node, dest, document);
    });
  }
  function tidy4(el) {
    const trim = (side) => {
      let n = side === "start" ? el.firstChild : el.lastChild;
      while (n && (n.nodeType === 3 && !n.textContent.trim() || n.nodeName === "BR")) {
        const next = side === "start" ? n.nextSibling : n.previousSibling;
        n.remove();
        n = next;
      }
      if (n && n.nodeType === 3) {
        n.textContent = side === "start" ? n.textContent.replace(/^\s+/, "") : n.textContent.replace(/\s+$/, "");
      }
    };
    trim("start");
    trim("end");
    return clean5(el.textContent) ? el : null;
  }
  function splitParagraph(p, document) {
    const parts = [document.createElement("p")];
    const nodes = [...p.childNodes];
    for (let i = 0; i < nodes.length; i += 1) {
      const n = nodes[i];
      if (n.nodeName === "BR") {
        let j = i;
        while (j + 1 < nodes.length && (nodes[j + 1].nodeName === "BR" || nodes[j + 1].nodeType === 3 && !nodes[j + 1].textContent.trim())) j += 1;
        const brs = nodes.slice(i, j + 1).filter((x) => x.nodeName === "BR").length;
        if (brs >= 2) {
          parts.push(document.createElement("p"));
          i = j;
          continue;
        }
      }
      parts[parts.length - 1].append(n);
    }
    return parts.map(tidy4).filter(Boolean);
  }
  function makeImage(srcImg, document) {
    const img = document.createElement("img");
    img.src = srcImg.getAttribute("src");
    img.alt = fixAlt(srcImg.getAttribute("alt"));
    const p = document.createElement("p");
    p.append(img);
    return p;
  }
  function makeCta(a, document) {
    const text = clean5(a.textContent);
    const href = a.getAttribute("href");
    const p = document.createElement("p");
    if (!text) return null;
    if (!isUsableHref5(href)) {
      p.textContent = text;
      return p;
    }
    const link = document.createElement("a");
    link.href = href.trim();
    link.textContent = text;
    const wrap = document.createElement(isPrimary2(a) ? "strong" : "em");
    wrap.append(link);
    p.append(wrap);
    return p;
  }
  function richContent2(container, document) {
    const out = [];
    let run = null;
    const flush = () => {
      if (run) out.push(...splitParagraph(run, document));
      run = null;
    };
    const addInline = (node) => {
      if (!run) run = document.createElement("p");
      const holder = document.createElement("span");
      holder.append(node.cloneNode(true));
      copyInline5(holder, run, document);
    };
    const pushImages = (node) => {
      const imgs = node.tagName === "IMG" ? [node] : [...node.querySelectorAll("img[src]")];
      imgs.forEach((img) => out.push(makeImage(img, document)));
    };
    const visit = (parent) => {
      parent.childNodes.forEach((node) => {
        if (node.nodeType === 3) {
          if (clean5(node.textContent) || run) addInline(node);
          return;
        }
        if (node.nodeType !== 1) return;
        const tag = node.tagName;
        if (/^(SCRIPT|STYLE|NOSCRIPT|IFRAME|VIDEO|SVG|HR|INPUT|BUTTON)$/.test(tag)) {
          if (tag === "BUTTON" && clean5(node.textContent)) addInline(document.createTextNode(clean5(node.textContent)));
          return;
        }
        if (node.matches(PLAYER_SELECTOR)) return;
        if (tag === "BR") {
          if (run) run.append(document.createElement("br"));
          return;
        }
        if (tag === "IMG") {
          flush();
          if (node.getAttribute("src")) pushImages(node);
          return;
        }
        if (/^H[1-6]$/.test(tag)) {
          flush();
          const h = document.createElement(tag === "H1" ? "h2" : tag.toLowerCase());
          const links = [...node.querySelectorAll("a[href]")].filter((a) => clean5(a.textContent) && clean5(a.textContent) !== clean5(node.textContent));
          const copy = node.cloneNode(true);
          copy.querySelectorAll("a[href]").forEach((a) => {
            if (links.some((l) => l.isEqualNode(a))) a.remove();
          });
          h.textContent = clean5(copy.textContent);
          if (h.textContent) out.push(h);
          links.forEach((a) => {
            const cta = makeCta(a, document);
            if (cta) out.push(cta);
          });
          return;
        }
        if (tag === "UL" || tag === "OL") {
          flush();
          const list = document.createElement(tag.toLowerCase());
          node.querySelectorAll(":scope > li").forEach((li) => {
            if (!clean5(li.textContent)) return;
            const item = document.createElement("li");
            copyInline5(li, item, document);
            if (tidy4(item)) list.append(item);
          });
          if (list.children.length) out.push(list);
          return;
        }
        if (tag === "A" && (isButton2(node) || node.parentElement.matches("div, section")) && !node.querySelector("img") && clean5(node.textContent)) {
          flush();
          const cta = makeCta(node, document);
          if (cta) out.push(cta);
          return;
        }
        if (tag === "A" && node.querySelector("img") && !clean5(node.textContent)) {
          flush();
          pushImages(node);
          return;
        }
        if (tag === "P") {
          flush();
          if (node.querySelector("img[src]")) {
            const copy = node.cloneNode(true);
            copy.querySelectorAll("img").forEach((i) => i.remove());
            pushImages(node);
            if (clean5(copy.textContent)) {
              const p2 = document.createElement("p");
              copyInline5(copy, p2, document);
              out.push(...splitParagraph(p2, document));
            }
            return;
          }
          if (!clean5(node.textContent)) return;
          const p = document.createElement("p");
          if (node.matches('[class*="meta-name"]') && !node.querySelector("strong, b")) {
            const strong = document.createElement("strong");
            copyInline5(node, strong, document);
            tidy4(strong);
            p.append(strong);
            out.push(p);
            return;
          }
          copyInline5(node, p, document);
          out.push(...splitParagraph(p, document));
          return;
        }
        if (/^(DIV|SECTION|ARTICLE|ASIDE|FIGURE|FIGCAPTION|HEADER|FOOTER|BLOCKQUOTE|TABLE|TBODY|TR|TD|TH|DL|DT|DD)$/.test(tag) || node.querySelector("div, p, h1, h2, h3, h4, h5, h6, ul, ol, img")) {
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
    return out;
  }
  function columnsOf(element) {
    const left = element.querySelector(".two-columns-holder__left");
    const right = element.querySelector(".two-columns-holder__right");
    if (left && right) return [left, right];
    let row = element;
    const kids = [...element.children];
    if (kids.length === 1 && kids[0].matches(".row")) [row] = kids;
    return [...row.children].filter((col) => clean5(col.textContent) || col.querySelector("img, picture, " + PLAYER_SELECTOR));
  }
  function parse5(element, { document }) {
    const cols = columnsOf(element);
    const ids = cols.map((col) => videoId(col));
    const texts = cols.map((col) => richContent2(col, document));
    const row = cols.map((col, i) => {
      const id = ids[i];
      if (!id) return texts[i].length ? texts[i] : "";
      const other = texts.find((t, j) => j !== i && !ids[j]) || [];
      const heading = other.find((n) => /^H[1-6]$/.test(n.tagName));
      const known = WISTIA[id] || {};
      const holder = col.querySelector("[data-video-id]");
      const dataTitle = clean5(holder && holder.getAttribute("data-title"));
      const title = heading && clean5(heading.textContent) || known.title || dataTitle || "Watch video";
      const nodes = [];
      if (known.poster) {
        const img = document.createElement("img");
        img.src = known.poster;
        img.alt = title;
        const pp = document.createElement("p");
        pp.append(img);
        nodes.push(pp);
      }
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = `https://fast.wistia.net/embed/iframe/${id}`;
      a.textContent = title;
      p.append(a);
      nodes.push(p);
      return [...nodes, ...texts[i]];
    });
    while (row.length < 2) row.push("");
    const block = WebImporter.Blocks.createBlock(document, { name: "columns", cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/form-mb.js
  var ORIGIN2 = "https://www.mybeckman.in";
  var FORM_JSON = {
    3797: "/forms/contact-our-team.json",
    3101: "/forms/contact-request-quote.json",
    1024: "/forms/contact-talk-to-expert.json"
  };
  var DEFAULT_FORM_JSON = "/forms/contact-request-quote.json";
  var PRIVACY_RE = /By submitting this form/i;
  var clean6 = (str) => (str || "").replace(/[\s ]+/g, " ").trim();
  function formId(element) {
    const form = element.querySelector('form[id^="mktoForm_"], [id^="mktoForm_"]');
    const fromId = form && (form.id.match(/^mktoForm_(\d+)/) || [])[1];
    if (fromId) return fromId;
    const input = element.querySelector('input[name="formid"], input[name="formVid"]');
    return input ? clean6(input.getAttribute("value")) : "";
  }
  function absoluteHref(href) {
    const v = (href || "").trim();
    if (/^\/[^/]/.test(v)) return `${ORIGIN2}${v}`;
    return v;
  }
  function privacyParagraph(element, document) {
    const holder = [...element.querySelectorAll(".mktoHtmlText")].find((el) => PRIVACY_RE.test(el.textContent)) || [...element.querySelectorAll("p, div, span")].reverse().find((el) => PRIVACY_RE.test(el.textContent) && !el.querySelector("div, p"));
    const p = document.createElement("p");
    if (!holder) {
      p.append(
        document.createTextNode("By submitting this form I confirm that I have reviewed and agree with the ")
      );
      const privacy = document.createElement("a");
      privacy.href = `${ORIGIN2}/about-us/global-privacy-notice`;
      privacy.textContent = "Privacy Policy";
      const terms = document.createElement("a");
      terms.href = `${ORIGIN2}/about-us/terms-of-use`;
      terms.textContent = "Terms of Use";
      p.append(privacy, document.createTextNode(" and "), terms, document.createTextNode(
        ". I also understand my privacy choices as they pertain to my personal data as provided in the Privacy Policy under \u201CYour Privacy Choices\u201D."
      ));
      return p;
    }
    const copy = (src, dest) => {
      src.childNodes.forEach((node) => {
        if (node.nodeType === 3) {
          dest.append(document.createTextNode(node.textContent.replace(/[\s ]+/g, " ")));
          return;
        }
        if (node.nodeType !== 1 || !clean6(node.textContent)) return;
        if (node.tagName === "A" && node.getAttribute("href")) {
          const a = document.createElement("a");
          a.href = absoluteHref(node.getAttribute("href"));
          a.textContent = clean6(node.textContent);
          dest.append(a);
          return;
        }
        if (/^(STRONG|B|EM|I)$/.test(node.tagName)) {
          const el = document.createElement(/^(STRONG|B)$/.test(node.tagName) ? "strong" : "em");
          copy(node, el);
          dest.append(el);
          return;
        }
        copy(node, dest);
      });
    };
    copy(holder, p);
    const first = p.firstChild;
    if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, "");
    const last = p.lastChild;
    if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, "");
    return p;
  }
  function parse6(element, { document }) {
    const id = formId(element);
    const file = FORM_JSON[id] || DEFAULT_FORM_JSON;
    const link = document.createElement("a");
    link.href = file;
    link.textContent = file;
    const block = WebImporter.Blocks.createBlock(document, {
      name: "form",
      cells: [[[document.createComment(" field:reference "), link]]]
    });
    const privacy = privacyParagraph(element, document);
    element.replaceWith(block);
    block.after(privacy);
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
    const slug3 = (text) => (text || "").toLowerCase().replace(/[^0-9a-z]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    safeQueryAll(element, 'a[href^="#"]').forEach((a) => {
      const id = a.getAttribute("href").slice(1);
      if (!id) return;
      const heading = safeQueryAll(element, "h1, h2, h3, h4, h5, h6").find((h) => h.id === id);
      if (heading) a.setAttribute("href", `#${slug3(heading.textContent)}`);
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
      const slug3 = h && slugify(h.textContent);
      if (slug3) a.setAttribute("href", `#${slug3}`);
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
  function isEmptyHeading2(h) {
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
    if (/^H[1-6]$/.test(target.tagName) && !isEmptyHeading2(target)) return target;
    const inner = safeQueryAll4(target, "h1, h2, h3, h4, h5, h6").find((h) => !isEmptyHeading2(h));
    if (inner) return inner;
    const all = safeQueryAll4(contentRoot3(element), "h1, h2, h3, h4, h5, h6").filter((h) => !isEmptyHeading2(h));
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
      const slug3 = h && slugify2(headingText(h));
      if (slug3) a.setAttribute("href", `#${slug3}`);
    });
  }
  function collectTabSlugs(element) {
    const map = /* @__PURE__ */ new Map();
    safeQueryAll4(element, ".product-tabs .ui.menu a.item, .product-tabs .tabs .menu a.item").forEach((tab) => {
      const slug3 = slugify2(tab.textContent);
      if (!slug3) return;
      map.set(slug3, slug3);
      if (tab.id) map.set(slugify2(tab.id.replace(/^tab-/, "")), slug3);
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
      if (isEmptyHeading2(h)) remove(h);
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
          const slug3 = slugify2(label);
          if (!slug3) return;
          const li = doc.createElement("li");
          const a = doc.createElement("a");
          a.setAttribute("href", `#${slug3}`);
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
        const isBlank2 = n.nodeType === 3 && !norm6(n.textContent);
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
        if (!isBlank2) lastBr = false;
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

  // tools/importer/transformers/mybeckman-cleanup.js
  var TEMPLATE_PREFIX = "mybeckman-";
  var ORIGIN3 = "https://www.mybeckman.in";
  var SECTION_ATTR = "data-mb-section";
  var BG_ATTR2 = "data-mb-section-bg";
  var PAGES = {
    "clinical-trials": {
      remove: ["#main hr"],
      anchors: {
        multicenter: "chapter-1-harmonize-your-multicenter-trials",
        resources: "chapter-2-leverage-expert-support-in-your-clinical-trials",
        efficiency: "chapter-3-increase-efficiency-with-automated-solutions"
      },
      // section background (not content): jump nav gradient image
      backgrounds: [{ section: "div.container-overlay-full-width:has(div.sticky)", img: ":scope > img" }]
    },
    "leukemia-and-lymphoma": {
      remove: [],
      anchors: {
        "overview-and-statistics": "overview-and-statistics",
        "diagnostic-tool": "flow-cytometry-as-a-diagnostic-tool",
        "laboratory-challenges": "laboratory-challenges",
        "standardized-reagents": "advantages-of-standardized-reagents",
        "additional-resources": "additional-resources"
      },
      unlinkFootnotes: true
    },
    "monoclonal-antibodies": {
      remove: ["#content-holder > h1"],
      anchors: { anchor: "our-team-is-ready-to-help" },
      strongHeadings: ["div.bc-rich-text > div.row:has(a.primary-btn) p"],
      referenceLines: ["div.bc-rich-text:has(h2 + h5) h5"]
    },
    biomanufacturing: {
      remove: [],
      // source content is ~1300px wide (not the 1140px container): theme "wide"
      theme: "wide",
      anchors: { form: "our-team-is-ready-to-help" }
    },
    "synthetic-biology": {
      remove: [
        "div.accordion-content hr",
        "div.containercustom > div.row:has(wistia-player) > div.col-md-1"
      ],
      anchors: { form: "our-team-is-ready-to-help" }
    },
    "cell-line-development": {
      remove: [],
      // source content is ~1300px wide (not the 1140px container): theme "wide"
      theme: "wide",
      anchors: { anchor: "want-to-bring-your-cell-line-development-workflow-to-the-next-level" }
    },
    "protein-production": {
      remove: [],
      anchors: {}
    },
    "analytical-ultracentrifugation": {
      remove: ["#main hr"],
      anchors: { anchor: "talk-to-an-expert-on-analytical-ultracentrifugation" },
      // button[onclick=scrollToDiv('x')] -> link to the EDS heading id
      jumpButtons: {
        overview: "introduction",
        // 'overview' does not exist on the source
        benefits: "key-benefits-of-auc",
        applications: "applications-of-analytical-ultracentrifugation",
        methods: "optima-auc-multiple-methods-in-one"
      }
    },
    "next-generation-sequencing": {
      remove: [],
      // source content is ~1300px wide (not the 1140px container): theme "wide"
      theme: "wide",
      anchors: {
        form: "ready-to-get-started",
        Solutions: "our-ngs-library-prep-automated-solutions"
      }
    }
  };
  var CHROME_SELECTORS6 = [
    "#consent_blackbar",
    "#truste-consent-track",
    "a.skip-to-main-content-link",
    'body > input[type="hidden"]',
    "#wrapper > input#csrfToken",
    "input#csrfToken",
    "header#mainNav",
    "#main > div.main-holder > div.container.custome-container",
    "nav.breadcrumbs",
    "div.footer2023",
    "#mktoForm_3594",
    "div.flash-message",
    "div.MaskOverlay",
    "#ModalPopup",
    "button#myBtn",
    "body > style",
    "body > iframe",
    "body > form.mktoForm",
    "body > #mktoStyleLoaded",
    "#mktoStyleLoaded",
    "body > wistia-tag-manager",
    "wistia-tag-manager",
    "input#hippowiz-ass-injected",
    "input#hvmessage-toextension-listener",
    "#main style",
    "#main link",
    "#main noscript",
    "#main script",
    "script",
    "noscript",
    "body > link",
    // hidden duplicates / decorative (mapping-notes "Hidden duplicates" + cleanup table)
    "div.overlay_0_mobile_vk",
    "div.container-overlay-full-width > div.overlay",
    "a[data-featherlight]",
    "div.smallbanner",
    "div.wf-grid-mobile",
    "div.color-overlay",
    "div.dark-overlay",
    "div.tab-scroll #content-0",
    "div.slideshow-container a.prev",
    "div.slideshow-container a.next",
    "div.dot-container",
    "em.fa-quote-left",
    "div.panel.panel-noborder"
  ];
  var HINDI_MONTHS = [
    [/जनवरी/g, "January"],
    [/फ़रवरी|फरवरी/g, "February"],
    [/मार्च/g, "March"],
    [/अप्रैल/g, "April"],
    [/मई/g, "May"],
    [/जून/g, "June"],
    [/जुलाई/g, "July"],
    [/अगस्त/g, "August"],
    [/सितम्बर|सितंबर/g, "September"],
    [/अक्टूबर|अक्तूबर/g, "October"],
    [/नवम्बर|नवंबर/g, "November"],
    [/दिसम्बर|दिसंबर/g, "December"]
  ];
  var BROKEN_LINK = 'a[href*="/sitecore/service/notfound.aspx"], a[href*="link.aspx?_id="]';
  function safeQueryAll7(root, selector) {
    try {
      return [...root.querySelectorAll(selector)];
    } catch (e) {
      return [];
    }
  }
  function safeQuery5(root, selector) {
    try {
      return root.querySelector(selector);
    } catch (e) {
      return null;
    }
  }
  var clean8 = (text) => (text || "").replace(/[\s\u00a0]+/g, " ").trim();
  function slug2(text) {
    return clean8(text).toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, "").replace(/ /g, "-");
  }
  function pageConfig(template) {
    const key2 = template.name.slice(TEMPLATE_PREFIX.length);
    return PAGES[key2] || { remove: [], anchors: {} };
  }
  function contentRoot6(element) {
    return element.querySelector("#main") || element;
  }
  function blockInstances(element, template) {
    const set = /* @__PURE__ */ new Set();
    (template && template.blocks || []).forEach((block) => {
      (block.instances || []).forEach((sel) => {
        safeQueryAll7(element, sel).forEach((el) => set.add(el));
      });
    });
    return [...set];
  }
  function sectionStarts(element, template) {
    const found = [];
    (template && template.sections || []).forEach((section) => {
      const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
      for (const sel of selectors) {
        if (!sel) continue;
        const el = safeQuery5(element, sel);
        if (el) {
          found.push({ section, el });
          break;
        }
      }
    });
    return found;
  }
  function makeContext(element, template) {
    const instances = blockInstances(element, template);
    const sections = sectionStarts(element, template).map((s) => s.el);
    const keep = [.../* @__PURE__ */ new Set([...instances, ...sections])];
    const insideInstance = (el) => instances.some((inst) => inst !== el && inst.contains(el));
    const isInstance = (el) => instances.includes(el);
    const remove = (el) => {
      if (!el || !el.isConnected) return;
      if (el === element || el.id === "main" || el.id === "wrapper") return;
      if (el.contains(contentRoot6(element)) && contentRoot6(element) !== element) return;
      if (keep.some((p) => p === el || el.contains(p))) return;
      el.remove();
    };
    return { instances, sections, insideInstance, isInstance, remove };
  }
  function renameTag4(el, tagName) {
    const next = el.ownerDocument.createElement(tagName);
    [...el.attributes].forEach(({ name, value }) => {
      if (name !== "style") next.setAttribute(name, value);
    });
    while (el.firstChild) next.append(el.firstChild);
    el.replaceWith(next);
    return next;
  }
  function unwrap(el) {
    if (!el || !el.parentNode) return;
    el.replaceWith(...el.childNodes);
  }
  var hasMedia5 = (el) => !!el.querySelector("img, picture, video, iframe, table, svg, wistia-player, [data-video-id], [media-id], input, select, textarea, form");
  var isBlank = (el) => !clean8(el.textContent) && !hasMedia5(el);
  function recordBackgrounds(element, config) {
    (config.backgrounds || []).forEach(({ section, img }) => {
      safeQueryAll7(element, section).forEach((sec) => {
        const image = safeQuery5(sec, img);
        if (!image) return;
        const src = image.getAttribute("src");
        if (src && !sec.getAttribute(BG_ATTR2)) {
          sec.setAttribute(BG_ATTR2, new URL(src, `${ORIGIN3}/`).href);
        }
      });
    });
  }
  function removeBackgroundImages(element, config) {
    (config.backgrounds || []).forEach(({ section, img }) => {
      safeQueryAll7(element, section).forEach((sec) => {
        if (sec.getAttribute(BG_ATTR2)) {
          const image = safeQuery5(sec, img);
          if (image) image.remove();
        }
      });
    });
  }
  function tagHeroTone(element) {
    safeQueryAll7(element, "div.top-banner").forEach((banner) => {
      if (!banner.querySelector(".dark-overlay")) banner.setAttribute("data-mb-tone", "light");
    });
  }
  function tagSections(element, template) {
    sectionStarts(element, template).forEach(({ section, el }) => {
      if (!el.hasAttribute(SECTION_ATTR)) el.setAttribute(SECTION_ATTR, section.id);
    });
  }
  function removeComments2(element) {
    const doc = element.ownerDocument;
    const walker = doc.createTreeWalker(
      element,
      128
      /* NodeFilter.SHOW_COMMENT */
    );
    const comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach((c) => c.remove());
  }
  function dedupeCalloutImages(element) {
    const hidden = (img) => /display:\s*none/i.test(img.getAttribute("style") || "");
    safeQueryAll7(element, "div.product-series-callouts .product-series-callouts__image-wrap").forEach((wrap) => {
      const imgs = [...wrap.querySelectorAll("img")];
      if (!imgs.length) return;
      const keep = imgs.find((img) => !hidden(img)) || imgs[0];
      keep.removeAttribute("style");
      imgs.filter((img) => img !== keep).forEach((img) => img.remove());
    });
  }
  var MIGRATED_PATHS = [
    "/flow-cytometry/clinical-trials",
    "/resources/disease-research/leukemia-and-lymphoma",
    "/resources/disease-research/monoclonal-antibodies",
    "/resources/industries/biomanufacturing",
    "/resources/industries/synthetic-biology",
    "/resources/methods/cell-line-development",
    "/resources/product-applications/process-development-manufacturing/protein-production",
    "/resources/technologies/analytical-ultracentrifugation",
    "/resources/technologies/next-generation-sequencing"
  ];
  function absolutizeSiteLinks(element) {
    safeQueryAll7(element, 'a[href^="/"]:not([href^="//"])').forEach((a) => {
      const href = a.getAttribute("href");
      const path = href.split(/[?#]/)[0].replace(/\/$/, "").toLowerCase();
      if (path.startsWith("/forms/") || path.startsWith("/content/dam/") || MIGRATED_PATHS.includes(path)) return;
      a.setAttribute("href", `${ORIGIN3}${href}`);
    });
  }
  function damifyImageLinks(element) {
    safeQueryAll7(element, "a[href]").forEach((a) => {
      const dam = DAM_MAP[a.getAttribute("href")];
      if (dam) {
        if (a.textContent.trim() === a.getAttribute("href")) a.textContent = dam;
        a.setAttribute("href", dam);
      }
    });
  }
  function removeChrome6(element, config, ctx) {
    [...CHROME_SELECTORS6, ...config.remove || []].forEach((sel) => safeQueryAll7(element, sel).forEach(ctx.remove));
    [...element.children].forEach((child) => {
      if (child.id === "wrapper" || child.contains(contentRoot6(element))) return;
      if (["STYLE", "LINK", "IFRAME", "FORM", "INPUT", "SCRIPT", "NOSCRIPT"].includes(child.tagName) || child.tagName.includes("-")) {
        ctx.remove(child);
      }
    });
    safeQueryAll7(contentRoot6(element), 'i[class*="fa-"], em[class*="fa-"], span[class*="fa-"]').forEach((icon) => {
      if (!clean8(icon.textContent)) ctx.remove(icon);
    });
  }
  function removeEmptyText(element, ctx) {
    const root = contentRoot6(element);
    safeQueryAll7(root, "h1, h2, h3, h4, h5, h6, p, p.embeded-video__caption").forEach((el) => {
      if (el.closest("form, .formassembly-container")) return;
      if (isBlank(el)) ctx.remove(el);
    });
    safeQueryAll7(root, "br").forEach((br) => {
      const parent = br.parentElement;
      if (!parent || parent.closest("form, .formassembly-container")) return;
      const meaningful = (node, dir) => {
        let n = node[dir];
        while (n && (n.nodeType === 3 && !clean8(n.textContent) || n.nodeType === 8 || n.nodeType === 1 && n.tagName === "BR")) n = n[dir];
        return n;
      };
      const prev = meaningful(br, "previousSibling");
      const next = meaningful(br, "nextSibling");
      const block = /^(DIV|SECTION|ARTICLE|ASIDE|LI|TD|TH)$/.test(parent.tagName);
      const edge = !prev || !next;
      const betweenBlocks = block && (!prev || prev.nodeType === 1) && (!next || next.nodeType === 1) && !/^(A|SPAN|STRONG|B|EM|I|SUP|SUB|IMG)$/.test(prev && prev.tagName || "") && !/^(A|SPAN|STRONG|B|EM|I|SUP|SUB|IMG)$/.test(next && next.tagName || "");
      if (edge || betweenBlocks) br.remove();
    });
    safeQueryAll7(root, "strong, b").forEach((el) => {
      if (isBlank(el)) el.remove();
    });
  }
  function removeEmptyWrappers(element, ctx) {
    const root = contentRoot6(element);
    safeQueryAll7(root, "div, section").reverse().forEach((el) => {
      if (ctx.isInstance(el) || ctx.insideInstance(el)) return;
      if (el.hasAttribute("id") && /^(main|wrapper|content-holder)$/.test(el.id)) return;
      if (isBlank(el)) ctx.remove(el);
    });
  }
  function promoteFormHeadings(element) {
    const root = contentRoot6(element);
    safeQueryAll7(root, "p.formtitle, div.formtitle").forEach((el) => {
      if (!clean8(el.textContent)) return;
      const h2 = renameTag4(el, "h2");
      h2.textContent = clean8(h2.textContent);
    });
    safeQueryAll7(root, "div.formtext").forEach((el) => {
      if (!el.querySelector("div, p")) renameTag4(el, "p");
    });
  }
  function promoteStrongHeadings(element, config) {
    (config.strongHeadings || []).forEach((sel) => {
      const p = safeQueryAll7(element, sel).find((el) => {
        const strong = clean8([...el.querySelectorAll("strong, b")].map((s) => s.textContent).join(" "));
        return strong && strong === clean8(el.textContent);
      });
      if (!p) return;
      const h2 = renameTag4(p, "h2");
      h2.textContent = clean8(h2.textContent);
    });
  }
  function demoteReferenceLines(element, config) {
    (config.referenceLines || []).forEach((sel) => {
      safeQueryAll7(element, sel).forEach((h) => renameTag4(h, "p"));
    });
  }
  function demoteExtraH1s2(element) {
    safeQueryAll7(contentRoot6(element), "h1").slice(1).forEach((h1) => renameTag4(h1, "h2"));
  }
  function fixAuthorHeadings(element) {
    safeQueryAll7(contentRoot6(element), ".bcls-aeo-author h5, .bcls-aeo-author h6").forEach((h) => renameTag4(h, "h3"));
  }
  function absolutizeAssetLinks(element) {
    const fix = (value) => {
      const v = (value || "").trim();
      if (/^(-|~)\/media\//i.test(v)) return `${ORIGIN3}/-/media/${v.replace(/^(-|~)\/media\//i, "")}`;
      if (/^\/(-|~)\/media\//i.test(v)) return `${ORIGIN3}/-/media/${v.replace(/^\/(-|~)\/media\//i, "")}`;
      if (/^\/[^/].*\.(ashx|pdf)(\?|#|$)/i.test(v)) return `${ORIGIN3}${v}`;
      return null;
    };
    safeQueryAll7(element, "a[href]").forEach((a) => {
      const next = fix(a.getAttribute("href"));
      if (next) a.setAttribute("href", next);
    });
    safeQueryAll7(element, "img[src]").forEach((img) => {
      const next = fix(img.getAttribute("src"));
      if (next) img.setAttribute("src", next);
    });
  }
  function linkList(doc, links) {
    const ul = doc.createElement("ul");
    links.forEach(({ href, text }) => {
      const li = doc.createElement("li");
      const a = doc.createElement("a");
      a.setAttribute("href", href);
      a.textContent = text;
      li.append(a);
      ul.append(li);
    });
    return ul;
  }
  function convertJumpButtons(element, config) {
    const map = config.jumpButtons;
    if (!map) return;
    const doc = element.ownerDocument;
    safeQueryAll7(contentRoot6(element), "div.quick-nav-row, #quick-nav").forEach((row) => {
      if (!row.isConnected) return;
      const buttons = [...row.querySelectorAll(":scope > button[onclick]")];
      if (!buttons.length) return;
      const links = buttons.map((b) => {
        const m = (b.getAttribute("onclick") || "").match(/scrollToDiv\(\s*['"]([^'"]+)['"]\s*\)/);
        const target = m && (map[m[1]] || m[1]);
        return target ? { href: `#${target}`, text: clean8(b.textContent) } : null;
      }).filter(Boolean);
      buttons.forEach((b) => b.remove());
      row.append(linkList(doc, links));
    });
  }
  function normalizeJumpNavs(element) {
    const doc = element.ownerDocument;
    safeQueryAll7(contentRoot6(element), "div.sticky").forEach((nav) => {
      const links = [...nav.querySelectorAll("a[href]")].map((a) => ({
        href: a.getAttribute("href"),
        text: clean8(a.textContent)
      }));
      if (!links.length) return;
      nav.replaceChildren(linkList(doc, links));
    });
  }
  function rewriteAnchors(element, config) {
    const root = contentRoot6(element);
    const map = config.anchors || {};
    const headings = safeQueryAll7(root, "h1, h2, h3, h4, h5, h6").filter((h) => clean8(h.textContent));
    safeQueryAll7(root, 'a[href^="#"]').forEach((a) => {
      const id = decodeURIComponent(a.getAttribute("href").slice(1));
      if (!id) return;
      if (Object.prototype.hasOwnProperty.call(map, id)) {
        a.setAttribute("href", `#${map[id]}`);
        return;
      }
      if (/^ref\d+$/.test(id)) return;
      const esc = id.replace(/["\\]/g, "");
      const target = safeQuery5(root, `[id="${esc}"]`) || safeQuery5(root, `a[name="${esc}"]`);
      if (!target) return;
      let heading = /^H[1-6]$/.test(target.tagName) ? target : target.querySelector("h1, h2, h3, h4, h5, h6");
      if (!heading) {
        heading = headings.find((h) => !target.contains(h) && target.compareDocumentPosition(h) & 4);
      }
      if (heading) a.setAttribute("href", `#${slug2(heading.textContent)}`);
    });
  }
  function unlinkFootnotes(element, config) {
    if (!config.unlinkFootnotes) return;
    safeQueryAll7(contentRoot6(element), 'a[href^="#ref"]').forEach(unwrap);
  }
  function unlinkBroken(element, ctx) {
    safeQueryAll7(element, BROKEN_LINK).forEach((a) => {
      if (ctx && (ctx.isInstance(a) || ctx.insideInstance(a))) return;
      unwrap(a);
    });
  }
  function flattenButtonLinks(element, ctx) {
    safeQueryAll7(element, "a button").forEach((button) => {
      if (ctx && ctx.insideInstance(button)) return;
      button.replaceWith(element.ownerDocument.createTextNode(clean8(button.textContent)));
    });
    safeQueryAll7(element, "a").forEach((a) => {
      if (ctx && ctx.insideInstance(a)) return;
      if (a.querySelector("img") && !clean8(a.textContent)) return;
      if (/btn|button/.test(a.className || "") || a.closest("div.buttflex")) {
        a.querySelectorAll("img").forEach((img) => img.remove());
        if (a.children.length === 0) a.textContent = clean8(a.textContent);
      }
    });
  }
  function wrapBareLinks(element, ctx) {
    const doc = element.ownerDocument;
    safeQueryAll7(contentRoot6(element), "a[href]").forEach((a) => {
      if (ctx.isInstance(a) || ctx.insideInstance(a)) return;
      const parent = a.parentElement;
      if (!parent || !/^(DIV|SECTION|ARTICLE)$/.test(parent.tagName)) return;
      if (!clean8(a.textContent)) return;
      const p = doc.createElement("p");
      a.replaceWith(p);
      p.append(a);
    });
  }
  var PRIMARY_BUTTON = /(^|\s)(primary-btn|btn-red|btn-primary)(\s|$)/;
  var SECONDARY_BUTTON = /(^|\s)(btn-default|redbtn|related-topic-button|btn-secondary)(\s|$)/;
  function emphasizeButtons(element, ctx) {
    const doc = element.ownerDocument;
    safeQueryAll7(contentRoot6(element), "a[href]").forEach((a) => {
      if (ctx.isInstance(a) || ctx.insideInstance(a)) return;
      const cls = a.className || "";
      const tag = PRIMARY_BUTTON.test(cls) ? "strong" : SECONDARY_BUTTON.test(cls) ? "em" : null;
      if (!tag || !clean8(a.textContent) || a.querySelector("img")) return;
      if (a.closest("strong, em, b, i, li, h1, h2, h3, h4, h5, h6")) return;
      let p = a.parentElement;
      if (!p) return;
      if (p.tagName !== "P" || clean8(p.textContent) !== clean8(a.textContent)) {
        const wrap = doc.createElement("p");
        a.replaceWith(wrap);
        wrap.append(a);
        p = wrap;
      }
      const emph = doc.createElement(tag);
      a.replaceWith(emph);
      emph.append(a);
    });
  }
  function translateDates(element) {
    safeQueryAll7(contentRoot6(element), "div.bcls-aeo-published p").forEach((p) => {
      let text = p.textContent;
      HINDI_MONTHS.forEach(([re, en]) => {
        text = text.replace(re, en);
      });
      if (text !== p.textContent) p.textContent = clean8(text);
    });
  }
  function removeNamedAnchors(element) {
    safeQueryAll7(element, "a[name]:not([href])").forEach((a) => {
      if (!clean8(a.textContent) && !a.querySelector("img")) a.remove();
    });
  }
  function headMeta(doc, attr, name) {
    const head = doc.head || doc;
    return [...head.querySelectorAll(`meta[${attr}="${name}"]`)].map((m) => clean8(m.getAttribute("content"))).filter(Boolean).join(", ");
  }
  function appendMetadata(element, config) {
    const doc = element.ownerDocument;
    const cells = {};
    const title = doc.querySelector("head title") || doc.querySelector("title");
    if (title && clean8(title.textContent)) cells.Title = clean8(title.textContent);
    const description = headMeta(doc, "name", "description") || headMeta(doc, "property", "og:description");
    if (description) cells.Description = description;
    const keywords = headMeta(doc, "name", "keywords");
    if (keywords) cells.keywords = keywords;
    cells.template = "mybeckman";
    if (config && config.theme) cells.theme = config.theme;
    const ogImage = headMeta(doc, "property", "og:image") || headMeta(doc, "name", "og:image");
    if (ogImage) {
      const src = ogImage.split(", ")[0];
      const a = doc.createElement("a");
      a.href = src;
      a.textContent = src;
      cells.image = a;
    }
    if (!Object.keys(cells).length) return;
    element.append(WebImporter.Blocks.createBlock(doc, { name: "Metadata", cells }));
    const head = doc.head;
    if (!head) return;
    safeQueryAll7(doc, "title").forEach((t) => t.remove());
    safeQueryAll7(head, 'meta[name="description"], meta[property^="og:"], meta[property^="twitter:"], link[rel="canonical"]').forEach((m) => m.remove());
  }
  function stripScriptAttributes(element) {
    safeQueryAll7(element, "*").forEach((el) => {
      [...el.attributes].forEach(({ name }) => {
        if (name.startsWith("on") || name.startsWith("data-bind") || name.startsWith("data-featherlight")) {
          el.removeAttribute(name);
        }
      });
    });
  }
  function transform11(hookName, element, payload) {
    const template = payload && payload.template;
    if (!template || typeof template.name !== "string" || !template.name.startsWith(TEMPLATE_PREFIX)) return;
    if (!element || !element.querySelectorAll) return;
    const config = pageConfig(template);
    if (hookName === "onLoad") {
      tagSections(element, template);
      recordBackgrounds(element, config);
      tagHeroTone(element);
      return;
    }
    if (hookName === "beforeTransform") {
      tagSections(element, template);
      recordBackgrounds(element, config);
      const ctx = makeContext(element, template);
      tagHeroTone(element);
      removeBackgroundImages(element, config);
      dedupeCalloutImages(element);
      removeChrome6(element, config, ctx);
      removeComments2(element);
      promoteFormHeadings(element);
      promoteStrongHeadings(element, config);
      demoteReferenceLines(element, config);
      demoteExtraH1s2(element);
      fixAuthorHeadings(element);
      absolutizeAssetLinks(element);
      convertJumpButtons(element, config);
      normalizeJumpNavs(element);
      rewriteAnchors(element, config);
      unlinkFootnotes(element, config);
      unlinkBroken(element, ctx);
      flattenButtonLinks(element, ctx);
      translateDates(element);
      removeNamedAnchors(element);
      wrapBareLinks(element, ctx);
      emphasizeButtons(element, ctx);
      removeEmptyText(element, ctx);
      removeEmptyWrappers(element, ctx);
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
        "button#myBtn",
        "wistia-tag-manager",
        "#consent_blackbar",
        "div.footer2023",
        "header#mainNav",
        "#ModalPopup"
      ]);
      unlinkBroken(element, null);
      flattenButtonLinks(element, null);
      removeNamedAnchors(element);
      absolutizeSiteLinks(element);
      stripScriptAttributes(element);
      appendMetadata(element, config);
      damifyImageLinks(element);
    }
  }
  var DAM_MAP = {
    "https://embed-ssl.wistia.com/deliveries/224144afcbc9d6ca19521b03e49533d5.jpg?image_crop_resized=960x480": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/224144afcbc9d6ca19521b03e49533d5.jpg",
    "https://embed-ssl.wistia.com/deliveries/3209e680127f6a5d15ce62a55bfc6498.jpg?image_crop_resized=960x480": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/3209e680127f6a5d15ce62a55bfc6498.jpg",
    "https://embed-ssl.wistia.com/deliveries/409cbdc255c1a944ebc233d2115f98e6a326cc45.jpg?image_crop_resized=960x540": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/409cbdc255c1a944ebc233d2115f98e6a326cc45.jpg",
    "https://embed-ssl.wistia.com/deliveries/45e305cfc56cdabaa65169d0fa94af5e.jpg?image_crop_resized=960x540": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/45e305cfc56cdabaa65169d0fa94af5e.jpg",
    "https://embed-ssl.wistia.com/deliveries/4995dc25d6fa8976480ea4c9558f75dd.jpg?image_crop_resized=960x540": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/4995dc25d6fa8976480ea4c9558f75dd.jpg",
    "https://embed-ssl.wistia.com/deliveries/50e244c00777190b1d68e625fcadf3e2.jpg?image_crop_resized=960x540": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/50e244c00777190b1d68e625fcadf3e2.jpg",
    "https://embed-ssl.wistia.com/deliveries/5702af258835345953234a5891605f90a3af40e2.jpg?image_crop_resized=960x540": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/5702af258835345953234a5891605f90a3af40e2.jpg",
    "https://embed-ssl.wistia.com/deliveries/5dd736fef9e33dadee202947e3458ca8c4d58741.jpg?image_crop_resized=960x540": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/5dd736fef9e33dadee202947e3458ca8c4d58741.jpg",
    "https://embed-ssl.wistia.com/deliveries/c8c2e5649c0cfa1f9611c505461c2801.jpg?image_crop_resized=960x480": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/c8c2e5649c0cfa1f9611c505461c2801.jpg",
    "https://embed-ssl.wistia.com/deliveries/daddcd151acb3a5e63a6ec126dd0ff04.jpg?image_crop_resized=960x540": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/daddcd151acb3a5e63a6ec126dd0ff04.jpg",
    "https://embed-ssl.wistia.com/deliveries/e6d1c6d874dbc935a49a5708a12b4e0e.jpg?image_crop_resized=960x540": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/e6d1c6d874dbc935a49a5708a12b4e0e.jpg",
    "https://embed-ssl.wistia.com/deliveries/fc26b07f327410cfe988f88e29ae5da8.jpg?image_crop_resized=960x540": "/content/dam/demo-ma-aem-coder/mybeckman/wistia/fc26b07f327410cfe988f88e29ae5da8.jpg",
    "https://media.beckman.com/-/media/app-note-support-items/a-rapid-flow-cytometry-data-analysis-workflow-using-machine-learning/figure-2.png?rev=03187d58c90f47d581431b3faf114d83": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/a-rapid-flow-cytometry-data-analysis-workflow-using-machine-learning/figure-2.png",
    "https://media.beckman.com/-/media/app-note-support-items/automating-cell-based-processes/thumbnail.jpg?h=251&w=195&rev=eed4b5d101af41099f64a80d30aa1945&sc_lang=hi&hash=F9AC4C4D95353F62A7308D946260CCA1": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/automating-cell-based-processes/thumbnail.jpg",
    "https://media.beckman.com/-/media/app-note-support-items/automating-cell-line-development/thumbnail.jpg?h=251&w=195&rev=cbf0d10c3ecc428086619bef6163c5cd&sc_lang=hi&hash=D17C102CE2FBF2BDEAC8C212074FAC47": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/automating-cell-line-development/thumbnail.jpg",
    "https://media.beckman.com/-/media/app-note-support-items/automating-cell-line-development/thumbnail2.jpg?h=251&w=195&rev=405018fae8334c5bbd759964fd13ff1a&sc_lang=hi&hash=41B1EF6F31D2C3BA5413DE352F20E17B": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/automating-cell-line-development/thumbnail2.jpg",
    "https://media.beckman.com/-/media/app-note-support-items/cell-line-development-hit-picking/thumbnail.jpg?h=251&w=195&rev=8d6fecb2eab54b87b0b29741aa0c3be8&sc_lang=hi&hash=291C40FA099FB2A30987FE1323E0AFC7": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/cell-line-development-hit-picking/thumbnail.jpg",
    "https://media.beckman.com/-/media/app-note-support-items/cell-line-development-limiting-dilution/thumbnail.jpg?h=251&w=195&rev=05648305e07b4caeb5ccf27cfb2af0eb&sc_lang=hi&hash=5A0BBBF95393CA79D8A0657924BB03FD": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/cell-line-development-limiting-dilution/thumbnail.jpg",
    "https://media.beckman.com/-/media/app-note-support-items/cell-line-development-selection-enrichment/thumbnail.jpg?h=251&w=195&rev=22c432abaa314bcf8c7135f46b9ef7d8&sc_lang=hi&hash=FC8ADFCF4A668B775E4515EDB573DF35": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/cell-line-development-selection-enrichment/thumbnail.jpg",
    "https://media.beckman.com/-/media/app-note-support-items/cluster-count-analysis-and-sample-preparation/thumbnail?rev=00cce21201e842d78473e71dbe20c155": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/cluster-count-analysis-and-sample-preparation/thumbnail.jpg",
    "https://media.beckman.com/-/media/app-note-support-items/evaluation-of-instrument-to-instrument-performance-of-the-vicell-blu-cell-viability-analyzer/evaluation-of-instrument-to-instrument-performance-of-the-vicell-blu-cell-viability-analyzer?rev=9f2a1c3f8bff4c209c1397f6619a479b": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/evaluation-of-instrument-to-instrument-performance-of-the-vicell-blu-cell-viability-analyzer/evaluation-of-instrument-to-instrument-performance-of-the-vicell-blu-cell-viability-analyzer.jpg",
    "https://media.beckman.com/-/media/app-note-support-items/integration-of-the-vi-cell-blu-cell-viability-analyzer-into-the-sartorius-ambr-250-high-throughput/thumbnail.jpg?h=251&w=195&rev=48723df8b8f044ff81650c20adecd34c&sc_lang=hi&hash=C687FF4143B183AC9213E80432A2686C": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/integration-of-the-vi-cell-blu-cell-viability-analyzer-into-the-sartorius-ambr-250-high-throughput/thumbnail.jpg",
    "https://media.beckman.com/-/media/app-note-support-items/integration-of-the-vi-cell-blu-cell-viability-analyzer-into-the-sartorius-ambr-250-high-throughput/thumbnail?rev=48723df8b8f044ff81650c20adecd34c": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/integration-of-the-vi-cell-blu-cell-viability-analyzer-into-the-sartorius-ambr-250-high-throughput/thumbnail-02630a.jpg",
    "https://media.beckman.com/-/media/app-note-support-items/leveraging-analytical-ultracentrifugation-for-comprehensive-characterization-of-lipid-nanoparticles/application-note-leveraging-analytical-ultracentrifugation-for-comprehensive-characterization-2.jpg?rev=3e6e33700c6a42bd8c4fbd18d751ea85&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/leveraging-analytical-ultracentrifugation-for-comprehensive-characterization-of-lipid-nanoparticles/application-note-leveraging-analytical-ultracentrifugation-for-comprehensive-characterization-2.jpg",
    "https://media.beckman.com/-/media/app-note-support-items/the-vi-cell-blu-cell-viability-analyzer-cell-counter-performance-comparison-for-cho-and-hek-cells/thumbnail?rev=9ffc68c1e7ca4fa7bead012b1e1a7ccd": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/the-vi-cell-blu-cell-viability-analyzer-cell-counter-performance-comparison-for-cho-and-hek-cells/thumbnail.jpg",
    "https://media.beckman.com/-/media/app-note-support-items/variability-analysis-of-the-vi-cell-blu-cell-viability-analyzer-against-3-automated-cell-counting/thumbnail.jpg?h=251&w=195&rev=ce6ad22af0a846d6a1efee30b992ca59&sc_lang=hi&hash=3E70F918AEC24674F9E767987A3393A0": "/content/dam/demo-ma-aem-coder/mybeckman/app-note-support-items/variability-analysis-of-the-vi-cell-blu-cell-viability-analyzer-against-3-automated-cell-counting/thumbnail.jpg",
    "https://media.beckman.com/-/media/biolector/cell-viability-vi-cell-blu-carousel-201901.jpg?rev=9ad04fd102ac4e94b9d21eab3afd75ad": "/content/dam/demo-ma-aem-coder/mybeckman/biolector/cell-viability-vi-cell-blu-carousel-201901.jpg",
    "https://media.beckman.com/-/media/cell-preparation-systems/instruments/cellmek-sps/callouts/flow-cytometry-cellmek-sps-8-waste.jpg?rev=ee9ae8d8ac9540dd87331c28627b72f9": "/content/dam/demo-ma-aem-coder/mybeckman/cell-preparation-systems/instruments/cellmek-sps/callouts/flow-cytometry-cellmek-sps-8-waste.jpg",
    "https://media.beckman.com/-/media/cell-preparation-systems/instruments/cellmek-sps/callouts/flow-cytometry-cellmek-sps-precision-performance.jpg?rev=8b0bd20c1c614038b954cc63956c41f8": "/content/dam/demo-ma-aem-coder/mybeckman/cell-preparation-systems/instruments/cellmek-sps/callouts/flow-cytometry-cellmek-sps-precision-performance.jpg",
    "https://media.beckman.com/-/media/cell-preparation-systems/instruments/cellmek-sps/callouts/flow-cytometry-cellmek-sps-sample-prep-performance.jpg?rev=a6a53da589044e39bb1ba61bd3765202": "/content/dam/demo-ma-aem-coder/mybeckman/cell-preparation-systems/instruments/cellmek-sps/callouts/flow-cytometry-cellmek-sps-sample-prep-performance.jpg",
    "https://media.beckman.com/-/media/cell-preparation-systems/instruments/cellmek-sps/flow-cytometry-cellmek-sps-hero-1.jpg": "/content/dam/demo-ma-aem-coder/mybeckman/cell-preparation-systems/instruments/cellmek-sps/flow-cytometry-cellmek-sps-hero-1.jpg",
    "https://media.beckman.com/-/media/cell-preparation-systems/instruments/cellmek-sps/flow-cytometry-cellmek-sps-hero-1.jpg?rev=f7f000d197d74d01b640cb3f9d78e8d7": "/content/dam/demo-ma-aem-coder/mybeckman/cell-preparation-systems/instruments/cellmek-sps/flow-cytometry-cellmek-sps-hero-1.jpg",
    "https://media.beckman.com/-/media/cell-sorters-counters-and-analyzers/cell-analyzers/instruments/cydem-vt/product-images/cydem-vt-system-front-view.jpg?rev=c3d5cae285484fc0baa6021516eae9df": "/content/dam/demo-ma-aem-coder/mybeckman/cell-sorters-counters-and-analyzers/cell-analyzers/instruments/cydem-vt/product-images/cydem-vt-system-front-view.jpg",
    "https://media.beckman.com/-/media/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-analytical-ultracentrifuge-auc-general-lab?rev=0df6a6ca84234caca209b883d07d9bdb": "/content/dam/demo-ma-aem-coder/mybeckman/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-analytical-ultracentrifuge-auc-general-lab.jpg",
    "https://media.beckman.com/-/media/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-analytical-ultracentrifuge-optima-auc-full-view-2017-05.jpg?rev=39d4064f4c334a40986dbbe3ce81d17a": "/content/dam/demo-ma-aem-coder/mybeckman/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-analytical-ultracentrifuge-optima-auc-full-view-2017-05.jpg",
    "https://media.beckman.com/-/media/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-analytical-ultracentrifuge-optima-auc-full-view-2017-05?rev=39d4064f4c334a40986dbbe3ce81d17a": "/content/dam/demo-ma-aem-coder/mybeckman/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-analytical-ultracentrifuge-optima-auc-full-view-2017-05.png",
    "https://media.beckman.com/-/media/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-rotor-analytical-optima-auc-chamber-lid-2017-11.png?rev=4c47520a046b4e47ae166042ca6463e1": "/content/dam/demo-ma-aem-coder/mybeckman/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-rotor-analytical-optima-auc-chamber-lid-2017-11.png",
    "https://media.beckman.com/-/media/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-rotor-analytical-optima-auc-chamber-lid-2017-11?rev=4c47520a046b4e47ae166042ca6463e1": "/content/dam/demo-ma-aem-coder/mybeckman/centrifugation/products/instruments/analytical-ultracentrifuge/optima-auc/centrifuge-rotor-analytical-optima-auc-chamber-lid-2017-11-4278be.png",
    "https://media.beckman.com/-/media/cytobank/content/premium/cytobank-v10-release-details-img1-2022-09.jpg?rev=0ccf4b855e3b491baecf61432a85a308": "/content/dam/demo-ma-aem-coder/mybeckman/cytobank/content/premium/cytobank-v10-release-details-img1-2022-09.jpg",
    "https://media.beckman.com/-/media/events/speakers/basse_hofzumahaus.jpg?rev=c0fc859e4e054283bdf1511bad88f9d2&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/events/speakers/basse_hofzumahaus.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/5-costly-aspects-of-manual-data-analysis/flow-cytometry-5-costly-aspects-callout-2024-05.jpg?rev=04717ee2f2a3402dba6a9ed38402fe9f&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/5-costly-aspects-of-manual-data-analysis/flow-cytometry-5-costly-aspects-callout-2024-05.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-automated-callout-2024-06.jpg?rev=e361e34e1e744def824bc5dd33c3bbaf&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-automated-callout-2024-06.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-ebook-thumbnail.jpg?rev=6eabb63c1c994714b0da729235de0ccb&sc_lang=hi&hash=61BF460AB1735144D76F49AACFF0DB59": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-ebook-thumbnail.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-hero-banner-2024-04.jpg?rev=73cc09c870b3414ea2a0ec947562cee2&sc_lang=hi&hash=7F904E0F050C96CDD8FE069A8476B1D4": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-hero-banner-2024-04.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-nav-background-2024-06.jpg?rev=08a128a0dfe6473bbda8814468fddd34&sc_lang=hi&hash=E432376D75D67F82926152EE17902E92": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-nav-background-2024-06.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-workflow-steps-2024-06.jpg?rev=7a369532eaea43ecae95f6f9b2d8f883&sc_lang=hi&hash=62FC2F964D408A7EF97B2FD763111671": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/flow-cytometry-clinical-trials-workflow-steps-2024-06.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/fully-automated-workflow/flow-cytometry-clinical-trials-automated-workflow-02c-hardware-2024-06.jpg?rev=832711cbb9334f4d9b821da6f4348134&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/fully-automated-workflow/flow-cytometry-clinical-trials-automated-workflow-02c-hardware-2024-06.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/lack-of-skilled-technicians/flow-cytometry-lack-of-skilled-vacancy-rates-2024-05.jpg?rev=4db47702a5c242fca5a2d35ff89e40db&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/lack-of-skilled-technicians/flow-cytometry-lack-of-skilled-vacancy-rates-2024-05.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/standardization/flow-cytometry-clinical-trials-analysis-evolution-2024-04.jpg?rev=84608d4156674a9aa661b8be06b65251&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/standardization/flow-cytometry-clinical-trials-analysis-evolution-2024-04.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/clinical-trials/tracking-car-t-cells-after-infusion/flow-cytometry-clinical-trials-car-t-histogram-1-2024-05.jpg?rev=ac4ec7f4d23e42e7adacd4768fd9a5b3&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/clinical-trials/tracking-car-t-cells-after-infusion/flow-cytometry-clinical-trials-car-t-histogram-1-2024-05.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/casebook/clearllab-10c-download/flow-cytometry-clearllab-10c-casebook-cover-2022-06.jpg?rev=8f2ecb57c7884f5cbb64ca9263f0788b": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/casebook/clearllab-10c-download/flow-cytometry-clearllab-10c-casebook-cover-2022-06.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-additional-resources-banner.jpg?rev=ad3351acafb84dea9cd8b121e9b0b0bf": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-additional-resources-banner.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-challenges-banner.jpg?rev=34ce9b6e9cbd4153b0baf1c9caee707a": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-challenges-banner.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-diagnostic-tool-banner.jpg?rev=8f783f0e98044976be9aa1e76569c1fa": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-diagnostic-tool-banner.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-lab-challenges.png?rev=fffaa2edaac641e78d166f8e8abc07bf": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-lab-challenges.png",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-overview-and-statistics-banner.jpg?rev=5739e57e32714629a631bf39b7a908ac": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-overview-and-statistics-banner.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-standardized-reagents-banner.jpg?rev=903180de1f854d8d8422cce35fd65652": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/gateway-page/flow-cytometry-l-and-l-standardized-reagents-banner.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/poster/flow-cytometry-haematopoietic-malignancies-poster-v2-2022-06.png?rev=b601568543474127bd92e324e6dd3ae2": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/poster/flow-cytometry-haematopoietic-malignancies-poster-v2-2022-06.png",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s1p02-how-flow-aids-diagnosis/flow-cytometry-clearllab-10c-workflow.jpg?rev=2ffc0ecf07ae4f449a7ad1992ecfa875": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s1p02-how-flow-aids-diagnosis/flow-cytometry-clearllab-10c-workflow.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s1p06-plasma-cell-neoplasms/flow-cytometry-plasma-cell-neoplasms.jpg?rev=6a9beb10bf8a464abd286eb145bbfb2f": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s1p06-plasma-cell-neoplasms/flow-cytometry-plasma-cell-neoplasms.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s1p10-t-all/flow-cytometry-t-cell-acute-lymphoblastic-leukemia.jpg?rev=51532f74ae7942c18ddc2340490ef150": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s1p10-t-all/flow-cytometry-t-cell-acute-lymphoblastic-leukemia.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s1p12-aml/flow-cytometry-acute-myeloid-leukemia.jpg?rev=f3a4a9e328414aa489677323dc5adc7e": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s1p12-aml/flow-cytometry-acute-myeloid-leukemia.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s2p01-minimizing-waste/flow-cytometry-workflow-spaghetti-diagram-1.jpg?rev=1f68ced1d77849b6b8581e3d0fef1daf": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s2p01-minimizing-waste/flow-cytometry-workflow-spaghetti-diagram-1.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s2p07-calculator/flow-cytometry-dura-innovations-calculator.png?rev=713cbfe365c74e86b8222ffd591d82ef": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s2p07-calculator/flow-cytometry-dura-innovations-calculator.png",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s2p09-dry-vs-liquid/flow-cytometry-dry-vs-liquid-thumbmail.png?rev=14b5f16b85d5497880edb7377452ff15": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s2p09-dry-vs-liquid/flow-cytometry-dry-vs-liquid-thumbmail.png",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s4p03-hernandez/flow-cytometry-sandra-hernandez.jpg?rev=79e6bc816ef849fdaa0e477ea3042981": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s4p03-hernandez/flow-cytometry-sandra-hernandez.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s5p03-cd200/flow-cytometry-cd200-expression.png?rev=96dce4ed7ae1416d99aef6048d6a3f68": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s5p03-cd200/flow-cytometry-cd200-expression.png",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s5p04-markers-in-the-panel/flow-cytometry-hematological-malignancies-s5-p4-figure-1a.jpg?rev=239ac5995e904da4a02e3ef685188a8a": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s5p04-markers-in-the-panel/flow-cytometry-hematological-malignancies-s5-p4-figure-1a.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/hematological-malignancies/s7p03-flow-cytometry-in-pediatric-cancer-diagnosis/flow-cytometry-pediatric-cancer-diagnosis-webinar-fig3-2022-06.jpg?rev=743e1ccbc68044ee8bbc2439ca4f5f8e": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hematological-malignancies/s7p03-flow-cytometry-in-pediatric-cancer-diagnosis/flow-cytometry-pediatric-cancer-diagnosis-webinar-fig3-2022-06.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/hiv-section/section-0/flowc-hiv-cd4-button-guidelines.jpg?rev=f874055d420848ff915044a9fc38f5e3": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/hiv-section/section-0/flowc-hiv-cd4-button-guidelines.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/content/ivdr/flow-cytometry-ivdr-impact-of-ivdr-webinar-callout-2.jpg?rev=359f968a009444fdba81d9fbd2960d28": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/content/ivdr/flow-cytometry-ivdr-impact-of-ivdr-webinar-callout-2.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/products/instruments/cytoflex/flow-cytometry-cytometers-cytoflex-full-view-2017-05.png": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/instruments/cytoflex/flow-cytometry-cytometers-cytoflex-full-view-2017-05.png",
    "https://media.beckman.com/-/media/flow-cytometry/products/instruments/cytoflex/flow-cytometry-cytometers-cytoflex-full-view-2017-05.png?rev=43f5b13d7e0145a89f0c74fc27ab7d7a": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/instruments/cytoflex/flow-cytometry-cytometers-cytoflex-full-view-2017-05.png",
    "https://media.beckman.com/-/media/flow-cytometry/products/instruments/cytoflex/flow-cytometry-instruments-cytoflex-lx-2018-7.gif": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/instruments/cytoflex/flow-cytometry-instruments-cytoflex-lx-2018-7.gif",
    "https://media.beckman.com/-/media/flow-cytometry/products/instruments/cytoflex/flow-cytometry-instruments-cytoflex-lx-2018-7.gif?rev=c47860798bdd4c0d8649eb4212dba6f3": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/instruments/cytoflex/flow-cytometry-instruments-cytoflex-lx-2018-7.gif",
    "https://media.beckman.com/-/media/flow-cytometry/products/instruments/dxflex/callout-images/flow-cytometry-dxflex-standardization-tile.jpg?rev=d3e2f2090b7f4883a38c8b55cdae6a2b&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/instruments/dxflex/callout-images/flow-cytometry-dxflex-standardization-tile.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/products/instruments/navios/flow-cytometers-navios-ex-full-view-2017-05.png?rev=6389c866ca4b43b798eb086cbb435d3a": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/instruments/navios/flow-cytometers-navios-ex-full-view-2017-05.png",
    "https://media.beckman.com/-/media/flow-cytometry/products/instruments/srt/flow-cytometry-cytoflex-srt-front-600x400.jpg?rev=ee2af927f8ab42599d7efc4c73388263": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/instruments/srt/flow-cytometry-cytoflex-srt-front-600x400.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-clearllab10c-10c-rack.jpg?rev=bdf3b56738bb44f2819916caa9a66ae2": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-clearllab10c-10c-rack.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-clearllab10c-compensation-beads.jpg?rev=440450b4a51648969e310cf822abda0e": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-clearllab10c-compensation-beads.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-clearllab10c-controls-tubes-boxes.jpg?rev=0897d9b65f1c42eb966c1e50db2ef42e": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-clearllab10c-controls-tubes-boxes.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-clearllab10c-t-tubes.jpg?rev=05ea779c053848928b1c4c28584a0455": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-clearllab10c-t-tubes.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-reagents-clearllab-10c-workflow-.jpg?w=1140&rev=4c44d07b9fc64b49a1f8ea4a35794035&hash=600D4F68853C84E45B18F2EB0BE800DE": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-reagents-clearllab-10c-workflow-.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-reagents-lab-developed-tests-workflow-v2.jpg?w=1140&rev=b7d731828ed741b2a28f73513b7e723b&hash=C1374ECF85BB6D31087CDDBFEBDFCABB": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/clearllab/10c/flow-cytometry-reagents-lab-developed-tests-workflow-v2.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/products/reagents/clearllab/flow-cytometry-clearllab-compensation-kit-2017-05.jpg?rev=c015e74d24c44945aee44ae18ebc66e1": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/clearllab/flow-cytometry-clearllab-compensation-kit-2017-05.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/products/reagents/duraclone/duraclone-im/flow-cytometry-reagent-duraclone-im-panels-2017-05.jpg": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/duraclone/duraclone-im/flow-cytometry-reagent-duraclone-im-panels-2017-05.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/products/reagents/duraclone/duraclone-im/flow-cytometry-reagent-duraclone-im-panels-2017-05.jpg?rev=d31f34ba48d243d98892ea6a60dae277": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/duraclone/duraclone-im/flow-cytometry-reagent-duraclone-im-panels-2017-05.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/products/reagents/duraclone/flow-cytometry-dura-innovations-time-savings-2019-03.jpg?rev=f4750e283a4c4b468f969761d5dc2138": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/duraclone/flow-cytometry-dura-innovations-time-savings-2019-03.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/products/reagents/sample-preparation/flow-cytometry-sample-preparation-02-2018.png?rev=4cd3c62cb35b4d699ace369d1bd46be7": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/sample-preparation/flow-cytometry-sample-preparation-02-2018.png",
    "https://media.beckman.com/-/media/flow-cytometry/products/reagents/supernova/flow-cytometry-reagents-supernova-polymer-dyes-liquid-conjugates.jpg?rev=7d476c673e284b0999ee6467d9187e5c": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/reagents/supernova/flow-cytometry-reagents-supernova-polymer-dyes-liquid-conjugates.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/products/software/cytobank/cytobank-learning-center-tiles/flow-cytometry-cytobank-learning-center-security-figure10.jpg?rev=7eda4ef5a4d0442da448d9c0343fa570": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/software/cytobank/cytobank-learning-center-tiles/flow-cytometry-cytobank-learning-center-security-figure10.jpg",
    "https://media.beckman.com/-/media/flow-cytometry/products/software/cytobank/flow-software-cytobank-logo-2023-02.png?rev=12b0ade940f142989c5131f34c3bf358": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/software/cytobank/flow-software-cytobank-logo-2023-02.png",
    "https://media.beckman.com/-/media/flow-cytometry/products/software/kaluza-c/flow-cytometry-kaluza-c-logo.jpg?rev=6e6bbbb786564e1ebc79c70d89cb2a86": "/content/dam/demo-ma-aem-coder/mybeckman/flow-cytometry/products/software/kaluza-c/flow-cytometry-kaluza-c-logo.jpg",
    "https://media.beckman.com/-/media/flow-reagents/products/infrared-fluorescent-dyes/infrared_fluorescent_dye_d20055_cd8_ir870.png?rev=0048dceaa72947dc872b994c4e25b7b0&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/flow-reagents/products/infrared-fluorescent-dyes/infrared_fluorescent_dye_d20055_cd8_ir870.png",
    "https://media.beckman.com/-/media/genomics/content/articles/accelerating-discovery-with-automated-ngs-library-prep/automated-ngs-library-prep-banner-social-media-2024-10.jpg?rev=f0bb398798534f179363fbebeaa32b31&sc_lang=hi&hash=10642233551258A6B4BD9D3BC3E966BC": "/content/dam/demo-ma-aem-coder/mybeckman/genomics/content/articles/accelerating-discovery-with-automated-ngs-library-prep/automated-ngs-library-prep-banner-social-media-2024-10.jpg",
    "https://media.beckman.com/-/media/genomics/content/articles/biomanufacturing-and-ngs/biomanufacturing-ngs-social-media-2024-07.jpg?rev=6e7bf33bdced4694980a28645e43c57f&sc_lang=hi&hash=2D71559EAB9A3B3D24EA0D48760155AB": "/content/dam/demo-ma-aem-coder/mybeckman/genomics/content/articles/biomanufacturing-and-ngs/biomanufacturing-ngs-social-media-2024-07.jpg",
    "https://media.beckman.com/-/media/genomics/content/articles/challenges-with-ffpe-tissue-samples/ngs-ffpe-samples-challenges-social-media-2024-09.jpg?rev=5d76b6349887444f8d4e2033df108d9a&sc_lang=hi&hash=A1AEC69D7AB2D9B0CCFC370E7C132B48": "/content/dam/demo-ma-aem-coder/mybeckman/genomics/content/articles/challenges-with-ffpe-tissue-samples/ngs-ffpe-samples-challenges-social-media-2024-09.jpg",
    "https://media.beckman.com/-/media/genomics/content/articles/ngs-cost-reduction/ngs-cost-reduction-banner-social-media-2024-09.jpg?rev=0f7303cda61849d28c32368c9c3c2844": "/content/dam/demo-ma-aem-coder/mybeckman/genomics/content/articles/ngs-cost-reduction/ngs-cost-reduction-banner-social-media-2024-09.jpg",
    "https://media.beckman.com/-/media/genomics/content/articles/nucleic-acid-cleanup-for-sequencing/nucleic-acid-cleanup-ngs-top-banner-social-media-2-2024-07.jpg?rev=6894a7637877444c900e4e93c7e8682f&sc_lang=hi&hash=76C48267A011A8115A4ABE7271D751E1": "/content/dam/demo-ma-aem-coder/mybeckman/genomics/content/articles/nucleic-acid-cleanup-for-sequencing/nucleic-acid-cleanup-ngs-top-banner-social-media-2-2024-07.jpg",
    "https://media.beckman.com/-/media/genomics/content/articles/optimizing-dna-and-rna-extraction-protocols-for-ngs/optmizing-extraction-protocols-ngs-social-media-2024-05.jpg?rev=ac89cfe5b3af4247a449480ab5ab4e71&sc_lang=hi&hash=4C0DBB2EE77F798870C1E7626C69B657": "/content/dam/demo-ma-aem-coder/mybeckman/genomics/content/articles/optimizing-dna-and-rna-extraction-protocols-for-ngs/optmizing-extraction-protocols-ngs-social-media-2024-05.jpg",
    "https://media.beckman.com/-/media/genomics/content/articles/role-of-ngs-in-cancer-research/ngs-cancer-research-banner-social-media-2024-09.jpg?rev=01ff9b5ca4584f27bcee7b722575aa97": "/content/dam/demo-ma-aem-coder/mybeckman/genomics/content/articles/role-of-ngs-in-cancer-research/ngs-cancer-research-banner-social-media-2024-09.jpg",
    "https://media.beckman.com/-/media/genomics/products/dna-isolation/genomic-dna-extraction-automation-biomek-liquid-handler.jpg?rev=40a3df3265c3499cab1312094dbe17ff&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/genomics/products/dna-isolation/genomic-dna-extraction-automation-biomek-liquid-handler.jpg",
    "https://media.beckman.com/-/media/immunotherapy/manufacturing-processes-for-engineered-t-cell-therapy/biomek.jpg?rev=b71245f0d9bd426a8217c2066ff551c0": "/content/dam/demo-ma-aem-coder/mybeckman/immunotherapy/manufacturing-processes-for-engineered-t-cell-therapy/biomek.jpg",
    "https://media.beckman.com/-/media/immunotherapy/manufacturing-processes-for-engineered-t-cell-therapy/cytoflex-flow-cytometer.jpg?rev=2c6ade0a241f4e9d813937030e6a478b": "/content/dam/demo-ma-aem-coder/mybeckman/immunotherapy/manufacturing-processes-for-engineered-t-cell-therapy/cytoflex-flow-cytometer.jpg",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/echo-comparison-page/liquid-handler-echo-650t-2023-04.jpg?rev=b44efa5bd7a240f6933bcc57a95b08b9": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/echo-comparison-page/liquid-handler-echo-650t-2023-04.jpg",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/automated-ngs-library-prep-biomek-ngenius-2024-09.png?rev=768830ecf054479ca533468635590f7d&sc_lang=hi&hash=75AA33AD986F9F06FF766DF2D7E998A5": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/automated-ngs-library-prep-biomek-ngenius-2024-09.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/automation-biomek-echo-genomic-applications-brochure-cover-2024-08.jpg?rev=b92b30d7eefd4a2892cc2918e3c9c741": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/automation-biomek-echo-genomic-applications-brochure-cover-2024-08.jpg",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/automation-flyer-biomek-na-method-cards-screenshot-2024-08.jpg?rev=9068e6f1cdc3422588b9110f43c22e0d": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/automation-flyer-biomek-na-method-cards-screenshot-2024-08.jpg",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/automation-flyer-biomek-ngs-method-cards-screenshot-2024-08.jpg?rev=bbce183415c04f44b1d56982a71c8a7b": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/automation-flyer-biomek-ngs-method-cards-screenshot-2024-08.jpg",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/cost-icon-2024-08.png?rev=b76e3456824d4405b94956e3cc9db13b": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/cost-icon-2024-08.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ease-of-use-icon-2024-08.png?rev=d02a260ecfb040d8ac2beb7ef9d74881": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ease-of-use-icon-2024-08.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/flexibility-icon-2024-08.png?rev=aab74ba3c3534509a20de02bbaabf25a": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/flexibility-icon-2024-08.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-ampure-xp-dna-cleanup-beads-2024-08.png?rev=09c07d781a094db0a5ad2b207f39e4ca": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-ampure-xp-dna-cleanup-beads-2024-08.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-biomek-i5-i7-automated-liquid-hanlers-2024-08.png?rev=163f56e083f34ccea7534a5c0279e0cf": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-biomek-i5-i7-automated-liquid-hanlers-2024-08.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-biomek-ngenius-library-prep-2024-08.png?rev=7cc41edfadf64bf5aee03ac3b2d920ee": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-biomek-ngenius-library-prep-2024-08.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-data-results-2024-08.jpg?rev=c29a722273e140a98443cc0e4941c249": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-data-results-2024-08.jpg",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-echo-525-acoustic-liquid-handler-2024-08.png?rev=336a06fd0f3248158634eb4b887ce07f": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-echo-525-acoustic-liquid-handler-2024-08.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-formapure-xl-total-nucleic-acid-extraction-kit-2024-08.png?rev=c9e3c841ec1e43949c35c59f6ba80e0d": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-formapure-xl-total-nucleic-acid-extraction-kit-2024-08.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-genfind-v3-dna-extraction-kit-2024-08.png?rev=cd4611bb9c4c4ed38e4454d4d98fa486": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-genfind-v3-dna-extraction-kit-2024-08.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-rnadvance-tissue-rna-extraction-kit-2024-08.png?rev=4723f853bf794f7e9768f6e3cec74861": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-rnadvance-tissue-rna-extraction-kit-2024-08.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-size-selection-cleanup-beads-brochure-front-page.jpg?rev=485a15f5bab34ec2bcba38e5c2652ad3&sc_lang=hi&hash=399FAA13C06D9190DF8C31ED3568DF83": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/ngs-size-selection-cleanup-beads-brochure-front-page.jpg",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/ngs-library-prep-regular-page/precise-data-icon-2024-08.png?rev=5281335a890e4abca48c9edaac8f945f": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/ngs-library-prep-regular-page/precise-data-icon-2024-08.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/automation-liquid-handler-biomek-i7-i5-2024-04-min.png?rev=b09f217cb9df4ebc84175e00ac41aaf6&sc_lang=hi&hash=A7AA44E48763649FC5F36BDCB2097361": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/automation-liquid-handler-biomek-i7-i5-2024-04-min.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-allegra-v15-r-2024-04-min.png?rev=8ab779354b654f27b30769aac9556004&sc_lang=hi&hash=2603E0B1ACF6A2297EACBE7389629570": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-allegra-v15-r-2024-04-min.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-ampure-xp-2024-02-min.png?rev=66406be37610440090607334c7cdd27a&sc_lang=hi&hash=F1BBFC260EB0C05775F240F467ABF6A9": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-ampure-xp-2024-02-min.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-avanti-jxn-26-2024-04-min.jpg?rev=b0ace3385a0242209533f0b6a556b32d&sc_lang=hi&hash=13E9643F7D29CFEFE9C0CEF6D1E3D48B": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-avanti-jxn-26-2024-04-min.jpg",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-biolector-xt-2024-02-min.png?rev=241ecfd659da4af5bcc5d8158fb729d3&sc_lang=hi&hash=E1F2F959366BE789D63CA05D8840307B": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-biolector-xt-2024-02-min.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-biomek-biolector-2024-02-min.png?rev=a89249b151fa4329ab0b63bedd422f62&sc_lang=hi&hash=78A864EA783134BC75FF3DE4A3BF9BAC": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-biomek-biolector-2024-02-min.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-cosmcprep-2024-02-min.png?rev=5f033570e7174e8796c989734374b5ad&sc_lang=hi&hash=21D3528EA174540FFB58805390111CC4": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-cosmcprep-2024-02-min.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-cytoflex-2024-04-min.png?rev=5ef648b7be424b559407c7e41c58b394&sc_lang=hi&hash=920177D6FD590DBD268DCCBEB95BEA27": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-cytoflex-2024-04-min.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-cytoflex-srt-2024-04-min.jpg?rev=99316335816f4f34b885afaa19c29f29&sc_lang=hi&hash=4064A377D0B36EFBBD921764233DA488": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-cytoflex-srt-2024-04-min.jpg",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-echo-525-2024-02-min.png?rev=0a35be16bfa9491ba5b46b7812cff055&sc_lang=hi&hash=4A4BB5F20DA35DA8117636FE7CF0FF86": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-echo-525-2024-02-min.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-genfind-v3-2024-02-min.png?rev=a0b5c192c8f942688bec05959eb93d28&sc_lang=hi&hash=C033F8CE15AA1F802CE28E837FDED207": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-genfind-v3-2024-02-min.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-harvestline-system-2024-04-min.jpg?rev=2a16d8b097d0448ead349160fa8c1a94&sc_lang=hi&hash=2D18FA2D17CA228E67CF2623F3383FE7": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-harvestline-system-2024-04-min.jpg",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-mechone-2024-04-min.png?rev=3c42f6eee311468caeda30cb2ff070b6&sc_lang=hi&hash=231E25E9D8C48D3A41190593710BF0DC": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-mechone-2024-04-min.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-mulrisizer-4e-2024-04-min.png?rev=9985a52357fd473d83ef8b5636875acc&sc_lang=hi&hash=BCB3A942FE79D5F0C4A19A666E667297": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-mulrisizer-4e-2024-04-min.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-optima-auc-2024-04-min.png?rev=b96c4b374933430fa3713d853254e816&sc_lang=hi&hash=0C4306B3FF348918D7B90306DD760C54": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-optima-auc-2024-04-min.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-optima-xpn-2024-04-min.png?rev=75b293134b4342e5a5c47ab0e41092f3&sc_lang=hi&hash=7725A250986EC5822F69001D982A9DC4": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-optima-xpn-2024-04-min.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-spriselect-2024-02-min.png?rev=b67102a7c56041d8b26e7c0d2303f190&sc_lang=hi&hash=DC4AF09E80B2E8CAFD928A712E9EAFCE": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/biomanufacturing-spriselect-2024-02-min.png",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/design-biuld-test-learn-cycle.jpg?rev=89dde98d58af4e5ea8c57b42ab584290": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/design-biuld-test-learn-cycle.jpg",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/lesaffre-biofoundry-spotlight-story-front-page.jpg?rev=ac3315a5400e4a5097ec3ad417e406e6": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/lesaffre-biofoundry-spotlight-story-front-page.jpg",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/synbio-page-social-media-banner-2024-07.jpg?rev=2614ad19c0064286aa3bae09d02e8ba1&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/synbio-page-social-media-banner-2024-07.jpg",
    "https://media.beckman.com/-/media/landing-page-support-images/automation/synthetic-biology-regular-page/synbio-page-top-banner-large-2024-02.jpg?rev=26376800644a4927ab651bce3798e827&sc_lang=hi&hash=2BF7DEABA4CD4A5F54BC95E21EBCAB38": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/automation/synthetic-biology-regular-page/synbio-page-top-banner-large-2024-02.jpg",
    "https://media.beckman.com/-/media/landing-page-support-images/biomanufacturing-ebook/ebook-biomanufacturing-front-page-2025-04.jpg?rev=a99fdd12f99e45f7891066b3d1e3b450": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/biomanufacturing-ebook/ebook-biomanufacturing-front-page-2025-04.jpg",
    "https://media.beckman.com/-/media/landing-page-support-images/centrifugation/cent-ppc-lp/centrifugation-allegra-v-15r-benchtop-centrifuge-2023-04.jpg?rev=9b41cd5f9f2b428786b3ab2d4008af2b": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/centrifugation/cent-ppc-lp/centrifugation-allegra-v-15r-benchtop-centrifuge-2023-04.jpg",
    "https://media.beckman.com/-/media/landing-page-support-images/centrifugation/centrifugation-adenovirus-dge-auc-2023-03.jpg?rev=deffa4590ec3404c9127dfc562118f25&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/centrifugation/centrifugation-adenovirus-dge-auc-2023-03.jpg",
    "https://media.beckman.com/-/media/landing-page-support-images/centrifugation/centrifugation-gene-therapy-dge-2023-03.jpg?rev=e34e101a686e4093beddc459bec92f54&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/centrifugation/centrifugation-gene-therapy-dge-2023-03.jpg",
    "https://media.beckman.com/-/media/landing-page-support-images/genomics/collaboration-program/genomics-customer-spotlight-palanisamy-formapure-xl-rna-screenshot-2024-02-min.png?rev=06a6773b99be4691ba69a0114d217754&sc_lang=hi&hash=1385A624D49BA4259BD7A8BFC19F0FB3": "/content/dam/demo-ma-aem-coder/mybeckman/landing-page-support-images/genomics/collaboration-program/genomics-customer-spotlight-palanisamy-formapure-xl-rna-screenshot-2024-02-min.png",
    "https://media.beckman.com/-/media/pdf-thumbnails/automating-the-valita-titer-igg-quantification-assay-on-a-biomek-i-series-liquid-handling-system/thumbnail_automating-valita-titer?rev=feb85a78d638420087db0fe934269979": "/content/dam/demo-ma-aem-coder/mybeckman/pdf-thumbnails/automating-the-valita-titer-igg-quantification-assay-on-a-biomek-i-series-liquid-handling-system/thumbnail_automating-valita-titer.jpg",
    "https://media.beckman.com/-/media/pdf-thumbnails/cydemvt/cover_cydem-vt-system-product-brochure.jpg?h=251&w=195&rev=1b4034fd64914355bc4e9d377813e4fb&sc_lang=hi&hash=1F75A93238CD74434BF2E227ED3AE8CC": "/content/dam/demo-ma-aem-coder/mybeckman/pdf-thumbnails/cydemvt/cover_cydem-vt-system-product-brochure.jpg",
    "https://media.beckman.com/-/media/pdf-thumbnails/cydemvt/thumbnail_introducing-cydem-vt?rev=f794b31eda22467ca03f060bdea4feb0": "/content/dam/demo-ma-aem-coder/mybeckman/pdf-thumbnails/cydemvt/thumbnail_introducing-cydem-vt.jpg",
    "https://media.beckman.com/-/media/product-applications/process-development-manufacturing/protein-production.png?rev=f6e0d5a5a46442f48461cde9df645d5c": "/content/dam/demo-ma-aem-coder/mybeckman/product-applications/process-development-manufacturing/protein-production.png",
    "https://media.beckman.com/-/media/research-areas/cell-line-development/cell-line-development-valita-titer.gif?h=312&w=550&rev=33a29a00c4614cb7b27282a981a08262&sc_lang=hi&hash=090B4F199D3A18EFAA82957825410C97": "/content/dam/demo-ma-aem-coder/mybeckman/research-areas/cell-line-development/cell-line-development-valita-titer.gif",
    "https://media.beckman.com/-/media/research-areas/cell-line-development/valita-titer-assay-for-igg-quantification.jpg?rev=8110c9f6e6c84ed2bb68ee971e0c0cc4": "/content/dam/demo-ma-aem-coder/mybeckman/research-areas/cell-line-development/valita-titer-assay-for-igg-quantification.jpg",
    "https://media.beckman.com/-/media/research-areas/extracellular-vesicles/2024_future_ev.jpg?rev=b826cc1551f04f5d95625050bb84ccd6&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/research-areas/extracellular-vesicles/2024_future_ev.jpg",
    "https://media.beckman.com/-/media/research-areas/monoclonal-antibodies/chc_monoclonal_antibodies_antidrug_conjugates_final_2560x600.jpg": "/content/dam/demo-ma-aem-coder/mybeckman/research-areas/monoclonal-antibodies/chc_monoclonal_antibodies_antidrug_conjugates_final_2560x600.jpg",
    "https://media.beckman.com/-/media/research-areas/monoclonal-antibodies/monoclonalantibodies-600x400-1.jpg?rev=e1fe238506964b85a228241f21effda3&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/research-areas/monoclonal-antibodies/monoclonalantibodies-600x400-1.jpg",
    "https://media.beckman.com/-/media/research-areas/monoclonal-antibodies/monoclonalantibodies-600x400-2.jpg?rev=4350adba757440f2a9446fce89d5bd36&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/research-areas/monoclonal-antibodies/monoclonalantibodies-600x400-2.jpg",
    "https://media.beckman.com/-/media/research-areas/monoclonal-antibodies/monoclonalantibodies-600x400-3.jpg?rev=3068bf61a7014e40a488c85f427167d7&sc_lang=hi": "/content/dam/demo-ma-aem-coder/mybeckman/research-areas/monoclonal-antibodies/monoclonalantibodies-600x400-3.jpg",
    "https://media.beckman.com/-/media/resources/disease-research/mabs-dev-ecosystem-v14?rev=af6420a01162440d805e645c4151e9a5": "/content/dam/demo-ma-aem-coder/mybeckman/resources/disease-research/mabs-dev-ecosystem-v14.jpg",
    "https://media.beckman.com/-/media/resources/technologies/auc-pages/blackandwhite_auc-homepage-banner-2560x600-v1-sw": "/content/dam/demo-ma-aem-coder/mybeckman/resources/technologies/auc-pages/blackandwhite_auc-homepage-banner-2560x600-v1-sw.png",
    "https://media.beckman.com/-/media/resources/technologies/auc-pages/evs": "/content/dam/demo-ma-aem-coder/mybeckman/resources/technologies/auc-pages/evs.png",
    "https://media.beckman.com/-/media/resources/technologies/auc-pages/interaction-studies": "/content/dam/demo-ma-aem-coder/mybeckman/resources/technologies/auc-pages/interaction-studies.png",
    "https://media.beckman.com/-/media/resources/technologies/auc-pages/lnp": "/content/dam/demo-ma-aem-coder/mybeckman/resources/technologies/auc-pages/lnp.png",
    "https://media.beckman.com/-/media/resources/technologies/auc-pages/mabs": "/content/dam/demo-ma-aem-coder/mybeckman/resources/technologies/auc-pages/mabs.png",
    "https://media.beckman.com/-/media/resources/technologies/auc-pages/thumbnails/dge-analysis.jpg?h=251&w=195&rev=4cdde9d6f3a4454d8d13f49f177e03b8&sc_lang=hi&hash=C93C53A9AC8B2768C0D372C158135BD9": "/content/dam/demo-ma-aem-coder/mybeckman/resources/technologies/auc-pages/thumbnails/dge-analysis.jpg",
    "https://media.beckman.com/-/media/resources/technologies/auc-pages/thumbnails/multiwavelenght?rev=f7470c16874e4bd0a6af9860bb226c57": "/content/dam/demo-ma-aem-coder/mybeckman/resources/technologies/auc-pages/thumbnails/multiwavelenght.jpg",
    "https://media.beckman.com/-/media/resources/technologies/auc-pages/thumbnails/sample-concentration?rev=97049503003343bca2c5f06f448cfa5b": "/content/dam/demo-ma-aem-coder/mybeckman/resources/technologies/auc-pages/thumbnails/sample-concentration.jpg",
    "https://media.beckman.com/-/media/resources/technologies/auc-pages/viral-vector": "/content/dam/demo-ma-aem-coder/mybeckman/resources/technologies/auc-pages/viral-vector.png",
    "https://media.beckman.com/-/media/service/media/vi-cell-metaflex.jpg?rev=1cdd2eea12c94ad3bcccc82851f62ffd": "/content/dam/demo-ma-aem-coder/mybeckman/service/media/vi-cell-metaflex.jpg"
  };

  // tools/importer/transformers/mybeckman-sections.js
  var TEMPLATE_PREFIX2 = "mybeckman-";
  var ORIGIN4 = "https://www.mybeckman.in";
  var SECTION_ATTR2 = "data-mb-section";
  var BG_ATTR3 = "data-mb-section-bg";
  var MARKER_ATTR6 = "data-excat-section-id";
  var FIRST_ATTR2 = "data-excat-section-first";
  var END_ATTR2 = "data-excat-section-end";
  var END_BG_ATTR = "data-excat-section-bg";
  var STOP_SELECTOR = "body, #wrapper, #main, #main > div.main-holder, #main > div.main-holder > div.container";
  function safeQuery6(root, selector) {
    try {
      return root.querySelector(selector);
    } catch (e) {
      return null;
    }
  }
  function safeQueryAll8(root, selector) {
    try {
      return [...root.querySelectorAll(selector)];
    } catch (e) {
      return [];
    }
  }
  function styleOf(section) {
    const { style } = section;
    if (!style) return "";
    const list = Array.isArray(style) ? style : String(style).split(",");
    return list.map((s) => String(s).trim()).filter(Boolean).join(", ");
  }
  function blockInstances2(element, template) {
    const set = /* @__PURE__ */ new Set();
    (template && template.blocks || []).forEach((block) => {
      (block.instances || []).forEach((sel) => {
        safeQueryAll8(element, sel).forEach((el) => set.add(el));
      });
    });
    return [...set];
  }
  function findSectionStart(element, section) {
    const id = String(section.id).replace(/["\\]/g, "");
    const tagged = safeQuery6(element, `[${SECTION_ATTR2}="${id}"]`);
    if (tagged) return tagged;
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      const el = safeQuery6(element, sel);
      if (el) return el;
    }
    return null;
  }
  function breakPoint(el, element, instances, starts) {
    const holders = instances.filter((inst) => inst !== el && inst.contains(el));
    if (holders.length) {
      return holders.reduce((outer, inst) => inst.contains(outer) ? inst : outer);
    }
    let node = el;
    while (node.parentElement && node.parentElement !== element) {
      const parent = node.parentElement;
      if (parent.matches(STOP_SELECTOR)) break;
      if (parent.firstElementChild !== node) break;
      if (starts.includes(parent)) break;
      node = parent;
    }
    return node;
  }
  function docOrder2(a, b) {
    if (a === b) return 0;
    return a.compareDocumentPosition(b) & 4 ? -1 : 1;
  }
  function backgroundOf(el) {
    const holder = el.hasAttribute(BG_ATTR3) ? el : safeQuery6(el, `[${BG_ATTR3}]`);
    if (holder) return holder.getAttribute(BG_ATTR3);
    const img = safeQuery6(el, ':scope > img[alt="gradient background"]');
    const src = img && img.getAttribute("src");
    return src ? new URL(src, `${ORIGIN4}/`).href : "";
  }
  function transform12(hookName, element, payload) {
    const template = payload && payload.template;
    if (!template || typeof template.name !== "string" || !template.name.startsWith(TEMPLATE_PREFIX2)) return;
    const sections = template.sections || [];
    if (sections.length < 2) return;
    if (!element || !element.querySelectorAll) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      const instances = blockInstances2(element, template);
      const resolved = sections.map((section) => ({ section, start: findSectionStart(element, section) })).filter((s) => s.start);
      const starts = resolved.map((s) => s.start);
      const found = resolved.map((s) => __spreadProps(__spreadValues({}, s), { at: breakPoint(s.start, element, instances, starts) })).sort((a, b) => docOrder2(a.at, b.at));
      for (let k = found.length - 1; k >= 0; k -= 1) {
        const { section, start, at } = found[k];
        const style = styleOf(section);
        const isFirst = k === 0;
        const next = found[k + 1];
        if (style) {
          const end = document.createElement("div");
          end.setAttribute(END_ATTR2, section.id);
          const bg = backgroundOf(start);
          if (bg) end.setAttribute(END_BG_ATTR, bg);
          const nextHr = next && next.at.previousElementSibling && next.at.previousElementSibling.tagName === "HR" ? next.at.previousElementSibling : null;
          if (nextHr) nextHr.before(end);
          else if (next) next.at.before(end);
          else element.append(end);
        }
        if (isFirst && !style) continue;
        const hr = document.createElement("hr");
        if (style) hr.setAttribute(MARKER_ATTR6, section.id);
        if (isFirst) hr.setAttribute(FIRST_ATTR2, "true");
        at.before(hr);
      }
      safeQueryAll8(element, `[${SECTION_ATTR2}]`).forEach((el) => el.removeAttribute(SECTION_ATTR2));
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const style = styleOf(section);
        if (!style) continue;
        const id = String(section.id).replace(/["\\]/g, "");
        const marker = safeQuery6(element, `hr[${MARKER_ATTR6}="${id}"]`);
        const end = safeQuery6(element, `[${END_ATTR2}="${id}"]`);
        if (!marker && !end) continue;
        const cells = { style };
        const bg = end && end.getAttribute(END_BG_ATTR);
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
          const hrs = safeQueryAll8(element, "hr");
          const nextHr = hrs.find((hr) => docOrder2(marker, hr) < 0 && hr !== marker);
          if (nextHr) nextHr.before(metadata);
          else element.append(metadata);
        }
        if (marker) {
          if (marker.hasAttribute(FIRST_ATTR2)) marker.remove();
          else marker.removeAttribute(MARKER_ATTR6);
        }
      }
      safeQueryAll8(element, `[${END_ATTR2}]`).forEach((el) => el.remove());
      safeQueryAll8(element, `[${BG_ATTR3}]`).forEach((el) => el.removeAttribute(BG_ATTR3));
    }
  }

  // tools/importer/import-mybeckman-protein-production.js
  var PAGE_TEMPLATE = {
    "name": "mybeckman-protein-production",
    "urls": [
      "https://www.mybeckman.in/resources/product-applications/process-development-manufacturing/protein-production"
    ],
    "representativeUrl": "https://www.mybeckman.in/resources/product-applications/process-development-manufacturing/protein-production",
    "urlPattern": "/resources/product-applications/process-development-manufacturing/protein-production",
    "description": 'AEO article page (two-columns-holder article + sidebar): H1 + published date, Key Takeaways and at-a-glance callouts, expression-host table, benefit and related-topic card grids, View References details, always-open FAQ, sidebar with author box and Marketo "Talk to an Expert" form (1024).',
    "blocks": [
      {
        "name": "table-striped-mb",
        "instances": [
          "div.table-wrapper"
        ]
      },
      {
        "name": "cards-grid-accent-mb",
        "instances": [
          "div.benefits-grid",
          "section.related-cleanroom-topics"
        ]
      },
      {
        "name": "accordion-toggle-mb",
        "instances": [
          "details.references-details"
        ]
      },
      {
        "name": "accordion-toggle-open-mb",
        "instances": [
          "div.bcls-aeo-faq:not(div.bcls-aeo-faq + div.bcls-aeo-faq)"
        ]
      },
      {
        "name": "columns-mb",
        "instances": [
          "div.bcls-aeo-author__card"
        ]
      },
      {
        "name": "form-mb",
        "instances": [
          "#main div.formassembly-container"
        ]
      }
    ],
    "sections": [
      {
        "id": "intro",
        "name": "Article title, published date and intro",
        "selector": [
          "#content-holder"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          "#content-holder > h1",
          "#content-holder div.bcls-aeo-published > p",
          "div.cleanroom-content-block > p:first-child"
        ]
      },
      {
        "id": "key-takeaways",
        "name": "Key Takeaways callout box",
        "selector": [
          "div.summary-box"
        ],
        "style": "callout",
        "blocks": [],
        "defaultContent": [
          "div.summary-box > h2",
          "div.summary-box > ul"
        ]
      },
      {
        "id": "recombinant",
        "name": "Why it matters / What is recombinant protein production + expression host table",
        "selector": [
          "div.summary-box + h2"
        ],
        "style": null,
        "blocks": [
          "table-striped-mb"
        ],
        "defaultContent": [
          "div.cleanroom-content-block > h2:nth-of-type(1)",
          "div.cleanroom-content-block > p:nth-of-type(2)",
          "div.cleanroom-content-block > h2:nth-of-type(2)",
          "div.cleanroom-content-block > p:nth-of-type(3)",
          "div.cleanroom-content-block > p:nth-of-type(4)",
          "div.table-wrapper + p"
        ]
      },
      {
        "id": "at-a-glance",
        "name": "Protein production at a glance callout",
        "selector": [
          "div.process-flow"
        ],
        "style": "callout",
        "blocks": [],
        "defaultContent": [
          "div.process-flow > strong",
          "div.process-flow > p"
        ]
      },
      {
        "id": "benefits",
        "name": "Benefits of Scalable Protein Production Systems + advantages cards",
        "selector": [
          "div.process-flow + h2"
        ],
        "style": null,
        "blocks": [
          "cards-grid-accent-mb"
        ],
        "defaultContent": [
          "div.process-flow + h2",
          "div.process-flow + h2 + p",
          "div.cleanroom-content-block > h3"
        ]
      },
      {
        "id": "references",
        "name": "View References collapsible",
        "selector": [
          "details.references-details"
        ],
        "style": null,
        "blocks": [
          "accordion-toggle-mb"
        ],
        "defaultContent": []
      },
      {
        "id": "related-topics",
        "name": "Explore Related Protein Production Topics",
        "selector": [
          "details.references-details + h2"
        ],
        "style": null,
        "blocks": [
          "cards-grid-accent-mb"
        ],
        "defaultContent": [
          "details.references-details + h2",
          "details.references-details + h2 + p"
        ]
      },
      {
        "id": "faq",
        "name": "FAQ on Protein Production Workflow and Process",
        "selector": [
          "div.bcls-aeo-faqs"
        ],
        "style": null,
        "blocks": [
          "accordion-toggle-open-mb"
        ],
        "defaultContent": [
          "div.bcls-aeo-faqs > h2"
        ]
      },
      {
        "id": "sidebar",
        "name": "Sidebar: author box + Talk to an Expert form",
        "selector": [
          "div.two-columns-holder__right > div.bcls-aeo-author",
          "div.two-columns-holder__right"
        ],
        "style": "sidebar",
        "blocks": [
          "columns-mb",
          "form-mb"
        ],
        "defaultContent": [
          "div.bcls-aeo-author__bio > h6",
          "div.bcls-aeo-author__bio > p",
          "div.two-columns-holder__right > div.bc-rich-text > h3"
        ]
      }
    ]
  };
  var parsers = {
    "table-striped-mb": parse,
    "cards-grid-accent-mb": parse2,
    "accordion-toggle-mb": parse3,
    "accordion-toggle-open-mb": parse4,
    "columns-mb": parse5,
    "form-mb": parse6
  };
  var transformers = [transform, transform2, transform3, transform4, transform5, transform6, transform7, transform8, transform9, transform10, transform11, transform12];
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
  var import_mybeckman_protein_production_default = {
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
      const metaTable = [...main.querySelectorAll("table")].find((table) => {
        const first = table.querySelector("tr > th, tr > td");
        return first && /^metadata$/i.test(first.textContent.trim());
      });
      if (metaTable && metaTable !== main.lastElementChild) main.append(metaTable);
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
  return __toCommonJS(import_mybeckman_protein_production_exports);
})();
