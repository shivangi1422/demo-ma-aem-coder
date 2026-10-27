# accordion-toggle

Custom **accordion** block. Purpose: Collapsible one-line toggles (related products, benefit details, featured resources, references, FAQs).

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: one row per item: title (plain text) | content (rich text). Product items in the content: a paragraph that only links to the image file (link text = alt), then the product name (heading or paragraph, usually linked), then an optional link-free description paragraph.

## Supported variations

| Variation | Option class |
| --- | --- |
| Open (all items expanded) | `open` |

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- `classes` select for options: Open (all items expanded).
- A separate `-item` model defines one repeated item.

## Authored structure (Universal Editor / md2jcr)

| Row | Cell 1 | Cell 2 |
| --- | --- | --- |
| one per item (`accordion-toggle-item`) | `title` (text, plain, no `<br>`) | `content` (rich text) |

- Container model `accordion-toggle` holds only `classes` (multiselect **Style**), so every body row is an item.
- `content`: paragraphs, lists, links, buttons (bold or italic link = button). Images can't live in rich text: author a **product item** as
  1. a paragraph that only links to the image file (link text = alt text),
  2. the product name (heading or paragraph, usually a link to the product),
  3. an optional link-free description paragraph.
  Consecutive product items render as a responsive grid; the image links to the same URL as the name. A lone image-file link renders as an image.

## Behaviour and accessibility

- Native `details` / `summary` elements: keyboard (Tab, Enter, Space) and expanded state come from the browser. Closed by default.
- `open` option: all items start expanded (FAQ lists).
