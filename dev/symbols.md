# Symbols and numbers

Both styles support exactly the same 32 punctuation/currency symbols, 0-9,
and ordinary space, in addition to A-Z. The shared repertoire and safe ID
encoding live in `src/styles/characters.ts`. ASCII lowercase input retains the
existing uppercase normalization. Text is limited to 64 supported characters.

```
. , : ; ! ? ' " - – — _ ( ) [ ] { } / \ & @ # % + = * < > $ € £
0 1 2 3 4 5 6 7 8 9
```

`soft-pixel-symbols.ts` contains authored full-cell charts, with the same 32-unit
pitch as the handmade Ambicase letters. Thin strokes occupy complete cells.
Punctuation uses body-relative heights; commas descend, quotes sit high, and
brackets extend beyond the body. Ampersand loops, the at-sign enclosure, percent
counters, and currency details are separately charted. Widths are proportional;
hyphen, en dash, and em dash have different advances and visible lengths.

`botanical-symbols.ts` contains independent plant skeletons and bud locations.
`botanical-symbol-renderer.ts` grows drawn ASCII-like stems, leaves, seed marks,
and flowers along those structures. Small punctuation has restrained growth;
counter-bearing signs use limited growth to stay legible. Density, growth,
flowers, branching, distortion, custom ASCII palette, seed, scale, line height,
and wind participate without changing the underlying character identity.
Symbols use proportional widths; existing Botanical A-Z keeps its 120-unit
advance. Space is 48 units in Botanical and 260 font units plus the usual
padding/scale in Soft Pixel, with no visible artwork or editable modules.

## Font-independent Botanical artwork

The existing A-Z skeletons, random calls, mark placement, size, opacity, and
rotation are unchanged. The tiny Courier New ASCII marks they previously drew
as SVG text are now stored as centered vector outlines in `botanical-marks.json`.
The font is not shipped or loaded by the application. This also preserves the
entire visible ASCII custom palette for both letters and new symbols. Runtime
glyph SVGs and exports contain paths or tile rectangles, never SVG text.
Browser font hinting may produce slightly different antialiasing from paths.
A 20-font-unit outline (about 0.14px at the usual mark size) compensates for
lost small-font hinting so the existing letter material remains readable.
The conversion was checked against the previous renderer for all 26 letters
with both the default material and a custom ASCII palette: all mark identities,
positions, sizes, rotations, and opacities matched across 52 comparisons.

To regenerate the existing ASCII material offline:

```
node scripts/extract-botanical-marks.mjs path/to/cour.ttf
```

This is independent of the authored symbol skeletons. Do not substitute a
browser-rendered punctuation character for a symbol skeleton.

## IDs, persistence, gallery and export

Legacy letter IDs stay unchanged. Symbols and digits use canonical codepoint
tokens, e.g. `u003a:14:2` for a colon module and `w@0:u0040:7:6` for a word's
at-sign module. Encoded tokens prevent colons, quotes, backslashes, and @ from
colliding with delimiters, CSS selectors, or export IDs. Word positions are
0-63. Existing version-1 and version-2 projects remain supported. JSON and URL
serialization preserve spaces, punctuation, and occurrence-specific edits.

The gallery shows A-Z, Symbols, then Numbers. Desktop specimens scroll through
the sections. Every visible glyph can be focused; Soft Pixel symbols keep
selection, dragging, grouped editing, keyboard nudging, and undo. Export offers
alphabet, symbols, numbers, custom glyphs, focused glyph, or the current text.
Live text and export share the same advance calculation, including spaces.

## Review

Run the dev server on port 4173 and open `/dev/symbols.html`. This sheet shows
every new glyph in both styles plus mixed text at a common scale.

```
node scripts/capture-symbols.mjs
npm test
npm run test:browser -- --workers=2
```

The design intentionally simplifies the ampersand waist, at-sign inner loop,
currency intersections, and percent counters. Botanical periods and quote buds
are compact seeds rather than full flowers. These choices protect readability
at gallery and text sizes without increasing pixel resolution.

## Files in this extension

- Shared repertoire and lookup: `src/styles/characters.ts`, `src/styles/glyphs.ts`, `src/styles/ambicase.ts`.
- Soft Pixel: `src/styles/soft-pixel-symbols.ts`, `src/styles/soft-pixel.ts`.
- Botanical: `src/styles/botanical-symbols.ts`, `src/styles/botanical-symbol-renderer.ts`, `src/styles/botanical-marks.ts`, `src/styles/botanical-marks.json`, `src/styles/botanical.ts`.
- Text, IDs, and export: `src/utils/composition.ts`, `src/utils/export-svg.ts`, `src/configuration.ts`.
- Gallery and controls: `src/ui/renderer.ts`, `src/ui/word-renderer.ts`, `src/ui/dialogs.ts`, `src/main.ts`, `src/css/workspace.css`.
- Verification: `tests/core.test.ts`, `tests/browser/ambicase.spec.ts`, `tests/browser/symbols.spec.ts`.
- Reference and documentation: `README.md`, `dev/symbols.html`, `dev/symbols.md`, `scripts/capture-symbols.mjs`, `scripts/extract-botanical-marks.mjs`.

The preceding handmade A-Z chart edits and their build tooling are preserved.
