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

  // tools/importer/import-software-product-detail.js
  var import_software_product_detail_exports = {};
  __export(import_software_product_detail_exports, {
    default: () => import_software_product_detail_default
  });

  // tools/importer/parsers/product-hero.js
  var clean = (text) => text.replace(/\s+/g, " ").trim();
  var slug = (text) => clean(text).toLowerCase().replace(/[^0-9a-z]+/g, "-").replace(/^-+|-+$/g, "");
  function anchorFor(href, document) {
    if (!href || !href.startsWith("#") || href.length < 2) return href;
    const target = document.getElementById(href.slice(1));
    const heading = target && (target.matches("h1, h2, h3, h4") ? target : target.querySelector("h1, h2, h3, h4"));
    return heading ? `#${slug(heading.textContent)}` : href;
  }
  function copyInline(source, target, document) {
    [...source.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        target.appendChild(document.createTextNode(node.textContent.replace(/[ \t\r\n\f]+/g, " ")));
      } else if (node.nodeType === 1 && node.tagName === "A") {
        const a = document.createElement("a");
        a.setAttribute("href", node.getAttribute("href"));
        a.textContent = clean(node.textContent);
        target.appendChild(a);
      } else if (node.nodeType === 1 && /^(STRONG|B|EM|I|SUP|SUB)$/.test(node.tagName)) {
        const el = document.createElement(node.tagName.toLowerCase());
        copyInline(node, el, document);
        target.appendChild(el);
      } else if (node.nodeType === 1 && node.tagName !== "BR") {
        copyInline(node, target, document);
      }
    });
    if (target.firstChild && target.firstChild.nodeType === 3) {
      target.firstChild.textContent = target.firstChild.textContent.replace(/^[ \t\r\n\f]+/, "");
    }
    if (target.lastChild && target.lastChild.nodeType === 3) {
      target.lastChild.textContent = target.lastChild.textContent.replace(/[ \t\r\n\f]+$/, "");
    }
    return target;
  }
  function parse(element, { document }) {
    const rt = element.querySelector(".rt-holder") || element;
    const slides = [...element.querySelectorAll(".product-gallery-carousel .slide img")];
    const img = slides[0] || element.querySelector(".lt-holder img");
    const hasButtonRow = !!rt.querySelector(":scope > .twobuttons, :scope > .threebuttons");
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(" field:image "));
    if (img && slides.length < 2) {
      const image = document.createElement("img");
      image.setAttribute("src", img.getAttribute("src"));
      image.setAttribute("alt", img.getAttribute("alt") || "");
      imageCell.appendChild(image);
    }
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(" field:text "));
    [...rt.children].forEach((child) => {
      if (/^H[1-6]$/.test(child.tagName)) {
        textCell.appendChild(copyInline(child, document.createElement(child.tagName.toLowerCase()), document));
      } else if (child.tagName === "P" && clean(child.textContent)) {
        textCell.appendChild(copyInline(child, document.createElement("p"), document));
      } else if (child.tagName === "UL" || child.tagName === "OL") {
        const list = document.createElement(child.tagName.toLowerCase());
        child.querySelectorAll(":scope > li").forEach((li) => {
          list.appendChild(copyInline(li, document.createElement("li"), document));
        });
        textCell.appendChild(list);
      } else if (child.classList.contains("twobuttons") || child.classList.contains("threebuttons")) {
        child.querySelectorAll("a.btn[href]").forEach((btn) => {
          const p = document.createElement("p");
          const wrapper = document.createElement(btn.classList.contains("btn-primary") ? "strong" : "em");
          const a = document.createElement("a");
          a.setAttribute("href", anchorFor(btn.getAttribute("href"), document));
          a.textContent = clean(btn.textContent);
          wrapper.appendChild(a);
          p.appendChild(wrapper);
          textCell.appendChild(p);
        });
      } else if (!hasButtonRow && child.tagName === "DIV" && child.querySelector(":scope > .product-table-link-btn")) {
        const jump = child.querySelector(":scope > .product-table-link-btn");
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.setAttribute("href", anchorFor(jump.getAttribute("href"), document));
        a.textContent = clean(jump.textContent);
        p.appendChild(a);
        textCell.appendChild(p);
        child.querySelectorAll(":scope > a.btn-primary[href]").forEach((btn) => {
          const q = document.createElement("p");
          const strong = document.createElement("strong");
          const link = document.createElement("a");
          link.setAttribute("href", btn.getAttribute("href"));
          link.textContent = clean(btn.textContent);
          strong.appendChild(link);
          q.appendChild(strong);
          textCell.appendChild(q);
        });
      }
    });
    const resourcesCell = document.createDocumentFragment();
    resourcesCell.appendChild(document.createComment(" field:resources "));
    const tools = element.querySelector(".resource-tool-table-wrapper");
    if (tools) {
      const label = tools.querySelector(".resource-tool-table-links-heading");
      if (label && clean(label.textContent)) {
        const p = document.createElement("p");
        p.textContent = clean(label.textContent);
        resourcesCell.appendChild(p);
      }
      const ul = document.createElement("ul");
      tools.querySelectorAll(".resource-tool-table-links-wrapper a[href]").forEach((link) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.setAttribute("href", link.getAttribute("href"));
        a.textContent = clean(link.textContent);
        li.appendChild(a);
        ul.appendChild(li);
      });
      if (ul.children.length) resourcesCell.appendChild(ul);
    }
    const items = [...rt.querySelectorAll(":scope > ul > li")];
    const compact = items.length > 1 && !items.some((li) => /margin-bottom/i.test(li.getAttribute("style") || ""));
    const block = WebImporter.Blocks.createBlock(document, {
      name: "product-hero",
      variants: compact ? ["compact-list"] : [],
      cells: [[imageCell], [textCell], [resourcesCell]]
    });
    if (slides.length < 2) {
      element.replaceWith(block);
      return;
    }
    const galleryCells = slides.map((slide) => {
      const cell = document.createDocumentFragment();
      cell.appendChild(document.createComment(" field:image "));
      const image = document.createElement("img");
      image.setAttribute("src", slide.getAttribute("src"));
      image.setAttribute("alt", slide.getAttribute("alt") || "");
      cell.appendChild(image);
      return [cell];
    });
    const gallery = WebImporter.Blocks.createBlock(document, { name: "product-gallery", cells: galleryCells });
    element.replaceWith(block, gallery);
  }

  // tools/importer/parsers/page-tabs.js
  var clean2 = (text) => text.replace(/\s+/g, " ").trim();
  var slug2 = (text) => clean2(text).toLowerCase().replace(/[^0-9a-z]+/g, "-").replace(/^-+|-+$/g, "");
  function parse2(element, { document }) {
    const cell = document.createDocumentFragment();
    cell.appendChild(document.createComment(" field:links "));
    const ul = document.createElement("ul");
    element.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      const target = href.startsWith("#") && href.length > 1 && document.getElementById(href.slice(1));
      const heading = target && (target.matches("h1, h2, h3, h4") ? target : target.querySelector("h1, h2, h3, h4"));
      const hidden = /display:\s*none/i.test(link.getAttribute("style") || "");
      if (hidden || href.startsWith("#") && !target) return;
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.setAttribute("href", heading ? `#${slug2(heading.textContent)}` : href);
      a.textContent = clean2(link.textContent);
      li.appendChild(a);
      ul.appendChild(li);
    });
    cell.appendChild(ul);
    const block = WebImporter.Blocks.createBlock(document, { name: "page-tabs", cells: [[cell]] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/feature-columns.js
  var clean3 = (text) => text.replace(/\s+/g, " ").trim();
  function copyInline2(source, target, document) {
    [...source.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        target.appendChild(document.createTextNode(node.textContent.replace(/[ \t\r\n\f]+/g, " ")));
      } else if (node.nodeType === 1 && node.tagName === "A") {
        const a = document.createElement("a");
        a.setAttribute("href", node.getAttribute("href"));
        a.textContent = clean3(node.textContent);
        target.appendChild(a);
      } else if (node.nodeType === 1 && /^(STRONG|B|EM|I|SUP|SUB)$/.test(node.tagName)) {
        target.appendChild(copyInline2(node, document.createElement(node.tagName.toLowerCase()), document));
      } else if (node.nodeType === 1 && !/^(BR|UL|OL)$/.test(node.tagName)) {
        copyInline2(node, target, document);
      }
    });
    if (target.firstChild && target.firstChild.nodeType === 3) {
      target.firstChild.textContent = target.firstChild.textContent.replace(/^[ \t\r\n\f]+/, "");
    }
    if (target.lastChild && target.lastChild.nodeType === 3) {
      target.lastChild.textContent = target.lastChild.textContent.replace(/[ \t\r\n\f]+$/, "");
    }
    return target;
  }
  function parse3(element, { document }) {
    const columns = [...element.querySelectorAll(":scope > .bc-column")];
    const cells = columns.map((column) => {
      const cell = document.createDocumentFragment();
      cell.appendChild(document.createComment(" field:text "));
      const heading = column.querySelector("h1, h2, h3, h4, h5, h6");
      if (heading) {
        const h4 = document.createElement("h4");
        h4.textContent = clean3(heading.textContent);
        cell.appendChild(h4);
      }
      column.querySelectorAll("ul, ol").forEach((list) => {
        if (list.parentElement.closest("ul, ol")) return;
        const copy = document.createElement(list.tagName.toLowerCase());
        list.querySelectorAll(":scope > li").forEach((li) => {
          copy.appendChild(copyInline2(li, document.createElement("li"), document));
        });
        cell.appendChild(copy);
      });
      column.querySelectorAll(".bc-rich-text-desc > p").forEach((p) => {
        if (clean3(p.textContent)) cell.appendChild(copyInline2(p, document.createElement("p"), document));
      });
      return [cell];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "feature-columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/spec-table.js
  var clean4 = (text) => text.replace(/\s+/g, " ").trim();
  function parse4(element, { document }) {
    const rows = [...element.querySelectorAll("tr")].filter((tr) => tr.children.length >= 2);
    const cells = rows.map((tr) => {
      const [labelTd, valueTd] = tr.children;
      const label = document.createDocumentFragment();
      label.appendChild(document.createComment(" field:label "));
      label.appendChild(document.createTextNode(clean4(labelTd.textContent)));
      const value = document.createDocumentFragment();
      value.appendChild(document.createComment(" field:value "));
      const lists = [...valueTd.querySelectorAll("ul, ol")].filter((list) => !list.parentElement.closest("ul, ol"));
      if (lists.length) {
        lists.forEach((list) => {
          const copy = document.createElement(list.tagName.toLowerCase());
          list.querySelectorAll(":scope > li").forEach((li) => {
            const item = document.createElement("li");
            item.textContent = clean4(li.textContent);
            if (item.textContent) copy.appendChild(item);
          });
          value.appendChild(copy);
        });
      } else {
        const p = document.createElement("p");
        p.textContent = clean4(valueTd.textContent);
        value.appendChild(p);
      }
      return [label, value];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "spec-table", cells });
    element.replaceWith(block);
  }

  // tools/importer/data/product-tables.js
  var product_tables_default = {
    "/flow-cytometry/software/cytobank-enterprise": {
      "source": "Live product table (search results) captured 2026-11-02",
      "items": [
        {
          "number": "C47400",
          "title": "Cytobank Commercial Enterprise License, 10-user, 3-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9d/7e/ca/64/64ca7e9d65334c0761c544e1/Cytobank-Enterprise-Commercial-License-c47400-2023-03.png",
          "alt": "C47400_Cytobank Commercial Enterprise License, 10-user, 3-year",
          "href": "https://store.beckman.com/hi/p/C47400?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Number of Users",
              "10"
            ],
            [
              "License Term",
              "3 years"
            ],
            [
              "License Type",
              "Enterprise, Commerical"
            ]
          ]
        },
        {
          "number": "C47401",
          "title": "Cytobank Commercial Enterprise License, Additional user, 3-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9d/7e/ca/64/64ca7e9d65334c0761c544e0/Cytobank-Enterprise-Commercial-License-c47401-2023-03.png",
          "alt": "C47401_Cytobank Commercial Enterprise License, Additional user, 3-year",
          "href": "https://store.beckman.com/hi/p/C47401?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Number of Users",
              "1"
            ],
            [
              "License Term",
              "3 years"
            ],
            [
              "License Type",
              "Enterprise, Commerical"
            ]
          ]
        },
        {
          "number": "C47405",
          "title": "Cytobank, Single Sign-On",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9d/7e/ca/64/64ca7e9d65334c0761c544bb/Cytobank-SSO-c47405-2023-03.png",
          "alt": "C47405_Cytobank, Single Sign-On",
          "href": "https://store.beckman.com/hi/p/C47405?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": []
        },
        {
          "number": "C47403",
          "title": "Cytobank Academic Enterprise License, Additional user, 3-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9e/7e/ca/64/64ca7e9e65334c0761c544ef/Cytobank-Enterprise-Academic-License-c47403-2023-03.png",
          "alt": "C47403_Cytobank Academic Enterprise License, Additional user, 3-year",
          "href": "https://store.beckman.com/hi/p/C47403?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Number of Users",
              "1"
            ],
            [
              "License Term",
              "3 years"
            ],
            [
              "License Type",
              "Enterprise, Academic"
            ]
          ]
        },
        {
          "number": "C47402",
          "title": "Cytobank Academic Enterprise License, 10-user, 3-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9e/7e/ca/64/64ca7e9e65334c0761c544f2/Cytobank-Enterprise-Academic-License-c47402-2023-03.png",
          "alt": "C47402_Cytobank Academic Enterprise License, 10-user, 3-year",
          "href": "https://store.beckman.com/hi/p/C47402?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Number of Users",
              "10"
            ],
            [
              "License Term",
              "3 years"
            ],
            [
              "License Type",
              "Enterprise, Academic"
            ]
          ]
        },
        {
          "number": "C47390",
          "title": "Cytobank Academic Enterprise License, Additional user, 1-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9e/7e/ca/64/64ca7e9e65334c0761c544fc/Cytobank-Enterprise-Academic-License-c47390-2023-03.png",
          "alt": "C47390_Cytobank Academic Enterprise License, Additional user, 1-year",
          "href": "https://store.beckman.com/hi/p/C47390?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Number of Users",
              "1"
            ],
            [
              "License Term",
              "1 Year"
            ],
            [
              "License Type",
              "Enterprise, Academic"
            ]
          ]
        },
        {
          "number": "C47394",
          "title": "Cytobank Commercial Enterprise License, Additional user, 2-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9d/7e/ca/64/64ca7e9d65334c0761c544e5/Cytobank-Enterprise-Commercial-License-c47394-2023-03.png",
          "alt": "C47394_Cytobank Commercial Enterprise License, Additional user, 2-year",
          "href": "https://store.beckman.com/hi/p/C47394?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Number of Users",
              "1"
            ],
            [
              "License Term",
              "2 years"
            ],
            [
              "License Type",
              "Enterprise, Commerical"
            ]
          ]
        },
        {
          "number": "C47387",
          "title": "Cytobank Commercial Enterprise License, Additional user, 1-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9d/7e/ca/64/64ca7e9d65334c0761c544e9/Cytobank-Enterprise-Commercial-License-c47387-2023-03.png",
          "alt": "C47387_Cytobank Commercial Enterprise License, Additional user, 1-year",
          "href": "https://store.beckman.com/hi/p/C47387?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Number of Users",
              "1"
            ],
            [
              "License Term",
              "1 Year"
            ],
            [
              "License Type",
              "Enterprise, Commerical"
            ]
          ]
        },
        {
          "number": "C47386",
          "title": "Cytobank Commercial Enterprise License, 10-user, 1-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9d/7e/ca/64/64ca7e9d65334c0761c544eb/Cytobank-Enterprise-Commercial-License-c47386-2023-03.png",
          "alt": "C47386_Cytobank Commercial Enterprise License, 10-user, 1-year",
          "href": "https://store.beckman.com/hi/p/C47386?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Number of Users",
              "10"
            ],
            [
              "License Term",
              "1 Year"
            ],
            [
              "License Type",
              "Enterprise, Commerical"
            ]
          ]
        },
        {
          "number": "C47388",
          "title": "Cytobank Academic Enterprise License, 10-user, 1-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/45/64/26/68/68266445768113c2e8659ffa/cytobank-enterprise-academic-license-c47388-2023-03.png",
          "alt": "C47388_Cytobank Academic Enterprise License, 10-user, 1-year",
          "href": "https://store.beckman.com/hi/p/C47388?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Number of Users",
              "10"
            ],
            [
              "License Term",
              "1 Year"
            ],
            [
              "License Type",
              "Enterprise, Academic"
            ]
          ]
        },
        {
          "number": "C47395",
          "title": "Cytobank Academic Enterprise License, 10-user, 2-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9e/7e/ca/64/64ca7e9e65334c0761c544f5/Cytobank-Enterprise-Academic-License-c47395-2023-03.png",
          "alt": "C47395_Cytobank Academic Enterprise License, 10-user, 2-year",
          "href": "https://store.beckman.com/hi/p/C47395?countryCode=IN",
          "quote": "/Request-Quote",
          "filters": [
            [
              "Number of Users",
              "10"
            ],
            [
              "License Term",
              "2 years"
            ],
            [
              "License Type",
              "Enterprise, Academic"
            ]
          ]
        },
        {
          "number": "C47396",
          "title": "Cytobank Academic Enterprise License, Additional user, 2-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9e/7e/ca/64/64ca7e9e65334c0761c544f4/Cytobank-Enterprise-Academic-License-c47396-2023-03.png",
          "alt": "C47396_Cytobank Academic Enterprise License, Additional user, 2-year",
          "href": "https://store.beckman.com/hi/p/C47396?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Number of Users",
              "1"
            ],
            [
              "License Term",
              "2 years"
            ],
            [
              "License Type",
              "Enterprise, Academic"
            ]
          ]
        },
        {
          "number": "C47393",
          "title": "Cytobank Commercial Enterprise License, 10-user, 2-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9d/7e/ca/64/64ca7e9d65334c0761c544e8/Cytobank-Enterprise-Commercial-License-c47393-2023-03.png",
          "alt": "C47393_Cytobank Commercial Enterprise License, 10-user, 2-year",
          "href": "https://store.beckman.com/hi/p/C47393?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Number of Users",
              "10"
            ],
            [
              "License Term",
              "2 years"
            ],
            [
              "License Type",
              "Enterprise, Commerical"
            ]
          ]
        }
      ]
    },
    "/flow-cytometry/software/cytobank-premium": {
      "source": "Live product table (search results) captured 2026-11-03",
      "items": [
        {
          "number": "C47389",
          "title": "Cytobank Commercial Premium License, 5-user, 2-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9d/7e/ca/64/64ca7e9d65334c0761c544c8/Cytobank-Premium-Commercial-License-c47389-2023-03.png",
          "alt": "C47389_Cytobank Commercial Premium License, 5-user, 2-year",
          "href": "https://store.beckman.com/hi/p/C47389?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Cytobank",
          "filters": [
            [
              "Number of Users",
              "5"
            ],
            [
              "License Term",
              "2 years"
            ],
            [
              "License Type",
              "Premium, Commercial"
            ]
          ]
        },
        {
          "number": "C47385",
          "title": "Cytobank Academic Premium License, 5-user, 1-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/44/64/26/68/68266444768113c2e8659ff5/cytobank-premium-academic-license-c47385-2023-03.png",
          "alt": "C47385_Cytobank Academic Premium License, 5-user, 1-year",
          "href": "https://store.beckman.com/hi/p/C47385?countryCode=IN",
          "quote": "/Request-Quote",
          "filters": [
            [
              "Number of Users",
              "5"
            ],
            [
              "License Term",
              "1 Year"
            ],
            [
              "License Type",
              "Premium, Academic"
            ]
          ]
        },
        {
          "number": "C47391",
          "title": "Cytobank Academic Premium License, 1-user, 2-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/44/64/26/68/68266444768113c2e8659ff4/cytobank-premium-academic-license-c47391-2023-03.png",
          "alt": "C47391_Cytobank Academic Premium License, 1-user, 2-year",
          "href": "https://store.beckman.com/hi/p/C47391?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Number of Users",
              "1"
            ],
            [
              "License Term",
              "2 years"
            ],
            [
              "License Type",
              "Premium, Academic"
            ]
          ]
        },
        {
          "number": "C47392",
          "title": "Cytobank Academic Premium License, 5-user, 2-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/44/64/26/68/68266444768113c2e8659ff1/cytobank-premium-academic-license-c47392-2023-03.png",
          "alt": "C47392_Cytobank Academic Premium License, 5-user, 2-year",
          "href": "https://store.beckman.com/hi/p/C47392?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Number of Users",
              "5"
            ],
            [
              "License Term",
              "2 years"
            ],
            [
              "License Type",
              "Premium, Academic"
            ]
          ]
        },
        {
          "number": "C47397",
          "title": "Cytobank Commercial Premium License, 5-user, 3-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/44/64/26/68/68266444768113c2e8659fed/cytobank-premium-commercial-license-c47397-2023-03.png",
          "alt": "C47397_Cytobank Commercial Premium License, 5-user, 3-year",
          "href": "https://store.beckman.com/hi/p/C47397?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Number of Users",
              "5"
            ],
            [
              "License Term",
              "3 years"
            ],
            [
              "License Type",
              "Premium, Commercial"
            ]
          ]
        },
        {
          "number": "C47399",
          "title": "Cytobank Academic Premium License, 5-user, 3-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/45/64/26/68/68266445768113c2e865a012/cytobank-premium-academic-license-c47399-2023-03.png",
          "alt": "C47399_Cytobank Academic Premium License, 5-user, 3-year",
          "href": "https://store.beckman.com/hi/p/C47399?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Number of Users",
              "5"
            ],
            [
              "License Term",
              "3 years"
            ],
            [
              "License Type",
              "Premium, Academic"
            ]
          ]
        },
        {
          "number": "C47384",
          "title": "Cytobank Academic Premium License, 1-user, 1-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/45/64/26/68/68266445768113c2e8659ffe/cytobank-premium-academic-license-c47384-2023-03.png",
          "alt": "C47384_Cytobank Academic Premium License, 1-user, 1-year",
          "href": "https://store.beckman.com/hi/p/C47384?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Number of Users",
              "1"
            ],
            [
              "License Term",
              "1 Year"
            ],
            [
              "License Type",
              "Premium, Academic"
            ]
          ]
        },
        {
          "number": "C47383",
          "title": "Cytobank Commercial Premium License, 5-user, 1-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/44/64/26/68/68266444768113c2e8659fef/cytobank-premium-commercial-license-c47383-2023-03.png",
          "alt": "C47383_Cytobank Commercial Premium License, 5-user, 1-year",
          "href": "https://store.beckman.com/hi/p/C47383?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Number of Users",
              "5"
            ],
            [
              "License Term",
              "1 Year"
            ],
            [
              "License Type",
              "Premium, Commercial"
            ]
          ]
        },
        {
          "number": "C47398",
          "title": "Cytobank Academic Premium License, 1-user, 3-year",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/44/64/26/68/68266444768113c2e8659ff2/cytobank-premium-academic-license-c47398-2023-03.png",
          "alt": "C47398_Cytobank Academic Premium License, 1-user, 3-year",
          "href": "https://store.beckman.com/hi/p/C47398?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Number of Users",
              "1"
            ],
            [
              "License Term",
              "3 years"
            ],
            [
              "License Type",
              "Premium, Academic"
            ]
          ]
        }
      ]
    },
    "/flow-cytometry/software/kaluza": {
      "source": "Live product table (search results) captured 2026-11-03; facet values per model follow its part number, Cytometry and RUO (8 of 8 on live)",
      "items": [
        {
          "number": "A84175",
          "title": "Kaluza Analysis Software, 5-User, Network",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9d/7e/ca/64/64ca7e9d65334c0761c544ba/Flow-Software-Kaluza-Analysis-Screen-2017-05.png",
          "alt": "A84175_Kaluza Analysis Software, 5-User, Network",
          "href": "https://store.beckman.com/hi/p/A84175?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Part Number",
              "A84175"
            ],
            [
              "Product Line Regulatory",
              "Cytometry"
            ],
            [
              "Regulatory Status",
              "RUO"
            ]
          ]
        },
        {
          "number": "A84174",
          "title": "Kaluza Analysis Software 1 Year, 1-User (Single)",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9d/7e/ca/64/64ca7e9d65334c0761c544ba/Flow-Software-Kaluza-Analysis-Screen-2017-05.png",
          "alt": "A84174_Kaluza Analysis Software 1 Year, 1-User (Single)",
          "href": "https://store.beckman.com/hi/p/A84174?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Part Number",
              "A84174"
            ],
            [
              "Product Line Regulatory",
              "Cytometry"
            ],
            [
              "Regulatory Status",
              "RUO"
            ]
          ]
        },
        {
          "number": "A82959",
          "title": "Kaluza Analysis Software Perpetual, 1-User (Single)",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9d/7e/ca/64/64ca7e9d65334c0761c544ba/Flow-Software-Kaluza-Analysis-Screen-2017-05.png",
          "alt": "A82959_Kaluza Analysis Software Perpetual, 1-User (Single)",
          "href": "https://store.beckman.com/hi/p/A82959?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Part Number",
              "A82959"
            ],
            [
              "Product Line Regulatory",
              "Cytometry"
            ],
            [
              "Regulatory Status",
              "RUO"
            ]
          ]
        },
        {
          "number": "A82961",
          "title": "Kaluza Analysis Software, 10-User, Network",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9d/7e/ca/64/64ca7e9d65334c0761c544ba/Flow-Software-Kaluza-Analysis-Screen-2017-05.png",
          "alt": "A82961_Kaluza Analysis Software, 10-User, Network",
          "href": "https://store.beckman.com/hi/p/A82961?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Part Number",
              "A82961"
            ],
            [
              "Product Line Regulatory",
              "Cytometry"
            ],
            [
              "Regulatory Status",
              "RUO"
            ]
          ]
        },
        {
          "number": "B16408",
          "title": "Kaluza Analysis Software Educational, 5-User (Network)",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9d/7e/ca/64/64ca7e9d65334c0761c544ba/Flow-Software-Kaluza-Analysis-Screen-2017-05.png",
          "alt": "B16408_Kaluza Analysis Software Educational, 5-User (Network)",
          "href": "https://store.beckman.com/hi/p/B16408?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Part Number",
              "B16408"
            ],
            [
              "Product Line Regulatory",
              "Cytometry"
            ],
            [
              "Regulatory Status",
              "RUO"
            ]
          ]
        },
        {
          "number": "B16407",
          "title": "Kaluza Analysis Software Educational 1 Year, 1-User (Single)",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9d/7e/ca/64/64ca7e9d65334c0761c544ba/Flow-Software-Kaluza-Analysis-Screen-2017-05.png",
          "alt": "B16407_Kaluza Analysis Software Educational 1 Year, 1-User (Single)",
          "href": "https://store.beckman.com/hi/p/B16407?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Part Number",
              "B16407"
            ],
            [
              "Product Line Regulatory",
              "Cytometry"
            ],
            [
              "Regulatory Status",
              "RUO"
            ]
          ]
        },
        {
          "number": "B16409",
          "title": "Kaluza Analysis Software Educational, 10-User (Network)",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9d/7e/ca/64/64ca7e9d65334c0761c544ba/Flow-Software-Kaluza-Analysis-Screen-2017-05.png",
          "alt": "B16409_Kaluza Analysis Software Educational, 10-User (Network)",
          "href": "https://store.beckman.com/hi/p/B16409?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Part Number",
              "B16409"
            ],
            [
              "Product Line Regulatory",
              "Cytometry"
            ],
            [
              "Regulatory Status",
              "RUO"
            ]
          ]
        },
        {
          "number": "B16406",
          "title": "Kaluza Analysis Software Educational, 1-User, Single",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/9d/7e/ca/64/64ca7e9d65334c0761c544ba/Flow-Software-Kaluza-Analysis-Screen-2017-05.png",
          "alt": "B16406_Kaluza Analysis Software Educational, 1-User, Single",
          "href": "https://store.beckman.com/hi/p/B16406?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": [
            [
              "Part Number",
              "B16406"
            ],
            [
              "Product Line Regulatory",
              "Cytometry"
            ],
            [
              "Regulatory Status",
              "RUO"
            ]
          ]
        }
      ]
    },
    "/flow-cytometry/software/kaluza-c": {
      "source": "Live product table (search results) captured 2026-11-05; the live table shows no filter groups for these 4 models",
      "items": [
        {
          "number": "C10574",
          "title": "Kaluza C Analysis Software Perpetual, 1-User (Single)",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/44/64/26/68/68266444768113c2e8659fea/flow-cytometers-software-kaluza-c-10c-data.png",
          "alt": "C10574_Kaluza C Analysis Software Perpetual, 1-User (Single)",
          "href": "https://store.beckman.com/hi/p/C10574?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": []
        },
        {
          "number": "C10577",
          "title": "Kaluza C Analysis Software, 5-User (Network)",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/44/64/26/68/68266444768113c2e8659fea/flow-cytometers-software-kaluza-c-10c-data.png",
          "alt": "C10577_Kaluza C Analysis Software, 5-User (Network)",
          "href": "https://store.beckman.com/hi/p/C10577?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": []
        },
        {
          "number": "C10575",
          "title": "Kaluza C Analysis Software 1 Year, 1-User (Single)",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/44/64/26/68/68266444768113c2e8659fea/flow-cytometers-software-kaluza-c-10c-data.png",
          "alt": "C10575_Kaluza C Analysis Software 1 Year, 1-User (Single)",
          "href": "https://store.beckman.com/hi/p/C10575?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": []
        },
        {
          "number": "C10576",
          "title": "Kaluza C Analysis Software, 10-User (Network)",
          "image": "https://www.mybeckman.in/pimassets/api/v1.1/file/public_files/pim/assets/8f/02/66/64/6466028f634fff00015af465/images/44/64/26/68/68266444768113c2e8659fea/flow-cytometers-software-kaluza-c-10c-data.png",
          "alt": "C10576_Kaluza C Analysis Software, 10-User (Network)",
          "href": "https://store.beckman.com/hi/p/C10576?countryCode=IN",
          "quote": "/Request-Quote?tfa_2=Flow Software - Kaluza",
          "filters": []
        }
      ]
    }
  };

  // tools/importer/parsers/product-table.js
  var clean5 = (text) => (text || "").replace(/\s+/g, " ").trim();
  function fromDom(element) {
    return [...element.querySelectorAll(".CoveoResult .product-card")].map((card) => {
      var _a;
      const img = card.querySelector("img");
      const title = card.querySelector(".product-card__title a, .product-card__title");
      const quote = card.querySelector(".add-to-quote-link, .product-card__footer a");
      return {
        number: clean5((_a = card.querySelector(".product-card__number")) == null ? void 0 : _a.textContent).replace(/^Product No:\s*/, ""),
        title: clean5(title == null ? void 0 : title.textContent),
        href: (title == null ? void 0 : title.getAttribute("href")) || null,
        image: img == null ? void 0 : img.getAttribute("src"),
        alt: (img == null ? void 0 : img.getAttribute("alt")) || "",
        quote: (quote == null ? void 0 : quote.getAttribute("href")) || null,
        filters: []
      };
    });
  }
  function parse5(element, { document, params }) {
    const path = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
    const items = product_tables_default[path] && product_tables_default[path].items || fromDom(element);
    if (!items.length) {
      element.remove();
      return;
    }
    const cells = items.map((item) => {
      const imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:image "));
      if (item.image) {
        const img = document.createElement("img");
        img.setAttribute("src", item.image);
        img.setAttribute("alt", item.alt || "");
        imageCell.appendChild(img);
      }
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      const h3 = document.createElement("h3");
      if (item.href) {
        const a = document.createElement("a");
        a.setAttribute("href", item.href);
        a.textContent = item.title;
        h3.appendChild(a);
      } else {
        h3.textContent = item.title;
      }
      textCell.appendChild(h3);
      if (item.number) {
        const p = document.createElement("p");
        p.textContent = `Product No: ${item.number}`;
        textCell.appendChild(p);
      }
      const filtersCell = document.createDocumentFragment();
      filtersCell.appendChild(document.createComment(" field:filters "));
      if (item.filters.length) {
        const ul = document.createElement("ul");
        item.filters.forEach(([name, value]) => {
          const li = document.createElement("li");
          li.textContent = `${name}: ${value}`;
          ul.appendChild(li);
        });
        filtersCell.appendChild(ul);
      }
      const quoteCell = document.createDocumentFragment();
      quoteCell.appendChild(document.createComment(" field:quoteLink "));
      if (item.quote) {
        const a = document.createElement("a");
        a.setAttribute("href", item.quote);
        a.textContent = "Add to Quote";
        quoteCell.appendChild(a);
      }
      return [imageCell, textCell, filtersCell, quoteCell];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "product-table", cells });
    const separate = document.querySelector("div.product-page-sub-heading-wrapper#product-table-wrapper");
    const inner = element.querySelector(".product-table__header h3");
    if (!separate && inner && clean5(inner.textContent)) {
      const h3 = document.createElement("h3");
      h3.textContent = clean5(inner.textContent);
      element.replaceWith(h3, block);
    } else {
      element.replaceWith(block);
    }
  }

  // tools/importer/parsers/resource-list.js
  var clean6 = (text) => text.replace(/\s+/g, " ").trim();
  function typeOf(item) {
    const icon = item.querySelector('.content-resource-list-icon [class*="fa-"]');
    const cls = item.dataset.icon || (icon ? icon.getAttribute("class") : "");
    if (/fa-video|fa-play|fa-film/.test(cls)) return "video";
    if (/fa-file|fa-book/.test(cls)) return "document";
    return "web-page";
  }
  function parse6(element, { document }) {
    const items = [...element.querySelectorAll(":scope > .content-resource-list-child")];
    const cells = items.map((item) => {
      const link = item.querySelector("a.content-resource-list-heading, a[href]");
      const text = item.querySelector(".content-resource-list-text");
      const type = document.createDocumentFragment();
      type.appendChild(document.createComment(" field:type "));
      type.appendChild(document.createTextNode(typeOf(item)));
      const linkCell = document.createDocumentFragment();
      linkCell.appendChild(document.createComment(" field:link "));
      if (link) {
        const a = document.createElement("a");
        a.setAttribute("href", link.getAttribute("href"));
        a.textContent = clean6(link.textContent);
        linkCell.appendChild(a);
      }
      const description = document.createDocumentFragment();
      description.appendChild(document.createComment(" field:description "));
      if (text && clean6(text.textContent)) {
        description.appendChild(document.createTextNode(clean6(text.textContent)));
      }
      return [type, linkCell, description];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "resource-list", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/related-products.js
  var clean7 = (text) => text.replace(/\s+/g, " ").trim();
  function parse7(element, { document }) {
    const items = [...element.querySelectorAll(".related-part")].filter((item) => !item.classList.contains("slick-cloned"));
    const cells = items.map((item) => {
      const img = item.querySelector(".related-part__img img, img");
      const title = item.querySelector(".related-part__title > a:not(.related-part__desc)");
      const desc = item.querySelector(".related-part__desc");
      const link = item.querySelector("a[href]");
      const imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:image "));
      if (img && img.getAttribute("src")) {
        const image = document.createElement("img");
        image.setAttribute("src", img.getAttribute("src"));
        image.setAttribute("alt", img.getAttribute("alt") || "");
        imageCell.appendChild(image);
      }
      const titleCell = document.createDocumentFragment();
      titleCell.appendChild(document.createComment(" field:title "));
      if (title) titleCell.appendChild(document.createTextNode(clean7(title.textContent)));
      const descCell = document.createDocumentFragment();
      descCell.appendChild(document.createComment(" field:description "));
      if (desc) descCell.appendChild(document.createTextNode(clean7(desc.textContent)));
      const linkCell = document.createDocumentFragment();
      linkCell.appendChild(document.createComment(" field:link "));
      if (link) {
        const a = document.createElement("a");
        a.setAttribute("href", link.getAttribute("href"));
        a.textContent = link.getAttribute("href");
        linkCell.appendChild(a);
      }
      return [imageCell, titleCell, descCell, linkCell];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "related-products", cells });
    element.replaceWith(block);
  }

  // tools/importer/data/technical-documents.js
  var technical_documents_default = {
    "/flow-cytometry/software/kaluza-c": {
      "source": "Live Technical Documents table (search results) captured 2026-11-05; every document is offered in all five languages",
      "items": [
        {
          "title": "Kaluza C 10 User Network",
          "href": "/techdocs/C10576DEC3.0/wsr-315758",
          "type": "CE Declaration - Hardware",
          "docId": "wsr-315758",
          "lots": [],
          "languages": ["English", "French", "German", "Italian", "Spanish"]
        },
        {
          "title": "Kaluza C 5 User Network",
          "href": "/techdocs/C10577DEC3.0/wsr-264808",
          "type": "CE Declaration - Hardware",
          "docId": "wsr-264808",
          "lots": [],
          "languages": ["English", "French", "German", "Italian", "Spanish"]
        },
        {
          "title": "Kaluza C Perpetual License",
          "href": "/techdocs/C10574DEC3.0/wsr-264805",
          "type": "CE Declaration - Hardware",
          "docId": "wsr-264805",
          "lots": [],
          "languages": ["English", "French", "German", "Italian", "Spanish"]
        },
        {
          "title": "Kaluza C Single Use 1 Year License",
          "href": "/techdocs/C10575DEC3.0/wsr-264806",
          "type": "CE Declaration - Hardware",
          "docId": "wsr-264806",
          "lots": [],
          "languages": ["English", "French", "German", "Italian", "Spanish"]
        }
      ]
    }
  };

  // tools/importer/parsers/technical-documents.js
  function parse8(element, { document, params }) {
    const path = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
    const items = technical_documents_default[path] && technical_documents_default[path].items || [];
    if (!items.length) {
      element.remove();
      return;
    }
    const cells = items.map((item) => {
      const linkCell = document.createDocumentFragment();
      linkCell.appendChild(document.createComment(" field:link "));
      const p = document.createElement("p");
      if (item.href) {
        const a = document.createElement("a");
        a.setAttribute("href", item.href);
        a.textContent = item.title;
        p.appendChild(a);
      } else {
        p.textContent = item.title;
      }
      linkCell.appendChild(p);
      const typeCell = document.createDocumentFragment();
      typeCell.appendChild(document.createComment(" field:category "));
      typeCell.appendChild(document.createTextNode(item.type || ""));
      const idCell = document.createDocumentFragment();
      idCell.appendChild(document.createComment(" field:docId "));
      idCell.appendChild(document.createTextNode(item.docId || ""));
      const detailsCell = document.createDocumentFragment();
      detailsCell.appendChild(document.createComment(" field:details "));
      const lines = [];
      if (item.lots && item.lots.length) lines.push(`Lot Number(s): ${item.lots.join(", ")}`);
      if (item.languages && item.languages.length) lines.push(`Language: ${item.languages.join(", ")}`);
      if (lines.length) {
        const ul = document.createElement("ul");
        lines.forEach((line) => {
          const li = document.createElement("li");
          li.textContent = line;
          ul.appendChild(li);
        });
        detailsCell.appendChild(ul);
      }
      return [linkCell, typeCell, idCell, detailsCell];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "technical-documents", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/beckman-cleanup.js
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      WebImporter.DOMUtils.remove(element, [
        "#consent_blackbar",
        // cookie consent banner
        "#ModalPopup.access-restriced-login-modal",
        // empty login modal
        "#ModalPopup",
        ".MaskOverlay"
      ]);
      const crumbs = [...element.querySelectorAll("nav.breadcrumbs li")].map((li) => li.textContent.replace(/\s+/g, " ").trim()).filter(Boolean).slice(1);
      if (crumbs.length) {
        element.ownerDocument.documentElement.dataset.breadcrumbLabels = crumbs.join(" | ");
      }
      WebImporter.DOMUtils.remove(element, [
        "#main .main-holder > .container.custome-container:not(.product-spotlight-wrapper)",
        "nav.breadcrumbs"
      ]);
      element.querySelectorAll("#techdocs-wrapper").forEach((wrap) => {
        const more = wrap.querySelector("#coveo-techdocs-more-results");
        const error = wrap.querySelector("#coveo-techdocs-error");
        const hidden = (el) => /display:\s*none/i.test(el && el.getAttribute("style") || "");
        if (more && error && hidden(more) && !hidden(error)) {
          error.removeAttribute("style");
          error.id = "coveo-techdocs-more-results";
          more.replaceWith(error);
        }
      });
      element.querySelectorAll("#techdocs-wrapper #coveo-center-column").forEach((column) => {
        column.removeAttribute("style");
        column.textContent = "Technical documents";
      });
      WebImporter.DOMUtils.remove(element, [
        ".product-spotlight-wrapper .rt-holder:has(> .twobuttons, > .threebuttons) > div:has(> .product-table-link-btn)",
        ".product-spotlight-wrapper :is(.twobuttons, .threebuttons) > div:not(:has(a))",
        '.product-spotlight-wrapper input[type="hidden"]',
        // (the licence table's search widget is kept: the product-table parser replaces it)
        ".product-spotlight-wrapper .CoveoSearchInterface:not(:has(.product-table))",
        "#coveo-center-column:not(#techdocs-wrapper *)",
        "#multiselect__container",
        "#resource-table-pagination",
        ".related-parts .slick-cloned",
        ".related-parts > button"
      ]);
      const iconClasses = [];
      (payload && payload.html || "").replace(
        /content-resource-list-icon"[^>]*>\s*<(?:i|em|svg)[^>]*class="([^"]*)"/g,
        (m, cls) => {
          iconClasses.push(cls);
          return m;
        }
      );
      element.querySelectorAll(".content-resource-list-child").forEach((item, i) => {
        if (iconClasses[i]) item.dataset.icon = iconClasses[i];
      });
      element.querySelectorAll("#coveo-techdocs-more-results").forEach((div) => {
        const p = element.ownerDocument.createElement("p");
        p.append(...div.childNodes);
        div.replaceWith(p);
      });
      element.querySelectorAll(".product-series-callouts").forEach((band) => {
        if (!band.querySelector(".product-series-callouts__item")) band.remove();
      });
      WebImporter.DOMUtils.remove(element, [
        ".series-category-promotional-wrapper",
        "#main .main-holder > .row.js-component",
        ".two-columns-holder .row.js-component",
        ".bcls-aeo-published"
      ]);
      element.querySelectorAll("#main a[href]").forEach((a) => {
        if (a.textContent.trim()) return;
        const next = a.nextElementSibling;
        if (next && next.tagName === "A" && !next.hasAttribute("href") && next.textContent.trim()) {
          a.replaceChildren(...next.childNodes);
          next.remove();
        }
      });
      const raw = payload && payload.html || "";
      const recovered = {};
      raw.replace(/<a href="([^"]+)">(?:\s*<span[^>]*>\s*<\/span>\s*)?<\/a>\s*<a>([^<]+)<\/a>/g, (m, href, text) => {
        recovered[text.trim()] = href;
        return m;
      });
      element.querySelectorAll("#main a:not([href])").forEach((a) => {
        const href = recovered[a.textContent.trim()];
        if (href) a.setAttribute("href", href);
      });
      element.querySelectorAll("#main a:not([href])").forEach((a) => {
        if (!a.textContent.trim() && !a.querySelector("img")) a.remove();
        else a.replaceWith(...a.childNodes);
      });
      element.querySelectorAll('#main a[href="#"]').forEach((a) => {
        if (a.querySelector("img")) a.replaceWith(...a.childNodes);
      });
      element.querySelectorAll('#main .bc-rich-text > ul[style*="margin-left"]').forEach((sub) => {
        var _a;
        const prev = sub.previousElementSibling;
        if (!prev || prev.tagName !== "UL" || !prev.lastElementChild) return;
        const next = sub.nextElementSibling;
        sub.removeAttribute("style");
        prev.lastElementChild.append(sub);
        if (next && next.tagName === "UL" && !((_a = next.getAttribute("style")) == null ? void 0 : _a.includes("margin-left"))) {
          while (next.firstElementChild) prev.append(next.firstElementChild);
          next.remove();
        }
      });
    }
    if (hookName === "afterTransform") {
      WebImporter.DOMUtils.remove(element, [
        "header#mainNav",
        "#mainNav",
        "header",
        "div.footer2023",
        "#navScrollContainer"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "a.skip-to-main-content-link",
        "input#userId",
        "input#contextItemId",
        "#mktoStyleLoaded",
        "form.mktoForm",
        "iframe",
        "script",
        "style",
        "noscript",
        "link",
        'img[width="1"][height="1"]'
        // tracking pixels
      ]);
      element.querySelectorAll('img[src*="/pimassets/"]').forEach((img) => {
        const src = img.getAttribute("src");
        const path = src.replace(/^(https?:)?(\/\/www\.mybeckman\.in)?\/pimassets\//, "/");
        if (path !== src) img.setAttribute("src", `https://plytix-files.com${path}`);
      });
      element.querySelectorAll('img[src*="media.beckman.com"]').forEach((img) => {
        try {
          const url = new URL(img.getAttribute("src"));
          const rev = url.searchParams.get("rev");
          url.search = rev ? `?rev=${rev}` : "";
          img.setAttribute("src", url.href);
        } catch (e) {
        }
      });
      const SITE_ROOT = "/sai";
      const MIGRATED = [
        "/software",
        "/flow-cytometry/software",
        "/flow-cytometry/software/cytobank-enterprise",
        "/flow-cytometry/software/cytobank-premium",
        "/flow-cytometry/software/kaluza",
        "/flow-cytometry/software/kaluza-c",
        "/liquid-handlers/software",
        "/microbioreactor/biolector-xt/software"
      ];
      element.querySelectorAll('a[href^="/"]').forEach((a) => {
        const href = a.getAttribute("href");
        const [, pathname, rest] = href.match(/^([^?#]*)(.*)$/);
        if (MIGRATED.includes(pathname.replace(/\/$/, ""))) a.setAttribute("href", `${SITE_ROOT}${pathname}${rest}`);
      });
      element.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach(({ name }) => {
          if (/^on/i.test(name) || /^data-(track|gtm|analytics|ga)/i.test(name)) {
            el.removeAttribute(name);
          }
        });
      });
    }
  }

  // tools/importer/transformers/beckman-sections.js
  var MARKER = "data-excat-section-id";
  function findSectionElement(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (let i = 0; i < selectors.length; i += 1) {
      const el = selectors[i] && root.querySelector(selectors[i]);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    const document = element.ownerDocument || payload.document;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const sectionEl = findSectionElement(element, section);
        if (!sectionEl) continue;
        if (i > 0 || section.style) {
          const hr = document.createElement("hr");
          if (section.style) hr.setAttribute(MARKER, section.id);
          sectionEl.parentNode.insertBefore(hr, sectionEl);
        }
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        const metadata = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        if (marker) {
          let end = marker.nextElementSibling;
          while (end && end.nextElementSibling && end.nextElementSibling.tagName !== "HR") {
            end = end.nextElementSibling;
          }
          if (end) end.after(metadata);
          else marker.after(metadata);
          if (i === 0) marker.remove();
          else marker.removeAttribute(MARKER);
        } else {
          const sectionEl = findSectionElement(element, section);
          if (sectionEl) sectionEl.after(metadata);
        }
      }
    }
  }

  // tools/importer/import-software-product-detail.js
  var PAGE_TEMPLATE = {
    "name": "software-product-detail",
    "urls": [
      "https://www.mybeckman.in/flow-cytometry/software/cytobank-enterprise",
      "https://www.mybeckman.in/flow-cytometry/software/cytobank-premium",
      "https://www.mybeckman.in/flow-cytometry/software/kaluza",
      "https://www.mybeckman.in/flow-cytometry/software/kaluza-c"
    ],
    "coverageGaps": [],
    "description": "Breadcrumb trail, product hero (image or gallery beside title, highlights, CTAs and resource links), sticky section tabs, then Features columns, a filterable licence/model table, specifications, content and resources, technical documents and related products",
    "blocks": [
      {
        "name": "product-hero",
        "instances": [
          ".product-spotlight-wrapper .product-intro-wrapper"
        ]
      },
      {
        "name": "page-tabs",
        "instances": [
          "#intrenal-page-link-wrapper"
        ]
      },
      {
        "name": "feature-columns",
        "instances": [
          "#features-wrapper .bc-columns"
        ]
      },
      {
        "name": "product-table",
        "instances": [
          ".product-spotlight-wrapper .CoveoSearchInterface:has(.product-table)"
        ]
      },
      {
        "name": "spec-table",
        "instances": [
          "#product-specification-wrapper .specification-holder"
        ]
      },
      {
        "name": "resource-list",
        "instances": [
          "#product-documentation-wrapper .content-resource-list-wrapper"
        ]
      },
      {
        "name": "technical-documents",
        "instances": [
          "#techdocs-wrapper #coveo-center-column"
        ]
      },
      {
        "name": "related-products",
        "instances": [
          "#related-parts-wrapper .related-parts"
        ]
      }
    ],
    "sections": [
      {
        "id": "s1",
        "name": "Product hero",
        "selector": [
          ".product-spotlight-wrapper .product-intro-wrapper"
        ],
        "style": null,
        "blocks": [
          "product-hero"
        ],
        "defaultContent": []
      },
      {
        "id": "s2",
        "name": "Page tabs",
        "selector": [
          "#intrenal-page-link-wrapper"
        ],
        "style": null,
        "blocks": [
          "page-tabs"
        ],
        "defaultContent": []
      },
      {
        "id": "s3",
        "name": "Features",
        "selector": [
          "#features-wrapper"
        ],
        "style": null,
        "blocks": [
          "feature-columns"
        ],
        "defaultContent": [
          "#features-wrapper h3"
        ]
      },
      {
        "id": "s4",
        "name": "Licenses / Models",
        "selector": [
          "div.product-page-sub-heading-wrapper#product-table-wrapper",
          ".product-spotlight-wrapper .CoveoSearchInterface:has(.product-table)"
        ],
        "style": null,
        "blocks": [
          "product-table"
        ],
        "defaultContent": [
          "div.product-page-sub-heading-wrapper#product-table-wrapper h3"
        ]
      },
      {
        "id": "s5",
        "name": "Specifications",
        "selector": [
          "#product-specification-wrapper"
        ],
        "style": null,
        "blocks": [
          "spec-table"
        ],
        "defaultContent": [
          "#product-specification-wrapper h3"
        ]
      },
      {
        "id": "s6",
        "name": "Content and Resources",
        "selector": [
          "#product-documentation-wrapper"
        ],
        "style": null,
        "blocks": [
          "resource-list"
        ],
        "defaultContent": [
          "#product-documentation-wrapper h3"
        ]
      },
      {
        "id": "s7",
        "name": "Technical Documents",
        "selector": [
          "#techdocs-wrapper"
        ],
        "style": null,
        "blocks": [
          "technical-documents"
        ],
        "defaultContent": [
          "#techdocs-wrapper h3",
          "#coveo-techdocs-more-results"
        ]
      },
      {
        "id": "s8",
        "name": "Related products",
        "selector": [
          "#related-parts-wrapper"
        ],
        "style": null,
        "blocks": [
          "related-products"
        ],
        "defaultContent": [
          "#related-parts-wrapper h3"
        ]
      },
      {
        "id": "s9",
        "name": "Disclaimer",
        "selector": [
          "#related-parts-wrapper + .bc-rich-text"
        ],
        "style": "fine-print",
        "blocks": [],
        "defaultContent": [
          "#related-parts-wrapper + .bc-rich-text p"
        ]
      }
    ],
    "urlPattern": "/*/software/*"
  };
  var parsers = {
    "product-hero": parse,
    "page-tabs": parse2,
    "feature-columns": parse3,
    "spec-table": parse4,
    "product-table": parse5,
    "resource-list": parse6,
    "related-products": parse7,
    "technical-documents": parse8
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
  function createMetadata(main, document) {
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    const labels = document.documentElement.dataset.breadcrumbLabels;
    if (labels) meta["Breadcrumb Labels"] = labels;
    meta.template = PAGE_TEMPLATE.name;
    delete document.documentElement.dataset.breadcrumbLabels;
    if (Object.keys(meta).length) main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
  }
  var import_software_product_detail_default = {
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
      createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(`/sai${rawPath === "" ? "/index" : rawPath}`);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_software_product_detail_exports);
})();
