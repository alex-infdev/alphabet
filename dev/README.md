Ambicase reconstruction
======================

Run `npm run dev` and open `/dev/ambicase.html` for A–Z reference, Soft Pixel,
overlay, and side-by-side views. Both outlines share the same baseline, font-unit
scale, and original advance widths. This page and the reference paths are not
included in the production build.

The font was parsed with development-only opentype.js. Its SHA-256 and original
outlines, widths, bounding boxes, ascender (830), descender (-170), and em (1000)
are recorded in `ambicase-reference.json`. Every lowercase character was checked
against its uppercase glyph index.

To reproduce the modules:

```
node scripts/extract-ambicase.mjs path/to/ambicase-modern-regular.ttf
node scripts/scaffold-ambicase.mjs
```

The scaffold intersects each outline with a 32-font-unit grid, sampling locally
at two-unit intervals. Each cell keeps its occupied rectangle rather than a
binary on/off square. This preserves hairlines and variable stroke thickness
at approximately 19 rows per 600-unit body. Dots and descenders use the same
coordinate system, not separate normalized boxes.

`scripts/ambicase-curation.mjs` records reviewed corrections for all 26 glyphs:
merging clipped boundary strips into neighboring modules, removing isolated
curve specks, and preserving distinctive counters and terminals. Regeneration
applies those corrections deterministically and fails if their addresses change.
The checked-in runtime data has one compact line per row, with modules encoded
as `[column, x, y, width, height]`. Coordinates remain in font units, with y
inverted for SVG. Module IDs remain `letter:row:column` or `w@index:letter:row:column`.

Glyphs contain 104–302 individually editable modules. M needs the most to retain
its double arch and central loop. Hairlines, diagonal edges, round ball terminals,
and the central M/K/R joins still show the discretization inherent in rectangular
modules. Rounded corners and small adjustable gutters preserve Soft Pixel's
visual identity. Runtime rendering uses only those modules, with no font, text,
outline paths, canvas, or rasterization.

Word layout and SVG export share the same advance calculation, including scale,
16 units of total padding for overhangs, and the existing spacing control.
Gallery cells share a 134 × 150 viewBox so narrow glyphs are not enlarged to fill
wide-letter slots. Botanical retains its original 120 × 150 layout.

The previous 5 × 7 module addresses can still be imported as edits; addresses
without a module in the reconstructed alphabet have no visible effect. A new
grid cannot preserve the old shapes or their spatial interpretation.

`node scripts/capture-ambicase.mjs` captures the comparison page with the dev
server running on port 4173. PNG screenshots are local QA artifacts.
