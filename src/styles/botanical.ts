import type { AlphabetStyle, RenderContext, TypedStyle, BotanicalParameters } from '../types';
import { seededRandom } from '../utils/random';
import { glyphSvg, svgElement } from '../utils/svg';
import { SKELETONS } from './glyphs';
import { configureWind } from './botanical-wind';
import './botanical-wind.css';
import { cleanAscii } from '../utils/composition';

function renderGlyph({ letter, state }: RenderContext): SVGSVGElement {
  const p = state.params;
  const palette = cleanAscii(String(p.characters ?? ''));
  const characterRandom = seededRandom(Number(p.seed) + letter.charCodeAt(0) * 1597);
  const random = seededRandom(Number(p.seed) + letter.charCodeAt(0) * 7919);
  const svg = glyphSvg(letter, 'Botanical ASCII');
  const scale = Number(p.scale);
  const group = svgElement('g', { transform: `translate(60 75) scale(${scale} ${scale * Number(p.lineHeight)}) translate(-60 -75)`, fill: 'currentColor', 'font-family': '"Courier New", monospace', 'text-anchor': 'middle' });
  svg.append(group);
  const sway = svgElement('g');
  group.append(sway);
  let branch = sway;
  const draw = (char: string, x: number, y: number, size: number, angle = 0, opacity = 1) => {
    const text = svgElement('text', { x: x.toFixed(2), y: y.toFixed(2), 'font-size': size, opacity, transform: `rotate(${angle.toFixed(1)} ${x.toFixed(2)} ${y.toFixed(2)})` });
    text.textContent = palette ? palette[Math.floor(characterRandom() * palette.length)] : char;
    branch.append(text);
  };
  for (const path of SKELETONS[letter]) {
    branch = svgElement('g');
    sway.append(branch);
    for (let i = 1; i < path.length; i++) {
      const [ax, ay] = path[i - 1];
      const [bx, by] = path[i];
      const dx = (bx - ax) * 18, dy = (by - ay) * 17;
      const length = Math.hypot(dx, dy);
      const steps = Math.ceil(length / (5.8 - Number(p.density) * 2.1));
      const nx = -dy / length, ny = dx / length;
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        const bend = (Math.sin(t * Math.PI * 3 + ax) * 1.6 + (random() - 0.5) * 3) * Number(p.distortion);
        const x = 24 + ax * 18 + dx * t + nx * bend;
        const y = 27 + ay * 17 + dy * t + ny * bend;
        const vertical = Math.abs(dy) > Math.abs(dx) * 1.7;
        const stem = vertical ? ['|', ':', ';', ')', '('] : Math.abs(dy) < 3 ? ['~', '-', ':', "'"] : dx * dy > 0 ? ['\\', ';', '`'] : ['/', ':', "'"];
        draw(stem[Math.floor(random() * stem.length)], x, y, 6.6 + random() * 1.3);
        if (random() < Number(p.density) * 0.8) {
          const side = random() > 0.5 ? 1 : -1;
          draw(random() > 0.5 ? '(' : ')', x + nx * side * 3.4, y + ny * side * 3.4, 6.4, (random() - 0.5) * 35, 0.85);
        }
        if (random() < Number(p.growth) * 0.46) {
          const side = random() > 0.5 ? 1 : -1;
          const reach = 3 + random() * 7 * Number(p.growth);
          draw(side > 0 ? '/' : '\\', x + nx * side * reach * 0.5, y + ny * side * reach * 0.5, 7, 0, 0.8);
          draw(['v', '^', ')', '(', "'"][Math.floor(random() * 5)], x + nx * side * reach, y + ny * side * reach, 6.5, 0, 0.85);
          if (random() < Number(p.branching)) draw(':', x + nx * side * (reach + 3), y + ny * side * (reach + 3) - 2, 7, 0, 0.6);
        }
        if (random() < Number(p.flowers) * 0.28) {
          const fx = x + (random() - 0.5) * 7, fy = y - random() * 4;
          draw(random() > 0.6 ? 'o' : '*', fx, fy, 8.2);
          if (random() < Number(p.flowers)) { draw('.', fx - 3.6, fy - 3, 6); draw("'", fx + 3.6, fy + 2, 6); }
        }
      }
    }
  }
  configureWind(sway, p, letter);
  return svg;
}

