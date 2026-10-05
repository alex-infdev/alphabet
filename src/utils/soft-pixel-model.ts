import type { AddedPixel, StyleState } from '../types.ts';
import { ambicaseGlyph, FONT_SCALE } from '../styles/ambicase.ts';
import { glyphKey } from '../styles/characters.ts';
import { basePixelId, pixelPosition, pixelScale } from './composition.ts';
import { seededRandom } from './random.ts';

// The authored charts (letters and symbols) share this font-unit coordinate system.
export const CELL_UNITS = 32;
export const CELL_STEP = CELL_UNITS * FONT_SCALE;
export const GRID_LEFT = -64 * FONT_SCALE;
export const GRID_TOP = -832 * FONT_SCALE;
export const GRID_ROWS = 32;
export const GRID_COLUMNS = 31;
export const isManualPixel = (id: string): boolean => /:0:m(?:0|[1-9][0-9]{0,3})$/.test(basePixelId(id));
export const validAddedCell = (value: unknown): value is AddedPixel => {
  if (!value || typeof value !== 'object') return false;
  const { row, column } = value as AddedPixel;
  return Number.isInteger(row) && row >= 0 && row < GRID_ROWS && Number.isInteger(column) && column >= 0 && column < GRID_COLUMNS;
};
export function gridColumns(letter: string): number {
  const glyph = ambicaseGlyph(letter.toUpperCase());
  const occupied = Object.values(glyph.rows).flat().map(([column, , , width]) => column + Math.ceil(width / CELL_UNITS));
  return Math.min(GRID_COLUMNS, Math.max(Math.ceil(glyph.width / CELL_UNITS) + 2, ...occupied));
}
export function cellPosition(cell: AddedPixel): { x: number; y: number } {
  return { x: GRID_LEFT + cell.column * CELL_STEP, y: GRID_TOP + cell.row * CELL_STEP };
}
/** Input is in the renderer's inner glyph group, after undoing its screen CTM. */
export function pointToCell(letter: string, point: { x: number; y: number }): AddedPixel | null {
  const cell = { column: Math.floor((point.x - GRID_LEFT) / CELL_STEP + 1e-9), row: Math.floor((point.y - GRID_TOP) / CELL_STEP + 1e-9) };
  return validAddedCell(cell) && cell.column < gridColumns(letter) ? cell : null;
}
export type PixelModule = { id: string; row: number; column: number; left: number; top: number; cellWidth: number; cellHeight: number; x: number; y: number; width: number; height: number; rotation: number; offset: { x: number; y: number } };
/** Rendering and occupied-cell detection use exactly the same resolved geometry. */
export function softPixelModules(letter: string, state: StyleState, instance?: string): PixelModule[] {
  letter = letter.toUpperCase();
  const prefix = glyphKey(letter);
  const random = seededRandom(Number(state.params.seed) + letter.charCodeAt(0) * 7919);
  const modules: PixelModule[] = [];
  function resolve(base: string, row: number, column: number, left: number, top: number, cellWidth: number, cellHeight: number, manual: boolean) {
    const id = instance ? `${instance}:${base.split(':').slice(-2).join(':')}` : base;
    // Consume the original random sequence even for removed modules.
    const jx = manual ? 0 : (random() - .5) * Number(state.params.jitter);
    const jy = manual ? 0 : (random() - .5) * Number(state.params.jitter);
    const rotation = manual ? 0 : (random() - .5) * 2 * Number(state.params.rotation);
    if (state.removedPixels?.[base]) return;
    const size = Number(state.params.pixelSize) / 13 * pixelScale(state, id);
    const gutter = Number(state.params.gap) * .28;
    modules.push({ id, row, column, left, top, cellWidth, cellHeight,
      x: left + cellWidth / 2 + jx, y: top + cellHeight / 2 + jy,
      width: Math.max(cellWidth * .55, cellWidth - gutter) * size,
      height: Math.max(cellHeight * .55, cellHeight - gutter) * size,
      rotation, offset: pixelPosition(state, id) });
  }
  for (const [row, cells] of Object.entries(ambicaseGlyph(letter).rows)) for (const [column, x, y, width, height] of cells) {
    resolve(`${prefix}:${row}:${column}`, Number(row), column, x * FONT_SCALE, y * FONT_SCALE, width * FONT_SCALE, height * FONT_SCALE, false);
  }
  for (const [id, cell] of Object.entries(state.addedPixels ?? {})) if (id.startsWith(`${prefix}:`)) {
    const { x, y } = cellPosition(cell);
    resolve(id, cell.row, cell.column, x, y, CELL_STEP, CELL_STEP, true);
  }
  return modules;
}
export function emptyCell(letter: string, state: StyleState, cell: AddedPixel): boolean {
  if (!validAddedCell(cell) || cell.column >= gridColumns(letter)) return false;
  const { x, y } = cellPosition(cell);
  const overlaps = (left: number, top: number, width: number, height: number) => left < x + CELL_STEP - 1e-7 && left + width > x + 1e-7 && top < y + CELL_STEP - 1e-7 && top + height > y + 1e-7;
  return !softPixelModules(letter, state).some(module => {
    const { offset } = module;
    if (overlaps(module.left + offset.x, module.top + offset.y, module.cellWidth, module.cellHeight)) return true;
    const radians = module.rotation * Math.PI / 180;
    const width = Math.abs(Math.cos(radians)) * module.width + Math.abs(Math.sin(radians)) * module.height;
    const height = Math.abs(Math.sin(radians)) * module.width + Math.abs(Math.cos(radians)) * module.height;
    return overlaps(module.x + offset.x - width / 2, module.y + offset.y - height / 2, width, height);
  });
}
export function addPixel(letter: string, state: StyleState, cell: AddedPixel): string | null {
  letter = letter.toUpperCase();
  if (!emptyCell(letter, state, cell)) return null;
  state.addedPixels ??= {};
  const prefix = `${glyphKey(letter)}:0:m`;
  let serial = 0;
  while (state.addedPixels[`${prefix}${serial}`]) serial++;
  if (serial > 9999) return null;
  const id = `${prefix}${serial}`;
  state.addedPixels[id] = { ...cell };
  return id;
}
function clearOverrides(state: StyleState, base: string) {
  for (const entries of [state.edits, state.positions ?? {}]) for (const id of Object.keys(entries)) if (basePixelId(id) === base) delete entries[id];
}
export function removePixels(state: StyleState, ids: Iterable<string>): void {
  for (const selected of ids) {
    const base = basePixelId(selected);
    if (isManualPixel(base)) delete state.addedPixels?.[base];
    else { state.removedPixels ??= {}; state.removedPixels[base] = true; }
    clearOverrides(state, base);
  }
}
export function resetGlyph(state: StyleState, letter: string): void {
  const prefix = `${glyphKey(letter.toUpperCase())}:`;
  for (const entries of [state.addedPixels ?? {}, state.removedPixels ?? {}, state.edits, state.positions ?? {}]) {
    for (const id of Object.keys(entries)) if (basePixelId(id).startsWith(prefix)) delete entries[id];
  }
}
