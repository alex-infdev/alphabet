import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seededRandom } from '../src/utils/random.ts';
import { LETTERS, SKELETONS, pixelIds } from '../src/styles/glyphs.ts';
import { AMBICASE, ambicaseGlyph, ambicaseWidth } from '../src/styles/ambicase.ts';
import { wordLayout } from '../src/utils/word-layout.ts';
import { initialState, sanitizeParams } from '../src/state.ts';
import { cleanAscii, cleanWord, pixelPosition, pixelScale, wordInstances } from '../src/utils/composition.ts';
import type { AlphabetStyle } from '../src/types.ts';

test('a seed reproduces a sequence, while another seed produces a new variation', () => {
  const sequence = (seed: number) => { const random = seededRandom(seed); return Array.from({ length: 100 }, random); };
  assert.deepEqual(sequence(2048), sequence(2048));
  assert.notDeepEqual(sequence(2048), sequence(2049));
  assert.ok(sequence(42).every(value => value >= 0 && value < 1));
});

test('both systems cover all 26 letters with valid, nonempty geometry and unique module IDs', () => {
  const allIds = LETTERS.flatMap(pixelIds);
  assert.equal(new Set(allIds).size, allIds.length);
  assert.equal(Object.keys(SKELETONS).length, 26);
  assert.equal(Object.keys(AMBICASE).length, 26);
  for (const letter of LETTERS) {
    const glyph = ambicaseGlyph(letter);
    assert.ok(glyph.width > 0 && glyph.height > 0);
    for (const cells of Object.values(glyph.rows)) for (const [column, x, y, width, height] of cells) {
      assert.ok(Number.isInteger(column) && column >= 0 && column <= 30);
      assert.ok([x, y, width, height].every(Number.isFinite));
      assert.ok(width > 0 && height > 0);
    }
    assert.ok(pixelIds(letter).length > 10);
    for (const path of SKELETONS[letter]) {
      assert.ok(path.length >= 2);
      for (let i = 1; i < path.length; i++) assert.notDeepEqual(path[i], path[i - 1], `${letter} must not contain a zero-length stem`);
    }
  }
});

test('Ambicase aliases, proportional metrics, dots and descenders preserve the source anatomy', () => {
  for (const letter of LETTERS) assert.equal(ambicaseGlyph(letter.toLowerCase()), ambicaseGlyph(letter));
  assert.equal(AMBICASE.M.width, 905); assert.equal(AMBICASE.I.width, 338);
  assert.ok(AMBICASE.W.width > AMBICASE.J.width * 2);
  for (const letter of ['I', 'J']) {
    assert.equal(AMBICASE[letter].bounds.y2, 817);
    assert.ok(Object.keys(AMBICASE[letter].rows).some(row => Number(row) < 5));
    assert.ok(!AMBICASE[letter].rows['5']);
  }
  for (const letter of ['G', 'J', 'P', 'Q', 'Y']) {
    assert.ok(AMBICASE[letter].bounds.y1 < -100);
    assert.ok(Object.keys(AMBICASE[letter].rows).some(row => Number(row) > 28));
  }
});

test('word layout uses actual glyph advances at the chosen scale and shared spacing', () => {
  const style = { glyphWidth: (letter: string, state: { params: Record<string, unknown> }) => ambicaseWidth(letter, Number(state.params.scale)) };
  const state = { params: { scale: .95, spacing: 14 }, edits: {} };
  const layout = wordLayout(style, state, 'IMWI');
  assert.ok(layout.glyphs[1].width > layout.glyphs[0].width * 2);
  layout.glyphs.slice(1).forEach((glyph, index) => assert.equal(glyph.x, layout.glyphs[index].x + layout.glyphs[index].width + 14));
  assert.equal(layout.width, 112 + layout.glyphs.reduce((sum, glyph) => sum + glyph.width, 0) + 42);
  assert.deepEqual(wordLayout(style, state, 'imwi'), layout);
  assert.equal(wordLayout({}, state, 'AB').width, 112 + 240 + 14);
});

