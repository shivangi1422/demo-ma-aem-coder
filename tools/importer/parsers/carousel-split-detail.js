/* eslint-disable */
/* global WebImporter */

/**
 * Parser for `carousel-split-detail` (GSPANN capability detail carousel).
 * Source: div.capability-carousel > div.capability-carousel-card
 *   .capability-carousel-content: h3, p, .capability-carousel-features (h4 + ul),
 *     .capability-carousel-metrics > .carousel-metric (.carousel-metric-value + .carousel-metric-label)
 *   .capability-carousel-image img (Next.js /_next/image?url=...)
 * Output (xwalk model carousel-split-detail-slide: media_image, media_imageAlt, content_text),
 * one row per slide:
 *   [ <!-- field:media_image --> img | <!-- field:content_text --> H3, p, H4, ul, p(<strong>value</strong> label)... ]
 *
 * The site renders only the active slide into the DOM (the rest are swapped in by JS on
 * "Next capability"). The import script's onLoad clicks through the live carousel and keeps a
 * copy of every slide in .capability-carousel-captured; those are used as-is. For the
 * application-services page, any known slide still missing is filled from FALLBACK_SLIDES.
 * Metrics that link to a case study keep the link on their label.
 */

const SANITY = 'https://cdn.sanity.io/images/l19qdyr5/production/';

const FALLBACK_SLIDES = [
  {
    title: 'Application Modernization',
    image: `${SANITY}d37011006ccd3c16865a0a2a8d368d7ea633d0db-1280x960.jpg`,
    description: 'We modernize your legacy applications through re-engineering, refactoring, or re-platforming to improve performance, reduce technical debt, and prepare your systems for cloud-native operation.',
    list: ['Assessment and Strategy', 'Technology Selection', 'Capabilities Blueprinting', 'Road Mapping', 'Application Re-Engineering', 'Phased Implementation'],
    metrics: [['20+', 'Microservices implementations delivered'], ['400+', 'Engineers across application services']],
  },
  {
    title: 'UI Modernization',
    image: `${SANITY}561dbdd643e2370a0dbe28e400af2594812b4836-1280x960.jpg`,
    description: 'We enhance your user experience with modern design, responsive interfaces, and intuitive navigation built on current JavaScript frameworks and mobile-first principles.',
    list: ['React, Angular, Vue.js, Next.js Development', 'Mobile-First Responsive Design', 'Single-Page Application Architecture', 'BDD/TDD Methodologies', 'Accessibility-Compliant Code', 'Automated UI Testing'],
    metrics: [['180+', 'Dedicated UI engineers'], ['6', 'JS frameworks supported: React, Angular, Vue, Next.js, Backbone, Node.js']],
  },
  {
    title: 'Enterprise Integration',
    image: `${SANITY}cfcfd4882b876a3ec373ba4dd08c2f994ccbf1f3-1280x960.jpg`,
    description: 'We connect your applications and data systems through API design, real-time data integration, and event-driven architectures using both commercial and open-source platforms.',
    list: ['Data Format Conversion', 'Application-to-Application Integration', 'API Lifecycle Management', 'Event Streaming Architecture', 'Open-Source Integration', 'Commercial Platform Implementation'],
    metrics: [['7+', 'Integration platforms supported (MuleSoft, Boomi, Apigee, Tibco, Kafka, NiFi, RabbitMQ)']],
  },
  {
    title: 'Cloud Migration',
    image: `${SANITY}7b2f0b39de5539eff2c1625d7830d081c3c3e33f-1280x960.jpg`,
    description: 'We migrate your on-premises infrastructure to AWS, Azure, or GCP, shifting your cost model from upfront capital expenditure to flexible pay-as-you-go operations.',
    list: ['Infrastructure Migration', 'Platform Migration', 'Data Migration', 'Application Migration', 'Disaster Recovery Planning', 'Automation Identification'],
    metrics: [['3', 'Major cloud platforms: AWS, Azure, GCP']],
  },
  {
    title: 'Application Management',
    image: `${SANITY}c1c157ffbc7dad68337f98b1d5b805999ff2b428-1280x960.jpg`,
    description: 'We manage your application landscape across the full lifecycle, from enhancement and optimization through 24/7 production support, with a commitment to ownership and proactive issue resolution.',
    list: ['Application Enhancement', 'End-to-End Lifecycle Management', '24/7/365 Production Support', 'Performance Optimization', 'Business Process Transformation', 'Composable Architecture Advisory'],
    metrics: [['24/7/365', 'Managed production support coverage'], ['25', 'Current implementation clients']],
  },
];

