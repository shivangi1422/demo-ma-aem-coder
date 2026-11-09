import { moveInstrumentation, unwrapRichtext } from '../../scripts/scripts.js';

/**
 * FAQ accordion: grey question bars with a +/- marker, the answer opens below.
 * Option "open": every item is a box with the question as a heading and the answer
 * always visible (no toggle).
 * Items: summary (question), text (answer).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const open = block.classList.contains('open');
  [...block.children].forEach((row) => {
    const [questionCell, answerCell] = row.children;
    const details = document.createElement(open ? 'div' : 'details');
    details.className = 'accordion-faq-item';
    moveInstrumentation(row, details);

    const summary = document.createElement(open ? 'h3' : 'summary');
    summary.className = 'accordion-faq-question';
    if (questionCell) summary.append(...questionCell.childNodes);
    // the question is authored as plain text; keep inline markup but drop the paragraph
    const p = summary.querySelector(':scope > p:only-child');
    if (p) {
      moveInstrumentation(p, summary);
      p.replaceWith(...p.childNodes);
    }

    const answer = document.createElement('div');
    answer.className = 'accordion-faq-answer';
    if (answerCell) {
      unwrapRichtext(answerCell);
      moveInstrumentation(answerCell, answer);
      answer.append(...answerCell.childNodes);
      // empty paragraphs left where the stored richtext wraps a list in <p> (author instance)
      answer.querySelectorAll(':scope > p').forEach((el) => {
        if (!el.textContent.trim() && !el.querySelector('img, picture')) el.remove();
      });
    }

    details.append(summary, answer);
    row.replaceWith(details);
  });
}
