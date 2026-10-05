# Alphabet Lab

Alphabet Lab is a small generative typography playground.

The idea is simple: take the alphabet, give it a visual system, and let people mess with it.

Right now there are two styles:

- **Botanical ASCII**, where letters grow out of ASCII characters like stems, leaves, and flowers.
- **Soft Pixel**, an Ambicase Modern interpretation built from hand-charted square tiles that can be resized and moved individually.

Everything is made with **Vite, TypeScript, CSS, and native SVG**. There is no framework and no graphics library.

---

## Running it

You’ll need **Node.js 22.18+** or **Node 24 LTS**, plus npm.

```sh
npm install
npm run dev
```

Then open the local address Vite prints in the terminal.

A few other useful commands:

```sh
npm run build
```

Checks the TypeScript and builds the production version into `dist/`.

```sh
npm run preview
```

Runs the production build locally.

```sh
npm test
```

Runs the unit tests (geometry, reproducibility, migrations, configuration validation, and bounded history).

```sh
npx playwright install chromium
npm run test:browser
npm run test:all
npm run typecheck
```

Browser tests run in desktop Chromium and a mobile Chromium/touch viewport. They cover persistence/migration, repeated letters, selection, drag/cancel, scale/nudge, history, JSON/file/URL portability, SVG downloads, dialogs, focus, rendering reuse, and responsive layout. `test:all` runs unit and browser suites. Screenshots are written to `.qa/`; failure traces go to `test-results/`. Browser binaries are only needed for testing.

---

## What you can do

### Botanical ASCII

This style builds every letter out of actual ASCII characters.

Instead of simply placing random symbols inside a letter shape, the characters follow custom stroke skeletons for A–Z. Stems, branches, leaves, and flowers grow from those structures, so each letter keeps its identity even when things get messy.

You can play with:

- density
- growth
- branching
- flowers
- distortion
- character palette
- seed

The generator is deterministic, so the same seed and the same settings will always produce the same result.

### Use your own ASCII characters

There’s also a character palette field.

Type something like:

```text
.*ox/\
```

and the botanical renderer will build the artwork using those characters instead.

Invisible characters, non-ASCII characters, and duplicates are cleaned up automatically.

Clear the field and the original botanical mix comes back.

Changing the palette only changes what the artwork is drawn with. It does not change the underlying geometry or seed.

---

## Make a word

You don’t have to work with the whole alphabet.

Open **Make a word** and type up to 64 characters: letters, numbers, punctuation, currencies, and ordinary spaces. The app creates one long SVG canvas and updates it as you type. Both styles support the same complete set.

Input is automatically converted to uppercase.

Repeated letters stay independent, so something like:

```text
LETTER
```

really contains two separate Ts. You can edit one without changing the other.

Both visual styles work here, including the shared controls, wind animation, pixel editing, and SVG export.

Your word and any edits you make to it are saved locally, so they survive refreshes and style changes.

Use **All glyphs** or press **Escape** to return to the gallery, arranged as A–Z, Symbols, and Numbers. Spaces have an intentional advance but no visible artwork.

---

## Wind

Botanical ASCII has optional wind animation.

Turn on **Animate wind** and you can control:

- wind intensity
- the direction the wind comes from
- gust speed

Branches and letters bend gently instead of simply moving as one object.

Wind is off by default.

An intensity of zero, or disabling the option entirely, puts the artwork back into its normal still state.

The animation does not affect the seed or generated geometry, so you are still looking at the same underlying letter.

Wind settings are saved along with everything else and are included when copying a configuration.

SVG exports always use the still version.

---

## Soft Pixel

Soft Pixel takes a very different approach.

Each letter is built from individual square tiles with lightly softened corners. Stepped curves, block terminals, and angular counters give the Ambicase-derived forms a stitched-chart character. Those modules are actual editable pieces rather than one finished shape. Corner radius remains adjustable.

Click a module to select it.

Use **Shift + click** to select several.

Click outside the artwork to clear the selection.

Once something is selected, the **Editing scope** decides what your changes affect:

