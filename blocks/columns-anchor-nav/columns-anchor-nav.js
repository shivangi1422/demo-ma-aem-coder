const ACTIVE = 'is-active';
const OPEN = 'is-open';

/**
 * Resolves the in-page target of an anchor link. Uses an element with the
 * hash id when one exists; otherwise finds the section whose leading default
 * content (eyebrow/heading) mentions the link label and gives it that id.
 * @param {string} hash e.g. "#services"
 * @param {string} label the link text
 * @param {Element} ownSection the section holding the nav bar
 * @returns {Element|null}
 */
function resolveTarget(hash, label, ownSection) {
  const id = decodeURIComponent(hash.slice(1));
  if (!id) return null;
  const existing = document.getElementById(id);
  if (existing) return existing;
  const word = label.trim().toLowerCase();
  if (!word) return null;
  const sections = [...document.querySelectorAll('main > .section')]
    .filter((section) => section !== ownSection && !section.id);
  const mentions = (el) => el?.textContent.toLowerCase().includes(word);
  // the section eyebrow ("Connect with Us") wins over headings/subtitles mentioning the word
  const match = sections.find((section) => mentions(section.querySelector(
    ':scope > .default-content-wrapper > p:first-child:has(+ h2)',
  ))) || sections.find((section) => [...section.querySelectorAll(
    ':scope > .default-content-wrapper > :is(p, h1, h2, h3)',
  )].slice(0, 3).some(mentions));
  if (match) match.id = id;
  return match || null;
}

/**
 * Wraps the title cell content in an h2 (the source renders the bar title as
 * an H2) unless the author already used a heading.
 * @param {Element} cell the title cell
 * @returns {Element} the heading
 */
function decorateTitle(cell) {
  const existing = cell.querySelector('h1, h2, h3, h4, h5, h6');
  if (existing) {
    existing.classList.add('columns-anchor-nav-heading');
    return existing;
  }
  const heading = document.createElement('h2');
  heading.className = 'columns-anchor-nav-heading';
  const only = cell.children.length === 1 && cell.firstElementChild.tagName === 'P'
    ? cell.firstElementChild : null;
  heading.append(...(only || cell).childNodes);
  if (only) only.remove();
  cell.append(heading);
  return heading;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;
  row.classList.add('columns-anchor-nav-bar');
  const cells = [...row.children];
  const linksCell = cells.find((cell) => cell.querySelector('ul, ol, a')) || cells[cells.length - 1];
  cells.forEach((cell) => {
    cell.classList.add(cell === linksCell ? 'columns-anchor-nav-links' : 'columns-anchor-nav-title');
  });
  if (!linksCell) return;

  const list = linksCell.querySelector('ul, ol');
  if (list) {
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'On this page');
    list.replaceWith(nav);
    nav.append(list);
  }

  // mobile: the title row toggles the link list open/closed (source dropdown)
  const titleCell = cells.find((cell) => cell !== linksCell);
  let setOpen = () => {};
  if (titleCell && list) {
    const heading = decorateTitle(titleCell);
    list.id = list.id || `columns-anchor-nav-list-${[...document.querySelectorAll('.columns-anchor-nav')].indexOf(block)}`;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'columns-anchor-nav-toggle';
    toggle.setAttribute('aria-controls', list.id);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', `${heading.textContent.trim()}: page sections`);
    titleCell.append(toggle);
    setOpen = (open) => {
      block.classList.toggle(OPEN, open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(!block.classList.contains(OPEN)));
    block.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && block.classList.contains(OPEN)) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  const ownSection = block.closest('.section');
  const links = [...linksCell.querySelectorAll('a[href^="#"]')];
  const entries = links
    .map((link) => ({ link, target: resolveTarget(link.getAttribute('href'), link.textContent, ownSection) }))
    .filter(({ target }) => target);

  const setActive = (activeLink) => {
    links.forEach((link) => {
      const on = link === activeLink;
      link.classList.toggle(ACTIVE, on);
      if (on) {
        link.setAttribute('aria-current', 'true');
        // keep the active link visible when the desktop bar scrolls horizontally
        const scroller = link.closest('ul, ol');
        if (scroller && scroller.scrollWidth > scroller.clientWidth) {
          scroller.scrollTo({ left: link.offsetLeft - scroller.offsetLeft, behavior: 'smooth' });
        }
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  // height covered by the fixed header plus this sticky bar
  const stickyOffset = () => {
    const header = document.querySelector('header');
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const bar = ownSection || block;
    return headerHeight + bar.getBoundingClientRect().height;
  };

  entries.forEach(({ link, target }) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(false);
      const top = target.getBoundingClientRect().top + window.scrollY - stickyOffset();
      window.scrollTo({ top, behavior: 'smooth' });
      window.history.replaceState(null, '', link.getAttribute('href'));
      setActive(link);
    });
  });

  if (!entries.length) return;

  // scroll spy: the last section whose top has passed under the bar is active;
  // before the first section the first link stays active (as on the source)
  let ticking = false;
  let current = null;
  const update = () => {
    ticking = false;
    const line = stickyOffset() + 1;
    let active = entries[0];
    entries.forEach((entry) => {
      // sections that are not displayed yet (still loading) have no box
      const rect = entry.target.getBoundingClientRect();
      if (rect.height && rect.top <= line) active = entry;
    });
    if (active.link !== current) {
      current = active.link;
      setActive(current);
    }
  };
  const schedule = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('load', schedule);
  update();
}
