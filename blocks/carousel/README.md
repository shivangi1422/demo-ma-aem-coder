# carousel

Custom **carousel** block. Purpose: Slider of items with an optional heading row; the Style option picks the treatment.

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: row 0 = heading/config (rich text; resources: a bulleted list of filter labels, plus optional heading); rows 1..N = one slide each: image cell (resources: may be left empty for a solid category colour) + rich text cell (resources: first paragraph = category matching a filter label, heading = title, trailing link paragraph = CTA).

## Supported variations

| Variation | Option class |
| --- | --- |
| Instruments (thumbnail slider) | `instruments` |
| Split (image + text panel) | `split` |
| Resources (filter pills + 3-up card slider) | `resources` |

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- `classes` select for options: Instruments (thumbnail slider), Split (image + text panel), Resources (filter pills + 3-up card slider).
- A separate `-item` model defines one repeated item.
