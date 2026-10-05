import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AlphabetStyle, StyleState } from '../src/types.ts';
import { addPixel, removePixels, resetGlyph, cellPosition, pointToCell, softPixelModules, emptyCell, CELL_STEP, gridColumns } from '../src/utils/soft-pixel-model.ts';
import { initialState } from '../src/state.ts';
import { configurationJSON, parseConfiguration } from '../src/configuration.ts';
import { constrainPixelOffset, nudgePixelOffset } from '../src/utils/pixel-grid.ts';
import { AMBICASE } from '../src/styles/ambicase.ts';
import { History } from '../src/history.ts';

const fixture: AlphabetStyle = {
  id: 'soft-pixel', name: 'Soft Pixel', subtitle: '', description: '', material: '',
  defaults: { grid: false, snapToGrid: false, pixelSize: 13, gap: 1, radius: .08, scale: .95, jitter: 0, rotation: 0, seed: 2048 },
  controls: [
    { type: 'toggle', key: 'grid', label: 'Grid' }, { type: 'toggle', key: 'snapToGrid', label: 'Snap' },
    ...['pixelSize', 'gap', 'radius', 'scale', 'jitter', 'rotation', 'seed'].map(key => ({ type: 'number' as const, key, label: key, min: 0, max: 999999, step: .01 })),
  ],
  renderGlyph: () => { throw new Error('No DOM in model tests'); },
};
const state = (): StyleState => ({ params: { ...fixture.defaults }, edits: {}, positions: {} });
const cell = { row: 3, column: 3 };

