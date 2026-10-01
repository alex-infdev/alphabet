import data from './ambicase-modules.json' with { type: 'json' };
import { SOFT_SYMBOLS } from './soft-pixel-symbols.ts';
import { glyphKey } from './characters.ts';

export interface AmbicaseGlyph {
  width: number;
  height: number;
  bounds: { x1: number; y1: number; x2: number; y2: number };
  /** row -> [column, x, y, width, height], in font units with SVG-downward y. */
  rows: Record<string, number[][]>;
}
export const AMBICASE = data as Record<string, AmbicaseGlyph>;
export const FONT_SCALE = 0.13;
export const BASELINE = 120;
export const GALLERY_WIDTH = 134;
export const ambicaseGlyph = (letter: string): AmbicaseGlyph => AMBICASE[letter.toUpperCase()] ?? SOFT_SYMBOLS[letter];
// Eight units of padding on each side accommodate J's negative left bearing at maximum scale.
export const ambicaseWidth = (letter: string, scale: number): number => ambicaseGlyph(letter).width * FONT_SCALE * scale + 16;
export function ambicasePixelIds(letter: string): string[] {
  return Object.entries(ambicaseGlyph(letter)?.rows ?? {}).flatMap(([row, cells]) => cells.map(([col]) => `${glyphKey(letter.toUpperCase())}:${row}:${col}`));
}
