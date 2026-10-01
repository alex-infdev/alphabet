import fs from 'node:fs';

// Authored on/off charts are the source of truth for the craft interpretation.
// Keep the original pitch and addresses so existing edits retain their grid cell.
const charts = JSON.parse(fs.readFileSync('dev/ambicase-charts.json', 'utf8'));
const reference = JSON.parse(fs.readFileSync('dev/ambicase-reference.json', 'utf8'));
const glyphs = Object.fromEntries(Object.entries(charts).map(([letter, chart]) => {
  if (chart.length !== 32 || chart.some(row => !/^[.#]{31}$/.test(row))) throw new Error(`Invalid chart ${letter}`);
  const source = reference.glyphs[letter];
  const rows = {};
  chart.forEach((line, row) => {
    const cells = [...line].flatMap((cell, col) => cell === '#' ? [[col, col * 32 - 64, row * 32 - 832, 32, 32]] : []);
    if (cells.length) rows[row] = cells;
  });
  return [letter, { width: source.advance, height: source.bounds.y2 - source.bounds.y1, bounds: source.bounds, rows }];
}));
if (Object.keys(glyphs).join('') !== 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') throw new Error('Expected A-Z charts');
const formatted = '{\n' + Object.entries(glyphs).map(([letter, glyph]) => {
  const { rows, ...metrics } = glyph;
  return `  "${letter}": {${JSON.stringify(metrics).slice(1, -1)}, "rows": {\n` +
    Object.entries(rows).map(([row, cells]) => `    "${row}": ${JSON.stringify(cells)}`).join(',\n') + '\n  }}';
}).join(',\n') + '\n}\n';
fs.writeFileSync('src/styles/ambicase-modules.json', formatted);
