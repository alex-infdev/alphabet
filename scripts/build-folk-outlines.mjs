import fs from 'node:fs';
import crypto from 'node:crypto';
import { transform } from '../src/styles/folk/geometry.ts';

// The development reference already contains the parsed, unmodified font paths.
// Verify the supplied TTF before deriving runtime vectors; never bundle the font.
const filename = process.argv[2];
if (!filename) throw new Error('Usage: node --experimental-strip-types scripts/build-folk-outlines.mjs path/to/ambicase-modern-regular.ttf');
const reference = JSON.parse(fs.readFileSync('dev/ambicase-reference.json', 'utf8'));
const sha256 = crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
if (sha256 !== reference.sha256) throw new Error('The font differs from the recorded Ambicase reference. Extract a matching reference first.');
const scale = .13, baseline = 112, bearing = 8;
const glyphs = Object.fromEntries(Object.entries(reference.glyphs).map(([letter, glyph]) => [letter, {
  advance: Number((glyph.advance * scale).toFixed(3)),
  width: Number((glyph.advance * scale + bearing * 2).toFixed(3)),
  path: transform({ d: glyph.path }, bearing, baseline, 0, scale).d,
}]));
fs.writeFileSync('src/styles/folk/ambicase-outlines.json', JSON.stringify({ sha256, scale, baseline, bearing, glyphs }, null, 2) + '\n');
console.log(`Derived ${Object.keys(glyphs).length} Folk outlines from verified Ambicase ${sha256.slice(0, 12)}.`);