test('grid toggle defaults off, persists, and old saved data retains its overrides', () => {
  const saved = initialState([fixture], null);
  assert.equal(saved.styles['soft-pixel'].params.grid, false);
  saved.styles['soft-pixel'].params.grid = true;
  assert.equal(parseConfiguration(configurationJSON(saved), [fixture]).styles['soft-pixel'].params.grid, true);
  const old = initialState([fixture], JSON.stringify({ version: 1, styles: { 'soft-pixel': { params: {}, edits: { 'A:6:10': 1.4 }, positions: { 'A:6:10': { x: 7, y: 3 } } } } }));
  assert.equal(old.styles['soft-pixel'].params.grid, false);
  assert.equal(old.styles['soft-pixel'].edits['A:6:10'], 1.4);
  assert.deepEqual(old.styles['soft-pixel'].positions?.['A:6:10'], { x: 7, y: 3 });
});
test('chart cell conversions match every authored module and proportional edit bounds', () => {
  for (const [letter, glyph] of Object.entries(AMBICASE)) for (const [row, cells] of Object.entries(glyph.rows)) for (const [column, x, y] of cells) {
    const position = cellPosition({ row: Number(row), column });
    assert.ok(Math.abs(position.x - x * .13) < 1e-10);
    assert.ok(Math.abs(position.y - y * .13) < 1e-10);
    assert.deepEqual(pointToCell(letter, { x: position.x + CELL_STEP / 2, y: position.y + CELL_STEP / 2 }), { row: Number(row), column });
  }
  assert.ok(gridColumns('I') < gridColumns('M'));
  assert.equal(pointToCell('A', { x: -100, y: -100 }), null);
  assert.equal(pointToCell('A', cellPosition({ row: 32, column: 3 })), null);
  assert.equal(pointToCell('A', cellPosition({ row: 3, column: gridColumns('A') })), null);
});
test('addition creates a real module, prevents duplicates and uses current dimensions', () => {
  const edited = state(); const count = softPixelModules('A', edited).length;
  const id = addPixel('a', edited, cell)!;
  assert.equal(id, 'A:0:m0');
  assert.equal(softPixelModules('A', edited).length, count + 1);
  assert.equal(addPixel('A', edited, cell), null);
  assert.equal(addPixel('A', edited, { row: 6, column: 10 }), null);
  const manual = softPixelModules('A', edited).find(module => module.id === id)!;
  assert.ok(Math.abs(manual.width - (CELL_STEP - .28)) < 1e-10);
  assert.equal(manual.x, cellPosition(cell).x + CELL_STEP / 2);
  assert.equal(manual.y, cellPosition(cell).y + CELL_STEP / 2);
});
test('occupied bounds include moved tiles, scaled tiles, and spanning geometry', () => {
  const edited = state(); const id = addPixel('A', edited, cell)!;
  edited.positions![id] = { x: CELL_STEP * 2, y: 0 };
  assert.equal(emptyCell('A', edited, cell), true);
  assert.equal(emptyCell('A', edited, { row: 3, column: 5 }), false);
  assert.ok(addPixel('A', edited, cell));
  edited.edits[id] = 1.8;
  assert.equal(emptyCell('A', edited, { row: 3, column: 6 }), false);
  // Temporarily supply a multi-cell chart tile, then restore the untouched source.
  const base = AMBICASE.A.rows['6'][0]; const width = base[3];
  try { base[3] = 64; assert.equal(emptyCell('A', state(), { row: 6, column: base[0] + 1 }), false); }
  finally { base[3] = width; }
});
test('manual movement stays on construction cells without changing legacy freehand or 5-unit snap', () => {
  const edited = state();
  assert.equal(constrainPixelOffset(edited, 7, 'A:0:m0'), CELL_STEP * 2);
  assert.ok(constrainPixelOffset(edited, 100, 'A:0:m0') <= 40);
  assert.equal(nudgePixelOffset(edited, 0, 1, 1, 'A:0:m0'), CELL_STEP);
  assert.equal(constrainPixelOffset(edited, 7, 'A:6:10'), 7);
  edited.params.snapToGrid = true;
  assert.equal(constrainPixelOffset(edited, 7, 'A:6:10'), 5);
});
test('deletion, reset, lowercase and every repeated text occurrence resolve the same edits', () => {
  const edited = state(); const base = JSON.stringify(AMBICASE.A);
  const original = softPixelModules('A', edited);
  const id = addPixel('A', edited, cell)!;
  edited.edits[id] = 1.3; edited.positions![id] = { x: CELL_STEP, y: 0 };
  assert.deepEqual(softPixelModules('a', edited), softPixelModules('A', edited));
  for (const instance of ['w@0:A', 'w@2:A', 'w@4:A', 'w@6:A']) {
    const module = softPixelModules('A', edited, instance).find(module => module.id.endsWith(':0:m0'))!;
    assert.equal(module.offset.x, CELL_STEP);
    assert.ok(module.width > original[0].width);
  }
  removePixels(edited, [id]);
  assert.equal(edited.addedPixels?.[id], undefined);
  assert.equal(edited.edits[id], undefined);
  assert.deepEqual(softPixelModules('A', edited), original);
  addPixel('A', edited, cell); removePixels(edited, ['A:6:10']);
  edited.positions!['A:7:10'] = { x: 4, y: 5 };
  edited.edits['w@0:A:7:10'] = 1.4;
  addPixel('B', edited, cell);
  resetGlyph(edited, 'a');
  assert.deepEqual(softPixelModules('A', edited), original);
  assert.equal(edited.edits['w@0:A:7:10'], undefined);
  assert.equal(Object.keys(edited.addedPixels!).length, 1, 'other glyphs stay edited');
  assert.equal(JSON.stringify(AMBICASE.A), base);
});
test('manual, removed, moved and scaled modules roundtrip through save/load and metadata import', () => {
  const saved = initialState([fixture], null); const edited = saved.styles['soft-pixel'];
  const id = addPixel('A', edited, cell)!;
  edited.edits[id] = 1.4; edited.positions![id] = { x: CELL_STEP, y: -CELL_STEP };
  removePixels(edited, ['A:6:10']);
  assert.deepEqual(initialState([fixture], JSON.stringify(saved)), saved);
  assert.deepEqual(parseConfiguration(configurationJSON(saved), [fixture]), saved);
  const imported = parseConfiguration(JSON.stringify({ version: 2, style: fixture.id, parameters: edited.params, pixelEdits: edited.edits, pixelPositions: edited.positions, addedPixels: edited.addedPixels, removedPixels: edited.removedPixels }), [fixture]);
  assert.deepEqual(imported.styles['soft-pixel'], edited);
  for (const bad of [{ 'A:0:m0': { row: 32, column: 0 } }, { 'w@0:A:0:m0': cell }, { 'A:6:10': cell }]) assert.throws(() => parseConfiguration(JSON.stringify({ ...saved, styles: { 'soft-pixel': { ...edited, addedPixels: bad } } }), [fixture]));
});
test('add, remove and move use existing detached undo snapshots', () => {
  let edited = state(); const history = new History(edited); const id = addPixel('A', edited, cell)!;
  history.record(edited); edited.positions![id] = { x: CELL_STEP, y: 0 }; history.record(edited);
  removePixels(edited, [id]); history.record(edited);
  edited = history.undo()!; assert.equal(edited.positions![id].x, CELL_STEP);
  edited = history.undo()!; assert.equal(edited.positions?.[id], undefined);
  edited = history.undo()!; assert.equal(edited.addedPixels, undefined);
  edited = history.redo()!; assert.deepEqual(edited.addedPixels?.[id], cell);
});
