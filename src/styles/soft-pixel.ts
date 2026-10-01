import type { AlphabetStyle, RenderContext, TypedStyle, SoftPixelParameters, StyleState } from '../types';
import { seededRandom } from '../utils/random';
import { glyphSvg, svgElement } from '../utils/svg';
import { ambicaseGlyph, ambicaseWidth, BASELINE, FONT_SCALE, GALLERY_WIDTH } from './ambicase';
import { pixelPosition, pixelScale } from '../utils/composition';
import { glyphKey } from './characters';

function glyphWidth(letter: string, state: StyleState): number {
  return ambicaseWidth(letter, Number(state.params.scale));
}

function renderGlyph({ letter, instance, layout, state, selected, interactive }: RenderContext): SVGSVGElement {
  letter = letter.toUpperCase();
  const glyph = ambicaseGlyph(letter);
  const p = state.params;
  const random = seededRandom(Number(p.seed) + letter.charCodeAt(0) * 7919);
  const svg = glyphSvg(letter, 'Soft Pixel');
  const width = layout === 'word' ? glyphWidth(letter, state) : GALLERY_WIDTH;
  svg.setAttribute('viewBox', `0 0 ${width} 150`);
  const origin = (width - glyph.width * FONT_SCALE * Number(p.scale)) / 2;
  const group = svgElement('g', { transform: `translate(${origin} ${BASELINE}) scale(${p.scale})` });
  svg.append(group);
  Object.entries(glyph.rows).forEach(([row, cells]) => cells.forEach(([x, left, top, cellWidth, cellHeight]) => {
    const y = Number(row);
    const id = `${instance ?? glyphKey(letter)}:${y}:${x}`;
    const size = Number(p.pixelSize) / 13 * pixelScale(state, id);
    // Fine seams separate the full chart tiles, including single-cell hairlines.
    const gutter = Number(p.gap) * 0.28;
    const w = Math.max(cellWidth * FONT_SCALE * 0.55, cellWidth * FONT_SCALE - gutter) * size;
    const h = Math.max(cellHeight * FONT_SCALE * 0.55, cellHeight * FONT_SCALE - gutter) * size;
    const offset = pixelPosition(state, id);
    const px = (left + cellWidth / 2) * FONT_SCALE + (random() - 0.5) * Number(p.jitter);
    const py = (top + cellHeight / 2) * FONT_SCALE + (random() - 0.5) * Number(p.jitter);
    const rotation = (random() - 0.5) * 2 * Number(p.rotation);
    const module = svgElement('g', { transform: `translate(${offset.x} ${offset.y})`, 'data-pixel': id, class: `pixel${selected.has(id) ? ' is-selected' : ''}` });
    const shape = svgElement('g', { transform: `translate(${px} ${py}) rotate(${rotation})` });
    if (interactive) {
      module.setAttribute('role', 'button');
      module.setAttribute('tabindex', '0');
      module.setAttribute('aria-label', `${letter}, pixel row ${y + 1}, column ${x + 1}`);
      module.setAttribute('aria-pressed', String(selected.has(id)));
    }
    const radius = Math.min(w, h) * Number(p.radius) / 2;
    shape.append(svgElement('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: radius, class: 'pixel-shape' }));
    shape.append(svgElement('rect', { x: -w / 2 - 0.6, y: -h / 2 - 0.6, width: w + 1.2, height: h + 1.2, rx: radius + 0.6, class: 'pixel-outline' }));
    module.append(shape);
    group.append(module);
  }));
  // Keep selected modules above their neighbours while manually arranging them.
  for (const module of [...group.children]) if (module.classList.contains('is-selected')) group.append(module);
  return svg;
}

export const softPixel: AlphabetStyle = {
  id: 'soft-pixel', name: 'Soft Pixel', subtitle: 'Editable modules',
  description: 'Ambicase Modern, hand-charted in square tiles.',
  material: 'MODULES / CHARTED', editablePixels: true,
  defaults: { snapToGrid: false, pixelSize: 13, gap: 1, radius: 0.08, scale: 0.95, spacing: 14, rowSpacing: 16, jitter: 0, rotation: 0, seed: 2048, labels: true } satisfies SoftPixelParameters,
  controls: [
    { type: 'toggle', key: 'snapToGrid', label: 'Snap to grid (5 units)' },
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
  ] satisfies TypedStyle<SoftPixelParameters>['controls'],
  renderGlyph,
  glyphWidth, specimenWidth: GALLERY_WIDTH,
  randomize: random => ({ radius: 0.2 + random() * 0.7, jitter: random() * 4, rotation: random() * 14, gap: random() * 2 }),
};
