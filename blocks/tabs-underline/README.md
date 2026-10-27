# tabs-underline

Custom **tabs** block. Purpose: Product detail tabs (e.g. Overview / Features / Specifications / Resources) with one panel per tab.

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: One row per tab item: title (plain text) | image (optional reference + alt) | text (rich text: headings, paragraphs, lists). Accessible ARIA tabs pattern (tablist/tab/tabpanel, arrow/Home/End keys). In the text, a paragraph holding only a play.vidyard.com link becomes an inline video (an image-only paragraph right before it is used as the poster). A paragraph holding only a link to an image file (.png/.jpg/.webp/...) is rendered as that image, with the link text as alt — use this for extra images, since rich text can't hold images in Universal Editor. A URL hash or in-page link matching the slug of a tab title (#overview, #specifications, ...) activates that tab and scrolls to the block..

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- A separate `-item` model defines one repeated item.