export const botanical: AlphabetStyle = {
  id: 'botanical', name: 'Botanical ASCII', subtitle: 'ASCII letterforms',
  description: 'Letterforms built from ASCII characters.',
  material: 'CHARACTERS / ORGANIC',
  defaults: { characters: '', density: 0.72, growth: 0.6, branching: 0.45, flowers: 0.42, distortion: 0.45, spacing: 14, rowSpacing: 16, scale: 0.95, lineHeight: 1, seed: 2048, labels: true, windEnabled: false, windIntensity: 40, windDirection: 'left', windSpeed: 1 } satisfies BotanicalParameters,
  controls: [
    { type: 'text', key: 'characters', label: 'ASCII character palette', help: 'Visible ASCII only. Leave empty for the botanical mix.', sanitize: cleanAscii },
    { type: 'toggle', key: 'windEnabled', label: 'Animate wind', group: 'wind' },
    { type: 'range', key: 'windIntensity', label: 'Wind intensity', min: 0, max: 100, step: 1, unit: '%', group: 'wind' },
    { type: 'select', key: 'windDirection', label: 'Blowing from', group: 'wind', options: [
      { value: 'left', label: 'Left →' }, { value: 'right', label: 'Right ←' },
      { value: 'top', label: 'Above ↓' }, { value: 'bottom', label: 'Below ↑' },
      { value: 'top-left', label: 'Upper left ↘' }, { value: 'top-right', label: 'Upper right ↙' },
      { value: 'bottom-left', label: 'Lower left ↗' }, { value: 'bottom-right', label: 'Lower right ↖' },
    ] },
    { type: 'range', key: 'windSpeed', label: 'Gust speed', min: 0.5, max: 2, step: 0.05, unit: '×', group: 'wind' },
    { type: 'range', key: 'density', label: 'Character density', min: 0.15, max: 1, step: 0.01 },
    { type: 'range', key: 'growth', label: 'Growth', min: 0, max: 1, step: 0.01 },
    { type: 'range', key: 'branching', label: 'Branching', min: 0, max: 1, step: 0.01 },
    { type: 'range', key: 'flowers', label: 'Flower density', min: 0, max: 1, step: 0.01 },
    { type: 'range', key: 'distortion', label: 'Organic distortion', min: 0, max: 1, step: 0.01 },
    { type: 'range', key: 'scale', label: 'Glyph scale', min: 0.65, max: 1.1, step: 0.01, unit: '×', group: 'layout' },
    { type: 'range', key: 'lineHeight', label: 'Line height', min: 0.8, max: 1.08, step: 0.01, unit: '×', group: 'layout' },
    { type: 'range', key: 'spacing', label: 'Letter spacing', min: 0, max: 40, step: 1, unit: 'px', group: 'layout' },
    { type: 'range', key: 'rowSpacing', label: 'Row spacing', min: 0, max: 48, step: 1, unit: 'px', group: 'layout' },
    { type: 'number', key: 'seed', label: 'Random seed', min: 0, max: 999999, step: 1 },
    { type: 'toggle', key: 'labels', label: 'Show letter labels', group: 'layout' },
    { type: 'action', key: 'regenerate', label: 'Regenerate' },
  ] satisfies TypedStyle<BotanicalParameters>['controls'],
  renderGlyph,
  randomize: random => ({ density: 0.45 + random() * 0.5, growth: 0.2 + random() * 0.8, branching: random(), flowers: 0.15 + random() * 0.8, distortion: random() * 0.85 }),
};
