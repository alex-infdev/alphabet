import fs from 'node:fs';
import crypto from 'node:crypto';
import opentype from 'opentype.js';

// Development only. Runtime uses the checked-in modules, never the font or rasterizer.
const filename = process.argv[2];
if (!filename) throw new Error('Usage: node scripts/extract-ambicase.mjs path/to/font.ttf');
const buffer = fs.readFileSync(filename);
const font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
const reference = { unitsPerEm: font.unitsPerEm, ascender: font.ascender, descender: font.descender,
  sha256: crypto.createHash('sha256').update(buffer).digest('hex'), glyphs: {} };
for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
  const glyph = font.charToGlyph(letter);
  if (glyph.index !== font.charToGlyph(letter.toLowerCase()).index) throw new Error(`Not caseless: ${letter}`);
  reference.glyphs[letter] = { index: glyph.index, advance: glyph.advanceWidth, bounds: glyph.getBoundingBox(),
    path: glyph.getPath(0, 0, 1000).toPathData(3) };
}
fs.mkdirSync('dev', { recursive: true });
fs.writeFileSync('dev/ambicase-reference.json', JSON.stringify(reference, null, 2) + '\n');
console.log(JSON.stringify({ ...reference, glyphs: Object.fromEntries(Object.entries(reference.glyphs).map(([c, g]) => [c, { advance: g.advance, bounds: g.bounds }])) }, null, 2));
