# Botanical-key photographic validation

Local prototype with a user photo experience and a separate internal research mode. Requires Node.js 24 (the repository's declared runtime); no dependency installation or mobile app is needed.

From the repository root:

```sh
node tools/botanical-key-validation/server.mjs
```

Open **http://127.0.0.1:4317** for photo identification. **http://127.0.0.1:4317/validation** preserves the internal dataset workflow. The main page does not link to the internal mode. Stop with Ctrl+C. `PORT` can override the port. Use one evaluator and one assessment tab per server for internal validation; uploaded observations are isolated per browser tab. The server binds only to loopback; `/validation` is a local development mode, not an authenticated production service.

```sh
node --test tools/botanical-key-validation/validation.test.mjs tools/botanical-key-validation/observation.test.mjs
```

## Main experience: uploaded observation

The root route always starts with **¿Qué planta encontraste? → Subir fotografía**. Select one JPG/JPEG, PNG, or WEBP (up to 20 MB). Format signatures and browser image decoding validate the file. Filename and path are never read for identification or displayed. The photograph is shown through a browser object URL, never posted to the server, written to the dataset, renamed, or modified. The only main-mode request is for the six canonical species names from `/catalog`; it contains no individual or photo metadata.

The user supplies the foliar character states; **there is no computer-vision model, automatic character extraction, or automatic photo analysis**. The existing engine in `logic.mjs` is unchanged. The interface provides one question at a time, **No logro verlo**, undo, enlargement, and photograph replacement. Replacing starts a new observation and clears the previous answers. Canceling the file picker or choosing an invalid file preserves the current observation.

Additional photographs are optional and must depict the same plant. A request is offered only for an unknown character that can still discriminate remaining candidates or independently confirm a singleton. Adding a view reopens that unknown question without treating an upload as botanical evidence. Earlier answers stay in the event audit. Extra photographs are not requested just because the engine lacks a discriminatory rule (for example, the Mitique/Colliguay ambiguity).

**Conocer especie** produces a hypothesis from the provided evidence: a sufficiently supported species, ambiguous candidates, or the requested cautious none-of-six message when no candidates remain. A lone candidate without independent confirmation stays ambiguous. A zero-candidate result retains the internal contradiction status and tells users that conflicting answers could explain it; it is not a definitive out-of-pilot classification. No new elimination rules were invented to make this outcome reachable. Evidence summaries quote only characters actually answered, never inferred photo features.

`observation.mjs` separates uploaded photo references, human evidence and audit events, candidate selection, and the final hypothesis. Photos and active evidence live in memory. On reveal, a technical trace without filenames, file paths, or image bytes is stored in browser `sessionStorage` (with an in-memory fallback if storage is blocked), never in validation results. Refreshing loses the active photographs and starts again; session traces are available internally until that tab's session ends. The normal UI has no raw data panel or dataset statistics.

## Internal assessment: /validation

The visual fallback described below applies to the uploaded-photo product flow only; the historical internal validation protocol is unchanged.

### Visual comparison fallback in the main flow

After all useful unanswered questions are exhausted, exactly two remaining candidates trigger **Compara tu planta**. One candidate or more than two never triggers it. Unknown answers count as attempted, unavailable evidence; this fallback does not invent more difficult questions. The user's selected photo remains above two reference cards. Cards show common names only, one full uncropped reference each, and links to enlarge them. Layout changes from two columns to stacked cards on mobile. Choosing neither or skipping is permitted.

A/B adds one unit of explicitly **visual** support to the chosen candidate. It does not eliminate the other candidate, count as an independent diagnostic character, or make an ambiguous result probable. “Ninguna de las dos” records visual rejection and displays “Esta planta no parece coincidir claramente con ninguna de estas dos opciones.” Botanical candidates remain intact; this alone is not an out-of-pilot conclusion. New answers, undo, or added photos invalidate active comparison support while preserving earlier events. Stale comparison support is ignored if the botanical candidate state changes or contradicts it.

The comparison trace stores both species, reference IDs and original photo IDs (filename fallback where metadata has no ID), A/B/none choice, none flag, candidate sets and visual support before/after, timestamp, and final hypothesis. It remains inside the existing session-local technical trace. The main flow additionally requests `/references` and anonymous `/reference/...` images only when the fallback is eligible; user image bytes still never leave the browser.

`references.mjs` defines a versioned, deterministic editorial selection rather than a random or filename-based quality guess. All current diagnostic characters are foliar, so the reviewed leaf view for each species is used. The selected file must resolve inside that species' metadata and have a foliar structure; missing references disable comparison rather than borrowing another species' image. Images are represented as arrays for future multi-view support, but this version sends/displays exactly one per candidate.

| Species | Selected photo | Visual review rationale / limit |
| --- | --- | --- |
| Peumo | `SP001_CA001_hojas_02.jpg` | Large leaf surfaces and margins; some glare and leaf damage remain visible. |
| Litre | `SP002_LC001_hojas_01.jpg` | Close leaves with clear contrasting veins; preferable to the more distant LC004 view inspected. Some surface deposits remain. |
| Bollén | `SP003_KO002_hojas_01.jpg` | Large leaf and visible teeth; avoids the prominent fruits in the inspected KO003 view. |
| Mitique | `SP004_PM002_hojas_01.jpg` | Leaves and toothed margins dominate; no flower used for comparison. |
| Colliguay | `SP005_CO001_hojas_01.jpg` | Leaf surfaces and margins visible; avoids the fruit-centered CO002 image despite its hojas label. |
| Quillay | `SP006_QS001_hojas_02.jpg` | Large leaf views; avoids obstructed, fruit-bearing QS002 view and improves on the smaller QS001_01 view. |

These are practical reviewed foliar exemplars, not proof of species-wide typicality or guaranteed visibility of tiny glands/undersides. Selection does not analyze an upload or infer traits from filenames. No source photograph is transformed or copied.

Start the next plant, explore the large photograph and thumbnails, and answer one question at a time. Click the photograph to enlarge it; the dialog also links to the original resolution. All actions support keyboard navigation, visible focus, and reduced motion preferences. Unknown answers retain every candidate. Undo corrects an accidental answer before saving. No notes field, candidate counts, species IDs, or manual outcome controls appear in the assessment. Press **Conocer especie** to save automatically and reveal the reference. You can finish early; the server records incomplete evidence whenever a useful question remains.

The assessment unit is `(species ID, individualId)`, grouped from `data/species/*.json`; the present dataset has 6 species, 15 individuals, and 45 photographs. Individuals are randomly selected from those not yet assessed. Anonymous UUIDs, generic view labels, anonymous photo URLs, and candidate counts are the only identity-related information returned during assessment. Labels, filenames, and candidate identities remain server-side until completion. The source files are served without copying or changing them. This blinds the interface, not an evaluator who deliberately opens repository files or examines original image metadata.

Finish saves one JSON per individual in `tools/botanical-key-validation/results/` (ignored by Git), then reveals the reference and complete trace. Saved individuals are skipped after restarting. Unfinished answers survive a browser refresh but not a server restart. New records retain an empty notes field for schema compatibility; existing notes are preserved. Results are local research records, not changes to canonical species metadata. Keep separate result directories/archives for independent evaluation rounds; this first version does not provide repeat-assessment management.

## Botanical adaptation and limits

Source: `docs/BOTANICAL_KEY_PILOT.md`, version 1.0, with the field-validation exclusion below. New results retain botanical logic `foliar-conservative-2`, with schema version 3 and outcome policy `automatic-1`; each stores the source key's SHA-256. `logic.mjs` is independent of HTTP, the filesystem, and presentation. It maintains compatible candidates rather than blindly following one dichotomous route. Margin is always first. Subsequent questions minimize the worst-case number of surviving candidates across observable answers, then the sum of survivors; source order breaks ties. Unknown is not used in this scoring and never eliminates candidates. An unspecified species/character relationship is unconstrained, not assumed absent.

**Leaf arrangement is a botanical/descriptive character, excluded from the pilot diagnostic flow. Reason: unreliable visual interpretation from available photographs.** In the first blind assessment, LC002 (*Lithraea caustica*) was interpreted as opposite-leaved and incorrectly eliminated at step 1. Arrangement is no longer asked, scored, ranked, or used to eliminate any species. Descriptive botanical source information remains intact; the master document's branch 1 is not executed by this revised adaptation. The saved LC002 record `0670001f-43c0-475b-8f6a-73ae4502174e.json` remains unchanged as historical evidence. Historical records and summaries retain their original questions and logic version; they are not recalculated under the new rules.

A singleton does not itself terminate question selection: unasked characters with a documented single matching state for that candidate are asked as confirmation checks. A contradicting answer can eliminate it. Probable requires at least two different observed character IDs with explicit matching states; unknown, unconstrained states, and states permitting either alternative do not count. Independent evidence already observed during discrimination can corroborate the final discriminating character (for example, entire margin plus contrasting prominent veins for Litre). A repeated question is not independent evidence. If fewer than two such characters are observable, the server records an ambiguous result. The evaluator no longer selects an outcome. No new characters or botanical state assumptions are introduced for confirmation.

| Question | Source | Photographic treatment |
| --- | --- | --- |
| Arrangement (descriptive only) | Branch 1 | **Excluded**: unreliable visual interpretation from available photographs. No diagnostic use or candidate ranking. |
| Margin | Branches 2–5 | Entire/undulate vs serrate/dentate; Quillay supports either. This combines explicit margin descriptions across branches. |
| Tooth glands | Branch 3a | A visibly absent combination can exclude Bollén; a matching answer cannot identify it. Resinous buds are outside this foliar-only version, so gland-bearing Quillay cannot be excluded by this partial test. |
| Vein contrast/relief | Branch 4 | Differentiates Litre from Peumo/Quillay; other taxa remain unconstrained. |
| Upper/lower surface contrast | Branch 5 | Differentiates Peumo and Quillay; other taxa remain unconstrained. Choose unknown unless both surfaces can be compared. |

No tactile texture, toughness, smell, taste, latex, injury, flowers, fruit, or bud questions are used. Branch 2's leaf shape descriptions overlap and its texture component cannot be established reliably by this visual-only adaptation. Mitique and Colliguay may therefore remain ambiguous. The tool deliberately does not invent an exclusive visual discriminator. These omissions mean this is a **conservative foliar adaptation**, not a complete executable reproduction or validation of every character in the master key. Zero remaining candidates also does not prove an out-of-pilot taxon: contradictory answers or a deficient key are possible.

Unknown answers, candidate history, and automatic evidence-status fields document unavailable evidence and contradictions. Photographic coverage and file labels do not establish independent botanical ground truth. A single candidate is only a proposed probable identification. No recognition, character extraction, or automated image assessment occurs.

## Trace and summary definitions

Automatic status is determined before ground-truth comparison and never uses the reference label to improve the outcome:

| Evidence status | Automatic result |
| --- | --- |
| `supported` | Probable: one candidate, independent confirmation, and no useful unanswered question. |
| `incomplete` | Ambiguous: the evaluator revealed the species while a useful question remained. |
| `insufficient` | Ambiguous: available questions exhausted without enough evidence for a probable identification. |
| `contradictory` | Ambiguous: no compatible candidates remain; this does not establish an out-of-pilot taxon. |

New records store `evidenceStatus`, `endedEarly`, `pendingQuestionId`, `independentConfirmation`, `observableCharacterCount`, and `contradictions` (step and question for elimination of the last candidates), alongside all existing question/candidate histories and ground-truth comparisons. Ordinary elimination of a candidate is not itself an evidence contradiction; incorrect ground-truth elimination remains a separate comparison. Removed client outcome/notes fields are ignored by the server. Historical results are never rewritten.

The result screen prominently shows the common and scientific names, consistency with the real species, named candidates reached, and a short evidence explanation. Exact elimination question/answer, step count, and raw JSON are available inside the collapsed **Ver detalles técnicos** section. The aggregate research summary is also collapsed and hidden during blind assessment.

JSON contains the anonymous ID, reference species, individual ID, original photo references, ordered question text/branch/answer and discrimination/confirmation purpose, before-and-after candidate IDs, unknown characters, independent confirmation character IDs, final key and predicted candidates, outcome, ground-truth retention throughout and at the end, match status, step count, notes, timestamp, and key/logic versions. New `finalPredictedCandidates` and `finalKeyCandidates` preserve the remaining candidates, including an empty set for a contradiction. Match is null for ambiguous and a comparison for probable. Historical none-of-pilot records remain readable without recalculation.

The summary counts saved individuals, correct probable identifications, incorrect probable identifications, ambiguous outcomes, and separately none-of-pilot outcomes. All reference labels are pilot species, so a none-of-pilot outcome is a reference disagreement, displayed separately rather than concealed in accuracy. Ground-truth elimination means it was removed at any diagnostic step, even when the final outcome is ambiguous. Question elimination counts identify the first loss in each monotonic path. Unknown counts are sorted descending. Average steps includes all completed outcomes; there is no success-only denominator.

`server.mjs` owns dataset loading, anonymous access, authoritative assessment state, and persistence. `public/` owns presentation. Tests exercise all possible adaptive answer paths plus dataset counts, anonymous HTTP responses, photo serving, saving/restart, invalid requests, and summary accounting. Tests use a temporary results directory and do not write assessment records to the real dataset or results directory.

