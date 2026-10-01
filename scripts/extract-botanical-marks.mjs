import fs from 'node:fs';
import opentype from 'opentype.js';

// Offline preservation of the existing ASCII material. No font is shipped or
// loaded by the app. Centered outlines retain the old text-anchor geometry.
const filename = process.argv[2];
if (!filename) throw new Error('Usage: node scripts/extract-botanical-marks.mjs path/to/cour.ttf');
const buffer = fs.readFileSync(filename);
const font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
const marks = {};
for (let code = 33; code <= 126; code++) {
  const char = String.fromCodePoint(code), glyph = font.charToGlyph(char);
  const advance = glyph.advanceWidth / font.unitsPerEm * 1000;
  marks[char] = glyph.getPath(-advance / 2, 0, 1000).toPathData(3);
}
fs.writeFileSync('src/styles/botanical-marks.json', JSON.stringify(marks, null, 2) + '\n');
