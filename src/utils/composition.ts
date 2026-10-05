import type { StyleState } from '../types';
import { isSupported, glyphKey, characterFromKey, MAX_TEXT_LENGTH } from '../styles/characters.ts';

export const cleanWord = (value: string): string => [...value.replace(/[a-z]/g, char => char.toUpperCase())].filter(isSupported).slice(0, MAX_TEXT_LENGTH).join('');
export const cleanAscii = (value: string): string => [...new Set(value.replace(/[^\x21-\x7e]/g, ''))].join('');
export const wordInstances = (word: string): string[] => [...word].map((letter, index) => `w@${index}:${glyphKey(letter)}`);
export const basePixelId = (id: string): string => id.split(':').slice(-3).join(':');
export const instanceOf = (id: string): string => id.split(':').slice(0, -2).join(':');
export const letterOf = (instance: string): string => characterFromKey(instance.split(':').at(-1)!);
export const pixelScale = (state: StyleState, id: string): number => state.edits[id] ?? state.edits[basePixelId(id)] ?? 1;
export const pixelPosition = (state: StyleState, id: string): { x: number; y: number } => state.positions?.[id] ?? state.positions?.[basePixelId(id)] ?? { x: 0, y: 0 };
export const validPixelId = (id: string): boolean => {
  const match = /^(?:w@(0|[1-9][0-9]*):)?([A-Z]|u[0-9a-f]{4}):([0-9]|[12][0-9]|3[01]):([0-9]|[12][0-9]|30|m(?:0|[1-9][0-9]{0,3}))$/.exec(id);
  if (!match || (match[1] !== undefined && Number(match[1]) >= MAX_TEXT_LENGTH)) return false;
  if (match[4].startsWith('m') && match[3] !== '0') return false;
  const char = characterFromKey(match[2]);
  return char !== ' ' && isSupported(char) && glyphKey(char) === match[2];
};

/** Retain only current occurrences; replaced letters cannot inherit unrelated overrides. */
export function pruneWordEdits(state: StyleState, word: string): void {
  const instances = new Set(wordInstances(word));
  for (const entries of [state.edits, state.positions ?? {}]) {
    for (const id of Object.keys(entries)) if (id.includes('@') && !instances.has(instanceOf(id))) delete entries[id];
  }
}
