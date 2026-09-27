import type { StyleState } from '../types';

export const cleanWord = (value: string): string => value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 16);
export const cleanAscii = (value: string): string => [...new Set(value.replace(/[^\x21-\x7e]/g, ''))].join('');
export const wordInstances = (word: string): string[] => [...word].map((letter, index) => `w@${index}:${letter}`);
export const basePixelId = (id: string): string => id.split(':').slice(-3).join(':');
export const instanceOf = (id: string): string => id.split(':').slice(0, -2).join(':');
export const letterOf = (instance: string): string => instance.slice(-1);
export const pixelScale = (state: StyleState, id: string): number => state.edits[id] ?? state.edits[basePixelId(id)] ?? 1;
export const pixelPosition = (state: StyleState, id: string): { x: number; y: number } => state.positions?.[id] ?? state.positions?.[basePixelId(id)] ?? { x: 0, y: 0 };
export const validPixelId = (id: string): boolean => /^(?:w@(?:[0-9]|1[0-5]):)?[A-Z]:[0-6]:[0-4]$/.test(id);

/** Retain only current occurrences; replaced letters cannot inherit unrelated overrides. */
export function pruneWordEdits(state: StyleState, word: string): void {
  const instances = new Set(wordInstances(word));
  for (const entries of [state.edits, state.positions ?? {}]) {
    for (const id of Object.keys(entries)) if (id.includes('@') && !instances.has(instanceOf(id))) delete entries[id];
  }
}