- selected modules
- the current letter
- the entire alphabet

The scale control uses an absolute multiplier. If you select modules that currently have different sizes, the slider displays their average. Moving it gives them all the same new scale.

The other shape controls apply globally.

---

## Moving pixels around

Soft Pixel modules can also be dragged.

This works with a mouse, pen, or touch.

If several modules are selected, dragging one of them moves the whole selection together.

When you’re editing a single letter or a word, you can also nudge focused pixels with the keyboard:

- **Arrow keys** move by 1 unit
- **Shift + Arrow key** moves by 5 units

**Snap to grid (5 units)** in Soft Pixel makes mouse, pen, and touch dragging snap to a 5-unit grid in glyph coordinates. Arrow keys move to the next grid line; Shift moves five grid steps. It starts off for free movement. Enabling it leaves existing artwork in place until you move pixels. The toggle is saved, exported with configurations, and undoable.

Offsets are limited to ±40 glyph units so pixels can’t disappear endlessly into space.

In a focused Soft Pixel glyph, turn **Grid** on to see the authored 32-font-unit chart (4.16 glyph units per cell). Hover an empty cell for a placement outline, then click or tap to add a module. The grid follows the glyph's SVG transform and proportional edit area; it stays out of the gallery, word canvas, and exported artwork. Added modules use the current pixel size, gap, radius, and ink. They stay aligned to chart cells when dragged or nudged, while existing modules retain their free movement and optional 5-unit snap. Manual modules stay precisely placed when jitter is changed.

Use **Delete selected**, **Delete**, or **Backspace** to remove selected modules. **Reset Glyph** restores the current authored glyph, including removed modules, and clears its additions, size overrides, and moved positions. Other glyphs and form settings are preserved. Additions and removals are stored separately from the built-in alphabet, apply to all occurrences of the same glyph (including lowercase aliases), and survive JSON import/export, browser saves, SVG metadata, and undo/redo. Existing per-occurrence size and position overrides in word mode remain supported.

If things get out of hand, **Restore pixel positions** puts the active scope back onto the original grid.

Word editing has its own small inheritance system.

A letter inside a word starts with whatever edits exist on the base alphabet, but once you edit that particular occurrence, it becomes independent.

So if you have:

```text
MOON
```

editing the first O does not automatically edit the second O.

Occurrence IDs use `w@POSITION:LETTER:ROW:COLUMN`, independent of the complete word. Changing or appending other letters preserves edits at unchanged positions. Replacing/removing an occurrence prunes its overrides; inserting letters does not move existing edits to new positions. Undo restores removed edits. This bounds saved edits to the current word rather than accumulating every word ever typed.

Version 1 saves migrate overrides for their saved word; obsolete word variants are discarded. Alphabet overrides and valid parameters are preserved. The storage key remains `alphabet-lab:v1` so existing users are upgraded automatically; the payload is version 2.

---

## Focusing on one letter

Click a Botanical letter to open it on its own.

For Soft Pixel, click the letter label underneath the glyph.

In Soft Pixel focus mode and word mode, **Tab** enters the pixel canvas at a single module. **Alt + Arrow keys** moves focus spatially between modules. **Enter** or **Space** selects. Plain arrows continue to nudge; Shift increases the nudge to 5. Only one module is in the tab order, and focus survives redraws. Instructions and selection status are available to assistive technology.

Hold **Shift** while selecting to add or remove modules from the current selection.

---

## Keyboard shortcuts

A few shortcuts make experimenting faster:

- **Left / Right Arrow** switches between styles
- **R** randomizes the current form
- **Space** generates a new seed
- **H** hides or shows the controls
- **Escape** leaves focus mode or clears the current selection
- **Ctrl/Cmd + Z** undoes; **Ctrl/Cmd + Shift + Z** redoes

App shortcuts are disabled while typing inside inputs or dialogs, preserving native text editing. Undo/Redo buttons remain available for applying history after word/parameter entry.

