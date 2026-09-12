# Architecture

## Decisions and purpose

Árboris is a mobile exploration and collection game about native Chilean flora. One real-world observation supports both the casual collection experience and scientific use. The [product vision](PRODUCT_VISION.md) and all 15 [product principles](PRODUCT_PRINCIPLES.md) govern this design.

The project owner has now authorized a minimal implementation using Expo, React Native, TypeScript, Expo Router, and SQLite. This supersedes the earlier documentation-only stage boundaries, not any of the 15 permanent principles. No cloud backend, authentication, AI/ML identification, or external service is included.

## How the parts fit together

| Part | Plain-language responsibility |
| --- | --- |
| Expo | Runs and packages the mobile app and provides device capabilities. |
| React Native | Displays the screens and controls on the phone. |
| TypeScript | Checks that code passes the expected kinds of information around. |
| Expo Router | Connects screen files to navigation, such as opening a species card. |
| SQLite through expo-sqlite | Keeps structured information on the device, including after closing the app. |
| Expo ImagePicker and FileSystem | Let users attach photographs and keep durable local copies. |

Use ordinary React state and direct, parameterized SQLite queries. No separate server, ORM, global state library, or service layer framework is needed.

Screens live in src/app. Shared presentation elements live in src/components. Domain types and rules live in src/domain. Local database operations and bundled placeholder content live in src/data. This is one app, not independently deployed systems.

## One observation, different presentations

The observation is the source of truth. Canonical species profiles and area content are separate from field observations. Scientific evidence is never copied into a second game observation dataset.

The collection screen presents discovery state. Observation screens expose the underlying evidence, context, uncertainty, and identification history without requiring a game unlock. Future game rules may derive progress from supported identifications; they cannot rewrite the original observation or canonical species knowledge.

Identification history is append-only. A candidate is not an identification. The four identification states are confirmed, probable, tentative, and unresolved; confidence may be unknown. This scaffold records unresolved observations rather than implementing a pretend identifier.

## First runnable scope and missing content

Bundle one clearly labeled pilot-area placeholder and six numbered species-profile placeholders. They are slots for the already-selected project content, not invented taxa. Names, photographs, distribution, and botanical profiles remain absent until supplied with provenance.

The foundation provides a collection/index, species details, an observation form, photograph attachment, observation review, and local persistence. Field context can be left unknown. No invented diagnostic questions, AI predictions, maps, area-progression rules, or botanical claims are added.

### Unresolved product decision: unlocking

A saved photograph or a user-selected candidate alone does not establish a trustworthy identification. Automatically unlocking a real species on that basis would conflict with principles 1, 4, 7, and 8 and the vision's evidence-based unlocking requirement.

The principles take precedence. The required evidence threshold must be decided by the project owner before real unlocking is enabled. Locked and unlocked presentation states can be represented without claiming that a placeholder is identified. Any interactive demo unlocking requires owner approval and must remain explicitly distinguishable from scientific identification.

## Offline from the beginning

The app reads bundled area/species placeholders, SQLite records, and photographs in the app's document directory. Creating and reviewing observations requires no network request. Photograph paths stored in SQLite are relative to that directory so they survive changes to the application container path.

Database creation and seed loading are transactional and versioned. Future schema changes require migrations that preserve existing records. Observation and identification identifiers are stable and do not depend on a server.

Expo Go is a development preview: initial installation and loading require the development environment. An installed standalone build must be tested separately for cold launch in airplane mode before claiming field readiness. Deleting the app removes its local data; backup and synchronization are not implemented.

Future geographic/ecological downloads can populate versioned local content with source metadata and local assets. No downloader or package format is chosen now. Later synchronization, accounts, or identification tools must work with the existing observation core; no such service is added now.

## Check against all 15 permanent principles

| Requirement | Architectural treatment and current boundary |
| --- | --- |
| 1. Assisted identification | Preserve multiple evidence sources and candidate taxa; no AI or definitive automatic result. |
| 2. Adaptive keys | Structured character evidence retains observation status; future questions must discriminate candidates and prioritize visible evidence. No fabricated key is implemented. |
| 3. Unknown answers | Optional context and explicit unknown/unobservable character responses preserve missing knowledge. |
| 4. Evidence and traceability | Keep photographs, characters, method, context, evidence quantity/quality, uncertainty, and confidence with identification history. |
| 5. Offline-first | SQLite, bundled content, and local photographs are used from the first implementation. |
| 6. Downloadable packages | Separate area/species content with provenance and versioning supports later local packages; downloading remains future work. |
| 7. Geographic/ecological context | Preserve geographic and environmental context. Filtering/weighting awaits real distribution and diagnostic data. |
| 8. Uncertainty | Model all four states, multiple candidates, reasons, and unknown confidence; the scaffold starts unresolved. |
| 9. Observations as evidence | Structured evidence is independent of collection display and remains accessible directly. |
| 10. Species versus observations | Canonical profiles are separate from observations and their candidate history. |
| 11. Intraspecific variation | Keep multiple photographs and contextual variables per observation; canonical profiles are not represented by a single typical image. Variation learning is future work. |
| 12. Identification errors | Preserve historical identification entries instead of replacing earlier judgments. No destructive correction flow is introduced. |
| 13. Botanical reasoning | History has readable reasoning; no invented botanical explanation is shown without knowledge to support it. |
| 14. Provenance | Content versions, photograph origins, user-entered evidence, and identification methods retain source information. Future imports must preserve earlier origins. |
| 15. Scientific usefulness | Preserve structured context, unknown values, timestamps, evidence, and history independently of game progress. |

The selected technologies do not conflict with the principles or vision. The unresolved unlocking policy above is a product dependency, not permission to weaken evidence requirements. This is an extensible foundation, not a claim that adaptive identification, downloadable packages, or the entire MVP is complete.

## Reference documentation

- [Expo project setup](https://docs.expo.dev/get-started/create-a-project/)
- [Expo Router setup](https://docs.expo.dev/router/installation/)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Expo ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Expo FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/)
