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
export type RenderContext = { letter: string; instance?: string; state: StyleState; selected: ReadonlySet<string>; interactive: boolean };
export interface AlphabetStyle {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  material: string;
  defaults: Parameters;
  controls: Control[];
  editablePixels?: boolean;
  renderGlyph(context: RenderContext): SVGSVGElement;
  randomize?: (random: () => number) => Partial<Parameters>;
}
