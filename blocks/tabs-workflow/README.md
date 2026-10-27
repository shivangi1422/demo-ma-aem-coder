# tabs-workflow

Custom **tabs** block. Purpose: Interactive process workflow: chevron stage tabs revealing the products for each stage.

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: one row per stage: title (plain text) | image (optional reference + alt) | text (rich text). Empty text and image = disabled stage. In the text, a lead paragraph directly followed by an ordered list = stage subtitle (moved into the stage button) + step chevrons; each product = a paragraph that only links to the image file (link text = alt) followed by the linked product name.

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- A separate `-item` model defines one repeated item.

## Authored structure (Universal Editor / md2jcr)

| Row | Cell 1 | Cell 2 | Cell 3 |
| --- | --- | --- | --- |
| one per stage (`tabs-workflow-item`) | `title` (text, plain, no `<br>`) | `image` + `imageAlt` (optional reference) | `text` (rich text) |

Same content model as `tabs-underline` (no container model). In `text`:

- **Disabled stage**: leave `text` and `image` empty. The stage shows light grey with `aria-disabled="true"` and can't be selected.
- **Stage subtitle + steps**: a lead paragraph directly followed by an ordered list. The paragraph moves into the stage button (under the title, wired with `aria-describedby`); the list renders as a row of grey step chevrons.
- **Products**: for each product a paragraph that only links to the image file (link text = alt), followed by the product name paragraph (a link to the product). Consecutive products form a thumbnail grid with the names below.
- Other paragraphs render as centred text.

## Behaviour and accessibility

- ARIA tabs pattern: `tablist`, `tab`, `tabpanel`, roving tabindex; Left/Right (and Up/Down) arrows, Home and End move between selectable stages; disabled stages are skipped.
- Active stage: brand red `#e81b2b` with white text (4.54:1). Selectable stage: `#e3e3e3` with `#333`. Disabled stage: `#f2f2f2` with `#6b6b6b` (4.8:1).
- Phones: stages stack vertically as down-pointing bars; from 900px they form one row of chevrons.
