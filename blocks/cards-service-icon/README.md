# cards-service-icon

Custom **cards** block. Purpose: Icon + h3 + description link cards in a fixed 2-column grid, lift and arrow-move on hover; mobile shows icon and title only.

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: one row per card, one rich-text cell: icon token paragraph (:heroicons-user-plus:), h3 containing the link, description paragraph.

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- A separate `-item` model defines one repeated item.
