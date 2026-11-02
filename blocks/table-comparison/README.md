# table-comparison

Custom **table** block. Purpose: feature-by-plan comparison rendered as an accessible table with grouped plan headers and included/optional markers.

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: every row has the same number of cells (6 in the UE model); row 1: group headers (first cell empty, a group label followed by empty cells for each further column it spans; optional); row 2: plan names (first cell empty); rows 3+: feature label + one value per plan (● included, ○ optional at additional charge, free text such as 10% Off, or empty).

## Supported variations

| Variation | Option class |
| --- | --- |
| Highlight last column | `highlight` |
| Compact (smaller text, equal-width columns) | `compact` |

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- `classes` select for options: Highlight last column, Compact (smaller text).
- A separate `-item` model defines one repeated item.
