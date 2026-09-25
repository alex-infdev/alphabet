import type { AlphabetStyle, RenderContext } from '../types';
import { seededRandom } from '../utils/random';
import { glyphSvg, svgElement } from '../utils/svg';
import { BITMAPS } from './glyphs';
import { pixelPosition, pixelScale } from '../utils/composition';

function renderGlyph({ letter, instance, state, selected, interactive }: RenderContext): SVGSVGElement {
  const p = state.params;
  const random = seededRandom(Number(p.seed) + letter.charCodeAt(0) * 7919);
  const svg = glyphSvg(letter, 'Soft Pixel');
  const group = svgElement('g', { transform: `translate(60 75) scale(${p.scale})` });
  svg.append(group);
  const pitch = 14 + Number(p.gap);
  BITMAPS[letter].forEach((row, y) => [...row].forEach((bit, x) => {
    if (bit === '0') return;
    const id = `${instance ?? letter}:${y}:${x}`;
    const size = Number(p.pixelSize) * pixelScale(state, id);
    const offset = pixelPosition(state, id);
    const px = (x - 2) * pitch + (random() - 0.5) * Number(p.jitter);
    const py = (y - 3) * pitch + (random() - 0.5) * Number(p.jitter);
    const rotation = (random() - 0.5) * 2 * Number(p.rotation);
    const module = svgElement('g', { transform: `translate(${offset.x} ${offset.y})`, 'data-pixel': id, class: `pixel${selected.has(id) ? ' is-selected' : ''}` });
    const shape = svgElement('g', { transform: `translate(${px} ${py}) rotate(${rotation})` });
    if (interactive) {
      module.setAttribute('role', 'button');
      module.setAttribute('tabindex', '0');
      module.setAttribute('aria-label', `${letter}, pixel row ${y + 1}, column ${x + 1}`);
      module.setAttribute('aria-pressed', String(selected.has(id)));
    }
    shape.append(svgElement('rect', { x: -size / 2, y: -size / 2, width: size, height: size, rx: size * Number(p.radius) / 2, class: 'pixel-shape' }));
    shape.append(svgElement('rect', { x: -size / 2 - 2, y: -size / 2 - 2, width: size + 4, height: size + 4, rx: size * Number(p.radius) / 2 + 2, class: 'pixel-outline' }));
    module.append(shape);
    group.append(module);
  }));
  // Keep selected modules above their neighbours while manually arranging them.
  for (const module of [...group.children]) if (module.classList.contains('is-selected')) group.append(module);
  return svg;
}

export const softPixel: AlphabetStyle = {
  id: 'soft-pixel', name: 'Soft Pixel', subtitle: 'Small modules. Infinite expressions.',
  description: 'A geometric alphabet with a softer side. Select a module, reshape a letter, make it your own.',
  material: 'MODULES / GEOMETRIC', editablePixels: true,
  defaults: { pixelSize: 13, gap: 1, radius: 0.5, scale: 0.95, spacing: 14, rowSpacing: 16, jitter: 0, rotation: 0, seed: 2048, labels: true },
  controls: [
    { type: 'range', key: 'pixelSize', label: 'Pixel size', min: 7, max: 16, step: 0.1, unit: 'px' },
    { type: 'range', key: 'gap', label: 'Module gap', min: 0, max: 3, step: 0.1, unit: 'px' },
    { type: 'range', key: 'radius', label: 'Corner radius', min: 0, max: 1, step: 0.01 },
    { type: 'range', key: 'scale', label: 'Glyph scale', min: 0.65, max: 1.1, step: 0.01, unit: '×', group: 'layout' },
    { type: 'range', key: 'spacing', label: 'Letter spacing', min: 0, max: 40, step: 1, unit: 'px', group: 'layout' },
    { type: 'range', key: 'rowSpacing', label: 'Row spacing', min: 0, max: 48, step: 1, unit: 'px', group: 'layout' },
    { type: 'range', key: 'jitter', label: 'Position jitter', min: 0, max: 6, step: 0.1, unit: 'px' },
    { type: 'range', key: 'rotation', label: 'Rotation jitter', min: 0, max: 20, step: 1, unit: '°' },
    { type: 'number', key: 'seed', label: 'Random seed', min: 0, max: 999999, step: 1 },
    { type: 'toggle', key: 'labels', label: 'Show letter labels', group: 'layout' },
    { type: 'action', key: 'regenerate', label: 'Regenerate' },
  ],
  renderGlyph,
  randomize: random => ({ radius: 0.2 + random() * 0.7, jitter: random() * 4, rotation: random() * 14, gap: random() * 2 }),
};
