# Árboris — Product Principles

**Versión:** 0.4  
**Última actualización:** 16 septiembre 2026

## Established purpose

Árboris is a real-world exploration, observation, learning, collection, and assisted-identification experience focused on native Chilean flora.

Its casual experience is primarily a game of exploration and discovery. Its scientific foundation preserves observations, evidence, uncertainty, provenance, and identification history.

Assisted identification is essential to the experience, but it is a means to support trustworthy discovery and learning rather than the whole product.

## Authority and permanence

The following 15 principles are explicit, permanent, non-negotiable product requirements, not preliminary ideas.

They must guide all future architecture, data-model, UX, AI, gameplay, and implementation decisions.

Future features may extend them but must not remove, weaken, reinterpret, or contradict them unless the project owner explicitly decides to change a principle.

## 1. Assisted identification, never blind definitive AI identification

Árboris must not present an AI prediction as an unquestionable identification.

Identification must combine multiple sources of evidence whenever available: photographs, observable botanical characters, geographic location, ecosystem, known distribution, phenology, and other ecological context.

AI models may generate candidates, observe specific characters, prioritize evidence, or assist the user.

They do not constitute taxonomic authority.

## 2. Adaptive taxonomic keys

The identification process should prioritize characteristics already visible in photographs or otherwise present in the observation.

The system should dynamically ask only for additional diagnostic characters that meaningfully discriminate between the remaining candidate taxa.

Question selection should consider not only discriminative value, but also observability, safety, invasiveness, and evidence already available.

## 3. “I don’t know / I can’t observe it” is always a valid answer

Users must never be forced to invent botanical information.

If a character cannot be observed, the system must preserve uncertainty and either continue with other diagnostic characters or maintain multiple candidates.

Automated visual models must also be allowed to abstain when a requested character cannot be observed reliably.

## 4. Evidence and traceability are mandatory

Every identification must preserve the evidence behind it, including photographs, observed characters, identification method, contextual information, quantity and quality of evidence, uncertainty, and confidence where applicable.

The system must preserve enough information to understand how an identification hypothesis was produced and later revised.

## 5. Offline-first architecture from the beginning

Core field functionality must be designed to work without continuous connectivity.

Offline capability is an architectural requirement, not a feature to be added after the product is built.

Synchronization may occur when connectivity becomes available.

The exact on-device inference strategy for visual models remains subject to technical validation.

## 6. Downloadable geographic/ecological packages

Users should eventually be able to download packages for specific areas or ecosystems containing the information required for offline exploration and identification, such as maps, species data, identification resources, and relevant local context.

The final package format does not need to be designed before the pilot demonstrates the core experience.

## 7. Identification must be geographically and ecologically contextual

Candidate species must eventually be filtered, weighted, or interpreted using geographic distribution, ecosystem, habitat, altitude, phenology, and other available environmental information.

A visually plausible species that is ecologically or geographically implausible must not be treated equivalently to a locally plausible candidate when reliable contextual information is available.

## 8. Preserve uncertainty instead of hiding it

Árboris must be capable of returning multiple plausible candidates and explaining why uncertainty remains.

The system must support states equivalent to confirmed, probable, tentative, and unresolved rather than forcing a single answer.

The exact implementation vocabulary may evolve, but the underlying distinction must remain.

## 9. Observations are evidence, not merely records

An observation should preserve enough structured information to be useful later for verification, comparison, research, learning, and improvement of identification systems.

A real-world observation is the underlying source of truth shared by the scientific and game layers.

## 10. Separate species knowledge from individual observations

Canonical taxonomic/species information must be modeled separately from field observations.

Individual observations can contain variation, uncertainty, unusual morphology, environmental context, and identification history without altering the canonical species description.

Scientific species data, observational evidence, and game-character data must remain separate but connected objects.

## 11. Intraspecific variation is a first-class requirement

Árboris must never model a species as having one single “typical appearance.”

Visible morphology can vary with microhabitat, environmental conditions, developmental stage, phenology, and other factors.

The system should represent ranges of variation using multiple examples per species.

Whenever possible, observations and image collections should preserve contextual variables such as exposure, shade/canopy cover, slope, altitude, phenology, microhabitat, and other relevant environmental factors.

This is necessary to distinguish true intraspecific variation from identification errors.

