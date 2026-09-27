import type { StyleState } from '../types';

export const GRID_STEP = 5;
export const POSITION_LIMIT = 40;
const clamp = (value: number): number => Math.max(-POSITION_LIMIT, Math.min(POSITION_LIMIT, value));

/** Offsets use glyph coordinates, independent of viewport size and zoom. */
export function constrainPixelOffset(state: StyleState, value: number): number {
  return clamp(state.params.snapToGrid ? Math.round(value / GRID_STEP) * GRID_STEP : value);
}

export function nudgePixelOffset(state: StyleState, value: number, direction: number, steps: number): number {
  if (!direction) return value;
  if (!state.params.snapToGrid) return clamp(value + direction * steps);
  // First move reaches the next grid line in the requested direction, even from a freehand offset.
  const cell = direction > 0 ? Math.floor(value / GRID_STEP) : Math.ceil(value / GRID_STEP);
  return clamp((cell + direction * steps) * GRID_STEP);
}
