# cards-grid

Custom **cards** block. 

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: row 1: optional heading/intro text; then one row per card: image or icon cell, text cell with linked title (H3/H4) and description.

## Supported variations

| Variation | Option class |
| --- | --- |
| Solutions (image + category + link) | `solutions` |
| Product Lines (image + title) | `productlines` |
| Insights (intro + text cards) | `insights` |
| Simple (4-up: image + tag + title + link) | `simple` |
| Features (centered, borderless, no image) | `features` |
| Products (large image + H3 title + Read More button) | `products` |
| Content List (3-up: bordered 4:3 image, light H3, linked text) | `contentlist` |
| Icon Left (2-up: small icon beside bold title, text, outlined button) | `icon-left` |
| Buttons (red link tiles with white icon) | `buttons` |

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- `classes` select for options: Solutions (image + category + link), Product Lines (image + title), Insights (intro + text cards), Simple (4-up: image + tag + title + link), Features (centered, borderless, no image), Products (large image + H3 title + Read More button), Content List (3-up: bordered 4:3 image, light H3, linked text), Icon Left (2-up: small icon beside bold title, text, outlined button), Buttons (red link tiles with white icon).
- A separate `-item` model defines one repeated item.
