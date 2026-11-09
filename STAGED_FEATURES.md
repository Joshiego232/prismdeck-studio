# Staged PrismDeck capabilities

This document describes groundwork that is deliberately **not exposed in the editor**. Do not add ribbon actions, Inspector entries, routes, menu items, keyboard shortcuts, presenter controls, or insertion actions for these capabilities until the product owner explicitly authorizes activation.

## Activation switches

All switches live in `src/lib/prism/featureFlags.ts` and must remain `false` until approval:

- `rememberedPositionSnapping`
- `customShapeLibrary`
- `stickFigureAnimationStudio`
- `bibleVerseInserter`

The current editor's existing snapping behavior remains available. Remembered-position alignment guides are not activated yet.

## Remembered-position snapping

The document model now allows an object to retain its last pre-move/pre-resize bounds. The snap-guide utility can combine those remembered bounds with slide edges/centre lines and the current bounds of peer objects. When authorized, a future drag can snap to a line from an object's earlier placement, even after that reference object has moved.

The feature is gated: while `rememberedPositionSnapping` is false, old-position targets are not used and last-position metadata is not written.

## Reusable custom group shapes

The custom-shape domain module can describe a group of shapes as a reusable asset with normalized local geometry. It retains shape kinds, fills, multi-stop gradients, gradient design/angle, strokes, opacity, rotations, text, shadows, blur, and other member styling. Instantiation allocates fresh element IDs and one new shared group ID.

The custom-shape library is gated by `customShapeLibrary`; storage and instantiation remain inactive while the switch is false. The first storage implementation is browser-local only. Cross-device cloud sync is not included.

## Stick-figure animation studio

`src/lib/prism/animation/model.ts` establishes data contracts for articulated rigs (joints and bones), poses, keyframes, interpolation, animation layers, frames-per-second, duration, looping, and canvas settings. Timeline utilities and tests are data-only.

No animation editor, rigging canvas, onion-skin view, playback renderer, audio timeline, export pipeline, route, or slide insertion UI has been built or exposed yet. Those are for the separately authorized major animation project.

## Bible verse insertion

`src/lib/prism/bible/contracts.ts` contains only provider and document contracts: verse references, translation descriptors, verse records, insertion targets, and a provider interface.

No Bible text or translation database is bundled, no external Bible API is connected, and no verse insertion UI or slide template is exposed. Before implementation, requirements must define supported translations, licensing/attribution, reference search, multi-verse layouts, target slide behavior, styling, offline expectations, and church-service presentation needs.

## Activation rule

Do not change these switches to true or expose any corresponding UI until the user explicitly says to activate the relevant feature. The interfaces are preparatory foundations, not a claim that the full animation or church presentation workflows are complete.
