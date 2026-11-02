# marketo-form

Custom **marketo-form** block. Purpose: embedded Marketo lead form (contact / training enquiry).

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell: link (or plain text) to the Marketo form endpoint https://{host}/index.php/form/getForm?munchkinId={id}&form={formId}.

## Supported variations

| Variation | Option class |
| --- | --- |
| Two column (labels beside fields, on a grey band) | `two-column` |

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- `classes` select for options: Two column (labels beside fields, on a grey band).
