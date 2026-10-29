# cards-link-tile

Custom **cards** block. Purpose: square link tiles with a title and a description that both link to the same page
(mybeckman.in /service/tech-support support tiles).

## Authoring (Universal Editor)

Model: container `cards-link-tile` with `cards-link-tile-item` items (one rich-text field `text`).

One row per tile, one cell: a linked h4 title and a linked description paragraph (links stay plain links, never buttons).

## Layout

320 x 320px tiles (2px #f0f3f5 border, 40px padding, margin 0 10px 10px 0), centred and wrapping; the tile turns
#f0f3f5 on hover. Tiles grow taller when the copy needs it.

## Supported variations

No variations.
