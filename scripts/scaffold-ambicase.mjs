import fs from 'node:fs';
import { chromium } from '@playwright/test';
import { curate } from './ambicase-curation.mjs';

const source = JSON.parse(fs.readFileSync('dev/ambicase-reference.json', 'utf8'));
const browser = await chromium.launch();
const page = await browser.newPage();
const glyphs = await page.evaluate(({ glyphs }) => {
  const ctx = document.createElement('canvas').getContext('2d');
  return Object.fromEntries(Object.entries(glyphs).map(([letter, glyph]) => {
    const path = new Path2D(glyph.path);
    const pitch = 32;
    const rows = {};
    // Sample outline intersections, retaining local occupied bounds rather than
    // turning every touched cell into a full square. Hairlines stay hairlines.
    for (let row = 0; row < 32; row++) {
      const y0 = row * pitch - 832;
      for (let col = 0; col < 31; col++) {
        const x0 = col * pitch - 64;
        let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
        for (let y = y0 + 1; y < y0 + pitch; y += 2) for (let x = x0 + 1; x < x0 + pitch; x += 2) {
          if (!ctx.isPointInPath(path, x, y)) continue;
          left = Math.min(left, x - 1); right = Math.max(right, x + 1);
          top = Math.min(top, y - 1); bottom = Math.max(bottom, y + 1);
        }
        if (right > left && bottom > top) (rows[row] ??= []).push([col, left, top, right - left, bottom - top]);
      }
    }
    return [letter, { width: glyph.advance, height: glyph.bounds.y2 - glyph.bounds.y1, bounds: glyph.bounds, rows }];
  }));
}, source);
await browser.close();
curate(glyphs);
// One compact line per row makes the geometry reviewable without a coordinate wall.
const formatted = '{\n' + Object.entries(glyphs).map(([letter, glyph]) => {
  const { rows, ...metrics } = glyph;
  return `  "${letter}": {${JSON.stringify(metrics).slice(1,-1)}, "rows": {\n` +
    Object.entries(rows).map(([row, cells]) => `    "${row}": ${JSON.stringify(cells)}`).join(',\n') + '\n  }}';
}).join(',\n') + '\n}\n';
fs.writeFileSync('src/styles/ambicase-modules.json', formatted);
console.log(Object.fromEntries(Object.entries(glyphs).map(([c, g]) => [c, Object.values(g.rows).flat().length])));
