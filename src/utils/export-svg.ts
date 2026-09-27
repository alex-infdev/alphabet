import type { AlphabetStyle, StyleState } from '../types';
import { svgElement } from './svg';
import { wordInstances } from './composition';

export interface SvgExportOptions {
  letters: string[];
  ink: string;
  background?: string;
  word?: string;
}

/** A standalone, still vector specimen with one editable group per letter. */
export function exportSvg(style: AlphabetStyle, state: StyleState, options: SvgExportOptions): string {
  const letters = (options.word ? [...options.word] : [...new Set(options.letters)]).filter(letter => /^[A-Z]$/.test(letter));
  if (!letters.length) throw new Error('Choose at least one letter from A to Z.');
  const columns = options.word ? letters.length : Math.min(7, letters.length);
  const rows = Math.ceil(letters.length / columns);
  const gapX = Number(state.params.spacing ?? 14);
  const gapY = Number(state.params.rowSpacing ?? 16);
  const padding = 56;
  const width = padding * 2 + columns * 120 + (columns - 1) * gapX;
  const height = padding * 2 + rows * 150 + (rows - 1) * gapY;
  const svg = svgElement('svg', { viewBox: `0 0 ${width} ${height}`, width, height, fill: options.ink, color: options.ink });
  const title = svgElement('title');
  title.textContent = `${style.name} / ${letters.join('')}`;
  const description = svgElement('desc');
  description.textContent = 'Alphabet Lab. Editable vector artwork. Botanical characters remain text in Courier New, with a monospace fallback. Exported in the still pose.';
  const metadata = svgElement('metadata');
  metadata.textContent = JSON.stringify({ version: 2, style: style.id, letters, word: options.word, parameters: state.params, pixelEdits: state.edits, pixelPositions: state.positions });
  svg.append(title, description, metadata);
  if (options.background) svg.append(svgElement('rect', { width, height, fill: options.background }));

  // Render from state rather than cloning the UI: no selection, animation, or
  // dependency on the current viewport. The live specimen is never mutated.
  const stillState = { ...state, params: { ...state.params, windEnabled: false } };
  letters.forEach((letter, index) => {
    const glyph = style.renderGlyph({ letter, instance: options.word ? wordInstances(options.word)[index] : undefined, state: stillState, selected: new Set(), interactive: false });
    glyph.querySelectorAll('.pixel-outline').forEach(outline => outline.remove());
    glyph.querySelectorAll('.pixel-shape').forEach(pixel => pixel.setAttribute('fill', options.ink));
    for (const element of [glyph, ...glyph.querySelectorAll('*')]) {
      if (element.getAttribute('fill') === 'currentColor') element.setAttribute('fill', options.ink);
      element.removeAttribute('class');
      element.removeAttribute('tabindex');
      element.removeAttribute('role');
      element.removeAttribute('aria-pressed');
    }
    const group = svgElement('g', {
      id: options.word ? `letter-${index}-${letter}` : `letter-${letter}`,
      transform: `translate(${padding + (index % columns) * (120 + gapX)} ${padding + Math.floor(index / columns) * (150 + gapY)})`,
    });
    group.append(...Array.from(glyph.childNodes));
    svg.append(group);
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}`;
}

export function downloadSvg(source: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.append(link);
  link.click(); link.remove();
  // Leave the object URL alive long enough for the browser to start the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
