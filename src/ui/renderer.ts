import type { AlphabetStyle, StyleState } from '../types';
import { LETTERS, SYMBOLS, DIGITS, VISIBLE_CHARACTERS, glyphKey } from '../styles/characters';

const cache = new WeakMap<HTMLElement, Map<string, { key: string; cell: HTMLElement }>>();

/** Direct SVG selection/drag updates bypass rendering and must invalidate its snapshots. */
export function invalidateAlphabet(container: HTMLElement): void { cache.delete(container); }

export function renderAlphabet(container: HTMLElement, style: AlphabetStyle, state: StyleState, selected: Set<string>, focused: string | null): void {
  container.className = `alphabet ${focused ? 'is-focused' : ''} ${state.params.labels ? '' : 'hide-labels'}`;
  container.style.setProperty('--letter-gap', `${state.params.spacing}px`);
  container.style.setProperty('--row-gap', `${state.params.rowSpacing}px`);
  const previous = cache.get(container) ?? new Map();
  const next = new Map<string, { key: string; cell: HTMLElement }>();
  const { spacing: _spacing, rowSpacing: _rowSpacing, labels: _labels, ...geometry } = state.params;
  const fragment = document.createDocumentFragment();
  for (const letter of focused ? [focused] : VISIBLE_CHARACTERS) {
    if (!focused && [LETTERS[0], SYMBOLS[0], DIGITS[0]].includes(letter)) {
      const heading = document.createElement('h2'); heading.className = 'glyph-section-title';
      heading.textContent = letter === LETTERS[0] ? 'A–Z' : letter === SYMBOLS[0] ? 'Symbols' : 'Numbers';
      fragment.append(heading);
    }
    const prefix = `${glyphKey(letter)}:`;
    const key = JSON.stringify([style.id, Boolean(focused), geometry,
      Object.entries(state.edits).filter(([id]) => id.startsWith(prefix)),
      Object.entries(state.positions ?? {}).filter(([id]) => id.startsWith(prefix)),
      [...selected].filter(id => id.startsWith(prefix))]);
    const cached = previous.get(letter);
    if (cached?.key === key) { fragment.append(cached.cell); next.set(letter, cached); continue; }
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
    next.set(letter, { key, cell });
    fragment.append(cell);
  }
  container.replaceChildren(fragment);
  cache.set(container, next);
}
