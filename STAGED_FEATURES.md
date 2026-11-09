# PrismDeck feature status

## Active in the editor

- Remembered-position snapping: previous move/resize bounds become additional alignment guides.
- Reusable custom-shape library: grouped shapes can be saved and reused across slides in the same browser workspace.
- Animation Mode: a distinct full-screen animation workspace separate from presentation editing and presenting.

## Animation Mode — current implementation

The first Animation Mode build includes:
- A frame-based timeline with playback, frame stepping, frame rate, duration, looping and a live playhead.
- Keyframes for every animation layer's position, scale, rotation, opacity and (for rigged characters) joint positions.
- Automatic inbetween evaluation between keyframes using hold, linear, ease-in, ease-out and ease-in-out interpolation.
- Stage selection and dragging, direct transform editing, and draggable character rig joints.
- Local browser project persistence, JSON project export and current-frame SVG export.
- 84 layered vector starter assets: 17 trees, 24 foliage assets, 14 city buildings, 17 original anime/superhero-inspired articulated characters, and 12 everyday human characters.

The named franchise characters requested as references are represented by original archetype designs, not copied official character artwork, symbols or costumes. The library is built from editable vector parts, not flattened character images.

## Still staged and inaccessible

- Bible verse insertion: provider contracts only; no translation source, verse search, insertion UI or multi-verse layout builder.

Do not enable `bibleVerseInserter` without explicit approval.

## Known first-release boundaries

This is the first functional Animation Mode foundation, not feature parity with every professional animation package. It does not yet include audio tracks, lip sync, onion-skin ghosts, motion paths, mesh/shape deformation, per-vector-part timeline tracks, camera rigs, multiplayer collaboration, MP4/GIF encoding, cloud asset sync, or cross-device project sync. Those remain candidates for later releases.

