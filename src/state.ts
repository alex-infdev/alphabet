import type { AlphabetStyle, Parameters, StyleState } from './types';
import { cleanWord, validPixelId } from './utils/composition.ts';

export const STORAGE_KEY = 'alphabet-lab:v1';
export type SavedState = { version: 1; activeStyle: string; styles: Record<string, StyleState>; word: string; wordMode: boolean };
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
  try { const parsed = JSON.parse(raw ?? '{}'); if (parsed?.version === 1) saved = parsed; } catch { /* Recover gracefully from invalid or old local data. */ }
  return {
    version: 1,
    word: typeof saved.word === 'string' ? cleanWord(saved.word) || 'GROW' : 'GROW',
    wordMode: saved.wordMode === true,
    activeStyle: styles.some(style => style.id === saved.activeStyle) ? saved.activeStyle! : styles[0].id,
    styles: Object.fromEntries(styles.map(style => {
      const previous = saved.styles?.[style.id];
      const edits = Object.fromEntries(Object.entries(previous?.edits ?? {}).filter(([key, value]) => validPixelId(key) && typeof value === 'number' && value >= 0.4 && value <= 1.8));
      const positions = Object.fromEntries(Object.entries(previous?.positions ?? {}).filter(([key, value]) => validPixelId(key) && value && Number.isFinite(value.x) && Number.isFinite(value.y) && Math.abs(value.x) <= 40 && Math.abs(value.y) <= 40));
      return [style.id, { params: sanitizeParams(style, previous?.params), edits, positions }];
    })),
  };
}