## 12. Identification errors are valuable data

Incorrect or initially ambiguous identifications should not simply disappear.

When appropriate, they should be preserved as traceable identification history because confusion between taxa can reveal useful diagnostic characters and improve future identification workflows.

A later correction should not silently erase the evidence or reasoning that produced the earlier hypothesis.

## 13. Human-readable botanical reasoning

Whenever possible, Árboris should explain why a candidate is suggested or rejected using understandable botanical and ecological evidence.

The goal is not only to produce a name but also to help the user learn how to observe plants.

Technology should act as scaffolding: as users learn, they should progressively become more capable of recognizing flora without depending entirely on automated identification.

## 14. Data provenance must be preserved

Taxonomic information, distribution information, photographs, external datasets, model-generated observations, expert validations, and other imported or generated knowledge must retain their source or provenance.

Future updates must not silently overwrite the origin of scientific information.

Evidence generated by a model must remain distinguishable from evidence supplied by a user or validated by an expert.

## 15. Architecture must preserve future scientific usefulness

Even though Árboris begins as a practical exploration and collection game, its data structures must not unnecessarily destroy information that could later support ecological analysis, population monitoring, temporal comparisons, conservation work, citizen science, or research.

Future scientific usefulness must be preserved without making the casual game experience unnecessarily complex.

## Decision rule for future development

When a proposed feature, architecture decision, AI behavior, UX simplification, gameplay mechanic, or data-model decision conflicts with one of these principles, the principle takes precedence. The conflict must be documented rather than silently resolved by weakening the requirement.

## Canonical botanical authority for Pilot 1.0

The scientific/editorial source of truth for the six-species pilot is:

```text
data/source/Base_botanica_Pokedex_flora_Master_2.0_FINAL.xlsx
```

The Master Botánico 2.0 is the canonical representation of species knowledge for the pilot.

The JSON files in `data/botanical/` and the six species cards in `data/species/` are reproducible derivatives of that source. They may be used by code, AI, UI, documentation, and art-direction workflows, but they must not become independent manually maintained sources of botanical truth.

The current canonical dataset contains 24 botanical characters, of which 19 are active/computable. Retired or pending characters may remain for audit and traceability but must not participate in the identification engine unless explicitly reactivated in the Master.

## Current Pilot 1.0 boundaries

Árboris is currently developing a deliberately constrained pilot consisting of:

- one geographic/ecological pilot context;
- six native species;
- real photographic evidence;
- structured botanical knowledge from Master 2.0;
- assisted identification;
- an adaptive botanical key;
- candidate generation using BioCLIP;
- observation and evidence records;
- discovery and collection mechanics;
- one game character associated with each species;
- a real-world treasure-hunt style exploration loop.

## Current technical state after Hito 15

Master 2.0, the eight canonical botanical JSON files, the six derived species cards and the minimal canonical identification engine are consolidated and validated.

The current backbone is:

```text
Master Botánico 2.0
→ data/botanical/
→ data/species/
→ tools/canonical-identification/
```

The immediate technical priority is Hito 16: restricted automatic extraction of concrete botanical characters from evidence, one character at a time.

The following stage is Hito 17: integration from BioCLIP candidates and visual character observations into the canonical adaptive key.

BioCLIP remains a candidate generator. Visual models may observe requested characters. Neither BioCLIP nor another visual model is allowed to dictate a definitive identification by itself.

The following are not current priorities unless a demonstrated pilot blockage requires them:

- additional species;
- custom classifiers;
- specialized segmentation pipelines;
- custom detectors for every botanical character;
- cloud backend;
- authentication;
- complex synchronization;
- social networks;
- leaderboards;
- large-scale multiplayer systems;
- complex game progression;
- multiple territories.

The pilot should first demonstrate a coherent end-to-end experience:

```text
explore
→ search
→ encounter
→ observe
→ gather evidence
→ identify with assistance
→ discover
→ unlock
→ collect
→ gain a reason to explore again
```

Technical novelty is not a goal by itself.

A new component should enter the architecture only when it solves a demonstrated problem that cannot be addressed adequately by the existing system or a simpler available tool.

These pilot boundaries do not weaken the 15 principles above. They define the current scope in which those principles are being implemented and tested.
