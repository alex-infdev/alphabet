import type { StyleState } from '../types';
import { CELL_STEP, isManualPixel } from './soft-pixel-model.ts';

export const GRID_STEP = 5;
export const POSITION_LIMIT = 40;
const clamp = (value: number): number => Math.max(-POSITION_LIMIT, Math.min(POSITION_LIMIT, value));

/** Offsets use glyph coordinates, independent of viewport size and zoom. */
export function constrainPixelOffset(state: StyleState, value: number, id?: string): number {
  if (id && isManualPixel(id)) {
    const limit = Math.floor(POSITION_LIMIT / CELL_STEP);
    return Math.max(-limit, Math.min(limit, Math.round(value / CELL_STEP))) * CELL_STEP;
  }
  return clamp(state.params.snapToGrid ? Math.round(value / GRID_STEP) * GRID_STEP : value);
}

export function nudgePixelOffset(state: StyleState, value: number, direction: number, steps: number, id?: string): number {
  if (!direction) return value;
  if (id && isManualPixel(id)) return constrainPixelOffset(state, value + direction * steps * CELL_STEP, id);
  if (!state.params.snapToGrid) return clamp(value + direction * steps);
  // First move reaches the next grid line in the requested direction, even from a freehand offset.
  const cell = direction > 0 ? Math.floor(value / GRID_STEP) : Math.ceil(value / GRID_STEP);
  return clamp((cell + direction * steps) * GRID_STEP);
}
