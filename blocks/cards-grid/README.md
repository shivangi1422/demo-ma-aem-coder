# cards-grid

Custom **cards** block. Purpose: Multi-column card grid with an optional heading/intro row; the Style option picks the card treatment.

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: row 0 = heading/intro (rich text; showcase: optional heading + subheading and optional background image, in the heading row or the container Background Image field); rows 1..N = one card each: image cell + rich text cell (title, description, link). video: poster image + paragraph with a link to the video (link text = video title). features/features-purple: card title is a heading or a leading bold-only paragraph; it renders above the icon.

## Supported variations

| Variation | Option class |
| --- | --- |
| Solutions (image + category + link) | `solutions` |
| Product Lines (image + title) | `productlines` |
| Insights (intro + text cards) | `insights` |
| Simple (4-up: image + tag + title + link) | `simple` |
| Features (centered, borderless, no image) | `features` |
| Features (purple band) | `features-purple` |
| Video (3-up video posters, play overlay) | `video` |
| Showcase (white cards over background image) | `showcase` |

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- `classes` select for options: Solutions (image + category + link), Product Lines (image + title), Insights (intro + text cards), Simple (4-up: image + tag + title + link), Features (centered, borderless, no image), Features (purple band), Video (3-up video posters, play overlay), Showcase (white cards over background image).
- A separate `-item` model defines one repeated item.
