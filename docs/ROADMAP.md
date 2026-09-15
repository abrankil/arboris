# Roadmap

This roadmap follows the [product vision](PRODUCT_VISION.md), the 15 mandatory [product principles](PRODUCT_PRINCIPLES.md), and the technical direction recorded in [ARCHITECTURE.md](ARCHITECTURE.md).

It describes the current development sequence without committing to release dates. Technical experiments such as `vision_v01`, `vision_v02`, `vision_v03`, and `vision_v04_bioclip` are iterations within enabling capabilities, not separate product phases.

## 1. Product foundations — completed

The core definition of Árboris is established:

- Real-world exploration and collection game focused on native Chilean flora.
- Identification is assisted and evidence-based; AI proposes rather than decides.
- A real-world observation is the shared source of truth for game and scientific experiences.
- Game and scientific presentations remain separate but connected through the same domain model.
- Uncertainty, evidence, context, provenance, variation, and identification history must be preserved.
- The initial MVP is constrained to one pilot geographic/ecological area and six documented native species.
- Offline-first operation is a mandatory architectural requirement.

The product vision, mandatory principles, architecture, data model, functional requirements, graphic direction, and pilot documentation provide the current foundation for development.

## 2. Enabling capabilities — in progress

Before building the complete application experience, Árboris must validate the capabilities required by its core loop.

Current enabling work includes:

- Botanical knowledge and diagnostic characters for the pilot species.
- Photo datasets with provenance and licensing information.
- Assisted computer-vision candidate generation.
- Adaptive botanical discrimination and evidence capture.
- Offline-first data structures and local persistence design.
- Graphic identity, species characters, environments, and discovery/collection assets.
- Rules for separating scientific evidence from ludic presentation.

The BioCLIP benchmark is part of this stage. Its purpose is to evaluate visual candidate generation, not to provide definitive species identification.

## 3. Integrated assisted identification — current priority

The immediate technical/product objective is to validate the first complete assisted-identification pipeline:

**real photo → visual candidates → botanical evidence → diagnostic question when needed → candidate update → traceable identification hypothesis**

The system must preserve uncertainty and allow hypotheses to remain revisable. A photograph, model score, or user-selected candidate alone is not sufficient evidence for a definitive identification.

The first focused integration test should use the difficult discrimination identified in the six-species BioCLIP benchmark, particularly Quillay, Peumo, and Litre.

This provides a useful test of whether visual candidates and botanical evidence improve one another.

### Exit criteria

- A real pilot photograph can enter the pipeline.
- The vision component returns ranked candidate taxa rather than a definitive answer.
- Árboris can select or request a useful diagnostic botanical character.
- User answers can include “I don't know / I can't observe it” without forcing a false conclusion.
- Candidate hypotheses update from accumulated evidence.
- The resulting hypothesis retains evidence, uncertainty, method, and history.
- The process works without requiring network connectivity once required local resources are available.

## 4. Pilot vertical slice — next milestone

Once integrated identification is working, build one minimal but complete playable path through Árboris:

**explore → observe → photograph → investigate/identify → gather sufficient evidence → discover → unlock → species card/collection → character/reward**

The vertical slice should initially prove the experience with one pilot species before expanding breadth.

Its purpose is not to demonstrate every planned feature. It must answer whether the defining Árboris loop is understandable, scientifically responsible, technically viable, and enjoyable enough to motivate another real-world exploration.

Evidence-based unlocking must be explicitly defined before this milestone is considered complete.

Scientific identification and game unlocking may be related, but they must not be silently treated as the same state.

## 5. Árboris MVP 0.1 — after vertical-slice validation

Expand the validated vertical slice to the complete initial pilot universe: one geographic/ecological area and six documented native species.

### MVP scope

- Species collection.
- Undiscovered/discovered state.
- Field observations.
- Photographs and associated context.
- Assisted identification.
- Evidence-based unlocking.
- Species cards and scientific information.
- Collection progress.
- Character/reward layer connected to discoveries.
- Local persistence and offline field use.

MVP validation must include real field testing.

The pilot should demonstrate that users can encounter native plants, document observations, investigate identity with assistance, unlock discoveries under defined evidence rules, and continue exploring.

The underlying observation records must remain scientifically useful independently of the game presentation.

## Beyond MVP 0.1

Future expansion may include additional geographic/ecological packages, more species, richer character and game systems, advanced scientific tools, synchronization, and other services.

These are not current implementation commitments.

Downloadable geographic/ecological packages remain an eventual mandatory capability under the product principles.

Social networks, leaderboards, competitive mechanics, complex achievements, cloud synchronization, and other large systems should not be added merely because they are common in games. They require separate product decisions after the core loop has been validated.

## Current position

**Product foundations ✓ → Enabling capabilities ◐ → Integrated assisted identification ← CURRENT → Pilot vertical slice → MVP 0.1 → Expansion**