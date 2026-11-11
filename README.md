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

## Ribbon and transition gallery

- The redesigned ribbon uses icon-led tabs, grouped tools, responsive layouts and PrismDeck's own cyan/indigo visual identity.
- The Transitions tab includes animated mini-previews and a full gallery grouped into Subtle, Dynamic and Dramatic effects.
- Hover or focus a transition tile to see its miniature animation and larger preview; choose a tile to apply it to the selected slide.
- Transition timing includes duration and direction, plus Preview and Apply to All actions.
- The Present menu offers **From Beginning** and **From Current Slide**. Keyboard shortcuts follow the same convention: F5 and Shift+F5 respectively.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `F5` | Present from the beginning |
| `Shift + F5` | Present from the current slide |
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

## Presentation design systems

- **Master Slides & Theme Designer** provides reusable title, content, section, minimal and two-column masters. Masters can be applied to one slide or the entire deck, with editable palette, title, accent, footer and slide-number treatments.
- Six presentation theme presets can be applied across solid slide backgrounds and default theme colours.
- **Smart Diagram Builder** creates editable grouped process, timeline, hierarchy, cycle and mind-map diagrams using native slide shapes and connectors.
- The **My Shapes** library supports searchable visual previews, folders, renaming, deletion, click-to-insert and drag-to-slide insertion. The library is saved in browser storage.

## Charts, animation and interaction

- Charts support vertical/horizontal bars, columns, line, area, pie and doughnut styles; chart values can be edited in the Inspector or imported from CSV/tab-separated spreadsheet data.
- Slide animations include additional emphasis/entrance/exit presets, editable order, duration, delay, repeat count, alternate playback, easing, direction and relative custom motion paths.
- Presentation objects can open external links or navigate to the next, previous, first, last or a selected slide during playback.
- The object Inspector provides precise geometry fields, while the contextual toolbar and Arrange ribbon offer alignment and distribution controls. Layers can be reordered by dragging.

## Performance and persistence

- Object and chart rendering is memoized where practical, slide thumbnails use layout containment, and autosave flushes when the tab is hidden or the page is leaving.
- Presentation documents and custom-shape libraries remain browser-local; this release does not claim cross-device cloud collaboration.

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

Remembered-position snapping and the reusable custom-shape library are active. Bible verse insertion remains staged and inaccessible until separately authorized. See `STAGED_FEATURES.md`.


## Editable illustration presets

The Home ribbon's **Insert** group includes a searchable **Illustrations** gallery with more than 60 multicolour designs across Trees, Grass & foliage, Flowers, Planets, Buildings, Landscapes, and Objects.

The botanical collection distinguishes individual species and silhouettes: silver birch, oak, cedar, Scots pine, Norway spruce, silver fir, apple, maple, cypress, coast redwood, giant sequoia, weeping willow, cherry blossom, magnolia, baobab, acacia, date palm, olive, poplar, and dogwood. Separate plant presets cover grass tufts, flowering meadow, cattails, fern, bamboo, wheat, daisy, sunflower, tulip, rose, lavender, hibiscus, bluebells, hydrangea, lotus, and blossom sprigs.

The space collection covers the Sun, all eight major planets, Earth's Moon, and Pluto, with individual surface and atmosphere details. Architecture includes homes, cottages, cabins, glass towers, apartments, Art Deco towers, schools, factories, greenhouses, churches, and townhouses.

Presets are assembled from native PrismDeck shapes—not flattened images. Each illustration is inserted as one group so it can be placed and resized together; use **Ungroup** to edit its leaves, petals, stems, bark, fruit, windows, facade panels, rings, craters, highlights, and other parts. The gallery previews use the same layered colour artwork, and category counts help you browse the growing library.

## Photo & Effects Studio

Select a visual element and open **Quick Edit** or **Photo & Effects Studio** from the Inspector's Photo & visual effects section. Quick Edit provides fast corrections and one-tap looks. The full studio adds Light, Color, Detail, and Effects workspaces with exposure, brightness, contrast, highlights, shadows, blacks, whites, saturation, vibrance, temperature, tint, hue, clarity, sharpness, fade, vignette, glow, shadow, and blur controls.

Adjustments are stored non-destructively with the selected document elements and rendered consistently on images, shapes, text, charts, and video. Older image adjustment values are retained and mapped into the shared adjustment model for compatibility. Multiple selected visual elements can be adjusted together.
