import outlines from './botanical-marks.json' with { type: 'json' };
import { svgElement } from '../utils/svg';

export const ASCII_OUTLINES: Record<string, string> = outlines;
/** Existing Courier-shaped ASCII material, frozen as centered vector outlines. */
export function asciiMark(char: string, x: number, y: number, size: number, angle = 0, opacity = 1): SVGPathElement {
  return svgElement('path', { d: ASCII_OUTLINES[char], 'data-ascii': char,
    transform: `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle.toFixed(1)}) scale(${size / 1000})`,
    // A small outline compensates for the loss of font hinting at 6-8px.
    fill: 'currentColor', stroke: 'currentColor', 'stroke-width': 20, 'stroke-linejoin': 'round', opacity });
}