History holds up to 100 changes in memory, including parameters, randomization, regeneration, movement/scaling, position resets, style reset, word changes, and configuration import. A slider gesture or word typing session is one change; each completed drag is one change. New edits discard redo history. Undo/redo persists the restored state and clears transient selection to avoid dangling IDs. History itself is not stored across reloads.

Buttons also keep their normal keyboard behaviour, so Space still activates a focused button.

---

## Saving your work

Most of the app remembers where you left off.

Each style stores its own:

- parameters
- pixel sizes
- pixel positions

The current word is stored too.

Focus state and selections are intentionally temporary and do not affect the generated artwork.

**Reset** only resets the style you’re currently using.

**Regenerate** and **Randomize** leave manual pixel edits alone.

---

## Configuration portability

**Copy configuration** copies version 2 JSON containing both styles, the active style, word, composition mode, parameters, and pixel overrides. Clipboard failure opens selectable text.

**Import / save configuration** supports paste, JSON upload/download, and share links. Upload loads text for review; **Import JSON** validates and applies it atomically. Errors explain malformed JSON, unsupported versions/styles, invalid parameter types/ranges, and invalid pixel IDs/offsets. Omitted parameters use style defaults; numeric steps and character palettes are normalized. Invalid imports leave your work unchanged. Files are limited to 2 MB.

Version 1 copied configurations and saved-state objects are accepted and migrated. Version 2 contains the complete setup; importing a legacy single-style configuration restores other styles to defaults. Import is undoable.

**Create share link** places a URL in the selectable text field. The configuration lives in the URL fragment, with no server required. Links over 8,000 characters are rejected with guidance to use a JSON file. A supplied link takes precedence over local state on page load; malformed links report an error and retain local state. Reloading a share URL reapplies that shared setup.

---

## Exporting SVG

The artwork can be exported as standalone SVG.

You can export:

- the entire alphabet
- the currently focused letter
- a custom set of letters
- the current word

You can also choose:

- light or dark ink
- transparent or solid background

The exported file keeps the structure editable.

Each letter gets its own SVG group.

Botanical ASCII marks export as vector outlines. Symbols and numbers have their own plant skeletons and drawn marks. No glyph uses SVG text or requires an installed font.

Soft Pixel modules remain separate vector shapes.

The configuration used to generate the artwork is included in the SVG metadata.

Interface-only things like selection outlines and labels are left out.

Alphabet and custom-letter exports use a consistent grid of up to seven columns regardless of your browser window.

Words stay on a single horizontal row and preserve repeated letters and their manually adjusted positions.

---

## Project structure

```text
src/
  main.ts
  types.ts
  state.ts
  history.ts
  persistence.ts
  configuration.ts
  css/
  style.css
  layout.css

  styles/
    index.ts
    glyphs.ts
    botanical.ts
    soft-pixel.ts

  ui/
    controls.ts
    renderer.ts
    word-renderer.ts
    pixel-drag.ts
    pixel-editing.ts
    pixel-navigation.ts
    keyboard.ts
    dialogs.ts

  utils/
    random.ts
    svg.ts
    composition.ts
    export-svg.ts

tests/
  core.test.ts
  browser/editor.spec.ts
```

A rough guide to what lives where:

### `main.ts`

The main app shell.

Handles navigation, interactions, and coordination between the different pieces of state.

### `types.ts`

Shared TypeScript definitions for styles, controls, rendering, and application state.

### `state.ts`

State validation and storage migrations. `persistence.ts` handles debounced writes and page-exit flushing. `history.ts` owns bounded detached snapshots; `configuration.ts` validates portable JSON and creates share links. UI controllers handle dialogs/exports, keyboard commands, pixel movement, and spatial navigation.

`style.css` and `layout.css` import feature modules under `css/` in the original cascade order. There are no runtime framework dependencies; Playwright is a development-only test dependency.

### `styles/`

This is where the actual alphabet systems live.

`glyphs.ts` contains the shared letter skeletons, pixel maps, and stable IDs.

`botanical.ts` contains the Botanical ASCII renderer.

`soft-pixel.ts` contains the Soft Pixel renderer.

`index.ts` registers the available styles.

