# accordion-faq

Custom **accordion-faq** block. Purpose: FAQ list of questions and answers.

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: summary (question, plain text) | text (answer, rich text).

## Supported variations

| Variation | Option class |
| --- | --- |
| Plain (ruled list, no grey bars) | `plain` |
| Open (all answers visible in grey boxes, no toggle) | `open` |

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- `classes` select for options: Plain (ruled list, no grey bars), Open (all answers visible in grey boxes, no toggle).
- A separate `-item` model defines one repeated item.
