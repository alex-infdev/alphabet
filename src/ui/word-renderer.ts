import type { AlphabetStyle, StyleState } from '../types';
import { svgElement } from '../utils/svg';
import { wordInstances } from '../utils/composition';

export function renderWord(container: HTMLElement, style: AlphabetStyle, state: StyleState, selected: Set<string>, word: string): void {
  container.className = 'alphabet word-canvas';
  const pitch = 120 + Number(state.params.spacing);
  const width = word.length * pitch - Number(state.params.spacing) + 112;
  const svg = svgElement('svg', { viewBox: `0 0 ${width} 262`, class: 'word-svg', 'aria-label': `Word ${word}, ${style.name}` });
  svg.style.minWidth = `${Math.max(320, word.length * 100)}px`;
  wordInstances(word).forEach((instance, index) => {
    const glyph = style.renderGlyph({ letter: word[index], instance, state, selected, interactive: Boolean(style.editablePixels) });
    glyph.setAttribute('x', String(56 + index * pitch)); glyph.setAttribute('y', '56');
    glyph.setAttribute('width', '120'); glyph.setAttribute('height', '150');
    glyph.removeAttribute('class'); glyph.style.overflow = 'visible';
    svg.append(glyph);
  });
  container.replaceChildren(svg);
}
