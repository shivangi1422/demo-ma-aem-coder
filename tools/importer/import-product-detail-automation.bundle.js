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

  // tools/importer/import-product-detail-automation.js
  var import_product_detail_automation_exports = {};
  __export(import_product_detail_automation_exports, {
    default: () => import_product_detail_automation_default
  });

  // tools/importer/parsers/carousel-gallery.js
  var clean = (str) => (str || "").replace(/[\s ]+/g, " ").trim();
  var safeUrl = (url) => (url || "").trim().replace(/%(?![0-9a-fA-F]{2})/g, "%25");
  var isUsableHref = (href) => !!href && href.trim() !== "" && href.trim() !== "#" && !/^javascript:/i.test(href.trim());
  var INLINE_KEEP = /^(STRONG|B|EM|I|U|SUP|SUB|A|BR|SMALL|CODE)$/;
  var BLOCK_KEEP = /^(H1|H2|H3|H4|H5|H6|P|UL|OL|LI|BLOCKQUOTE)$/;
  var SKIP = /^(SCRIPT|STYLE|NOSCRIPT|IFRAME|IMG|PICTURE|SVG|BUTTON|INPUT|SELECT|TEXTAREA|FORM|LABEL)$/;
  function sanitize(node, document) {
    if (node.nodeType === 3) return document.createTextNode(node.textContent.replace(/ /g, " "));
    if (node.nodeType !== 1 || SKIP.test(node.tagName)) return null;
    const tag = node.tagName;
    let out;
    if (tag === "A") {
      const href = node.getAttribute("href");
      if (isUsableHref(href) || href && href.startsWith("#") && href.length > 1) {
        out = document.createElement("a");
        out.setAttribute("href", safeUrl(href));
      } else {
        out = document.createDocumentFragment();
      }
    } else if (INLINE_KEEP.test(tag) || BLOCK_KEEP.test(tag)) {
      out = document.createElement(tag.toLowerCase());
    } else {
      out = document.createDocumentFragment();
    }
    const structural = /^(UL|OL)$/.test(tag);
    [...node.childNodes].forEach((child) => {
      if (structural && child.nodeType === 3 && !clean(child.textContent)) return;
      const c = sanitize(child, document);
      if (c) out.append(c);
    });
    return out;
  }
  function trimEdges(el) {
    while (el.firstChild && el.firstChild.nodeType === 3 && !clean(el.firstChild.textContent)) el.firstChild.remove();
    while (el.lastChild && el.lastChild.nodeType === 3 && !clean(el.lastChild.textContent)) el.lastChild.remove();
    if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.textContent = el.firstChild.textContent.replace(/^\s+/, "");
    if (el.lastChild && el.lastChild.nodeType === 3) el.lastChild.textContent = el.lastChild.textContent.replace(/\s+$/, "");
    [...el.children].forEach((child) => {
      if (/^(P|H[1-6]|LI|A|STRONG)$/.test(child.tagName)) trimEdges(child);
    });
    return el;
  }
  function productText(col, document) {
    const out = [];
    const containers = [...col.querySelectorAll(".content-container")].filter((c) => !c.parentElement.closest(".content-container"));
    const roots = containers.length ? containers : [col];
    const visit = (root) => {
      [...root.children].forEach((child) => {
        const tag = child.tagName;
        if (SKIP.test(tag)) return;
        if (/^(H[1-6]|P|UL|OL|BLOCKQUOTE)$/.test(tag)) {
          if (!clean(child.textContent)) return;
          const c = sanitize(child, document);
          if (c && clean(c.textContent)) out.push(trimEdges(c));
          return;
        }
        if (tag === "A") {
          if (!clean(child.textContent)) return;
          const p = document.createElement("p");
          p.append(sanitize(child, document));
          out.push(trimEdges(p));
          return;
        }
        const hasBlocks = child.querySelector("h1, h2, h3, h4, h5, h6, p, ul, ol, div, blockquote");
        if (!hasBlocks && clean(child.textContent)) {
          const p = document.createElement("p");
          const c = sanitize(child, document);
          if (c) p.append(c);
          out.push(trimEdges(p));
          return;
        }
        visit(child);
      });
    };
    roots.forEach(visit);
    return out;
  }
  function vidyardInfo(slide) {
    const iframe = slide.querySelector('iframe[src*="vidyard"]');
    const poster = slide.querySelector('img.vidyard-player-embed, img[data-uuid], img[src*="play.vidyard.com"]');
    const container = slide.querySelector('.vidyard-player-container, [class*="vidyard-div-"]');
    if (!iframe && !poster && !container) return null;
    let uuid = container && container.getAttribute("uuid") || poster && poster.getAttribute("data-uuid") || "";
    if (!uuid && iframe) {
      const m = (iframe.getAttribute("src") || "").match(/play\.vidyard\.com\/(?:embed\/v4\/)?([A-Za-z0-9_-]+)/);
      uuid = m ? m[1] : "";
    }
    if (!uuid && poster) {
      const m = (poster.getAttribute("src") || "").match(/play\.vidyard\.com\/([A-Za-z0-9_-]+)\.jpg/);
      uuid = m ? m[1] : "";
    }
    if (!uuid) {
      const m = slide.innerHTML.match(/vidyard-(?:div|inner-container|iframe)-([A-Za-z0-9_-]{10,})/);
      uuid = m ? m[1] : "";
    }
    if (!uuid) return null;
    const link = slide.querySelector("a[data-mss-title], a[title]");
    const title = clean(iframe && iframe.getAttribute("title") || link && (link.getAttribute("data-mss-title") || link.getAttribute("title")) || "").replace(/^\d{4}-\d{3,}\s+/, "").replace(/\s+v\d+$/i, "");
    const posterSrc = poster && /play\.vidyard\.com/.test(poster.getAttribute("src") || "") && poster.getAttribute("src") || `https://play.vidyard.com/${uuid}.jpg`;
    return { uuid, title, poster: posterSrc };
  }
  var isFilenameAlt = (alt) => /^[^\s]+$/.test(alt) && /[-_]/.test(alt);
  function altFromFilename(src, baseAlt) {
    let name = "";
    try {
      name = decodeURIComponent(src.split("?")[0].split("/").pop() || "");
    } catch (e) {
      name = src.split("?")[0].split("/").pop() || "";
    }
    name = name.replace(/\.(jpe?g|png|gif|webp|svg)$/i, "").replace(/^\d+[-_]/, "").replace(/[-_]\d+x\d+$/i, "");
    const have = new Set(clean(baseAlt).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
    const extra = name.split(/[-_\s]+/).filter((w) => w && !have.has(w.toLowerCase()));
    if (!baseAlt) return extra.join(" ");
    return extra.length ? `${baseAlt} ${extra.join(" ")}` : baseAlt;
  }
  function parse(element, { document }) {
    const cells = [];
    const col1 = element.querySelector(".column-1") || element;
    const col2 = element.querySelector(".column-2");
    const text = col2 ? productText(col2, document) : [];
    if (text.length) {
      cells.push([[document.createComment(" field:text "), ...text]]);
    } else {
      cells.push([""]);
    }
    const slideshow = col1.querySelector(".product-media-slideshow") || col1;
    let slides = [...slideshow.querySelectorAll(".owl-item:not(.cloned) > .item")];
    if (!slides.length) {
      slides = [...slideshow.querySelectorAll(".item")].filter((s) => !s.closest(".cloned, .slider-nav, .thumbs") && !s.parentElement.closest(".item"));
    }
    if (!slides.length) {
      slides = [...col1.querySelectorAll(".thumbs .thumb")];
    }
    const rows = [];
    slides.forEach((slide) => {
      const video = vidyardInfo(slide);
      if (video) {
        const img2 = document.createElement("img");
        img2.src = safeUrl(video.poster);
        img2.alt = video.title ? `${video.title} video` : "Video";
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = `https://play.vidyard.com/${video.uuid}`;
        a.textContent = video.title || a.href;
        p.append(a);
        rows.push({ img: img2, text: [p] });
        return;
      }
      const srcImg = [...slide.querySelectorAll("img")].find((i) => i.getAttribute("src") && !/^data:/i.test(i.getAttribute("src")));
      if (!srcImg) return;
      const img = document.createElement("img");
      img.src = safeUrl(srcImg.getAttribute("src"));
      img.alt = clean(srcImg.getAttribute("alt"));
      rows.push({ img, text: [], image: true });
    });
    const altCount = {};
    rows.filter((r) => r.image).forEach((r) => {
      altCount[r.img.alt] = (altCount[r.img.alt] || 0) + 1;
    });
    rows.filter((r) => r.image).forEach((r) => {
      const alt = r.img.alt;
      if (!alt || isFilenameAlt(alt)) {
        r.img.alt = altFromFilename(r.img.getAttribute("src"), "") || alt.replace(/[-_]+/g, " ");
      } else if (altCount[alt] > 1) {
        r.img.alt = altFromFilename(r.img.getAttribute("src"), alt);
      }
    });
    rows.forEach((r) => {
      const imageCell = [document.createComment(" field:image "), r.img];
      const textCell = r.text.length ? [document.createComment(" field:text "), ...r.text] : "";
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel (gallery)", cells });
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

  // tools/importer/parsers/embed.js
  var clean3 = (str) => (str || "").replace(/[\s ]+/g, " ").trim();
  var safeUrl2 = (url) => (url || "").trim().replace(/%(?![0-9a-fA-F]{2})/g, "%25");
  var isGenericTitle = (title) => !title || /^(view[-\s]?genial(ly)?|genially|iframe|embed|frame|video|player|untitled|content)$/i.test(title) || /^https?:\/\//i.test(title);
  var isUsableHeading = (h) => {
    const t = clean3(h.textContent);
    return t && !/^empty heading$/i.test(t) && h.getAttribute("aria-hidden") !== "true";
  };
  function headingBefore(element) {
    let node = element;
    for (let depth = 0; node && depth < 6; depth += 1) {
      let prev = node.previousElementSibling;
      while (prev) {
        const headings = /^H[1-6]$/.test(prev.tagName) ? [prev] : [...prev.querySelectorAll("h1, h2, h3, h4, h5, h6")];
        const h = headings.reverse().find(isUsableHeading);
        if (h) return clean3(h.textContent);
        prev = prev.previousElementSibling;
      }
      node = node.parentElement;
      if (!node || node.matches("#main-container, body, .sublayout, .page-content")) break;
    }
    return "";
  }
  function parse3(element, { document }) {
    const iframe = element.tagName === "IFRAME" ? element : element.querySelector("iframe");
    const src = iframe ? (iframe.getAttribute("src") || iframe.getAttribute("data-src") || "").trim() : "";
    const url = src.startsWith("//") ? `https:${src}` : src;
    const cells = [];
    if (url) {
      const a = document.createElement("a");
      a.href = safeUrl2(url);
      a.textContent = safeUrl2(url);
      cells.push([[document.createComment(" field:url "), a]]);
    } else {
      cells.push([""]);
    }
    const iframeTitle = clean3(iframe ? iframe.getAttribute("title") : "");
    const title = !isGenericTitle(iframeTitle) ? iframeTitle : headingBefore(iframe || element);
    if (title) {
      cells.push([[document.createComment(" field:title "), document.createTextNode(title)]]);
    } else {
      cells.push([""]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "embed", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-underline.js
  var clean4 = (str) => (str || "").replace(/[\s ]+/g, " ").trim();
  var BLOCK_TAGS = /^(H1|H2|H3|H4|H5|H6|P|UL|OL|BLOCKQUOTE|TABLE|DIV|SECTION|ARTICLE|FIGURE|HR|DL|PRE)$/;
  var INLINE_KEEP2 = /^(STRONG|B|EM|I|U|SUP|SUB|A|BR|CODE|SMALL)$/;
  var SKIP_TAGS = /^(SCRIPT|STYLE|NOSCRIPT|LINK|IFRAME|INPUT|SELECT|TEXTAREA|BUTTON|FORM|SVG|LABEL)$/;
  var safeUrl3 = (url) => (url || "").trim().replace(/%(?![0-9a-fA-F]{2})/g, "%25");
  var isUsableHref2 = (href) => !!href && href.trim() !== "" && href.trim() !== "#" && !/^javascript:/i.test(href.trim());
  function sanitize2(node, document) {
    if (node.nodeType === 3) return document.createTextNode(node.textContent.replace(/ /g, " "));
    if (node.nodeType !== 1 || SKIP_TAGS.test(node.tagName)) return null;
    const tag = node.tagName;
    if (tag === "IMG") {
      const src = node.getAttribute("src");
      if (!src) return null;
      const img = document.createElement("img");
      img.src = safeUrl3(src);
      img.alt = clean4(node.getAttribute("alt"));
      return img;
    }
    const keep = INLINE_KEEP2.test(tag) || BLOCK_TAGS.test(tag) || /^(LI|TBODY|THEAD|TFOOT|TR|TD|TH|DT|DD|CAPTION)$/.test(tag);
    let out;
    if (keep && !/^(DIV|SECTION|ARTICLE|FIGURE)$/.test(tag)) {
      out = document.createElement(tag.toLowerCase());
      if (tag === "A") {
        const href = node.getAttribute("href");
        if (!isUsableHref2(href)) out = document.createDocumentFragment();
        else out.setAttribute("href", safeUrl3(href));
      }
      ["colspan", "rowspan"].forEach((attr) => {
        if (node.getAttribute(attr) && out.setAttribute) {
          out.setAttribute(attr, node.getAttribute(attr));
          out.setAttribute("data-keep-span", "");
        }
      });
    } else {
      out = document.createDocumentFragment();
    }
    const structural = /^(TABLE|TBODY|THEAD|TFOOT|TR|UL|OL|DL)$/.test(tag);
    [...node.childNodes].forEach((child) => {
      if (structural && child.nodeType === 3 && !clean4(child.textContent)) return;
      const c = sanitize2(child, document);
      if (c) out.append(c);
    });
    return out;
  }
  function trimParagraph(p) {
    while (p.firstChild && (p.firstChild.nodeType === 3 && !clean4(p.firstChild.textContent) || p.firstChild.nodeType === 1 && p.firstChild.tagName === "BR")) p.firstChild.remove();
    while (p.lastChild && (p.lastChild.nodeType === 3 && !clean4(p.lastChild.textContent) || p.lastChild.nodeType === 1 && p.lastChild.tagName === "BR")) p.lastChild.remove();
    if (p.firstChild && p.firstChild.nodeType === 3) p.firstChild.textContent = p.firstChild.textContent.replace(/^\s+/, "");
    if (p.lastChild && p.lastChild.nodeType === 3) p.lastChild.textContent = p.lastChild.textContent.replace(/\s+$/, "");
  }
  function isLayoutTable(table) {
    return !!table.querySelector("img, picture, iframe, .vidyard-player-container");
  }
  function fixAlt(alt) {
    const a = clean4(alt);
    if (/^[^\s]+$/.test(a) && /[-_]/.test(a) && !/^https?:/i.test(a)) {
      return a.replace(/\.(jpe?g|png|gif|webp|svg)$/i, "").replace(/[-_]+/g, " ").trim();
    }
    return a;
  }
  var VIDEO_CONTAINER = '.vidyard-player-container, [class*="vidyard-div-"], .video-container, .embed-container';
  function videoInfo(node) {
    const iframe = node.tagName === "IFRAME" ? node : node.querySelector("iframe");
    const iframeSrc = iframe ? iframe.getAttribute("src") || "" : "";
    const posterImg = node.tagName === "IMG" ? node : node.querySelector("img.vidyard-player-embed, img[data-uuid], img");
    let uuid = node.getAttribute("uuid") || node.getAttribute("data-uuid") || posterImg && posterImg.getAttribute("data-uuid") || "";
    if (!uuid) {
      const m = iframeSrc.match(/play\.vidyard\.com\/(?:embed\/v4\/)?([A-Za-z0-9_-]+)/) || (posterImg && posterImg.getAttribute("src") || "").match(/play\.vidyard\.com\/([A-Za-z0-9_-]+)\.jpg/) || node.outerHTML.match(/vidyard-(?:div|inner-container|iframe|lightbox)-([A-Za-z0-9_-]{10,})/);
      uuid = m ? m[1] : "";
    }
    const rawTitle = clean4(iframe && iframe.getAttribute("title") || "");
    const title = rawTitle.replace(/\s+v\d+$/i, "");
    if (uuid) {
      const poster = posterImg && /vidyard/.test(posterImg.getAttribute("src") || "") && posterImg.getAttribute("src") || `https://play.vidyard.com/${uuid}.jpg`;
      const posterAlt = clean4(posterImg && posterImg.getAttribute("alt"));
      return {
        href: `https://play.vidyard.com/${uuid}`,
        poster,
        title: title || (/^watch video$/i.test(posterAlt) ? "" : posterAlt) || "Video"
      };
    }
    if (iframeSrc && /youtube|youtu\.be|vimeo/i.test(iframeSrc)) {
      return { href: iframeSrc.split("?")[0], poster: "", title: title || "Video" };
    }
    return null;
  }
  function flatten(root, document, out, images, ctx = {}) {
    let run = null;
    const flush = () => {
      if (run) {
        trimParagraph(run);
        if (clean4(run.textContent) || run.querySelector("img")) out.push(run);
      }
      run = null;
    };
    const pushImage = (srcImg) => {
      const img = sanitize2(srcImg, document);
      if (!img) return;
      img.alt = fixAlt(img.alt);
      if (!img.alt) {
        const lastHeading = [...out].reverse().find((n) => n.nodeType === 1 && /^H[1-6]$/.test(n.tagName));
        if (lastHeading) img.alt = clean4(lastHeading.textContent);
      }
      if (!images.length && !ctx.imageTaken) {
        images.push(img);
      } else {
        const a = document.createElement("a");
        a.href = img.getAttribute("src");
        a.textContent = img.alt || a.href;
        const p = document.createElement("p");
        p.append(a);
        out.push(p);
      }
    };
    const pushVideo = (node) => {
      const info = videoInfo(node);
      if (!info) return false;
      const a = document.createElement("a");
      a.href = safeUrl3(info.href);
      a.textContent = info.title;
      const p = document.createElement("p");
      p.append(a);
      out.push(p);
      return true;
    };
    [...root.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        if (!clean4(node.textContent) && !run) return;
        if (!run) run = document.createElement("p");
        run.append(document.createTextNode(node.textContent.replace(/\u00a0/g, " ")));
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName;
      if (node.matches(VIDEO_CONTAINER) || tag === "IFRAME" && videoInfo(node)) {
        flush();
        if (pushVideo(node)) return;
      }
      if (SKIP_TAGS.test(tag)) return;
      if (tag === "BR") {
        flush();
        return;
      }
      if (tag === "IMG" || tag === "PICTURE") {
        flush();
        const img = tag === "IMG" ? node : node.querySelector("img");
        if (img) pushImage(img);
        return;
      }
      if (!BLOCK_TAGS.test(tag) && tag !== "LI") {
        if (node.querySelector("img, iframe")) {
          flush();
          flatten(node, document, out, images, ctx);
          return;
        }
        if (!clean4(node.textContent)) return;
        if (!run) run = document.createElement("p");
        const c2 = sanitize2(node, document);
        if (c2) run.append(c2);
        return;
      }
      flush();
      if (/^(DIV|SECTION|ARTICLE|FIGURE)$/.test(tag)) {
        flatten(node, document, out, images, ctx);
        return;
      }
      if (tag === "TABLE") {
        if (isLayoutTable(node)) {
          const cellCtx = __spreadProps(__spreadValues({}, ctx), { inLayoutTable: true });
          node.querySelectorAll("td, th").forEach((cell) => {
            const outer = cell.parentElement && cell.parentElement.closest("td, th");
            if (outer && node.contains(outer)) return;
            flatten(cell, document, out, images, cellCtx);
            if (images.length) cellCtx.imageTaken = true;
          });
        } else if (clean4(node.textContent)) {
          const table = sanitize2(node, document);
          table.querySelectorAll("tr").forEach((tr) => {
            if (!clean4(tr.textContent) && !tr.querySelector("img")) tr.remove();
          });
          table.querySelectorAll("a, p, li, td, th, strong").forEach((el) => trimParagraph(el));
          out.push(table);
        }
        return;
      }
      if (tag === "HR") return;
      if (/^(UL|OL|DL)$/.test(tag) && !clean4(node.textContent)) return;
      if (/^(H[1-6]|P|BLOCKQUOTE|PRE)$/.test(tag)) {
        [...node.querySelectorAll("img")].forEach((img) => {
          pushImage(img);
          img.remove();
        });
        if (!clean4(node.textContent)) return;
      }
      const c = sanitize2(node, document);
      if (c && clean4(c.textContent)) {
        if (c.nodeType === 1 && /^(P|H[1-6])$/.test(c.tagName)) trimParagraph(c);
        if (c.nodeType === 1) c.querySelectorAll("li").forEach((li) => trimParagraph(li));
        out.push(c);
      }
    });
    flush();
  }
  function parse4(element, { document }) {
    const cells = [];
    const labelKey = (el) => el.getAttribute("data-tab") || (el.id ? el.id.replace(/^tab-/, "") : "");
    const labelEls = [...element.querySelectorAll('.menu > .item, .menu > a.item, [role="tab"]')].filter((el, i, all) => all.indexOf(el) === i && !el.closest(".tabs-mobile-dropdown, .dropdown, select") && clean4(el.textContent));
    const labelFor = /* @__PURE__ */ new Map();
    labelEls.forEach((el) => {
      const key2 = labelKey(el);
      if (key2 && !labelFor.has(key2)) labelFor.set(key2, clean4(el.textContent));
    });
    let panels = [...element.querySelectorAll('.tab.segment, .tab[data-tab], [role="tabpanel"]')].filter((el) => !el.matches(".item") && !el.closest(".menu, .tabs-mobile-dropdown"));
    panels = panels.filter((p) => !panels.some((o) => o !== p && o.contains(p)));
    if (!panels.length) {
      const fallback = element.querySelector(".wysiwyg-content") || null;
      if (fallback) panels = [fallback];
    }
    panels.forEach((panel, i) => {
      const key2 = panel.getAttribute("data-tab") || (panel.id ? panel.id.replace(/^(tab-)?panel-|^tab-/, "") : "");
      const title = key2 && labelFor.get(key2) || labelEls[i] && clean4(labelEls[i].textContent) || clean4(key2 ? key2.replace(/[-_]+/g, " ") : "") || `Tab ${i + 1}`;
      const root = panel;
      const out = [];
      const images = [];
      flatten(root, document, out, images);
      const titleCell = [document.createComment(" field:title "), document.createTextNode(title)];
      const imageCell = images.length ? [document.createComment(" field:image "), images[0]] : "";
      const textCell = out.length ? [document.createComment(" field:text "), ...out] : "";
      cells.push([titleCell, imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs-underline", cells });
    block.querySelectorAll("table td[colspan], table th[colspan]").forEach((cell) => {
      if (cell.closest("table") !== block && !cell.hasAttribute("data-keep-span")) cell.removeAttribute("colspan");
    });
    block.querySelectorAll("[data-keep-span]").forEach((el) => el.removeAttribute("data-keep-span"));
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote-testimonial-purple.js
  var clean5 = (str) => (str || "").replace(/[\s ]+/g, " ").trim();
  var GLYPH_SELECTOR = [
    ".quoteBefore",
    ".quoteAfter",
    ".quote-mark",
    ".quote-icon",
    '[class*="quote-open"]',
    '[class*="quote-close"]',
    '[class*="open-quote"]',
    '[class*="close-quote"]',
    "svg",
    "img",
    "i"
  ].join(", ");
  var OPEN_RE = /^[“”"„«‘’']+\s*/;
  var CLOSE_RE = /\s*[“”"„»‘’']+$/;
  function parse5(element, { document }) {
    const cells = [];
    const quoteEl = element.querySelector(".quoteText") || element.querySelector(".quote, blockquote, .testimonial-quote");
    const quoteNodes = [];
    if (quoteEl) {
      const clone = quoteEl.cloneNode(true);
      clone.querySelectorAll(GLYPH_SELECTOR).forEach((g) => g.remove());
      const paras = [...clone.querySelectorAll("p")].filter((p) => clean5(p.textContent));
      const texts = paras.length ? paras.map((p) => clean5(p.textContent)) : [clean5(clone.textContent)];
      texts.forEach((text, i) => {
        let t = text;
        if (i === 0) t = t.replace(OPEN_RE, "");
        if (i === texts.length - 1) t = t.replace(CLOSE_RE, "");
        if (!t) return;
        const p = document.createElement("p");
        p.textContent = t;
        quoteNodes.push(p);
      });
    }
    if (quoteNodes.length) {
      cells.push([[document.createComment(" field:quote "), ...quoteNodes]]);
    } else {
      cells.push([""]);
    }
    let parts = [".author", ".title1", ".title2", ".title3"].map((sel) => clean5((element.querySelector(sel) || {}).textContent)).filter(Boolean);
    if (!parts.length) {
      const cite = element.querySelector("cite, .attribution, figcaption");
      if (cite) parts = [clean5(cite.textContent)].filter(Boolean);
    }
    if (parts.length) {
      cells.push([[
        document.createComment(" field:attribution "),
        document.createTextNode(parts.join("\\n"))
      ]]);
    } else {
      cells.push([""]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "quote (testimonial-purple)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  var clean6 = (str) => (str || "").replace(/\s+/g, " ").trim();
  var isUsableHref3 = (href) => !!href && href.trim() !== "" && href.trim() !== "#";
  function buildTextColumn(segment, document) {
    const out = [];
    segment.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, a.button, a.ui.button").forEach((el) => {
      if (el.parentElement && el.parentElement.closest("p, ul, ol, h1, h2, h3, h4, h5, h6") && segment.contains(el.parentElement.closest("p, ul, ol, h1, h2, h3, h4, h5, h6"))) return;
      const tag = el.tagName;
      if (/^H[1-6]$/.test(tag)) {
        const text = clean6(el.textContent);
        if (!text || /^empty heading$/i.test(text)) return;
        const h = document.createElement(tag === "H1" ? "h2" : tag.toLowerCase());
        h.textContent = text;
        out.push(h);
        return;
      }
      if (tag === "A") {
        const text = clean6(el.textContent);
        if (!text) return;
        const p2 = document.createElement("p");
        const href = el.getAttribute("href");
        if (isUsableHref3(href)) {
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
      if (!clean6(el.textContent)) return;
      const p = document.createElement("p");
      p.innerHTML = el.innerHTML.trim();
      p.querySelectorAll("a").forEach((a) => {
        if (!isUsableHref3(a.getAttribute("href"))) a.replaceWith(document.createTextNode(a.textContent));
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
      img.alt = clean6(srcImg.getAttribute("alt"));
      out.push(img);
    });
    return out;
  }
  function parse6(element, { document }) {
    const container = element.querySelector(".content-container") || element;
    let segments = [...container.querySelectorAll(":scope > .segment, :scope > div")];
    if (!segments.length) {
      segments = [
        element.querySelector(".adjustable-two-column-display-content"),
        element.querySelector(".adjustable-two-column-display-image")
      ].filter(Boolean);
    }
    const row = segments.slice(0, 2).map((segment) => {
      const isImage = segment.classList.contains("adjustable-two-column-display-image") || !clean6(segment.textContent) && !!segment.querySelector("img");
      const content = isImage ? buildImageColumn(segment, document) : buildTextColumn(segment, document);
      return content.length ? content : "";
    });
    while (row.length < 2) row.push("");
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-products.js
  var clean7 = (str) => (str || "").replace(/[\s ]+/g, " ").trim();
  var isUsableHref4 = (href) => !!href && href.trim() !== "" && href.trim() !== "#" && !/^javascript:/i.test(href.trim());
  var safeUrl4 = (url) => (url || "").trim().replace(/%(?![0-9a-fA-F]{2})/g, "%25");
  var INLINE_KEEP3 = /^(SUP|SUB|STRONG|B|EM|I|U|SMALL|BR)$/;
  function bgUrl2(el) {
    if (!el || !el.getAttribute) return "";
    const style = el.getAttribute("style") || "";
    const m = style.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    return m && m[1] ? m[1].replace(/&amp;/g, "&").trim() : "";
  }
  function inlineCopy(node, document, target) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        target.append(document.createTextNode(child.textContent.replace(/[\s ]+/g, " ")));
      } else if (child.nodeType === 1) {
        if (INLINE_KEEP3.test(child.tagName)) {
          const el = document.createElement(child.tagName.toLowerCase());
          inlineCopy(child, document, el);
          target.append(el);
        } else if (!/^(SCRIPT|STYLE|IMG|SVG)$/.test(child.tagName)) {
          inlineCopy(child, document, target);
        }
      }
    });
    return target;
  }
  function trimEdges2(el) {
    if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.textContent = el.firstChild.textContent.replace(/^\s+/, "");
    if (el.lastChild && el.lastChild.nodeType === 3) el.lastChild.textContent = el.lastChild.textContent.replace(/\s+$/, "");
    return el;
  }
  function imageSrc(card, item) {
    const img = [...card.querySelectorAll("img")].find((i) => i.getAttribute("src") && !/^data:/i.test(i.getAttribute("src")));
    if (img) return { src: img.getAttribute("src"), alt: clean7(img.getAttribute("alt")) };
    const holders = [card, item, ...card.querySelectorAll('[data-icon-src], [data-bg-src], [style*="url("]')].filter(Boolean);
    for (const el of holders) {
      const src = el.getAttribute("data-icon-src") || el.getAttribute("data-bg-src") || bgUrl2(el);
      if (src && !/^data:/i.test(src)) return { src, alt: "" };
    }
    return null;
  }
  function parse7(element, { document }) {
    const cells = [];
    cells.push([""]);
    let cards = [...element.querySelectorAll(".owl-item:not(.cloned) .product-card")];
    if (!cards.length) cards = [...element.querySelectorAll(".product-card")].filter((c) => !c.closest(".cloned"));
    if (!cards.length) {
      cards = [...element.querySelectorAll(".owl-item:not(.cloned) > .item, .item")].filter((c) => !c.closest(".cloned") && c.querySelector("h1, h2, h3, h4, h5, h6"));
    }
    cards.forEach((card) => {
      const item = card.closest(".item") || card.closest(".owl-item");
      const desc = card.querySelector(".product-description") || card;
      const titleEl = desc.querySelector("h1, h2, h3, h4, h5, h6");
      const h3 = document.createElement("h3");
      if (titleEl) trimEdges2(inlineCopy(titleEl, document, h3));
      const titleText = clean7(h3.textContent);
      const plainTitle = titleEl ? clean7(titleEl.cloneNode(true).textContent) : "";
      const cta = desc.querySelector("a.btn-cta, a.ui.button, a.button") || [...desc.querySelectorAll("a[href]")].find((a) => clean7(a.textContent) && !(titleEl && titleEl.contains(a)));
      const cardLink = [...card.querySelectorAll("a[href]")].find((a) => !desc.contains(a) || a === card) || card.closest("a[href]");
      const ctaHref = cta && isUsableHref4(cta.getAttribute("href")) ? cta.getAttribute("href") : cardLink && isUsableHref4(cardLink.getAttribute("href")) ? cardLink.getAttribute("href") : "";
      const imageCell = [];
      const found = imageSrc(card, item);
      if (found) {
        const img = document.createElement("img");
        img.src = safeUrl4(found.src);
        img.alt = found.alt || (plainTitle || titleText).replace(/[*†‡]+$/, "").trim();
        imageCell.push(document.createComment(" field:image "), img);
      }
      const textCell = [];
      if (titleText) textCell.push(h3);
      [...desc.querySelectorAll("p")].forEach((p) => {
        if (cta && p.contains(cta)) return;
        if (!clean7(p.textContent)) return;
        const para = document.createElement("p");
        trimEdges2(inlineCopy(p, document, para));
        textCell.push(para);
      });
      const ctaText = clean7(cta ? cta.textContent : "") || (ctaHref ? "Learn more" : "");
      if (ctaText) {
        const p = document.createElement("p");
        if (ctaHref) {
          const a = document.createElement("a");
          a.href = safeUrl4(ctaHref);
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
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel (products)", cells });
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
      const slug = h && slugify2(headingText(h));
      if (slug) a.setAttribute("href", `#${slug}`);
    });
  }
  function collectTabSlugs(element) {
    const map = /* @__PURE__ */ new Map();
    safeQueryAll4(element, ".product-tabs .ui.menu a.item, .product-tabs .tabs .menu a.item").forEach((tab) => {
      const slug = slugify2(tab.textContent);
      if (!slug) return;
      map.set(slug, slug);
      if (tab.id) map.set(slugify2(tab.id.replace(/^tab-/, "")), slug);
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
          const slug = slugify2(label);
          if (!slug) return;
          const li = doc.createElement("li");
          const a = doc.createElement("a");
          a.setAttribute("href", `#${slug}`);
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

  // tools/importer/import-product-detail-automation.js
  var PAGE_TEMPLATE = {
    "name": "product-detail-automation",
    "urls": [
      "https://www.beckmancoulter.com/en/products/automation/workflow-automation-system-dxa-5000-fit"
    ],
    "representativeUrl": "https://www.beckmancoulter.com/en/products/automation/workflow-automation-system-dxa-5000-fit",
    "description": "Automation product detail pages: media-gallery product hero, image-panel feature, purple feature band, interactive embed, product tabs, purple testimonial, text/image rows, related products slider, footnotes.",
    "blocks": [
      {
        "name": "carousel-gallery",
        "instances": [
          "#main-container > div.sublayout-two-column-dynamic"
        ]
      },
      {
        "name": "cards-grid-features-purple",
        "instances": [
          "div.data-visualization-container"
        ]
      },
      {
        "name": "embed",
        "instances": [
          'iframe[src*="genial.ly"]',
          'iframe[src*="genially"]'
        ]
      },
      {
        "name": "tabs-underline",
        "instances": [
          "div.product-tabs"
        ]
      },
      {
        "name": "quote-testimonial-purple",
        "instances": [
          "div.testimonial-slim"
        ]
      },
      {
        "name": "columns",
        "instances": [
          "div.adjustable-two-column-display"
        ]
      },
      {
        "name": "carousel-products",
        "instances": [
          "div.related-products:has(h3)"
        ]
      }
    ],
    "urlPattern": "/en/products/automation/*",
    "sections": [
      {
        "id": "hero",
        "name": "The DxA 5000 Fit Workflow Automation System",
        "selector": [
          "#main-container > div.sublayout-two-column-dynamic"
        ],
        "style": null,
        "blocks": [
          "carousel-gallery"
        ],
        "defaultContent": []
      },
      {
        "id": "focus",
        "name": "Focus on what matters",
        "selector": [
          "div.photo-feature"
        ],
        "style": "image-panel",
        "blocks": [],
        "defaultContent": [
          "h2",
          "p",
          "a"
        ]
      },
      {
        "id": "automation-for-all",
        "name": "Automation for All",
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
        "id": "explore-features",
        "name": "Explore DxA 5000 Fit Features",
        "selector": [
          "div.page-content:has(iframe)"
        ],
        "style": "centered",
        "blocks": [
          "embed"
        ],
        "defaultContent": [
          "h2",
          "p"
        ]
      },
      {
        "id": "product-tabs",
        "name": "Endless Benefits",
        "selector": [
          "div.product-tabs"
        ],
        "style": "highlight",
        "blocks": [
          "tabs-underline"
        ],
        "defaultContent": []
      },
      {
        "id": "testimonial",
        "name": "From its compact footprint",
        "selector": [
          "div.testimonial-slim"
        ],
        "style": null,
        "blocks": [
          "quote-testimonial-purple"
        ],
        "defaultContent": []
      },
      {
        "id": "webinars",
        "name": "Watch our latest automation webinars",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.adjustable-two-column-display"
        ],
        "style": null,
        "blocks": [
          "columns"
        ],
        "defaultContent": []
      },
      {
        "id": "routing",
        "name": "Intelligent routing in a compact footprint",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.adjustable-two-column-display"
        ],
        "style": null,
        "blocks": [
          "columns"
        ],
        "defaultContent": []
      },
      {
        "id": "demo",
        "name": "Watch the DxA 5000 Fit Demo",
        "selector": [
          "#main-container > div.sublayout.ui.one.column.stackable.grid.container > div.adjustable-two-column-display"
        ],
        "style": null,
        "blocks": [
          "columns"
        ],
        "defaultContent": []
      },
      {
        "id": "related-heading",
        "name": "Related Solutions",
        "selector": [
          "div.related-products:has(h2)"
        ],
        "style": "centered",
        "blocks": [],
        "defaultContent": [
          "h2"
        ]
      },
      {
        "id": "related-products",
        "name": "Hematology",
        "selector": [
          "div.related-products:has(h3)"
        ],
        "style": null,
        "blocks": [
          "carousel-products"
        ],
        "defaultContent": []
      },
      {
        "id": "disclaimer",
        "name": "REMISOL Advance is a trademark",
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
    "carousel-gallery": parse,
    "cards-grid-features-purple": parse2,
    embed: parse3,
    "tabs-underline": parse4,
    "quote-testimonial-purple": parse5,
    columns: parse6,
    "carousel-products": parse7
  };
  var transformers = [transform, transform2, transform3, transform4, transform5, transform6, transform7, transform8];
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
  var import_product_detail_automation_default = {
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
  return __toCommonJS(import_product_detail_automation_exports);
})();
