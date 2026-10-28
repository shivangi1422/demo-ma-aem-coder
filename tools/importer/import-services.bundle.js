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

  // tools/importer/import-services.js
  var import_services_exports = {};
  __export(import_services_exports, {
    default: () => import_services_default
  });

  // tools/importer/parsers/columns-anchor-nav.js
  function parse(element, { document }) {
    const titleEl = element.querySelector(".secondary-nav-title, h2, h3");
    const title = titleEl ? titleEl.textContent.replace(/[▾▼]/g, "").trim() : "";
    const ul = document.createElement("ul");
    element.querySelectorAll("ul a").forEach((a) => {
      if (ul.querySelector(`a[href="${a.getAttribute("href")}"]`)) return;
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = a.getAttribute("href") || "";
      link.textContent = a.textContent.trim();
      li.append(link);
      ul.append(li);
    });
    const cells = [[title, ul.children.length ? ul : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-anchor-nav", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-overlay-left.js
  function cleanImageSrc(src) {
    if (!src) return "";
    const next = src.match(/_next\/image\?(?:.*&)?url=([^&]+)/);
    let url = next ? decodeURIComponent(next[1]) : src;
    if (/cdn\.sanity\.io\/.+\.svg$/i.test(url)) url += "?fm=png&w=400";
    return url;
  }
  function parse2(element, { document }) {
    var _a;
    const cells = [];
    const srcImg = element.querySelector(".service-hero-background img, img");
    if (srcImg) {
      const widest = [...((_a = srcImg.closest("picture")) == null ? void 0 : _a.querySelectorAll("source[srcset], source[srcSet]")) || []].map((s) => {
        var _a2;
        return {
          min: parseInt(((_a2 = (s.getAttribute("media") || "").match(/min-width:\s*(\d+)/)) == null ? void 0 : _a2[1]) || "0", 10),
          src: (s.getAttribute("srcset") || s.getAttribute("srcSet") || "").split(",")[0].trim().split(/\s+/)[0]
        };
      }).filter((s) => s.src).sort((a, b) => b.min - a.min)[0];
      const img = document.createElement("img");
      img.src = cleanImageSrc(widest ? widest.src : srcImg.getAttribute("src"));
      img.alt = srcImg.getAttribute("alt") || "";
      cells.push([[document.createComment(" field:image "), img]]);
    } else {
      cells.push([""]);
    }
    const content = element.querySelector(".service-hero-content") || element;
    const text = [];
    const h1 = content.querySelector("h1, h2");
    if (h1) {
      const h = document.createElement("h1");
      h.textContent = h1.textContent.trim();
      text.push(h);
    }
    const desc = content.querySelector(".service-hero-description, p");
    if (desc) {
      const p = document.createElement("p");
      p.textContent = desc.textContent.trim();
      text.push(p);
    }
    content.querySelectorAll(".service-hero-ctas a").forEach((a) => {
      const p = document.createElement("p");
      const link = document.createElement("a");
      link.href = a.getAttribute("href") || "";
      link.textContent = a.textContent.trim();
      p.append(link);
      text.push(p);
    });
    cells.push(text.length ? [[document.createComment(" field:text "), ...text]] : [""]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-overlay-left", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-capability.js
  function parse3(element, { document }) {
    const cells = [];
    element.querySelectorAll(".capability-flat-item").forEach((item) => {
      const text = [];
      const titleEl = item.querySelector(".capability-flat-title");
      if (titleEl) {
        const h3 = document.createElement("h3");
        h3.textContent = titleEl.textContent.trim();
        text.push(h3);
      }
      const descEl = item.querySelector(".capability-flat-desc");
      if (descEl) {
        const p = document.createElement("p");
        p.textContent = descEl.textContent.trim();
        text.push(p);
      }
      const cta = item.querySelector(".capability-flat-link");
      if (cta) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = cta.getAttribute("href") || "#services";
        a.textContent = cta.textContent.replace(/[→›]/g, "").trim() || "Learn More";
        p.append(a);
        text.push(p);
      }
      if (!text.length) return;
      cells.push(["", [document.createComment(" field:text "), ...text]]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-capability", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-split-detail.js
  var SANITY = "https://cdn.sanity.io/images/l19qdyr5/production/";
  var FALLBACK_SLIDES = [
    {
      title: "Application Modernization",
      image: `${SANITY}d37011006ccd3c16865a0a2a8d368d7ea633d0db-1280x960.jpg`,
      description: "We modernize your legacy applications through re-engineering, refactoring, or re-platforming to improve performance, reduce technical debt, and prepare your systems for cloud-native operation.",
      list: ["Assessment and Strategy", "Technology Selection", "Capabilities Blueprinting", "Road Mapping", "Application Re-Engineering", "Phased Implementation"],
      metrics: [["20+", "Microservices implementations delivered"], ["400+", "Engineers across application services"]]
    },
    {
      title: "UI Modernization",
      image: `${SANITY}561dbdd643e2370a0dbe28e400af2594812b4836-1280x960.jpg`,
      description: "We enhance your user experience with modern design, responsive interfaces, and intuitive navigation built on current JavaScript frameworks and mobile-first principles.",
      list: ["React, Angular, Vue.js, Next.js Development", "Mobile-First Responsive Design", "Single-Page Application Architecture", "BDD/TDD Methodologies", "Accessibility-Compliant Code", "Automated UI Testing"],
      metrics: [["180+", "Dedicated UI engineers"], ["6", "JS frameworks supported: React, Angular, Vue, Next.js, Backbone, Node.js"]]
    },
    {
      title: "Enterprise Integration",
      image: `${SANITY}cfcfd4882b876a3ec373ba4dd08c2f994ccbf1f3-1280x960.jpg`,
      description: "We connect your applications and data systems through API design, real-time data integration, and event-driven architectures using both commercial and open-source platforms.",
      list: ["Data Format Conversion", "Application-to-Application Integration", "API Lifecycle Management", "Event Streaming Architecture", "Open-Source Integration", "Commercial Platform Implementation"],
      metrics: [["7+", "Integration platforms supported (MuleSoft, Boomi, Apigee, Tibco, Kafka, NiFi, RabbitMQ)"]]
    },
    {
      title: "Cloud Migration",
      image: `${SANITY}7b2f0b39de5539eff2c1625d7830d081c3c3e33f-1280x960.jpg`,
      description: "We migrate your on-premises infrastructure to AWS, Azure, or GCP, shifting your cost model from upfront capital expenditure to flexible pay-as-you-go operations.",
      list: ["Infrastructure Migration", "Platform Migration", "Data Migration", "Application Migration", "Disaster Recovery Planning", "Automation Identification"],
      metrics: [["3", "Major cloud platforms: AWS, Azure, GCP"]]
    },
    {
      title: "Application Management",
      image: `${SANITY}c1c157ffbc7dad68337f98b1d5b805999ff2b428-1280x960.jpg`,
      description: "We manage your application landscape across the full lifecycle, from enhancement and optimization through 24/7 production support, with a commitment to ownership and proactive issue resolution.",
      list: ["Application Enhancement", "End-to-End Lifecycle Management", "24/7/365 Production Support", "Performance Optimization", "Business Process Transformation", "Composable Architecture Advisory"],
      metrics: [["24/7/365", "Managed production support coverage"], ["25", "Current implementation clients"]]
    }
  ];
  function cleanImageSrc2(src) {
    if (!src) return "";
    const next = src.match(/_next\/image\?(?:.*&)?url=([^&]+)/);
    let url = next ? decodeURIComponent(next[1]) : src;
    if (/cdn\.sanity\.io\/.+\.svg$/i.test(url)) url += "?fm=png&w=400";
    return url;
  }
  var norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  function readSlide(card) {
    var _a, _b, _c;
    const content = card.querySelector(".capability-carousel-content") || card;
    const img = card.querySelector(".capability-carousel-image img");
    return {
      title: norm((_a = content.querySelector("h3")) == null ? void 0 : _a.textContent),
      image: img ? cleanImageSrc2(img.getAttribute("src")) : "",
      alt: img ? img.getAttribute("alt") || "" : "",
      description: norm((_b = content.querySelector(":scope > p")) == null ? void 0 : _b.textContent),
      featuresTitle: norm((_c = content.querySelector(".capability-carousel-features h4")) == null ? void 0 : _c.textContent),
      list: [...content.querySelectorAll(".capability-carousel-features li")].map((li) => norm(li.textContent).replace(/^[•·]\s*/, "")),
      metrics: [...content.querySelectorAll(".carousel-metric")].map((m) => {
        var _a2, _b2;
        return [
          norm((_a2 = m.querySelector(".carousel-metric-value")) == null ? void 0 : _a2.textContent),
          norm((_b2 = m.querySelector(".carousel-metric-label")) == null ? void 0 : _b2.textContent)
        ];
      })
    };
  }
  function buildRow(slide, document) {
    const imageCell = [];
    if (slide.image) {
      const img = document.createElement("img");
      img.src = slide.image;
      img.alt = slide.alt || slide.title;
      imageCell.push(document.createComment(" field:media_image "), img);
    }
    const text = [];
    if (slide.title) {
      const h3 = document.createElement("h3");
      h3.textContent = slide.title;
      text.push(h3);
    }
    if (slide.description) {
      const p = document.createElement("p");
      p.textContent = slide.description;
      text.push(p);
    }
    if (slide.list && slide.list.length) {
      const h4 = document.createElement("h4");
      h4.textContent = slide.featuresTitle || "Key Capabilities";
      const ul = document.createElement("ul");
      slide.list.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.append(li);
      });
      text.push(h4, ul);
    }
    (slide.metrics || []).forEach(([value, label]) => {
      if (!value && !label) return;
      const p = document.createElement("p");
      if (value) {
        const strong = document.createElement("strong");
        strong.textContent = value;
        p.append(strong);
      }
      if (label) p.append(document.createTextNode(value ? ` ${label}` : label));
      text.push(p);
    });
    return [
      imageCell.length ? imageCell : "",
      text.length ? [document.createComment(" field:content_text "), ...text] : ""
    ];
  }
  function parse4(element, { document }) {
    const domSlides = [...element.querySelectorAll(".capability-carousel-card")].map(readSlide).filter((s) => s.title);
    const byTitle = new Map(domSlides.map((s) => [s.title.toLowerCase(), s]));
    const slides = [];
    FALLBACK_SLIDES.forEach((fb) => {
      const key = fb.title.toLowerCase();
      if (byTitle.has(key)) {
        slides.push(byTitle.get(key));
        byTitle.delete(key);
      } else {
        slides.push(fb);
      }
    });
    byTitle.forEach((s) => slides.push(s));
    const known = domSlides.some((s) => FALLBACK_SLIDES.some((fb) => fb.title.toLowerCase() === s.title.toLowerCase()));
    const finalSlides = domSlides.length && !known ? domSlides : slides;
    const cells = finalSlides.map((s) => buildRow(s, document));
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-split-detail", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-logo-group.js
  function cleanImageSrc3(src) {
    if (!src) return "";
    const next = src.match(/_next\/image\?(?:.*&)?url=([^&]+)/);
    let url = next ? decodeURIComponent(next[1]) : src;
    if (/cdn\.sanity\.io\/.+\.svg$/i.test(url)) url += "?fm=png&w=400";
    return url;
  }
  function parse5(element, { document }) {
    const cells = [];
    element.querySelectorAll(".platform-category-card").forEach((card) => {
      const text = [];
      const titleEl = card.querySelector(".platform-category-title");
      if (titleEl) {
        const h3 = document.createElement("h3");
        h3.textContent = titleEl.textContent.trim();
        text.push(h3);
      }
      const descEl = card.querySelector(".platform-category-desc");
      if (descEl) {
        const p = document.createElement("p");
        p.textContent = descEl.textContent.trim();
        text.push(p);
      }
      if (text.length) cells.push(["", [document.createComment(" field:text "), ...text]]);
      card.querySelectorAll(".platform-card img").forEach((srcImg) => {
        const src = cleanImageSrc3(srcImg.getAttribute("src"));
        if (!src) return;
        const img = document.createElement("img");
        img.src = src;
        img.alt = srcImg.getAttribute("alt") || "";
        cells.push([[document.createComment(" field:image "), img], ""]);
      });
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-logo-group", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/form.js
  var FORM_JSON = {
    "2549": "/forms/speak-to-representative.json"
  };
  var DEFAULT_FORM_JSON = "/forms/speak-to-representative.json";
  var GSPANN_FORM_JSON = "/forms/gspann-get-started.json";
  function isMarketo(element) {
    return element.classList.contains("mktoForm") || /^mktoForm_/.test(element.id || "") || !!element.querySelector('input[name="formid"], input[name="munchkinId"]');
  }
  function isGspann(element, document) {
    var _a, _b, _c;
    if (element.closest("#approach")) return true;
    const hints = [
      (_a = document.querySelector('link[rel="canonical"]')) == null ? void 0 : _a.getAttribute("href"),
      (_b = document.querySelector('meta[property="og:url"]')) == null ? void 0 : _b.getAttribute("content")
    ];
    try {
      hints.push((_c = document.location) == null ? void 0 : _c.href);
    } catch (e) {
    }
    return hints.some((h) => /(^|\/\/|\.)gspann\.com/i.test(h || ""));
  }
  function parse6(element, { document }) {
    var _a;
    const visibleFields = element.querySelectorAll('input:not([type="hidden"]), select, textarea');
    if (!visibleFields.length) {
      element.remove();
      return;
    }
    let file;
    if (isMarketo(element)) {
      const formId = (element.id || "").replace(/^mktoForm_/, "") || (((_a = element.querySelector('input[name="formid"]')) == null ? void 0 : _a.getAttribute("value")) || "");
      file = FORM_JSON[formId] || DEFAULT_FORM_JSON;
    } else if (isGspann(element, document)) {
      file = GSPANN_FORM_JSON;
    } else {
      file = DEFAULT_FORM_JSON;
    }
    const link = document.createElement("a");
    link.href = file;
    link.textContent = file;
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Form",
      cells: [[[document.createComment(" field:reference "), link]]]
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-stats.js
  function parse7(element, { document }) {
    const cells = [];
    element.querySelectorAll(".impact-metric-item").forEach((item) => {
      var _a;
      const valueEl = item.querySelector(".impact-metric-value");
      const value = valueEl ? [...valueEl.querySelectorAll("span")].map((s) => s.textContent.trim()).join("") || valueEl.textContent.replace(/\s+/g, "") : "";
      const label = ((_a = item.querySelector(".impact-label")) == null ? void 0 : _a.textContent.trim()) || "";
      const text = [];
      if (value) {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = value;
        p.append(strong);
        text.push(p);
      }
      if (label) {
        const p = document.createElement("p");
        p.textContent = label;
        text.push(p);
      }
      if (!text.length) return;
      cells.push(["", [document.createComment(" field:text "), ...text]]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-stats", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-resources.js
  function cleanImageSrc4(src) {
    if (!src) return "";
    const next = src.match(/_next\/image\?(?:.*&)?url=([^&]+)/);
    let url = next ? decodeURIComponent(next[1]) : src;
    if (/cdn\.sanity\.io\/.+\.svg$/i.test(url)) url += "?fm=png&w=400";
    return url;
  }
  function relativeHref(href) {
    if (!href) return "";
    try {
      const u = new URL(href, "https://www.gspann.com");
      if (/(^|\.)gspann\.com$|^localhost$|^127\.0\.0\.1$/.test(u.hostname)) {
        return `${u.pathname}${u.search}${u.hash}`;
      }
      return u.href;
    } catch (e) {
      return href;
    }
  }
  function parse8(element, { document }) {
    const cells = [];
    element.querySelectorAll(".resource-card").forEach((card) => {
      const srcImg = card.querySelector(".resource-card-image img");
      let imageCell = "";
      if (srcImg) {
        const img = document.createElement("img");
        img.src = cleanImageSrc4(srcImg.getAttribute("src"));
        img.alt = srcImg.getAttribute("alt") || "";
        imageCell = [document.createComment(" field:image "), img];
      }
      const text = [];
      const badge = card.querySelector(".resource-type-badge");
      if (badge && badge.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = badge.textContent.trim();
        text.push(p);
      }
      const title = card.querySelector(".resource-card-title");
      if (title) {
        const h3 = document.createElement("h3");
        h3.textContent = title.textContent.trim();
        text.push(h3);
      }
      const excerpt = card.querySelector(".resource-card-excerpt");
      if (excerpt) {
        const p = document.createElement("p");
        p.textContent = excerpt.textContent.trim();
        text.push(p);
      }
      const linkEl = card.querySelector("a.resource-card-link") || card.closest("a");
      const href = relativeHref(linkEl == null ? void 0 : linkEl.getAttribute("href"));
      if (href) {
        const readMore = card.querySelector(".resource-card-readmore");
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = href;
        a.textContent = ((readMore == null ? void 0 : readMore.textContent) || "").replace(/[→›]/g, "").trim() || "Read More";
        p.append(a);
        text.push(p);
      }
      if (!imageCell && !text.length) return;
      cells.push([imageCell, text.length ? [document.createComment(" field:text "), ...text] : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-resources", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-leader.js
  function cleanImageSrc5(src) {
    if (!src) return "";
    const next = src.match(/_next\/image\?(?:.*&)?url=([^&]+)/);
    let url = next ? decodeURIComponent(next[1]) : src;
    if (/cdn\.sanity\.io\/.+\.svg$/i.test(url)) url += "?fm=png&w=400";
    return url;
  }
  function parse9(element, { document }) {
    const cells = [];
    element.querySelectorAll(".leader-card").forEach((card) => {
      const srcImg = card.querySelector("img.leader-image, .leader-image-wrapper img");
      let imageCell = "";
      if (srcImg) {
        const img = document.createElement("img");
        img.src = cleanImageSrc5(srcImg.getAttribute("src"));
        img.alt = srcImg.getAttribute("alt") || "";
        imageCell = [document.createComment(" field:image "), img];
      }
      const text = [];
      const name = card.querySelector(".leader-name");
      if (name) {
        const h3 = document.createElement("h3");
        h3.textContent = name.textContent.trim();
        text.push(h3);
      }
      const title = card.querySelector(".leader-title");
      if (title) {
        const p = document.createElement("p");
        p.textContent = title.textContent.trim();
        text.push(p);
      }
      const cta = card.querySelector(".leader-contact-link");
      if (cta) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = cta.getAttribute("href") || "#connect";
        a.textContent = cta.textContent.replace(/[→›]/g, "").trim() || "Get In Touch";
        p.append(a);
        text.push(p);
      }
      if (!imageCell && !text.length) return;
      cells.push([imageCell, text.length ? [document.createComment(" field:text "), ...text] : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-leader", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/gspann-cleanup.js
  var TEMPLATE_NAME = "services";
  var PAGE_TEMPLATE_STYLE = "gspann";
  var CHROME_SELECTORS = [
    "body > div.ch2",
    "div.ch2.ch2-region-c3",
    "div.ch2-container",
    "a.skip-to-main",
    "nav.navbar",
    "div.mobile-menu-overlay",
    "div.mobile-menu-backdrop",
    "footer.footer",
    "next-route-announcer"
  ];
  var HIDDEN_SELECTORS = [
    "#main-content > section.key-takeaways-section.sr-only",
    "section.key-takeaways-section",
    ".sr-only"
  ];
  var DECORATIVE_SELECTORS = [
    "#services hr.capabilities-divider",
    "#services hr",
    '#services div[class*="divider"]'
  ];
  var NON_CONTENT_SELECTORS = [
    "script",
    "style",
    "noscript",
    "link",
    "iframe",
    "meta"
  ];
  function clean(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }
  function safeQueryAll(root, selector) {
    try {
      return [...root.querySelectorAll(selector)];
    } catch (e) {
      return [];
    }
  }
  function removeAll(root, selectors) {
    selectors.forEach((sel) => safeQueryAll(root, sel).forEach((el) => el.remove()));
  }
  function isolateMain(element) {
    const main = element.querySelector("#main-content");
    if (!main) return;
    let node = main;
    while (node && node !== element && node.parentElement) {
      const parent = node.parentElement;
      [...parent.children].forEach((sib) => {
        if (sib !== node) sib.remove();
      });
      if (parent === element) break;
      node = parent;
    }
  }
  function convertSectionTags(element) {
    const doc = element.ownerDocument;
    safeQueryAll(element, "span.section-tag").forEach((span) => {
      const p = doc.createElement("p");
      p.className = "section-tag";
      while (span.firstChild) p.append(span.firstChild);
      span.replaceWith(p);
    });
  }
  function stripTrackingAttributes(element) {
    safeQueryAll(element, "*").forEach((el) => {
      [...el.attributes].forEach(({ name }) => {
        if (name.startsWith("on") || name.startsWith("data-gtm") || name.startsWith("data-analytics") || name.startsWith("data-track") || name.startsWith("data-ga")) {
          el.removeAttribute(name);
        }
      });
    });
  }
  function headMeta(doc, attr, name) {
    const head = doc.head || doc;
    return [...head.querySelectorAll(`meta[${attr}="${name}"]`)].map((m) => clean(m.getAttribute("content"))).filter(Boolean).join(", ");
  }
  function appendMetadata(element) {
    const doc = element.ownerDocument;
    const cells = {};
    const title = doc.querySelector("head title") || doc.querySelector("title");
    if (title && clean(title.textContent)) cells.Title = clean(title.textContent);
    const description = headMeta(doc, "name", "description") || headMeta(doc, "property", "og:description");
    if (description) cells.Description = description;
    const keywords = headMeta(doc, "name", "keywords");
    if (keywords) cells.keywords = keywords;
    cells.template = PAGE_TEMPLATE_STYLE;
    const ogImage = headMeta(doc, "property", "og:image") || headMeta(doc, "name", "og:image");
    if (ogImage) {
      const src = ogImage.split(", ")[0];
      const a = doc.createElement("a");
      a.href = src;
      a.textContent = src;
      cells.image = a;
    }
    element.append(WebImporter.Blocks.createBlock(doc, { name: "Metadata", cells }));
    const { head } = doc;
    if (!head) return;
    safeQueryAll(doc, "title").forEach((t) => t.remove());
    safeQueryAll(head, 'meta[name="description"], meta[property^="og:"], meta[name^="twitter:"], meta[property^="twitter:"], link[rel="canonical"]').forEach((m) => m.remove());
  }
  function transform(hookName, element, payload) {
    const template = payload && payload.template;
    if (!template || template.name !== TEMPLATE_NAME) return;
    if (!element || !element.querySelectorAll) return;
    if (hookName === "beforeTransform") {
      removeAll(element, CHROME_SELECTORS);
      isolateMain(element);
      removeAll(element, HIDDEN_SELECTORS);
      removeAll(element, DECORATIVE_SELECTORS);
      removeAll(element, NON_CONTENT_SELECTORS);
      stripTrackingAttributes(element);
      convertSectionTags(element);
    }
    if (hookName === "afterTransform") {
      WebImporter.DOMUtils.remove(element, [
        ...NON_CONTENT_SELECTORS,
        ...CHROME_SELECTORS,
        "section.key-takeaways-section"
      ]);
      appendMetadata(element);
    }
  }

  // tools/importer/transformers/gspann-sections.js
  var TEMPLATE_NAME2 = "services";
  var MARKER_ATTR = "data-excat-section-id";
  var FIRST_ATTR = "data-excat-section-first";
  var END_ATTR = "data-excat-section-end";
  function safeQuery(root, selector) {
    try {
      return root.querySelector(selector);
    } catch (e) {
      return null;
    }
  }
  function safeQueryAll2(root, selector) {
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
  function findSectionStart(element, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      const el = safeQuery(element, sel);
      if (el) return el;
    }
    return null;
  }
  function docOrder(a, b) {
    if (a === b) return 0;
    return a.compareDocumentPosition(b) & 4 ? -1 : 1;
  }
  function idOf(section) {
    return String(section.id).replace(/["\\]/g, "");
  }
  function transform2(hookName, element, payload) {
    const template = payload && payload.template;
    if (!template || template.name !== TEMPLATE_NAME2) return;
    const sections = template.sections || [];
    if (sections.length < 2) return;
    if (!element || !element.querySelectorAll) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      const found = sections.map((section) => ({ section, start: findSectionStart(element, section) })).filter((s) => s.start).sort((a, b) => docOrder(a.start, b.start));
      for (let k = found.length - 1; k >= 0; k -= 1) {
        const { section, start } = found[k];
        const style = styleOf(section);
        const isFirst = k === 0;
        if (style) {
          const end = document.createElement("div");
          end.setAttribute(END_ATTR, idOf(section));
          start.after(end);
        }
        if (isFirst && !style) continue;
        const hr = document.createElement("hr");
        if (style) hr.setAttribute(MARKER_ATTR, idOf(section));
        if (isFirst) hr.setAttribute(FIRST_ATTR, "true");
        start.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const style = styleOf(section);
        if (!style) continue;
        const id = idOf(section);
        const marker = safeQuery(element, `hr[${MARKER_ATTR}="${id}"]`);
        const end = safeQuery(element, `[${END_ATTR}="${id}"]`);
        if (!marker && !end) continue;
        const metadata = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style }
        });
        if (end) {
          end.replaceWith(metadata);
        } else {
          const nextHr = safeQueryAll2(element, "hr").find((hr) => hr !== marker && docOrder(marker, hr) < 0);
          if (nextHr) nextHr.before(metadata);
          else element.append(metadata);
        }
        if (marker) {
          if (marker.hasAttribute(FIRST_ATTR)) marker.remove();
          else marker.removeAttribute(MARKER_ATTR);
        }
      }
      safeQueryAll2(element, `[${END_ATTR}]`).forEach((el) => el.remove());
      safeQueryAll2(element, `[${FIRST_ATTR}]`).forEach((el) => el.remove());
      safeQueryAll2(element, `[${MARKER_ATTR}]`).forEach((el) => el.removeAttribute(MARKER_ATTR));
    }
  }

  // tools/importer/import-services.js
  var PAGE_TEMPLATE = {
    "name": "services",
    "urls": [
      "https://www.gspann.com/services/application-services-and-modernization"
    ],
    "representativeUrl": "https://www.gspann.com/services/application-services-and-modernization",
    "urlPattern": "/services/*",
    "description": "GSPANN service landing pages: sticky gradient anchor nav, photo hero, capabilities cards + detail carousel, technology partner logo cards, navy email CTA, impact stats, insights resource scroller, leadership cards.",
    "blocks": [
      {
        "name": "columns-anchor-nav",
        "instances": [
          "#main-content > nav.secondary-nav div.secondary-nav-content"
        ]
      },
      {
        "name": "hero-overlay-left",
        "instances": [
          "#main-content > section.service-hero"
        ]
      },
      {
        "name": "cards-capability",
        "instances": [
          "#services div.capabilities-flat-grid"
        ]
      },
      {
        "name": "carousel-split-detail",
        "instances": [
          "#services div.capability-carousel"
        ]
      },
      {
        "name": "cards-logo-group",
        "instances": [
          "#platforms div.platforms-categories-wrapper"
        ]
      },
      {
        "name": "form",
        "instances": [
          "#approach form"
        ]
      },
      {
        "name": "cards-stats",
        "instances": [
          "#results div.impact-metrics-grid"
        ]
      },
      {
        "name": "cards-resources",
        "instances": [
          "#insights div.rc-track"
        ]
      },
      {
        "name": "cards-leader",
        "instances": [
          "#connect div.leadership-grid"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Sticky service anchor navigation",
        "selector": [
          "#main-content > nav.secondary-nav"
        ],
        "style": "blue-red-gradient",
        "blocks": [
          "columns-anchor-nav"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "Service hero",
        "selector": [
          "#main-content > section.service-hero"
        ],
        "style": null,
        "blocks": [
          "hero-overlay-left"
        ],
        "defaultContent": []
      },
      {
        "id": "section-3",
        "name": "Our Capabilities",
        "selector": [
          "#services"
        ],
        "style": null,
        "blocks": [
          "cards-capability",
          "carousel-split-detail"
        ],
        "defaultContent": [
          "#services .section-tag",
          "#services h2",
          "#services h2 + p"
        ]
      },
      {
        "id": "section-4",
        "name": "Technology Partners",
        "selector": [
          "#platforms"
        ],
        "style": "light-blue",
        "blocks": [
          "cards-logo-group"
        ],
        "defaultContent": [
          "#platforms .section-tag",
          "#platforms h2",
          "#platforms h2 + p"
        ]
      },
      {
        "id": "section-5",
        "name": "Modernization partner CTA",
        "selector": [
          "#approach"
        ],
        "style": "navy-gradient, centered",
        "blocks": [
          "form"
        ],
        "defaultContent": [
          "#approach h2",
          "#approach h2 + p"
        ]
      },
      {
        "id": "section-6",
        "name": "Our Impact",
        "selector": [
          "#results"
        ],
        "style": "light-grey",
        "blocks": [
          "cards-stats"
        ],
        "defaultContent": [
          "#results .section-tag",
          "#results h2",
          "#results h2 + p"
        ]
      },
      {
        "id": "section-7",
        "name": "Insights resources",
        "selector": [
          "#insights"
        ],
        "style": "light-grey",
        "blocks": [
          "cards-resources"
        ],
        "defaultContent": [
          "#insights .section-tag",
          "#insights h2",
          "#insights h2 + p"
        ]
      },
      {
        "id": "section-8",
        "name": "Connect with Us",
        "selector": [
          "#connect"
        ],
        "style": null,
        "blocks": [
          "cards-leader"
        ],
        "defaultContent": [
          "#connect .section-tag",
          "#connect h2"
        ]
      }
    ]
  };
  var parsers = {
    "columns-anchor-nav": parse,
    "hero-overlay-left": parse2,
    "cards-capability": parse3,
    "carousel-split-detail": parse4,
    "cards-logo-group": parse5,
    "form": parse6,
    "cards-stats": parse7,
    "cards-resources": parse8,
    "cards-leader": parse9
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
  var import_services_default = {
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
  return __toCommonJS(import_services_exports);
})();
