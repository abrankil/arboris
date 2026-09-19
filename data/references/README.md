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

## Incorporation gate

A persisted REF is not considered successfully incorporated until the resulting
`data/references/graphic_references.json` passes `npm run validate:reference-corpus`.
The canonical `npm test` gate includes this validation.

When incorporation originates from a frozen collection artifact, populate
`registrationProvenance.sourceArtifact` with its stable artifact identifier and
SHA-256 and bind `sourceRecordNumber` to that exact artifact. If the source
artifact has not been preserved in a stable project location, both fields remain
`null`; do not invent a hash or locator. This is valid V1 provenance, but weaker
than artifact-bound provenance and should be upgraded when the source artifact is
canonically preserved.
