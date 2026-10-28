# cards-grid

Custom **cards** block. Purpose: Multi-column card grid with an optional heading/intro row; the Style option picks the card treatment.

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: row 0 = heading/intro (rich text; showcase: optional heading + subheading and optional background image, in the heading row or the container Background Image field); rows 1..N = one card each: image cell + rich text cell (title, description, link). video: poster image + paragraph with a link to the video (link text = video title). features/features-purple: card title is a heading or a leading bold-only paragraph; it renders above the icon. products/photo: optional heading row (no image, no link); each card = image cell + text cell (products: optional tag paragraph before the H3 title, description, link-only paragraph for the Learn more link; photo: H3 title, description, link-only paragraph). accent/icons: optional single-cell heading row; each card = image cell (accent: usually empty; icons: the icon) + rich text cell (title = first heading or a leading bold-only paragraph, description, accent: trailing link-only paragraph = pill link).

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
| Products (tagged product cards) | `products` |
| Photo (centred photo cards) | `photo` |
| Accent (text cards, red top border) | `accent` |
| Icons (large icon, title, text) | `icons` |
| Compact (small photo tiles, 4-up) | `compact` |

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- `classes` select for options: Solutions (image + category + link), Product Lines (image + title), Insights (intro + text cards), Simple (4-up: image + tag + title + link), Features (centered, borderless, no image), Features (purple band), Video (3-up video posters, play overlay), Showcase (white cards over background image), Products (tagged product cards), Photo (centred photo cards), Accent (text cards, red top border), Icons (large icon, title, text), Compact (small photo tiles, 4-up). Style is a multiselect: `compact` is combined with `photo`.
- A separate `-item` model defines one repeated item.

## compact option

- **compact** (Compact (small photo tiles, 4-up)), added to `photo`: same content as photo cards; small tiles with a 4:3 cover image and a short bold title, 2-up from 600px, 4-up from 900px (5-up when there are exactly five cards). Used for the mybeckman.in Related Content, AUC application and NGS article tiles.

## accent and icons options

Both use the existing model unchanged (`cards-grid` container: `text` heading/intro + `classes`; `cards-grid-item`: `image` + `imageAlt`, `text`).

- **Heading row**: optional; a single-cell first row (the container `text` field) becomes the heading. It can be left empty.
- **accent** (Accent (text cards, red top border)): leave `image` empty; `text` = title (first heading, or a leading bold-only paragraph), description paragraph(s), optional trailing paragraph that only holds a link = outlined red pill link. White cards with a 4px brand-red top border; 1-up on phones, 2-up from 600px.
- **icons** (Icons (large icon, title, text)): `image` = the icon; `text` = title (heading or bold-only paragraph) + description. No card chrome; icon 64px (80px from 900px) on top, bold centred title, left-aligned text; 1-up, 2-up from 600px, 4-up from 900px.
