export type Point = [number, number];
export type Shape = { d: string; stroke?: number; role?: string; motif?: 'dot' | 'rosette' | 'leaf' };
export type Anchor = {
  name: string;
  kind: 'dots' | 'flower' | 'vine';
  at: Point;
  /** Direction out from the attachment; local ornament grows along +y. */
  angle?: number;
  length?: number;
  stage: number;
  side?: 1 | -1;
  knockout?: boolean;
};
export type FolkGlyph = { width: number; base: Shape[]; anchors: Anchor[]; note: string };
export const ink = (d: string): Shape => ({ d });
export const line = (d: string, stroke = 2.2): Shape => ({ d, stroke });
export const dot = (x: number, y: number, r: number): Shape => ({...ink(`M${x-r} ${y}C${x-r} ${y-r*1.34} ${x+r} ${y-r*1.34} ${x+r} ${y}C${x+r} ${y+r*1.34} ${x-r} ${y+r*1.34} ${x-r} ${y}Z`),motif:'dot'});
export const glyph = (width: number, base: Shape[], anchors: Anchor[], note: string): FolkGlyph => ({ width, base, anchors, note });
export const dots = (name: string, x: number, y: number, angle = 0, stage = 16): Anchor => ({ name, kind: 'dots', at: [x,y], angle, stage });
export const flower = (name: string, x: number, y: number, stage = 31): Anchor => ({ name, kind: 'flower', at: [x,y], stage });
export const vine = (name: string, x: number, y: number, angle: number, length: number, stage = 30, side: 1|-1 = 1): Anchor => ({ name, kind: 'vine', at:[x,y],angle,length,stage,side });
