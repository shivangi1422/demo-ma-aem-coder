# carousel

Custom **carousel** block. Purpose: Slider of items with an optional heading row; the Style option picks the treatment.

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: row 0 = heading/config (rich text; resources: a bulleted list of filter labels, plus optional heading); rows 1..N = one slide each: image cell (resources: may be left empty for a solid category colour) + rich text cell (resources: first paragraph = category matching a filter label, heading = title, trailing link paragraph = CTA); products: row 0 may be left empty, each slide = image + rich text (heading = title, paragraph = description, trailing link paragraph = 'Learn more' CTA); gallery: row 0 = product text panel (rich text: H1, paragraphs, CTA link, optional bulleted list of #anchor jump links), each slide = image (poster for videos; Vidyard poster used when empty) + rich text (optional play.vidyard.com link = video slide, link text = video title); testimonials: optional single-cell heading row (may be empty), each slide = optional image + rich text (leading bold-only paragraph = name, following italic-only paragraph = role, trailing link-only paragraph = CTA, the rest = quote).

## Supported variations

| Variation | Option class |
| --- | --- |
| Instruments (thumbnail slider) | `instruments` |
| Split (image + text panel) | `split` |
| Resources (filter pills + 3-up card slider) | `resources` |
| Products (4-up product card slider) | `products` |
| Gallery (product hero) | `gallery` |
| Testimonials (quote slides) | `testimonials` |

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- `classes` select for options: Instruments (thumbnail slider), Split (image + text panel), Resources (filter pills + 3-up card slider), Products (4-up product card slider), Gallery (product hero), Testimonials (quote slides).
- A separate `-item` model defines one repeated item.

## testimonials option

Uses the existing model unchanged (`carousel` container: `text` heading + `classes`; `carousel-item`: `image` + `imageAlt`, `text`).

- **Heading row**: optional single-cell first row (may be empty). Without one, the carousel is labelled by the heading right above the block.
- **Each slide**: `image` optional (for example a Customer Spotlight cover, shown beside the text on desktop); `text` =
  1. a bold-only paragraph = name,
  2. an italic-only paragraph = role,
  3. quote paragraph(s),
  4. optional trailing paragraph that only holds a link = CTA (bold link = red button).
- One slide at a time in a light grey card; prev/next arrows at the sides, dots below. No autoplay.
- Accessibility: region with `aria-roledescription="carousel"`; slides are `role="group"` with `aria-roledescription="slide"` and "n of N" labels inside an `aria-live="polite"` container; labelled arrow and dot buttons (`aria-current` on the active dot); Left/Right arrow keys inside the carousel.
