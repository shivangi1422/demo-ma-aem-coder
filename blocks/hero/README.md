# hero

Custom **hero** block. Purpose: Page-top hero; the Style option picks the treatment.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: optional image row (image + alt) and a rich text row (heading, subtitle, optional CTA links).

## Supported variations

| Variation | Option class |
| --- | --- |
| Home (background image) | `home` |
| Banner (solid, no image) | `banner` |
| Plain (white, dark text, no image) | `plain` |
| Gradient (banner, white text, image bleeds right) | `gradient` |
| Split (text left, image right) | `split` |
| Split (image left, text right) | `split-left` |
| Left (background image, left-aligned text) | `left` |

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- `classes` select for options: Home (background image), Banner (solid, no image), Plain (white, dark text, no image), Gradient (banner, white text, image bleeds right), Split (text left, image right), Split (image left, text right), Left (background image, left-aligned text).
