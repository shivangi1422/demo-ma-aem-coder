# hero

Custom **hero** block. Purpose: Hero / promo banner with heading, tagline and CTA.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: Row 1: optional image (image + imageAlt). Row 2: richtext (heading, tagline paragraph, CTA link). Style select adds the option class.

## Supported variations

| Variation | Option class |
| --- | --- |
| Home (background image) | `home` |
| Banner (solid, no image) | `banner` |
| Plain (white, dark text, no image) | `plain` |
| Gradient (banner, white text, image bleeds right) | `gradient` |
| Split (text left, image right) | `split` |
| Split (image left, text right) | `split-left` |

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- `classes` select for options: Home (background image), Banner (solid, no image), Plain (white, dark text, no image), Gradient (banner, white text, image bleeds right), Split (text left, image right), Split (image left, text right).
