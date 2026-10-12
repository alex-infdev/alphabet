import type { AlphabetStyle, StyleState } from '../types';
import { LETTERS, SYMBOLS, DIGITS, VISIBLE_CHARACTERS, glyphKey } from '../styles/characters';
import { cachedGlyphs, glyphKeys, reconcileChildren, saveGlyphs } from './glyph-cache';

export function renderAlphabet(container: HTMLElement, style: AlphabetStyle, state: StyleState, selected: Set<string>, focused: string | null): void {
  const previous = container.classList.contains('word-canvas') ? new Map() : cachedGlyphs(container);
  container.className = `alphabet ${focused ? 'is-focused' : ''} ${state.params.labels ? '' : 'hide-labels'}`;
  container.style.setProperty('--letter-gap', `${state.params.spacing}px`);
  container.style.setProperty('--row-gap', `${state.params.rowSpacing}px`);
  const next: ReturnType<typeof cachedGlyphs> = new Map();
  const keyFor = glyphKeys(style, state, selected, focused ? 'focused' : 'alphabet');
  const children: Element[] = [];
  for (const letter of focused ? [focused] : VISIBLE_CHARACTERS) {
    if (!focused && [LETTERS[0], SYMBOLS[0], DIGITS[0]].includes(letter)) {
      const heading = document.createElement('h2'); heading.className = 'glyph-section-title';
      heading.textContent = letter === LETTERS[0] ? 'A–Z' : letter === SYMBOLS[0] ? 'Symbols' : 'Numbers';
      children.push(heading);
    }
    const instance = glyphKey(letter);
    const key = keyFor(instance);
    const cached = previous.get(instance);
    if (cached?.key === key) { children.push(cached.element); next.set(instance, cached); continue; }
    const cell = document.createElement('article');
    cell.className = 'glyph-cell';
    cell.dataset.letter = letter;
    cell.dataset.section = LETTERS.includes(letter) ? 'letters' : SYMBOLS.includes(letter) ? 'symbols' : 'numbers';
    const open = document.createElement('button');
    open.className = 'glyph-open';
    open.dataset.focus = letter;
    open.setAttribute('aria-label', `Focus letter ${letter}`);
    const label = document.createElement('span'); label.textContent = letter;
    const arrow = document.createElement('span'); arrow.className = 'focus-symbol'; arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '↗';
    open.append(label, arrow);
    const svg = style.renderGlyph({ letter, state, selected, interactive: Boolean(focused && style.editablePixels) });
    if (!style.editablePixels) {
      const artButton = document.createElement('button');
      artButton.className = 'glyph-art-button'; artButton.dataset.focus = letter;
      artButton.setAttribute('aria-label', `Focus letter ${letter}`);
      artButton.append(svg); cell.append(artButton);
    } else cell.append(svg);
    cell.append(open);
    next.set(instance, { key, element: cell });
    children.push(cell);
  }
  reconcileChildren(container, children);
  saveGlyphs(container, next);
}
