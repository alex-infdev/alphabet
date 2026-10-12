import type { AlphabetStyle, StyleState } from '../types';
import { svgElement } from '../utils/svg';
import { wordInstances } from '../utils/composition';
import { wordLayout } from '../utils/word-layout';
import { cachedGlyphs, glyphKeys, reconcileChildren, saveGlyphs } from './glyph-cache';

export function renderWord(container: HTMLElement, style: AlphabetStyle, state: StyleState, selected: Set<string>, word: string): void {
  const wasWord = container.classList.contains('word-canvas');
  const previous = wasWord ? cachedGlyphs(container) : new Map();
  const next: ReturnType<typeof cachedGlyphs> = new Map();
  const keyFor = glyphKeys(style, state, selected, 'word');
  container.className = 'alphabet word-canvas';
  const { width, glyphs } = wordLayout(style, state, word);
  const svg = wasWord ? container.querySelector<SVGSVGElement>('.word-svg')! : svgElement('svg', { class: 'word-svg' });
  svg.setAttribute('viewBox', `0 0 ${width} 262`);
  svg.setAttribute('aria-label', `Word ${word}, ${style.name}`);
  svg.style.minWidth = `${Math.max(320, width)}px`;
  const children: SVGSVGElement[] = [];
  wordInstances(word).forEach((instance, index) => {
    const key = keyFor(instance);
    const cached = previous.get(instance);
    const glyph = cached?.key === key ? cached.element as SVGSVGElement
      : style.renderGlyph({ letter: word[index], instance, layout: 'word', state, selected, interactive: Boolean(style.editablePixels) });
    glyph.setAttribute('x', String(glyphs[index].x)); glyph.setAttribute('y', '56');
    glyph.setAttribute('width', String(glyphs[index].width)); glyph.setAttribute('height', '150');
    glyph.removeAttribute('class'); glyph.style.overflow = 'visible';
    children.push(glyph);
    next.set(instance, { key, element: glyph });
  });
  reconcileChildren(svg, children);
  if (!wasWord) container.replaceChildren(svg);
  saveGlyphs(container, next);
}