const fixture: AlphabetStyle = {
  id: 'fixture', name: 'Fixture', subtitle: '', description: '', material: '',
  defaults: { size: 1, seed: 2048, labels: true, mode: 'one' },
  controls: [
    { type: 'range', key: 'size', label: 'Size', min: 0.4, max: 1.8, step: 0.01 },
    { type: 'number', key: 'seed', label: 'Seed', min: 0, max: 999999, step: 1 },
    { type: 'toggle', key: 'labels', label: 'Labels' },
    { type: 'select', key: 'mode', label: 'Mode', options: [{ value: 'one', label: 'One' }] },
  ],
  renderGlyph: () => { throw new Error('DOM is not used in state tests'); },
};

test('character and word input only retain supported visible characters', () => {
  assert.equal(cleanAscii('**o<> &\n🌿é'), '*o<>&');
  assert.equal(cleanWord('Hello, world! 123'), 'HELLOWORLD');
  assert.equal(cleanWord('abcdefghijklmnopq').length, 16);
});
test('repeated word letters have independent overrides and inherit base glyph edits', () => {
  const instances = wordInstances('LL');
  assert.deepEqual(instances, ['w@0:L', 'w@1:L']);
  const state = { params: {}, edits: { 'L:0:0': 1.2, 'w@0:L:0:0': 1.6 }, positions: { 'L:0:0': { x: 3, y: 4 }, 'w@0:L:0:0': { x: 15, y: 8 } } };
  assert.equal(pixelScale(state, 'w@0:L:0:0'), 1.6);
  assert.equal(pixelScale(state, 'w@1:L:0:0'), 1.2);
  assert.deepEqual(pixelPosition(state, 'w@0:L:0:0'), { x: 15, y: 8 });
  assert.deepEqual(pixelPosition(state, 'w@1:L:0:0'), { x: 3, y: 4 });
  const restored = initialState([fixture], JSON.stringify({ version: 1, word: 'LL', wordMode: true, styles: { fixture: state } }));
  assert.deepEqual(restored.styles.fixture.positions, state.positions);
  assert.deepEqual(restored.styles.fixture.edits, state.edits);
  assert.equal(restored.wordMode, true);
});
test('import boundary clamps numbers and rejects invalid values and unknown keys', () => {
  assert.deepEqual(sanitizeParams(fixture, { size: 999, seed: -1, labels: 'true', mode: 'unknown', unknown: 4 }), { size: 1.8, seed: 0, labels: true, mode: 'one' });
  assert.equal(sanitizeParams(fixture, { size: NaN }).size, 1);
  assert.equal(sanitizeParams(fixture, { size: 0.777 }).size, 0.78);
});
test('persistence recovers invalid JSON, ignores incompatible versions and preserves valid edits', () => {
  assert.equal(initialState([fixture], '{broken').activeStyle, 'fixture');
  assert.equal(initialState([fixture], JSON.stringify({ version: 99, styles: { fixture: { params: { size: 1.5 } } } })).styles.fixture.params.size, 1);
  const restored = initialState([fixture], JSON.stringify({ version: 1, activeStyle: 'missing', styles: { fixture: { params: { size: 1.3 }, edits: { 'A:0:1': 1.5, 'A:32:9': 1, 'B:2:2': 9 } } } }));
  assert.equal(restored.activeStyle, 'fixture');
  assert.equal(restored.styles.fixture.params.size, 1.3);
  assert.deepEqual(restored.styles.fixture.edits, { 'A:0:1': 1.5 });
});


test('legacy word IDs migrate only for the active word, and stale words are removed', () => {
  const saved = initialState([fixture], JSON.stringify({ version: 1, word: 'LL', styles: { fixture: { edits: { 'LL@0:L:0:0': 1.6, 'OLD@0:O:0:0': 1.4, 'L:0:0': 1.1 }, positions: { 'LL@1:L:1:0': { x: 3, y: 4 } } } } }));
  assert.equal(saved.version, 2);
  assert.deepEqual(saved.styles.fixture.edits, { 'w@0:L:0:0': 1.6, 'L:0:0': 1.1 });
  assert.deepEqual(saved.styles.fixture.positions, { 'w@1:L:1:0': { x: 3, y: 4 } });
});

import { History } from '../src/history.ts';
import { parseConfiguration, configurationJSON, shareURL } from '../src/configuration.ts';
import { pruneWordEdits, validPixelId } from '../src/utils/composition.ts';

