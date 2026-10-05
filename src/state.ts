import type { AlphabetStyle, Parameters, StyleState } from './types';
import { cleanWord, validPixelId, pruneWordEdits } from './utils/composition.ts';
import { isManualPixel, validAddedCell } from './utils/soft-pixel-model.ts';

export const STORAGE_KEY = 'alphabet-lab:v1';
export type SavedState = { version: 2; activeStyle: string; styles: Record<string, StyleState>; word: string; wordMode: boolean };
export function sanitizeParams(style: AlphabetStyle, input: unknown): Parameters {
  const result = { ...style.defaults };
  if (!input || typeof input !== 'object') return result;
  const values = input as Record<string, unknown>;
  for (const control of style.controls) {
    const value = values[control.key];
    if ((control.type === 'range' || control.type === 'number') && typeof value === 'number' && Number.isFinite(value)) {
      const clamped = Math.min(control.max, Math.max(control.min, value));
      result[control.key] = Number((control.min + Math.round((clamped - control.min) / control.step) * control.step).toFixed(4));
    } else if (control.type === 'toggle' && typeof value === 'boolean') result[control.key] = value;
    else if (control.type === 'select' && typeof value === 'string' && control.options.some(option => option.value === value)) result[control.key] = value;
    else if (control.type === 'text' && typeof value === 'string') result[control.key] = control.sanitize(value);
  }
  return result;
}
export function initialState(styles: AlphabetStyle[], raw: string | null): SavedState {
  let saved: Partial<SavedState> = {};
  try { const parsed = JSON.parse(raw ?? '{}'); if ((parsed?.version === 1 || parsed?.version === 2)) saved = parsed; } catch { /* Recover gracefully from invalid or old local data. */ }
  return {
    version: 2,
    word: typeof saved.word === 'string' ? cleanWord(saved.word) || 'GROW' : 'GROW',
    wordMode: saved.wordMode === true,
    activeStyle: styles.some(style => style.id === saved.activeStyle) ? saved.activeStyle! : styles[0].id,
    styles: Object.fromEntries(styles.map(style => {
      const previous = saved.styles?.[style.id];
      const migrate = (input: unknown): Record<string, unknown> => {
        if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
        const result: Record<string, unknown> = {};
        for (let [id, value] of Object.entries(input)) {
          if (/^[A-Z]+@/.test(id)) {
            if (!id.startsWith(`${saved.word}@`)) continue;
            id = id.replace(/^[A-Z]+@/, 'w@');
          }
          result[id] = value;
        }
        return result;
      };
      const edits: StyleState['edits'] = {};
      const positions: NonNullable<StyleState['positions']> = {};
      for (const [id, value] of Object.entries(migrate(previous?.edits))) {
        if (validPixelId(id) && typeof value === 'number' && Number.isFinite(value) && value >= .4 && value <= 1.8) edits[id] = value;
      }
      for (const [id, value] of Object.entries(migrate(previous?.positions))) {
        if (!validPixelId(id) || !value || typeof value !== 'object') continue;
        const { x, y } = value as Record<string, unknown>;
        if (typeof x === 'number' && typeof y === 'number' && Number.isFinite(x) && Number.isFinite(y) && Math.abs(x) <= 40 && Math.abs(y) <= 40) positions[id] = { x, y };
      }
      const state: StyleState = { params: sanitizeParams(style, previous?.params), edits, positions };
      if (style.id === 'soft-pixel') {
        if (previous?.addedPixels && typeof previous.addedPixels === 'object') {
          state.addedPixels = {};
          for (const [id, cell] of Object.entries(previous.addedPixels)) {
            if (validPixelId(id) && !id.includes('@') && isManualPixel(id) && validAddedCell(cell)) state.addedPixels[id] = { row: cell.row, column: cell.column };
          }
        }
        if (previous?.removedPixels && typeof previous.removedPixels === 'object') {
          state.removedPixels = {};
          for (const [id, removed] of Object.entries(previous.removedPixels)) {
            if (validPixelId(id) && !id.includes('@') && !isManualPixel(id) && removed === true) state.removedPixels[id] = true;
          }
        }
      }
      pruneWordEdits(state, typeof saved.word === 'string' ? cleanWord(saved.word) : 'GROW');
      return [style.id, state];
    })),
  };
}
