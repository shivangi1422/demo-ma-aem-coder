# cards-grid

Custom **cards** block. 

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: image cell | rich-text cell (h4 title linked to the detail page, then description paragraphs; may include a sub-heading, bullet list and italic note). An optional first row without an image holds the heading/intro.

## Supported variations

| Variation | Option class |
| --- | --- |
| Solutions (image + category + link) | `solutions` |
| Product Lines (image + title) | `productlines` |
| Insights (intro + text cards) | `insights` |
| Simple (4-up: image + tag + title + link) | `simple` |
| Features (centered, borderless, no image) | `features` |

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- `classes` select for options: Solutions (image + category + link), Product Lines (image + title), Insights (intro + text cards), Simple (4-up: image + tag + title + link), Features (centered, borderless, no image).
- A separate `-item` model defines one repeated item.