test('bounded history coalesces gestures, detaches snapshots and invalidates redo branches', () => {
  const history = new History({ value: 0 }, 2);
  history.record({ value: 1 }, 'slider'); history.record({ value: 2 }, 'slider'); history.end();
  const previous = history.undo()!; assert.equal(previous.value, 0); previous.value = 99;
  assert.equal(history.redo()!.value, 2);
  history.record({ value: 3 }); history.record({ value: 4 }); history.record({ value: 5 });
  assert.equal(history.undo()!.value, 4); assert.equal(history.undo()!.value, 3); assert.equal(history.undo(), undefined);
  history.record({ value: 6 }); assert.equal(history.redo(), undefined);
});

test('word edits survive changes elsewhere; replaced and removed occurrences are pruned', () => {
  const state = { params: {}, edits: { 'w@0:L:0:0': 1.4, 'w@1:L:0:0': 1.6 }, positions: { 'w@1:L:0:0': { x: 2, y: 3 } } };
  pruneWordEdits(state, 'LLA'); assert.equal(Object.keys(state.edits).length, 2);
  pruneWordEdits(state, 'LA'); assert.deepEqual(state.edits, { 'w@0:L:0:0': 1.4 }); assert.deepEqual(state.positions, {});
});

test('configuration roundtrip, version 1 import and helpful validation errors', () => {
  const state = initialState([fixture], null);
  assert.deepEqual(parseConfiguration(configurationJSON(state), [fixture]), state);
  const legacy = { version: 1, style: 'fixture', parameters: { size: 1.4 }, word: 'LL', pixelEdits: { 'LL@0:L:0:0': 1.6 } };
  assert.equal(parseConfiguration(JSON.stringify(legacy), [fixture]).styles.fixture.edits['w@0:L:0:0'], 1.6);
  for (const input of ['null', '{', JSON.stringify({ version: 99 }), JSON.stringify({ ...legacy, parameters: { size: 8 } }), JSON.stringify({ ...legacy, pixelPositions: { 'L:0:0': { x: '1', y: 0 } } })]) assert.throws(() => parseConfiguration(input, [fixture]));
  const url = new URL(shareURL(state, 'https://example.test/'));
  assert.deepEqual(parseConfiguration(decodeURIComponent(url.hash.slice(8)), [fixture]), state);
});

test('high-resolution module IDs survive JSON roundtrip and invalid grid addresses are rejected', () => {
  const state = initialState([fixture], null);
  state.word = 'MM'; state.wordMode = true;
  state.styles.fixture.edits = { 'M:16:25': 1.4, 'w@1:M:16:25': 1.7 };
  state.styles.fixture.positions = { 'M:16:25': { x: -3, y: 8 }, 'w@1:M:16:25': { x: 4, y: -9 } };
  assert.deepEqual(parseConfiguration(configurationJSON(state), [fixture]), state);
  for (const letter of LETTERS) assert.ok(pixelIds(letter).every(validPixelId));
  for (const id of ['M:32:25', 'M:16:31', 'w@16:M:16:25', 'M:-1:0']) assert.equal(validPixelId(id), false);
});


import { constrainPixelOffset, nudgePixelOffset } from '../src/utils/pixel-grid.ts';
test('optional grid snaps glyph offsets and nudges directionally within bounds', () => {
  const grid = { params: { snapToGrid: true }, edits: {} };
  const free = { params: { snapToGrid: false }, edits: {} };
  assert.equal(constrainPixelOffset(grid, 8.1), 10);
  assert.equal(constrainPixelOffset(grid, -8.1), -10);
  assert.equal(constrainPixelOffset(grid, 43), 40);
  assert.equal(constrainPixelOffset(free, 8.1), 8.1);
  assert.equal(nudgePixelOffset(grid, 7, 1, 1), 10);
  assert.equal(nudgePixelOffset(grid, 7, -1, 1), 5);
  assert.equal(nudgePixelOffset(grid, -7, -1, 1), -10);
  assert.equal(nudgePixelOffset(grid, 0, 1, 5), 25);
  assert.equal(nudgePixelOffset(grid, 38, 1, 5), 40);
  assert.equal(nudgePixelOffset(free, 7, 1, 1), 8);
});
