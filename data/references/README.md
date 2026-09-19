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

## Repeatable incorporation command

Reviewed incorporation decisions are executed with:

`npm.cmd run incorporate:reference -- <input.json>`

The command contract is versioned independently as `commandVersion: "1.0.0"`.
It accepts exactly `commandVersion`, `identityDecision`, `existingRefId`, and
`record` at the top level. A `new` record must not provide the REF-managed
fields `refId`, `identityStatus`, or `canonicalRefId`.

The command validates the canonical corpus before acting, delegates REF allocation
and record validation to `incorporateReviewed()` / `validateRefCorpus()`, writes
a canonically serialized temporary file in the corpus directory, validates that
temporary file, replaces the corpus, then reloads and validates the persisted
result before reporting `INCORPORATED REF-###`.

`existing` resolves the active canonical REF without writing the corpus.
`uncertain` performs no write and exits with code 2 for human review. Errors
exit with code 1 and never report incorporation.

V1 is **single-writer**. Concurrent incorporations are not a supported operation.
The local replacement prevents a known-invalid candidate from replacing the
corpus, but V1 does not promise automatic rollback after a replacement has
already completed. Exact V3 artifact preservation and concurrency/locking remain
OPEN.

## Operational verification — REF-002

The first real incorporation cycle was completed on 2026-09-19 using the reviewed
Laysara V3 candidate #2, `Laysara: Summit Kingdom Presskit`.

The initial trial persisted a manually constructed corpus compatible with the
command but did not prove command execution. That limitation was detected during
audit and the trial was corrected before integration. The corrected trial executed
REF Incorporation Command V1 from the canonical pre-state containing only
`REF-001`. The command reported `INCORPORATED REF-002`, persisted `REF-002`
as an active REF, and advanced `nextRefNumber` from 2 to 3.

The corrected HEAD `59e1cfecbd2145b9cde6abf68c129679ea255bce` passed CI #131
and Audit Protocol Check #78/#79. PR #37 was then validated and merged into
`main` as merge commit `726015157d1b07246b463604cc7fe3a09dad5908`.

This verifies the V1 operational path for the tested environment:

`reviewed V3 candidate → NEW decision → incorporation command → REF allocation → persisted corpus → corpus validation → CI → audit → integration`

The verification does **not** close two known limits:

- `registrationProvenance.sourceArtifact` and `sourceRecordNumber` remain
  `null` until the exact V3 source artifact is canonically preserved; no
  provenance identifier or hash may be invented.
- The corrected operational execution was verified in Linux/CI. Windows-specific
  replacement behavior for `fs.renameSync` remains unverified.

These limits do not invalidate the REF-002 incorporation. They remain explicit
OPEN items for future work.
