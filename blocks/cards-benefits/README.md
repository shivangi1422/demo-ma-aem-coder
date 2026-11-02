# cards-benefits

Custom **cards** block. Purpose: intro panel beside a list of short benefits, each an icon + bold title + description.

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: row 1: intro cell (H2 + paragraph), optional; then one row per benefit: one cell with a title paragraph (:check-circle: icon token + bold title) and a description paragraph.

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- A separate `-item` model defines one repeated item.
