import type { AlphabetStyle } from './types';
import { initialState, type SavedState } from './state.ts';
import { cleanWord, validPixelId } from './utils/composition.ts';
import { MAX_TEXT_LENGTH } from './styles/characters.ts';
import { isManualPixel, validAddedCell } from './utils/soft-pixel-model.ts';
export function parseConfiguration(text: string, styles: AlphabetStyle[]): SavedState {
  if (text.length > 2_000_000) throw new Error('Configuration is too large (maximum 2 MB).');
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('Invalid JSON. Check commas, quotes, and brackets.'); }
  if (!value || ![1, 2].includes(value.version)) throw new Error('Supported configuration versions are 1 and 2.');
  if (value.style) value = { version: value.version, activeStyle: value.style, word: value.word ?? 'GROW', wordMode: Boolean(value.word), styles: { [value.style]: { params: value.parameters, edits: value.pixelEdits, positions: value.pixelPositions, addedPixels: value.addedPixels, removedPixels: value.removedPixels } } };
  if (!styles.some(style => style.id === value.activeStyle)) throw new Error('Unknown or missing active style.');
  if (!value.styles || typeof value.styles !== 'object' || Array.isArray(value.styles)) throw new Error('Expected a styles object.');
  if (value.word !== undefined && (typeof value.word !== 'string' || !value.word.length || cleanWord(value.word) !== value.word)) throw new Error(`Text must contain 1-${MAX_TEXT_LENGTH} supported uppercase letters, symbols, or spaces.`);
  if (!Object.hasOwn(value.styles, value.activeStyle)) throw new Error('Missing state for the active style.');
  if (value.wordMode !== undefined && typeof value.wordMode !== 'boolean') throw new Error('wordMode must be true or false.');
  for (const [id, entry] of Object.entries(value.styles)) {
    const style = styles.find(style => style.id === id);
    if (!style) throw new Error(`Unknown style: ${id}.`);
    const data = entry as Record<string, unknown>;
    if (!data || typeof data !== 'object' || !data.params || typeof data.params !== 'object' || Array.isArray(data.params)) throw new Error(`${id}: expected parameters object.`);
    for (const [key, val] of Object.entries(data.params)) {
      const control = style.controls.find(control => control.key === key && control.type !== 'action');
      if (!control) throw new Error(`${id}: unknown parameter ${key}.`);
      if (typeof val !== typeof style.defaults[key]) throw new Error(`${key}: expected ${typeof style.defaults[key]}.`);
      if ((control.type === 'number' || control.type === 'range') && (typeof val !== 'number' || !Number.isFinite(val) || val < control.min || val > control.max)) throw new Error(`${key}: use a number from ${control.min} to ${control.max}.`);
      if (control.type === 'select' && !control.options.some(option => option.value === val)) throw new Error(`${key}: unsupported option.`);
    }
    for (const field of ['edits', 'positions']) {
      const entries = data[field]; if (entries === undefined) continue;
      if (!entries || typeof entries !== 'object' || Array.isArray(entries)) throw new Error(`${field}: expected an object.`);
      for (const [key, val] of Object.entries(entries)) {
        const normalized = value.version === 1 ? key.replace(/^[A-Z]+@/, 'w@') : key;
        if (!validPixelId(normalized)) throw new Error(`Invalid pixel ID: ${key}.`);
        if (field === 'edits' ? typeof val !== 'number' || !Number.isFinite(val) || val < .4 || val > 1.8 : !val || typeof val.x !== 'number' || typeof val.y !== 'number' || !Number.isFinite(val.x) || !Number.isFinite(val.y) || Math.abs(val.x) > 40 || Math.abs(val.y) > 40) throw new Error(`Invalid ${field} for ${key}.`);
      }
    }
    for (const field of ['addedPixels', 'removedPixels']) {
      const entries = data[field]; if (entries === undefined) continue;
      if (id !== 'soft-pixel' || !entries || typeof entries !== 'object' || Array.isArray(entries)) throw new Error(`${field}: expected a Soft Pixel object.`);
      for (const [key, cell] of Object.entries(entries)) {
        if (!validPixelId(key) || key.includes('@') || (field === 'addedPixels' ? !isManualPixel(key) || !validAddedCell(cell) : isManualPixel(key) || cell !== true)) throw new Error(`Invalid ${field} for ${key}.`);
      }
    }
  }
  return initialState(styles, JSON.stringify(value));
}
export const configurationJSON = (state: SavedState): string => JSON.stringify(state, null, 2);
export function shareURL(state: SavedState, base: string): string {
  const url = new URL(base); url.hash = 'config=' + encodeURIComponent(JSON.stringify(state));
  if (url.href.length > 8000) throw new Error('This configuration is too large for a compact link. Download a JSON file instead.');
  return url.href;
}