function cleanImageSrc(src) {
  if (!src) return '';
  const next = src.match(/_next\/image\?(?:.*&)?url=([^&]+)/);
  let url = next ? decodeURIComponent(next[1]) : src;
  if (/cdn\.sanity\.io\/.+\.svg$/i.test(url)) url += '?fm=png&w=400';
  return url;
}

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

/** Read one rendered slide card into the same shape as FALLBACK_SLIDES. */
function readSlide(card) {
  const content = card.querySelector('.capability-carousel-content') || card;
  const img = card.querySelector('.capability-carousel-image img');
  return {
    title: norm(content.querySelector('h3')?.textContent),
    image: img ? cleanImageSrc(img.getAttribute('src')) : '',
    alt: img ? img.getAttribute('alt') || '' : '',
    description: norm(content.querySelector(':scope > p')?.textContent),
    featuresTitle: norm(content.querySelector('.capability-carousel-features h4')?.textContent),
    list: [...content.querySelectorAll('.capability-carousel-features li')]
      .map((li) => norm(li.textContent).replace(/^[•·]\s*/, '')),
    metrics: [...content.querySelectorAll('.carousel-metric')].map((m) => [
      norm(m.querySelector('.carousel-metric-value')?.textContent),
      norm(m.querySelector('.carousel-metric-label')?.textContent),
      m.querySelector('a[href]')?.getAttribute('href') || '',
    ]),
  };
}

function buildRow(slide, document) {
  const imageCell = [];
  if (slide.image) {
    const img = document.createElement('img');
    img.src = slide.image;
    img.alt = slide.alt || slide.title;
    imageCell.push(document.createComment(' field:media_image '), img);
  }

  const text = [];
  if (slide.title) {
    const h3 = document.createElement('h3');
    h3.textContent = slide.title;
    text.push(h3);
  }
  if (slide.description) {
    const p = document.createElement('p');
    p.textContent = slide.description;
    text.push(p);
  }
  if (slide.list && slide.list.length) {
    const h4 = document.createElement('h4');
    h4.textContent = slide.featuresTitle || 'Key Capabilities';
    const ul = document.createElement('ul');
    slide.list.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      ul.append(li);
    });
    text.push(h4, ul);
  }
  (slide.metrics || []).forEach(([value, label, href]) => {
    if (!value && !label) return;
    const p = document.createElement('p');
    if (value) {
      const strong = document.createElement('strong');
      strong.textContent = value;
      p.append(strong);
    }
    if (label && href) {
      if (value) p.append(document.createTextNode(' '));
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      p.append(a);
    } else if (label) {
      p.append(document.createTextNode(value ? ` ${label}` : label));
    }
    text.push(p);
  });

  return [
    imageCell.length ? imageCell : '',
    text.length ? [document.createComment(' field:content_text '), ...text] : '',
  ];
}

export default function parse(element, { document }) {
  // captured copies (all slides, in order) first, then whatever the live DOM still shows
  const seen = new Set();
  const domSlides = [
    ...element.querySelectorAll('.capability-carousel-captured > .capability-carousel-card'),
    ...element.querySelectorAll(':scope > .capability-carousel-card'),
  ]
    .map(readSlide)
    .filter((s) => {
      const key = s.title.toLowerCase();
      if (!s.title || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  // merge: DOM slides win, fallback fills the slides the carousel did not render
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
  // any DOM slide not known to the fallback list (other service pages) keeps DOM order at the end
  byTitle.forEach((s) => slides.push(s));

  // other service pages with a different carousel: use only what the DOM has
  const known = domSlides.some((s) => FALLBACK_SLIDES.some((fb) => fb.title.toLowerCase() === s.title.toLowerCase()));
  const finalSlides = domSlides.length && !known ? domSlides : slides;

  const cells = finalSlides.map((s) => buildRow(s, document));
  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-split-detail', cells });
  element.replaceWith(block);
}
