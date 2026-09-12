# Product principles

## Established purpose

Árboris is a mobile application for exploration, observation, documentation, learning, and assisted identification of native Chilean flora.

## Authority and permanence

The following 15 principles are explicit, permanent, non-negotiable product requirements, not preliminary ideas. They must guide all future architecture, data-model, UX, AI, and implementation decisions.

Future features may extend them but must not remove, weaken, reinterpret, or contradict them unless the project owner explicitly decides to change a principle.

## 1. Assisted identification, never blind definitive AI identification

Árboris must not present an AI prediction as an unquestionable identification. Identification must combine multiple sources of evidence whenever available: photographs, observable botanical characters, geographic location, ecosystem, known distribution, phenology, and other ecological context.

## 2. Adaptive taxonomic keys

The identification process should prioritize characteristics already visible in photographs. The system should dynamically ask the user only for additional diagnostic characters that meaningfully discriminate between the remaining candidate taxa.

## 3. “I don’t know / I can’t observe it” is always a valid answer

Users must never be forced to invent botanical information. If a character cannot be observed, the system must preserve uncertainty and either continue with other diagnostic characters or maintain multiple candidates.

## 4. Evidence and traceability are mandatory

Every identification must preserve the evidence behind it, including photographs, observed characters, identification method, contextual information, quantity and quality of evidence, uncertainty, and confidence.

## 5. Offline-first architecture from the beginning

Core field functionality must work without connectivity. Offline capability must be an architectural requirement, not a feature added later. Synchronization can occur when connectivity becomes available.

## 6. Downloadable geographic/ecological packages

Users should eventually be able to download packages for specific areas or ecosystems containing the information required for offline exploration and identification, such as maps, species data, identification resources, and relevant local context.

## 7. Identification must be geographically and ecologically contextual

Candidate species must be filtered or weighted using geographic distribution, ecosystem, habitat, altitude, and other available environmental information. A visually plausible species that is ecologically or geographically implausible must not be treated equivalently to a locally plausible candidate.

## 8. Preserve uncertainty instead of hiding it

Árboris must be capable of returning multiple plausible candidates and explaining why uncertainty remains. The system must distinguish between confirmed, probable, tentative, and unresolved identifications rather than forcing a single answer.

## 9. Observations are evidence, not merely records

An observation should preserve enough structured information to be useful later for verification, comparison, research, learning, and improvement of identification systems.

## 10. Separate species knowledge from individual observations

Canonical taxonomic/species information must be modeled separately from field observations. Individual observations can contain variation, uncertainty, unusual morphology, environmental context, and identification history without altering the canonical species description.

## 11. Intraspecific variation is a first-class requirement

Árboris must never model a species as having one single “typical appearance.” Visible morphology can vary with microhabitat, environmental conditions, developmental stage, phenology, and other factors.

The system should learn and represent ranges of variation using multiple examples per species. Whenever possible, observations and image collections should preserve contextual variables such as exposure, shade/canopy cover, slope, altitude, phenology, microhabitat, and other relevant environmental factors.

This is necessary to distinguish true intraspecific variation from identification errors.

## 12. Identification errors are valuable data

Incorrect or initially ambiguous identifications should not simply disappear. When appropriate, they should be preserved as traceable identification history because confusion between taxa can reveal useful diagnostic characters and improve future identification workflows.

For example, confusion between Lithraea caustica and Cryptocarya alba can become useful information for designing discriminating questions and explaining similar-looking species.

## 13. Human-readable botanical reasoning

Whenever possible, Árboris should explain why a candidate is suggested or rejected using understandable botanical and ecological evidence. The goal is not only to produce a name but also to help the user learn how to observe plants.

## 14. Data provenance must be preserved

Taxonomic information, distribution information, photographs, external datasets, expert validations, and other imported knowledge must retain their source/provenance. Future updates must not silently overwrite the origin of scientific information.

## 15. Architecture must preserve future scientific usefulness

Even though Árboris begins as a practical flora exploration and identification application, its data structures must not unnecessarily destroy information that could later support ecological analysis, population monitoring, temporal comparisons, conservation work, or research.

## Decision rule for future development

“When a proposed feature, architecture decision, AI behavior, UX simplification, or data-model decision conflicts with one of these principles, the principle takes precedence. The conflict must be documented rather than silently resolving it by weakening the requirement.”

## Current documentation-stage boundaries

- Establish repository structure and documentation before implementing the application.
- Leave the mobile framework undecided at this stage.
- Do not add external dependencies at this stage.
- Treat product behavior not specified by the project owner as an open question, not an accepted requirement.

These stage boundaries do not defer or weaken the 15 requirements above. Detailed workflows, supported platforms, technical choices, and implementation details remain to be defined within those requirements.
