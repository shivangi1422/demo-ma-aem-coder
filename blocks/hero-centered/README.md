# hero-centered

Custom **hero** block. Purpose: page-opening banner with a full-bleed photo behind a centered heading, intro text and call to action.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: row 1: background image (with alt); row 2: text cell with H1, intro paragraph and one CTA link.

## Supported variations

- `tall` (Universal Editor Style "Tall (450px)"): hero is at least 450px tall at every width (source `height: 40vh; min-height: 450px`). Default floor is 360px.

On pages with the `service-plans` template the hero follows the source plan-page styling (light H1, 25px subheading, shrink-wrapped content, equal-height solid/outlined buttons); other pages such as /service are unchanged.

## Universal Editor fields

- Content fields derived from the block's decorate contract.
