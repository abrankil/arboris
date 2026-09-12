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

Do not add social networks, leaderboards, competitive mechanics, complex achievements, cloud synchronization, or other large systems merely because they are common in games.

Those are future product decisions.

First prove that finding a real native plant and unlocking it in Árboris is useful, understandable, scientifically responsible, and fun.

## Relationship to mandatory product principles

The 15 [product principles](PRODUCT_PRINCIPLES.md) remain permanent, non-negotiable requirements. This vision extends the product definition without weakening them. Their decision rule governs conflicts in future development.
