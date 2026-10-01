export type Parameters = Record<string, number | string | boolean>;
export type RangeControl = { type: 'range' | 'number'; key: string; label: string; min: number; max: number; step: number; unit?: string };
export type Control = (RangeControl
  | { type: 'text'; key: string; label: string; help: string; sanitize: (value: string) => string }
  | { type: 'toggle'; key: string; label: string }
  | { type: 'select'; key: string; label: string; options: { value: string; label: string }[] }
  | { type: 'action'; key: string; label: string }) & { group?: 'layout' | 'wind' };
export type PixelEdits = Record<string, number>;
export type StyleState = { params: Parameters; edits: PixelEdits; positions?: Record<string, { x: number; y: number }> };
export type Scope = 'selection' | 'letter' | 'alphabet';
export type RenderContext = { letter: string; instance?: string; layout?: 'word'; state: StyleState; selected: ReadonlySet<string>; interactive: boolean };
export interface AlphabetStyle {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  material: string;
  defaults: Parameters;
  controls: Control[];
  editablePixels?: boolean;
  glyphWidth?: (letter: string, state: StyleState) => number;
  specimenWidth?: number;
  renderGlyph(context: RenderContext): SVGSVGElement;
  randomize?: (random: () => number) => Partial<Parameters>;
}

export type LayoutParameters = { seed: number; spacing: number; rowSpacing: number; scale: number; labels: boolean };
export type SoftPixelParameters = LayoutParameters & { snapToGrid: boolean; pixelSize: number; gap: number; radius: number; jitter: number; rotation: number };
export type BotanicalParameters = LayoutParameters & { characters: string; density: number; growth: number; branching: number; flowers: number; distortion: number; lineHeight: number; windEnabled: boolean; windIntensity: number; windDirection: string; windSpeed: number };
type KeysOfType<P, V> = { [K in keyof P]: P[K] extends V ? K : never }[keyof P] & string;
export type TypedControl<P> = Control extends infer C ? C extends Control ? Omit<C, 'key'> & { key: C['type'] extends 'action' ? string : C['type'] extends 'range' | 'number' ? KeysOfType<P, number> : C['type'] extends 'toggle' ? KeysOfType<P, boolean> : KeysOfType<P, string> } : never : never;
export type TypedStyle<P extends Parameters> = Omit<AlphabetStyle, 'defaults' | 'controls' | 'renderGlyph' | 'randomize'> & {
  defaults: P; controls: TypedControl<P>[];
  renderGlyph(context: Omit<RenderContext, 'state'> & { state: Omit<StyleState, 'params'> & { params: P } }): SVGSVGElement;
  randomize?: (random: () => number) => Partial<P>;
};
