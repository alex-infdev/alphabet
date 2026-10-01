Ambicase reconstruction and craft charts
=======================================

Run `npm run dev` and open `/dev/ambicase.html` for A-Z reference, Soft Pixel,
overlay, and side-by-side views. Both forms share the same baseline, font-unit
scale, and original advance widths. Development references are not bundled.

The font was parsed with development-only opentype.js. Its SHA-256, original
outlines, widths, bounding boxes, ascender (830), descender (-170), and em (1000)
are recorded in `ambicase-reference.json`. Lowercase aliases use uppercase forms.

To reproduce the current runtime modules:

```
node scripts/build-ambicase-charts.mjs
```

`ambicase-charts.json` is the authored source of truth: 32 rows of 31 cells per
letter, with `#` for an occupied tile and `.` for a blank. All cells are full
32-by-32 font-unit squares. The pitch remains 32, but the old two-unit boundary
sampling and clipped rectangles are gone. The body has roughly 19 chart rows.
Thin strokes now use whole cells, and diagonals move in complete grid steps.
The existing corner-radius control defaults to 0.08 rather than 0.5. Fine seams
retain the individual-tile texture. No noise, new toggle, or runtime filter is
used to create the authored irregularity.

Glyph-by-glyph decisions:

| Glyph | Chart treatment |
| --- | --- |
| A | Uneven two-row diagonal steps, blunt apex, open curled foot. |
| B | Unequal angular counters and a narrower bowl junction. |
| C | Flat crown, short block terminal, stepped open lower wedge. |
| D | Faceted right bowl with the inward left hook retained. |
| E | Short square middle hook and staggered lower-arm steps. |
| F | Flat hooked cap, compact terminal, single-row crossbar. |
| G | Angular upper bowl, block crossbar, square descender terminal. |
| H | Low rising bridge with deliberately uneven stair lengths. |
| I | Small squared dot and unequal top and bottom serifs. |
| J | Offset square dot and a compact, stepped left hook. |
| K | Blunt upper terminal, thin stepped join, dense lower wedge. |
| L | Two-cell upright foot terminal and abrupt rising steps. |
| M | Flat unequal shoulders and a more open angular central loop. |
| N | Open arched entrance, repeated diagonal steps, one-cell right upright. |
| O | Flat crown and base with unequal faceted sides. |
| P | Squared upper bowl, open counter, offset descender serif. |
| Q | Angular inner upstroke, broad lower curl, square terminal. |
| R | Open shoulder, notched waist, staggered heavy leg and blunt foot. |
| S | Compact upper terminal and a deliberately staggered diagonal band. |
| T | Short hanging cap terminals and a squared baseline hook. |
| U | Broad flat-bottomed bowl and projecting right serif. |
| V | Block upper terminal, repeated diagonal steps and blunt point. |
| W | Two unequal stepped valleys and compact high right terminal. |
| X | Open hooked upper terminal and an offset lower-left block. |
| Y | Thin stepped branch, narrow join, square-tipped long descender. |
| Z | Paired diagonal steps and blunt wedge-shaped arm terminals. |

The runtime JSON keeps the existing `[column, x, y, width, height]` structure,
in SVG-downward font units, with 99-270 individually editable modules per glyph.
IDs remain `letter:row:column` or `w@index:letter:row:column`. Existing edits keep
their cell addresses; edits to cells removed during charting remain importable
but have no visible module. Saved parameters are respected, so a previously
saved radius is not silently changed to the new default. Reset the style to
apply the new defaults to an existing session.

Advance widths, baseline, 16 units of total overhang padding, 134-by-150 gallery
viewBox, and proportional word/export layout are unchanged. Botanical retains
its original geometry. Rendering and SVG export use the same tile rectangles.

The earlier smooth reconstruction tooling is retained for reference:

```
node scripts/extract-ambicase.mjs path/to/ambicase-modern-regular.ttf
node scripts/scaffold-ambicase.mjs
```

That scaffold writes the old clipped-outline modules using corrections from
`scripts/ambicase-curation.mjs`. Run `build-ambicase-charts.mjs` afterward to
restore the authored craft charts. Do not replace the charts with resampling.

`node scripts/capture-ambicase.mjs` captures the comparison page with the dev
server running on port 4173. PNG screenshots are local QA artifacts.
