# Folk Ornamental

The current Folk alphabet uses the supplied Ambicase Modern anatomy with individually composed sprigs, attached blossoms, small carved details, and a geometric stepped treatment. The user's font reference supersedes the earlier independently drawn serif skeletons.

## Source and coordinate model

`src/styles/folk/ambicase-outlines.json` contains native SVG outlines and proportional advances derived from the recorded Ambicase reference. The supplied TTF was SHA-256 verified against `dev/ambicase-reference.json`: `974f5559c060580a146c5e11e1fdfd9446d2c766955a911f469bb3dfbc121ea4`. The source outlines are scaled by .13, positioned on baseline 112, and given eight units of gallery bearing space per side. Word layout uses the source advance plus the existing four-unit word allowance; gallery bearing padding does not inflate tracking. The runtime loads vectors, not the TTF or development reference.

To regenerate from the same supplied font:

```powershell
node --experimental-strip-types scripts/build-folk-outlines.mjs 'C:/Users/justf/Downloads/exe/ambicase-modern-regular.ttf'
```

The builder rejects a font whose hash differs from the recorded reference. Soft Pixel's authored chart and all Botanical geometry remain unchanged.

## Ornament grammar

`letters.ts` composes attachments against the actual Ambicase anatomy: A's swept lower bowl, the I/J dots, M/N's arched shoulders, the low H bridge, and G/P/Q/Y's descenders remain intact. At the default ornament value of 40, each letter gets one primary gesture. Denser settings add a second gesture or a small carved detail. There are no scattered vertical dot columns on A-Z.

Sprigs have a substantial stem and a small number of broad paired leaves. B/O/S/V/Z use attached flowers to vary the word rhythm. Narrow I/K/R/T/V/W spaces have individually tuned attachment positions and sizes. Seed variation is bounded to the authored attachments and never changes the source silhouette or width. Density adds leaf pairs and secondary motifs without free placement or long inter-letter branches.

Punctuation and numerals retain their independently authored family geometry. Their ornament uses the revised motif vocabulary; currency forms sharing C/S inherit the new base anatomy.

## Smooth and stepped treatments

`ornament.ts` supplies smooth almond leaves and separate broad geometric leaf contours. Both treatments start at the same stem attachment and transform together. Flowers have eight broad petals with a small centre in smooth mode and a square-petal treatment at coarse settings. The stepped flower scales in whole grid multiples to retain its optical size through the slider.

`geometry.ts` keeps the ordered orthogonal contour walk and connected hairline cells. The maximum body grid pitch is now 4.16 glyph units, matching the Soft Pixel chart's 32-font-unit pitch at .13 scale. Motifs, masks and body geometry remain native vectors. Carved flowers use the restrained dot treatment when quantized so a full large flower cannot remove an entire black stem.

## Visual review and verification

Open `/dev/folk.html` for live A-Z, symbols, CULTURE, ORNAMENT, FOLK and PIXEL, plus the fixed treatment matrix. `node scripts/capture-folk.mjs` captures the matrix, A-Z at six density/treatment combinations, symbol sheets, and the desktop/mobile app. These PNGs are ignored QA artifacts.

The redesign was reviewed across A-Z at minimal, default and dense ornament, and in smooth and coarse states. The first review exposed merged I/K/R/T/V/W ornament; their attachments were moved into the actual open fields. The font's original counters, hooked terminals and dotted aliases remain visible. Maximum coarseness intentionally simplifies leaves into bold stepped shapes.

Tests check exact font-source contour correspondence, proportional metrics, retained dots/counters, one primary default gesture, bounded secondary motifs, flower optical size, explicit leaf geometry, attachment stability, deterministic seeds, native SVG/export parity, unique mask IDs, lowercase aliases, persistence, and desktop/mobile behavior. Existing Soft Pixel and Botanical regressions remain part of the complete suite.
