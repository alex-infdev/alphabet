# Folk Ornamental

Original display geometry, anchored ornament, and vector grid interpretation are separate layers. No font, traced reference, canvas, raster sampling, or remote asset is used.

## Design grammar and implementation

The CULTURE references establish black vertical masses, extreme contrast, irregular serifs, inward bell terminals, generous counters, low hooks, restrained dots and small flowers, and plants attached to structural joints. The design preserves empty space and uses different ornament arrangements for different letters.

- `src/styles/folk/letters.ts`: 26 individually authored capital skeletons with proportional widths, cap height 24, baseline 112, and intentional overshoots/descenders. Each entry contains its design rationale and named attachment points.
- `src/styles/folk/symbols.ts`: independent punctuation, currencies, operators, ten numerals, and blank space. Lowercase resolves to the same capital geometry.
- `src/styles/folk/model.ts`: filled contours, optional hairline strokes, motif hints, and anchors with position, direction, activation stage, and optional knockout.
- `src/styles/folk/ornament.ts`: bounded seeded choices at authored anchors. Dots begin near 16; flowers and leaf structures around 30; larger plants and curls around 50; additional structures around 70; secondary branches above 84. Eased growth changes scale/length within each stage. There is no free random placement. Pixelation is not an input to composition.
- `src/styles/folk/geometry.ts`: low settings snap control coordinates. Above 25, sampled mathematical contours become ordered orthogonal grid walks; grid pitch increases to 6 units. Straight edges and implicit closing edges are also subdivided. Hairlines become connected vector cells, small dots retain a cell, and rosettes become compact crosses. Counters use even-odd fill. Tiny carved motifs are constrained separately so they cannot remove a whole stem. Native SVG crisp-edge rendering prevents seams between adjacent cells.
- `src/styles/folk-ornamental.ts`: style adapter, bounded derived-geometry cache, controls, metrics, SVG groups, and uniquely identified cutout masks. Changing a seed affects ornament only. Both live layout and export use this renderer.

Registration, word layout, export, persistence, color, focus, history, and configuration import use the existing application architecture. Old saved configurations receive the new style's defaults. Existing style artwork and module editing are unchanged. Ornament is local to each glyph; there is no word-level vine connection in this pass.

## Manual glyph review

The complete A-Z was visually reviewed glyph by glyph at base, ornamented, and coarse states, not accepted from data generation alone.

| Glyphs | Reviewed anatomy |
| --- | --- |
| A, B, C | Offset A crown and low bar; unequal B bowls and backward cap hook; C crescent and inward bell |
| D, E, F | Inflated D bowl and inner plant; unequal E arms and cupped foot; F canopy and open lower field |
| G, H, I | Dropped G spur; H low curved bridge; narrow I with notched cap and restrained carved foot |
| J, K, L | J descending bell; curved K upper arm and kicked leg; L sunk keel and rising beak |
| M, N, O | M central loop; bowed N diagonal; tall O with asymmetric black mass |
| P, Q, R | P short descending foot; Q curled tail; open R shoulder and kicked leg |
| S, T, U | Opposed S bells; T canopy and double hook; heavy/fine U uprights and deep bowl |
| V, W, X | Wedge construction, unequal W low points, contrasted X diagonals |
| Y, Z | Y high fork and long hook; Z ribbon diagonal and curved head/foot |

The CULTURE matrix uses (Ornament, Pixelation) = (0,0), (40,0), (40,60), (80,0), (80,80), plus (100,100). Review led to tighter spacing, stronger inner plants, revised B/R shoulders and W points, a corrected diagonal grid walk, and reduced coarse cutouts. Punctuation and digits were reviewed in smooth and stepped sheets.

The results retain the same skeleton and attachment locations across treatments. Relative to the source CULTURE composition, these letters remain more upright and the word has less inter-letter interaction. At maximum density and coarseness, M/O/T leaf clusters merge with adjacent masses; these are the first candidates for further optical tuning. Small curls intentionally lose detail on the largest grid. The design is an original display alphabet, not a complete typographic font with kerning and OpenType features.

## Review and verification

Run the Vite development server and open `/dev/folk.html`. It includes adjustable A-Z, symbols, CULTURE, ORNAMENT, FOLK, PIXEL, and fixed CULTURE comparisons. `node scripts/capture-folk.mjs` regenerates ignored PNG review sheets against port 4173.

Tests cover the full shared repertoire, treatment extremes, deterministic ornament, unchanged skeletons, stable anchors, diagonal stepping, lowercase aliases, proportional layout, SVG parity and mask IDs, old-state loading, persisted controls, and desktop/mobile integration. Existing regression checks retain the original two styles' artwork hashes and module-editing behavior.
