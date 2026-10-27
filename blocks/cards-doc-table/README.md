# cards-doc-table

Custom **cards** block. Purpose: Table of technical documents (linked title, type, doc id, lot numbers).

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: linked title | document type | doc id | lot number(s). An optional first row with one cell holds comma-separated column headings (default: Title, Document Type, Doc Id, Lot Number(s)).

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- A separate `-item` model defines one repeated item.
