import type { StyleState } from '../types';
import { nudgePixelOffset } from '../utils/pixel-grid';
import { pixelPosition } from '../utils/composition';
export function nudgePixels(state: StyleState, selected: Iterable<string>, key: string, step: number): void {
  state.positions ??= {};
  for (const id of selected) {
    const position = pixelPosition(state, id);
    state.positions[id] = {
      x: nudgePixelOffset(state, position.x, key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : 0, step, id),
      y: nudgePixelOffset(state, position.y, key === 'ArrowUp' ? -1 : key === 'ArrowDown' ? 1 : 0, step, id),
    };
  }
}
