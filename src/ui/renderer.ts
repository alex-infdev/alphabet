import type { AlphabetStyle, StyleState } from '../types';
import { LETTERS } from '../styles/glyphs';

export function renderAlphabet(container: HTMLElement, style: AlphabetStyle, state: StyleState, selected: Set<string>, focused: string | null): void {
  container.className = `alphabet ${focused ? 'is-focused' : ''} ${state.params.labels ? '' : 'hide-labels'}`;
  container.style.setProperty('--letter-gap', `${state.params.spacing}px`);
  container.style.setProperty('--row-gap', `${state.params.rowSpacing}px`);
  const fragment = document.createDocumentFragment();
  for (const letter of focused ? [focused] : LETTERS) {
    const cell = document.createElement('article');
    cell.className = 'glyph-cell';
    cell.dataset.letter = letter;
    const open = document.createElement('button');
    open.className = 'glyph-open';
    open.dataset.focus = letter;
    open.setAttribute('aria-label', `Focus letter ${letter}`);
    open.innerHTML = `<span>${letter}</span><span class="focus-symbol" aria-hidden="true">↗</span>`;
    const svg = style.renderGlyph({ letter, state, selected, interactive: Boolean(focused && style.editablePixels) });
    if (!style.editablePixels) {
      const artButton = document.createElement('button');
      artButton.className = 'glyph-art-button'; artButton.dataset.focus = letter;
      artButton.setAttribute('aria-label', `Focus letter ${letter}`);
      artButton.append(svg); cell.append(artButton);
    } else cell.append(svg);
    cell.append(open);
    fragment.append(cell);
  }
  if (!focused) {
    const colophon = document.createElement('div');
    colophon.className = 'specimen-colophon';
    colophon.innerHTML = '<span class="colophon-flower" aria-hidden="true">✳</span><span>26 letters.<br>Endless possibilities.</span>';
    fragment.append(colophon);
  }
  container.replaceChildren(fragment);
}
