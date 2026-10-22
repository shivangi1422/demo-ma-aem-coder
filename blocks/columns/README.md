# columns

Custom **columns** block. Purpose: Side-by-side content columns (text, images, video).

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: Columns/rows grid authored in UE (column filter: text, image, button, title). Each cell is rich content. Video cell: optional poster image + a paragraph whose only content is a link to play.vidyard.com/{uuid} (link text = video title, used as the accessible label)..

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- A separate `-item` model defines one repeated item.
