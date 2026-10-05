import type { AlphabetStyle, RenderContext, TypedStyle, SoftPixelParameters, StyleState } from '../types';
import { glyphSvg, svgElement } from '../utils/svg';
import { ambicaseGlyph, ambicaseWidth, BASELINE, FONT_SCALE, GALLERY_WIDTH } from './ambicase';
import { CELL_STEP, GRID_LEFT, GRID_TOP, GRID_ROWS, gridColumns, softPixelModules } from '../utils/soft-pixel-model';

function glyphWidth(letter: string, state: StyleState): number {
  return ambicaseWidth(letter, Number(state.params.scale));
}

function renderGlyph({ letter, instance, layout, state, selected, interactive }: RenderContext): SVGSVGElement {
  letter = letter.toUpperCase();
  const glyph = ambicaseGlyph(letter);
  const p = state.params;
  const svg = glyphSvg(letter, 'Soft Pixel');
  const width = layout === 'word' ? glyphWidth(letter, state) : GALLERY_WIDTH;
  svg.setAttribute('viewBox', `0 0 ${width} 150`);
  const origin = (width - glyph.width * FONT_SCALE * Number(p.scale)) / 2;
  const group = svgElement('g', { transform: `translate(${origin} ${BASELINE}) scale(${p.scale})` });
  svg.append(group);
  if (interactive && layout !== 'word' && p.grid) {
    // A single path, in the very same transformed group as the modules.
    const columns = gridColumns(letter);
    const right = GRID_LEFT + columns * CELL_STEP;
    const bottom = GRID_TOP + GRID_ROWS * CELL_STEP;
    const lines = [];
    for (let column = 0; column <= columns; column++) {
      const x = GRID_LEFT + column * CELL_STEP;
      lines.push(`M${x} ${GRID_TOP}V${bottom}`);
    }
    for (let row = 0; row <= GRID_ROWS; row++) {
      const y = GRID_TOP + row * CELL_STEP;
      lines.push(`M${GRID_LEFT} ${y}H${right}`);
    }
    group.dataset.pixelGrid = letter;
    svg.classList.add('has-pixel-grid');
    group.append(svgElement('path', { d: lines.join(''), class: 'pixel-grid', 'aria-hidden': 'true', 'pointer-events': 'none' }));
    group.append(svgElement('rect', { class: 'pixel-grid-preview', width: CELL_STEP, height: CELL_STEP, visibility: 'hidden', 'aria-hidden': 'true', 'pointer-events': 'none' }));
  }
  for (const { id, row: y, column: x, width: w, height: h, x: px, y: py, rotation, offset } of softPixelModules(letter, state, instance)) {
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
  }
  // Keep selected modules above their neighbours while manually arranging them.
  for (const module of [...group.children]) if (module.classList.contains('is-selected')) group.append(module);
  return svg;
}

export const softPixel: AlphabetStyle = {
  id: 'soft-pixel', name: 'Soft Pixel', subtitle: 'Editable modules',
  description: 'Ambicase Modern, hand-charted in square tiles.',
  material: 'MODULES / CHARTED', editablePixels: true,
  defaults: { grid: false, snapToGrid: false, pixelSize: 13, gap: 1, radius: 0.08, scale: 0.95, spacing: 14, rowSpacing: 16, jitter: 0, rotation: 0, seed: 2048, labels: true } satisfies SoftPixelParameters,
  controls: [
    { type: 'toggle', key: 'grid', label: 'Grid' },
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
