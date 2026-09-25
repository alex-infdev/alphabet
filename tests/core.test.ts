import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seededRandom } from '../src/utils/random.ts';
import { LETTERS, SKELETONS, BITMAPS, pixelIds } from '../src/styles/glyphs.ts';
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
  assert.equal(Object.keys(BITMAPS).length, 26);
  for (const letter of LETTERS) {
    assert.equal(BITMAPS[letter].length, 7);
    assert.ok(BITMAPS[letter].every(row => /^[01]{5}$/.test(row)));
    assert.ok(pixelIds(letter).length > 10);
    for (const path of SKELETONS[letter]) {
      assert.ok(path.length >= 2);
      for (let i = 1; i < path.length; i++) assert.notDeepEqual(path[i], path[i - 1], `${letter} must not contain a zero-length stem`);
    }
  }
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
  assert.deepEqual(instances, ['LL@0:L', 'LL@1:L']);
  const state = { params: {}, edits: { 'L:0:0': 1.2, 'LL@0:L:0:0': 1.6 }, positions: { 'L:0:0': { x: 3, y: 4 }, 'LL@0:L:0:0': { x: 15, y: 8 } } };
  assert.equal(pixelScale(state, 'LL@0:L:0:0'), 1.6);
  assert.equal(pixelScale(state, 'LL@1:L:0:0'), 1.2);
  assert.deepEqual(pixelPosition(state, 'LL@0:L:0:0'), { x: 15, y: 8 });
  assert.deepEqual(pixelPosition(state, 'LL@1:L:0:0'), { x: 3, y: 4 });
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
  const restored = initialState([fixture], JSON.stringify({ version: 1, activeStyle: 'missing', styles: { fixture: { params: { size: 1.3 }, edits: { 'A:0:1': 1.5, 'A:7:9': 1, 'B:2:2': 9 } } } }));
  assert.equal(restored.activeStyle, 'fixture');
  assert.equal(restored.styles.fixture.params.size, 1.3);
  assert.deepEqual(restored.styles.fixture.edits, { 'A:0:1': 1.5 });
});
