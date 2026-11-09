# PrismDeck Studio

PrismDeck Studio is a cross-platform presentation editor built with React, TypeScript, TanStack Start, Vite, Tailwind CSS, and Zustand.

## Development

Requirements: Node.js 20+ and Bun (the repository includes `bun.lock`).

```bash
bun install --frozen-lockfile
bun run dev
```

Open the forwarded port shown by Codespaces to preview the app.

## Quality checks

```bash
bun run lint
bun run test
bun run build
```

GitHub Actions runs the same checks on pushes to `main` and feature branches, and on pull requests into `main`.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `F5` | Open the separate presenter window |
| `Shift + G` | Group selected objects |
| `Ctrl/Cmd + Shift + G` | Ungroup selected objects |
| `Shift + K` | Add or edit a hyperlink on selected objects |
| `Ctrl/Cmd + D` | Duplicate selected objects or slides |
| `Ctrl/Cmd + C / V` | Copy and paste objects |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` | Redo |
| Arrow keys | Move selected objects or navigate slides |
| `Shift + Arrow` | Move selected objects by a larger increment |
| `Escape` | Exit presentation or clear selection |

Right-click a slide thumbnail to add a slide after it, duplicate it, or delete it. The duplicate control beside each thumbnail and `Ctrl/Cmd + D` also duplicate the current slide when no objects are selected.

## Slide and object editing

- Use the **Shapes** dropdown on Home or Insert to choose from the shape gallery.
- Drag objects to snap to slide edges/centres and to alignment points on other objects; cyan guides show active alignments.
- Selected objects have eight resize handles. Hold `Shift` while dragging a handle to preserve the original aspect ratio.
- The Inspector's **Slide customisation** tab contains slide-level settings, including automatic advance, visibility, backgrounds, transitions, and speaker notes.
- Backgrounds and shapes support up to six gradient colours, multiple gradient styles, and rotation. Grouped shapes share a gradient field only when every member uses the same gradient settings; otherwise individual colours and gradients are preserved.
- Remembered-position snapping retains an object's previous move/resize bounds as additional alignment guides.
- Save a group of two or more shapes using **Home → Arrange → Save as custom shape**, then insert it from **Insert → Custom library** on any slide. The library is local to the current browser profile and site origin, not cloud-synchronised.
- In **Layers**, grouped objects appear under collapsible group rows. Shift-click adds items to the selection; Ctrl/Cmd-click toggles individual items.

## Animation Mode

Animation Mode is a separate full-screen workspace, independent of slide editing and presenting. It currently includes a frame timeline, playhead, playback controls, transform/joint keyframes, automatic inbetweens, five interpolation modes, object layers, an inspector, local project persistence, and SVG frame / native project export.

The starter vector library includes 84 assets: 17 trees, 24 foliage assets, 14 city buildings, 17 original anime/superhero-inspired rigged characters, and 12 everyday human characters. Character assets use 13-joint rigs; environmental assets are layered vector illustrations. Named franchises are not bundled as official artwork; the hero designs are original archetypes.

## Project structure

- `src/components/prism/` — presentation studio, slide canvas, and inspector
- `src/lib/prism/` — deck model, editor state, projects, fonts, effects, and assets
- `src/components/ui/` — reusable interface components
- `src/routes/` — application routes
- `src/styles.css` — application design system and styling
- `roadmap.md` — development roadmap

## Current baseline

The app stores project documents in browser local storage and uploaded assets in IndexedDB. The separate presenter window uses BroadcastChannel to receive live deck changes from the editor window on the same browser origin. This is same-browser live sync, not cross-device cloud synchronization.

## License

No license has been assigned. All rights remain with the project owner unless a license is added.

## Staged capabilities

Remembered-position snapping and the reusable custom-shape library are active. The pro stick-figure animation workspace and Bible verse insertion remain staged and inaccessible until separately authorized. See `STAGED_FEATURES.md`.
