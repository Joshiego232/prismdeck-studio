# PrismDeck feature status

## Active in the editor

- Remembered-position snapping: enabled. Objects retain their previous move/resize bounds as alignment guides for other objects.
- Reusable custom-shape library: enabled. Complete groups of shapes can be saved and inserted on any slide in this browser workspace. Each member retains its own fill, gradient, stroke, opacity, rotation, text and effects.

## Still staged and inaccessible

These capabilities remain deliberately disabled until separately authorized:

- Stick-figure animation studio: data contracts only; no editor, timeline, playback renderer, or export pipeline.
- Bible verse insertion: provider contracts only; no translation source, verse search, insertion UI, or multi-verse layout builder.

The activation switches live in `src/lib/prism/featureFlags.ts`. Only `rememberedPositionSnapping` and `customShapeLibrary` are enabled. Do not enable `stickFigureAnimationStudio` or `bibleVerseInserter` without explicit approval.

## Remembered-position snapping

After a move or resize, PrismDeck stores the object's previous bounds. Other selected objects can align to the current or remembered left, centre, right, top, middle, and bottom guides of unselected peer objects. The dragged object's own previous location is not used as a target during its current drag, avoiding self-snapping.

## Reusable custom shapes

Save a complete group of shape objects from Home → Arrange → Save as custom shape. Insert saved assets from Insert → Custom library. The library is stored in browser local storage and is available across slides in the same browser profile and site origin; it is not cloud-synchronised. Inserting an asset creates fresh object IDs and a new shared group ID while preserving every member's own visual styling.

## Group and Layers behaviour

Layers displays each group as a collapsible parent row. Expand it to inspect and select individual members. Shift-click adds an object to the current selection; Ctrl-click or Cmd-click toggles an object's selection. Clicking a group parent selects the complete group. Group-wide gradients are coordinated only when every member is a shape using the same gradient definition; mixed or differently coloured groups keep each member's own appearance.
