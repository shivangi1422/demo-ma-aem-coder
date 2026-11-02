# columns

Custom **columns** block. Purpose: fixed set of different content pieces side by side (image | text, text | text, text | video, contact CTAs).

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell per column; a cell holding only a picture is an image column; a cell holding only a link to fast.wistia.net / fast.wistia.com / youtube.com / youtu.be / player.vimeo.com becomes a lazy-loaded video embed; other cells are text (headings, paragraphs, lists, links). Style cta: each cell = lone link (rendered as button) + short paragraph.

## Supported variations

| Variation | Option class |
| --- | --- |
| Call to action (button over text, centered) | `cta` |

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- `classes` select for options: Call to action (button over text, centered).
