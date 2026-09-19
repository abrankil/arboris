# Graphic reference corpus

Persistent metadata for the global Árboris `REF-###` namespace.

## Boundary

A REF identifies a documentary unit. Registration does **not** make a reference evidence, `OBSERVED`, `RECURRENT`, an approved art rule, or authorized input for ASC.

Expected flow:

`collection → incorporation → REF → analysis → authorization → approved Scene Reference Brief → ASC`

## V1

- `graphic_references.json` is the canonical corpus record.
- IDs are global, persistent, monotonic and non-reusable.
- `sourceUrl` is the only current source-locator authority.
- Drive copies, when present, belong in `preservedCopies`; Drive storage does not create authority.
- Documentary identity review is explicit: `existing`, `new`, or `uncertain`.
- Uncertain identity must stop before consuming a REF number.
- Duplicate REFs retain their historical record and point directly to an active canonical REF.
- Collection-internal piece identity, concurrent allocation, exceptional administrative deletion, and independent preserved-copy IDs remain OPEN.