### `ui/`

UI rendering and interaction code.

This includes the controls, alphabet view, word view, and pixel dragging.

### `utils/`

Smaller shared pieces such as seeded random generation, SVG helpers, word composition logic, and SVG export.

### `tests/`

Tests for things where consistency matters most: geometry, seeded generation, and saved state.

---

## Adding another alphabet style

The project is designed so that more styles can be added without rewriting the rest of the app.

Create a new module inside:

```text
src/styles/
```

and export an `AlphabetStyle`.

At minimum it needs:

- a unique `id`
- display information
- default parameters
- control definitions
- a `renderGlyph(context)` function

Each glyph is rendered into the shared:

```text
0 0 120 150
```

SVG view box.

Try to keep the renderer deterministic.

In other words, rendering the same letter with the same state and seed should give the same result every time.

UI events should stay outside the renderer itself.

The render context already tells the style which letter is being rendered, what its current state is, which elements are selected, and whether focused keyboard interaction is enabled.

If the style supports randomization, it can also implement:

```ts
randomize(random)
```

This should return a safe subset of parameters to change.

For variation between letters, use the provided per-glyph seeded random stream rather than ordinary uncontrolled randomness.

Finally, register the style in:

```text
src/styles/index.ts
```

Once registered, the existing app takes care of navigation, controls, persistence, reset, focus mode, and configuration copying.

---

## A note about editable pixels

The existing `editablePixels` system is specifically designed around the bitmap glyphs in `glyphs.ts`.

Their IDs look like:

```text
LETTER:ROW:COLUMN
```

If you build another style using the same kind of modules, you can reuse that system.

If your new style has a completely different structure, it is better to give it its own editing model rather than trying to force it into the bitmap editor.

---

## State and parameters

Controls currently come in these types:

```text
range
number
text
toggle
select
action
```

Text controls can provide a sanitizer, which is also used when restoring saved state.

Numeric controls define their bounds, step size, and optionally a display unit.

Controls marked with:

```ts
group: 'layout'
```

appear in the shared spacing/layout section.

Each renderer receives a `StyleState` containing:

- parameters
- module scale overrides
- optional position offsets

Word rendering can also provide an instance ID.

A repeated letter might look like:

```text
w@3:L
```

and individual modules extend that ID with their row and column.

This is how the app can tell two copies of the same letter apart.

Control changes render on the next animation frame. Alphabet glyph cells are cached by geometry, relevant overrides, selection, and focus mode. Spacing/row spacing/labels reuse geometry; individual edits rebuild only affected letters. Global form/seed changes still regenerate every glyph because they affect all letters. Text canvases rebuild at most 64 glyphs. Dragging updates transforms directly, without rebuilding artwork. Deterministic random streams are unchanged.

Writes to local storage are debounced as well.

---

## Saved configuration format

```ts
{
  version: 2,
  activeStyle: 'soft-pixel',
  styles: {
    'soft-pixel': { params: { /* typed controls */ }, edits: {}, positions: {} },
    'botanical': { params: { /* typed controls */ }, edits: {}, positions: {} }
  },
  word: 'GROW',
  wordMode: false
}
```

Unknown/incompatible browser storage recovers to defaults. Configuration imports instead report errors. `SoftPixelParameters`, `BotanicalParameters`, and `TypedControl` check defaults and control keys/types at compile time; the shared registry retains a generic boundary for extensible styles.

---

## A few implementation details

The UI uses local sans-serif fonts.

Botanical A–Z preserves its original Courier-shaped ASCII material as stored outlines. Its skeletons, seeded placement, and controls remain unchanged. The new symbols and numbers use separate plant structures. See [symbol design and architecture notes](dev/symbols.md) and the development sheet at `/dev/symbols.html`.

There are no remote fonts or other asset requests.

Animation respects `prefers-reduced-motion`, except when the user explicitly turns wind animation on.

On desktop, the gallery scrolls through A–Z, Symbols, and Numbers while the controls retain their own scrolling area.

On smaller screens, the alphabet flows naturally and the controls move underneath it.
