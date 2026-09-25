# Alphabet Lab

Alphabet Lab is a small generative typography playground.

The idea is simple: take the alphabet, give it a visual system, and let people mess with it.

Right now there are two styles:

- **Botanical ASCII**, where letters grow out of ASCII characters like stems, leaves, and flowers.
- **Soft Pixel**, where letters are built from rounded pixel-like modules that can be resized and moved around individually.

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

Runs the geometry, reproducibility, and persistence tests.

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

Open **Make a word** and type up to 16 letters. The app creates one long SVG canvas for the word and updates it as you type.

Input is automatically converted to uppercase.

Repeated letters stay independent, so something like:

```text
LETTER
```

really contains two separate Ts. You can edit one without changing the other.

Both visual styles work here, including the shared controls, wind animation, pixel editing, and SVG export.

Your word and any edits you make to it are saved locally, so they survive refreshes and style changes.

Use **All letters** or press **Escape** to go back to the full alphabet.

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

Each letter is built from individual rounded modules. Those modules are actual editable pieces rather than one finished shape.

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

Offsets are limited to ±40 glyph units so pixels can’t disappear endlessly into space.

If things get out of hand, **Restore pixel positions** puts the active scope back onto the original grid.

Word editing has its own small inheritance system.

A letter inside a word starts with whatever edits exist on the base alphabet, but once you edit that particular occurrence, it becomes independent.

So if you have:

```text
MOON
```

editing the first O does not automatically edit the second O.

Those occurrence-specific edits are remembered even if you change the word and later come back to it.

---

## Focusing on one letter

Click a Botanical letter to open it on its own.

For Soft Pixel, click the letter label underneath the glyph.

In Soft Pixel focus mode, individual modules can also be reached with **Tab** and selected using **Enter** or **Space**.

Hold **Shift** while selecting to add or remove modules from the current selection.

---

## Keyboard shortcuts

A few shortcuts make experimenting faster:

- **Left / Right Arrow** switches between styles
- **R** randomizes the current form
- **Space** generates a new seed
- **H** hides or shows the controls
- **Escape** leaves focus mode or clears the current selection

Shortcuts are disabled while you are typing inside inputs or dialogs.

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

## Copy configuration

**Copy configuration** gives you the current setup as JSON.

For example, the configuration contains:

```text
version
style
parameters
pixelEdits
pixelPositions
word
```

The exact format is currently version 1.

If normal clipboard access isn’t available, the app shows the JSON as selectable text instead.

This is mainly useful for preserving a particular setup or eventually sharing/importing presets.

Importing presets through the UI is not implemented yet.

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

Botanical characters stay as actual text using **Courier New** with a monospace fallback instead of being converted into paths.

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

  utils/
    random.ts
    svg.ts
    composition.ts
    export-svg.ts

tests/
  core.test.ts
```

A rough guide to what lives where:

### `main.ts`

The main app shell.

Handles navigation, interactions, and coordination between the different pieces of state.

### `types.ts`

Shared TypeScript definitions for styles, controls, rendering, and application state.

### `state.ts`

Persistence, state validation, and compatibility with saved configurations.

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
WORD@3:L
```

and individual modules extend that ID with their row and column.

This is how the app can tell two copies of the same letter apart.

Control changes are rendered on the next animation frame rather than immediately hammering the DOM.

Writes to local storage are debounced as well.

---

## Saved configuration format

Copied configurations currently look roughly like this:

```ts
{
  version: 1,
  style,
  parameters,
  pixelEdits,
  pixelPositions,
  word?
}
```

Browser storage keeps the state for all styles together, along with the active word and composition mode.

Older saved states that do not contain words or pixel positions are still supported.

`sanitizeParams` is the main validation boundary for loaded parameters.

Unknown parameters and incompatible storage versions are ignored rather than trusted.

This also gives the project a reasonable foundation for something like URL presets or configuration importing later.

Neither of those is currently exposed in the UI.

---

## A few implementation details

The UI uses local sans-serif fonts.

Botanical ASCII uses **Courier New**, falling back to the browser’s monospace font if necessary.

There are no remote fonts or other asset requests.

Animation respects `prefers-reduced-motion`, except when the user explicitly turns wind animation on.

On desktop, the layout tries to keep the complete alphabet visible while giving the controls their own scrolling area.

On smaller screens, the alphabet flows naturally and the controls move underneath it.