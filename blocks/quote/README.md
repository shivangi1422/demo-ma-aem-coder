# quote

Custom **quote** block. Purpose: Pull quote / testimonial with optional attribution.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: row 1 = quote (rich text); row 2 = attribution (plain text, optional; omitted when empty). Style select (classes) picks the option. testimonial: the attribution is split into lines on line breaks, or on commas when there are none. testimonial-purple: the attribution is split on line breaks only (no comma fallback, since organizations contain commas)..

## Supported variations

| Variation | Option class |
| --- | --- |
| Banner (dark band, upright white text) | `banner` |
| Testimonial (large quotation marks, multi-line attribution) | `testimonial` |
| Testimonial (purple band) | `testimonial-purple` |

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- `classes` select for options: Banner (dark band, upright white text), Testimonial (large quotation marks, multi-line attribution), Testimonial (purple band).
