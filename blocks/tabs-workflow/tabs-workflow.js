import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/*
 * Tabs Workflow: an interactive workflow (source: "Interactive Synthetic Biology
 * Workflow"). A row of chevron stage tabs; each clickable stage shows its own
 * panel with a row of chevron steps and a grid of product tiles. The products
 * listed for the active step are shown in colour and enlarged, the others greyed.
 *
 * Authored rows (read in order; steps and products belong to the stage above):
 *   stage:   title | description | state ("stage" or "stage-inactive")
 *   step:    label | state ("step" or "step-inactive")
 *   product: image | product link (link text = product name) | steps | image height
 * Rows are told apart by content, so it works with or without a leading component
 * id cell: a picture = product; the state cell value says stage or step.
 */

const ITEM_IDS = ['tabs-workflow-stage', 'tabs-workflow-step', 'tabs-workflow-product'];
const STATE_RE = /^(stage|step)(-inactive)?$/i;
// selected colours of the clickable stages, in order (red, blue, purple)
const STAGE_COLORS = ['#ea1c2c', '#0d426a', '#6f295b'];

let blockCount = 0;

const norm = (text) => (text || '').replace(/[\u200b\u00a0\s]+/g, ' ').trim();
const key = (text) => norm(text).toLowerCase();

/**
 * Only same-origin, non-SVG images can be optimized; migrated images still point
 * at the source site until uploaded.
 * @param {HTMLImageElement} img
 * @returns {boolean}
 */
function canOptimize(img) {
  const url = new URL(img.src, window.location.href);
  return url.origin === window.location.origin && !/\.svg$/i.test(url.pathname);
}

/**
 * The row's property cells (a leading component id cell from the importer is skipped).
 * @param {Element} row
 * @returns {Element[]}
 */
function cellsOf(row) {
  const cells = [...row.children];
  if (cells[0] && ITEM_IDS.includes(cells[0].textContent.trim())) cells.shift();
  return cells;
}

/**
 * Reads one authored row into a typed item.
 * @param {Element} row
 * @returns {object|null}
 */
function readRow(row) {
  const cells = cellsOf(row);
  const model = row.dataset.aueModel || '';
  const picture = row.querySelector('picture, img');
  const stateCell = cells.find((c) => STATE_RE.test(c.textContent.trim()));
  const state = stateCell ? stateCell.textContent.trim().toLowerCase() : '';
  const textCells = cells.filter((c) => c !== stateCell);

  if (model === 'tabs-workflow-product' || (picture && !state)) {
    const imgCell = cells.find((c) => c.querySelector('picture, img'));
    const link = row.querySelector('a[href]');
    const rest = cells.filter((c) => c !== imgCell && !c.querySelector('a[href]'));
    const heightCell = rest.find((c) => /^\d+(\.\d+)?\s*(px)?$/i.test(c.textContent.trim()));
    const stepsCell = rest.find((c) => c !== heightCell && c.textContent.trim());
    return {
      type: 'product',
      row,
      img: imgCell && imgCell.querySelector('img'),
      href: link ? link.getAttribute('href') : '',
      name: norm(link ? link.textContent : (rest[0] && rest[0].textContent)),
      steps: (stepsCell ? stepsCell.textContent : '').split(',').map(key).filter(Boolean),
      height: heightCell ? parseFloat(heightCell.textContent) : 0,
    };
  }
  if (model === 'tabs-workflow-stage' || state.startsWith('stage')) {
    return {
      type: 'stage',
      row,
      title: norm(textCells[0] && textCells[0].textContent),
      description: norm(textCells[1] && textCells[1].textContent),
      inactive: state === 'stage-inactive',
      steps: [],
      products: [],
    };
  }
  if (model === 'tabs-workflow-step' || state.startsWith('step')) {
    return {
      type: 'step',
      row,
      label: norm(textCells[0] && textCells[0].textContent),
      inactive: state === 'step-inactive',
    };
  }
  return null;
}

/**
 * Splits products into rows of about one tile per step: 10 products / 5 steps =
 * 2 rows of 5; 13 / 6 = rows of 6 and 7; 6 / 6 = one row (as on the source).
 * @param {number} count
 * @param {number} perRow
 * @returns {number[]} tiles per row
 */
function rowSizes(count, perRow) {
  const rows = Math.max(1, Math.round(count / Math.max(perRow, 1)));
  const base = Math.floor(count / rows);
  const extra = count % rows;
  return Array.from({ length: rows }, (_, i) => base + (i >= rows - extra ? 1 : 0));
}

/**
 * A step label with a line break after each "/" (source:
 * "Transformation/<br>Strain Construction").
 * @param {Element} el
 * @param {string} label
 */
function setStepLabel(el, label) {
  label.split('/').forEach((part, i, parts) => {
    el.append(i < parts.length - 1 ? `${part}/` : part);
    if (i < parts.length - 1) el.append(document.createElement('br'));
  });
}

function buildProduct(product, cols) {
  const li = document.createElement('li');
  li.className = 'tabs-workflow-product';
  li.style.setProperty('--tw-cols', cols);
  moveInstrumentation(product.row, li);

  const a = document.createElement(product.href ? 'a' : 'span');
  a.className = 'tabs-workflow-product-link';
  if (product.href) {
    a.href = product.href;
    a.title = 'Click to learn more about the product';
    a.target = '_blank';
    a.rel = 'noopener';
  }

  const media = document.createElement('span');
  media.className = 'tabs-workflow-product-image';
  if (product.img) {
    let picture = product.img.closest('picture') || product.img;
    if (canOptimize(product.img)) {
      picture = createOptimizedPicture(product.img.src, '', false, [{ width: '300' }]);
      moveInstrumentation(product.img, picture.querySelector('img'));
    }
    const img = picture.tagName === 'IMG' ? picture : picture.querySelector('img');
    // decorative: the product name names the link
    img.alt = '';
    img.loading = 'lazy';
    if (product.height) img.style.height = `${product.height}px`;
    media.append(picture);
  }

  const name = document.createElement('span');
  name.className = 'tabs-workflow-product-name';
  name.textContent = product.name;

  a.append(media, name);
  li.append(a);
  return li;
}

