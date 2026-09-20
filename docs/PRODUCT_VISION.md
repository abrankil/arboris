# Árboris Product Vision

Árboris is primarily a real-world exploration and collection game focused on native flora.

Its core experience is inspired by the collection and discovery loop of games such as Pokémon Go and the Pokédex concept, but applied to real native biodiversity.

The casual user's main motivation is not botanical identification itself. The motivation is exploration, discovery, collection, progression, and completing the native flora associated with real geographic areas and ecosystems.

## Core casual-user loop

The fundamental gameplay loop is:

Explore a real area
→ encounter a plant
→ observe and photograph it
→ use assisted identification
→ gather sufficient evidence
→ identify/discover the species
→ unlock it in the user's collection
→ access its species card and knowledge
→ continue exploring to find missing species.

For Pilot 1.0, this loop is intentionally focused: the player receives a target species, consults its guide, explores for a candidate leaf, captures one complete leaf through a guided oval, marks the leaf–branch junction, and verifies the result against the six-species pilot library. The system must answer whether the scanned leaf corresponds to the target species; it is not a general-purpose plant identifier.

Species should initially appear as undiscovered when appropriate.

Collections can be associated with geographic areas, habitats, or ecosystems. As users explore new areas, new groups of native species can become available to discover.

Progress can therefore be expressed through concepts such as:

- species discovered / species available in an area;
- completion of geographic or ecological collections;
- new areas explored;
- unresolved discoveries;
- species still to be found.

For the initial MVP, the complete playable universe consists of ONE pilot area and SIX already-documented native species.

The objective of this MVP is not to maximize the number of species. It is to validate the complete exploration → observation → assisted identification → discovery → collection loop.

## Scientific layer

Árboris must simultaneously support a different use case for researchers, naturalists, and advanced users.

The same underlying observation that produces a discovery for a casual player must preserve scientifically useful information, including where applicable:

- photographs;
- coordinates and geographic context;
- date/time;
- botanical characters;
- phenology;
- habitat and microhabitat;
- environmental context;
- identification evidence;
- candidate taxa;
- uncertainty and confidence;
- identification history;
- provenance.

The scientific user does not need the gamified presentation in order to access and work with these records.

## Critical architectural principle: science and game must be separated

Gamification and scientific data must be separate layers built over a shared domain model.

Do NOT create separate scientific observations and game observations.

A real-world observation is the underlying source of truth.

The game layer may interpret a sufficiently supported observation as a discovery, unlock, collection entry, progress event, or achievement.

Pilot 1.0 keeps the game result deliberately simple: an incorrect candidate returns “Incorrecto. Sigue intentando.”; a verified target returns “¡Correcto!” and unlocks the species and its library. Internal candidates and uncertainty remain available to the scientific and diagnostic layers without overloading the mission interface.

These messages describe outcomes after evidence evaluation. Insufficient or unobservable evidence must instead preserve the observation and request a useful character or remain unresolved; it must not be translated into “Incorrecto” or “¡Correcto!”. The Python integration currently produces experimental hypotheses, not a validated target-verification or unlocking decision. See the [integration checkpoint](INTEGRATION_2026-09-15.md).

The scientific layer exposes the underlying evidence and structured observation data.

Conceptually:

Casual experience
(collections, discoveries, unlocks, progression)
                 \
                  → Shared domain core
                 /
Scientific experience
(observations, evidence, provenance, uncertainty)

This separation is mandatory because future changes to game mechanics must not corrupt scientific records, and scientific requirements must not make the casual exploration experience unnecessarily complex.

## Identification is a means, not the product

Assisted identification is essential to Árboris, but Árboris must not be designed as merely a plant-identification utility.

Identification exists primarily to support trustworthy discovery, learning, documentation, and scientific usefulness.

The product should not drift into becoming a generic “take a photo and receive a species name” application.

## Learning through play

The game should progressively teach users to observe native flora.

Assisted identification should expose meaningful visible characters and ecological clues instead of hiding all reasoning behind AI.

The player should gradually become better at recognizing plants through exploration.

## Adopted gameplay interaction rule

The gameplay layer follows **observe → interpret → unlock**. Encounters begin with visible botanical or environmental evidence, let the player form or refine an interpretation, and produce a clear consequence such as new evidence, fewer candidates, a species card, a discovery, or progress. Alternative routes are allowed when they arise from different available evidence, but uncertainty and the original observation must remain intact. The detailed system rules are in [gameplay systems direction](GAMEPLAY_SYSTEMS_DIRECTION.md).

## MVP scope

Version 0.1 should remain intentionally small:

- one pilot geographic/ecological area;
- six native species already selected and documented;
- species collection;
- undiscovered/discovered state;
- field observation;
- photographs;
- assisted identification;
- evidence-based unlocking;
- species cards;
- collection progress.

The Pilot 1.0 acquisition protocol is also part of the MVP boundary: one dominant, complete and centered leaf per capture; quality control before acceptance; user-marked leaf–branch junction; segmentation, orientation and foliar character extraction; adaptive diagnostic questions only when needed. Flowers, fruits, bark, arbitrary plant recognition and systematic adaxial/abaxial capture remain outside 1.0.

Pilot 1.0 also includes an exploration-companion layer: after receiving a target mission and clues, the user walks toward a plausible real-world destination while the phone detects movement and animates a looping procedural pixel-art environment with optional environmental clues, related species, and lightweight observation activities. This layer gives the user something meaningful to do during the journey; it never counts movement or a visual appearance as botanical evidence. The user decides when to open the scanner, and only validated foliar evidence unlocks the target species. See [Pilot 1.0 exploration companion](PILOT_1_0_EXPLORATION_COMPANION.md).

Do not add social networks, leaderboards, competitive mechanics, complex achievements, cloud synchronization, or other large systems merely because they are common in games.

Those are future product decisions.

First prove that finding a real native plant and unlocking it in Árboris is useful, understandable, scientifically responsible, and fun.

## Relationship to mandatory product principles

The 15 [product principles](PRODUCT_PRINCIPLES.md) remain permanent, non-negotiable requirements. This vision extends the product definition without weakening them. Their decision rule governs conflicts in future development.
