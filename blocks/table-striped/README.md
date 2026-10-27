# table-striped

Custom **table** block. Purpose: Data table with a header row.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: row 1 = column headers, rows 2..N = data rows; 2-4 cells per row (rich text: em, sup, links). Columns empty in every row are dropped.

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.

## Authored structure (Universal Editor / md2jcr)

| Row | Cell 1 | Cell 2 | Cell 3 | Cell 4 |
| --- | --- | --- | --- | --- |
| first row = header (`table-striped-row`) | `column1` | `column2` | `column3` (optional) | `column4` (optional) |
| data rows (`table-striped-row`) | `column1` | `column2` | `column3` (optional) | `column4` (optional) |

- No container model: every row is a `table-striped-row` item with up to four rich-text cells (em, sup and links allowed). md2jcr maps a 2-cell row to `column1` and `column2`.
- Columns that are empty in every row are dropped, so a 2-column table renders 2 columns even though Universal Editor stores 4 fields.

## Behaviour and accessibility

- Header cells are `th` with `scope="col"`; the nearest heading above the block becomes a visually hidden `caption` and the label of the focusable horizontal-scroll region.
- Header: white bold text on brand red `#e81b2b` (4.54:1). Body rows are zebra striped (`#f5f5f5`). Tables with 3 or 4 columns keep a 540px minimum width and scroll sideways on phones.