export default function decorate(block) {
  blockCount += 1;
  const uid = `tabs-workflow-${blockCount}`;

  // group rows: steps and products belong to the nearest stage above them
  const stages = [];
  [...block.children].forEach((row) => {
    const item = readRow(row);
    if (!item) return;
    if (item.type === 'stage') {
      stages.push(item);
      return;
    }
    if (!stages.length) {
      stages.push({
        type: 'stage', title: '', description: '', inactive: false, steps: [], products: [],
      });
    }
    const stage = stages[stages.length - 1];
    if (item.type === 'step') stage.steps.push(item);
    else stage.products.push(item);
  });

  const scroll = document.createElement('div');
  scroll.className = 'tabs-workflow-scroll';
  const tabs = document.createElement('div');
  tabs.className = 'tabs-workflow-tabs';
  const tablist = document.createElement('div');
  tablist.className = 'tabs-workflow-tablist';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Workflow stages');
  tablist.style.setProperty('--tw-stages', stages.length || 1);
  tabs.append(tablist);

  const tabButtons = [];
  const panels = [];
  let colorIndex = 0;

  stages.forEach((stage, s) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-workflow-stage';
    tab.id = `${uid}-tab-${s}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', 'false');
    if (stage.row) moveInstrumentation(stage.row, tab);
    const title = document.createElement('span');
    title.className = 'tabs-workflow-stage-title';
    title.textContent = stage.title;
    tab.append(title);
    if (stage.description) {
      const desc = document.createElement('span');
      desc.className = 'tabs-workflow-stage-description';
      desc.textContent = stage.description;
      tab.append(desc);
    }
    tablist.append(tab);

    if (stage.inactive) {
      tab.classList.add('is-inactive');
      tab.setAttribute('aria-disabled', 'true');
      tab.tabIndex = -1;
      return;
    }

    const color = STAGE_COLORS[colorIndex % STAGE_COLORS.length];
    colorIndex += 1;
    tab.style.setProperty('--tw-color', color);

    const panel = document.createElement('div');
    panel.className = 'tabs-workflow-panel';
    panel.id = `${uid}-panel-${s}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.style.setProperty('--tw-color', color);
    panel.hidden = true;
    tab.setAttribute('aria-controls', panel.id);

    const steps = document.createElement('div');
    steps.className = 'tabs-workflow-steps';
    steps.setAttribute('role', 'group');
    steps.setAttribute('aria-label', `${stage.title} steps`);
    steps.style.setProperty('--tw-cols', stage.steps.length || 1);
    const stepButtons = stage.steps.map((step) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tabs-workflow-step';
      moveInstrumentation(step.row, button);
      setStepLabel(button, step.label);
      button.dataset.step = key(step.label);
      if (step.inactive) {
        button.classList.add('is-inactive');
        button.setAttribute('aria-disabled', 'true');
      } else {
        button.setAttribute('aria-pressed', 'false');
      }
      steps.append(button);
      return button;
    });

    const products = document.createElement('div');
    products.className = 'tabs-workflow-products';
    let offset = 0;
    const tiles = [];
    rowSizes(stage.products.length, stage.steps.length || 5).forEach((size) => {
      const ul = document.createElement('ul');
      ul.className = 'tabs-workflow-row';
      stage.products.slice(offset, offset + size).forEach((product) => {
        const li = buildProduct(product, size);
        li.dataset.steps = product.steps.join('|');
        tiles.push(li);
        ul.append(li);
      });
      offset += size;
      if (ul.children.length) products.append(ul);
    });

    const activate = (button) => {
      stepButtons.forEach((b) => {
        if (b.classList.contains('is-inactive')) return;
        const on = b === button;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      const stepKey = button.dataset.step;
      tiles.forEach((tile) => {
        tile.classList.toggle('is-active', tile.dataset.steps.split('|').includes(stepKey));
      });
    };
    stepButtons.forEach((button) => {
      if (button.classList.contains('is-inactive')) return;
      button.addEventListener('click', () => activate(button));
    });
    const firstStep = stepButtons.find((b) => !b.classList.contains('is-inactive'));
    if (firstStep) activate(firstStep);

    panel.append(steps, products);
    tabs.append(panel);
    tabButtons.push(tab);
    panels.push(panel);
  });

  const select = (tab, focus) => {
    tabButtons.forEach((t, i) => {
      const on = t === tab;
      t.classList.toggle('is-selected', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
    });
    if (focus) tab.focus();
  };

  tabButtons.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      const last = tabButtons.length - 1;
      let next = -1;
      if (e.key === 'ArrowRight') next = i === last ? 0 : i + 1;
      else if (e.key === 'ArrowLeft') next = i === 0 ? last : i - 1;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = last;
      if (next < 0) return;
      e.preventDefault();
      select(tabButtons[next], true);
    });
  });
  if (tabButtons.length) select(tabButtons[0]);

  scroll.append(tabs);
  block.replaceChildren(scroll);
}
