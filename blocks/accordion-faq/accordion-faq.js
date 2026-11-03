import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * FAQ accordion: grey question bars with a +/- marker, the answer opens below.
 * Items: summary (question), text (answer).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [questionCell, answerCell] = row.children;
    const details = document.createElement('details');
    details.className = 'accordion-faq-item';
    moveInstrumentation(row, details);

    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-question';
    if (questionCell) summary.append(...questionCell.childNodes);
    // the question is authored as plain text; keep inline markup but drop the paragraph
    const p = summary.querySelector(':scope > p:only-child');
    if (p) p.replaceWith(...p.childNodes);

    const answer = document.createElement('div');
    answer.className = 'accordion-faq-answer';
    if (answerCell) answer.append(...answerCell.childNodes);

    details.append(summary, answer);
    row.replaceWith(details);
  });
}
