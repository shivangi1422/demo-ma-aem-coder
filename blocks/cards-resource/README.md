# cards-resource

Custom **cards** block. Purpose: list of downloadable documents (Content and Resources): file icon or thumbnail beside the document title link.

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: image (optional thumbnail; a document icon is shown without it, PDF style for .pdf and /gated-media links) | text (title link, optional description).

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- A separate `-item` model defines one repeated item.
