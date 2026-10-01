import type { AlphabetStyle, StyleState } from '../types';
import { svgElement } from '../utils/svg';
import { wordInstances } from '../utils/composition';
import { wordLayout } from '../utils/word-layout';

export function renderWord(container: HTMLElement, style: AlphabetStyle, state: StyleState, selected: Set<string>, word: string): void {
  container.className = 'alphabet word-canvas';
  const { width, glyphs } = wordLayout(style, state, word);
  const svg = svgElement('svg', { viewBox: `0 0 ${width} 262`, class: 'word-svg', 'aria-label': `Word ${word}, ${style.name}` });
  svg.style.minWidth = `${Math.max(320, width)}px`;
  wordInstances(word).forEach((instance, index) => {
    const glyph = style.renderGlyph({ letter: word[index], instance, layout: 'word', state, selected, interactive: Boolean(style.editablePixels) });
    glyph.setAttribute('x', String(glyphs[index].x)); glyph.setAttribute('y', '56');
    glyph.setAttribute('width', String(glyphs[index].width)); glyph.setAttribute('height', '150');
    glyph.removeAttribute('class'); glyph.style.overflow = 'visible';
    svg.append(glyph);
  });
  container.replaceChildren(svg);
}
