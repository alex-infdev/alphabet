import type { AlphabetStyle, StyleState } from '../types.ts';

/** Shared by live composition and SVG export. Styles without metrics keep their existing layout. */
export function wordLayout(style: Pick<AlphabetStyle, 'glyphWidth'>, state: StyleState, word: string) {
  const spacing = Number(state.params.spacing ?? 14);
  let cursor = 56;
  const glyphs = [...word.toUpperCase()].map(letter => {
    const width = style.glyphWidth?.(letter, state) ?? 120;
    const result = { letter, x: cursor, width };
    cursor += width + spacing;
    return result;
  });
  return { glyphs, width: cursor - (glyphs.length ? spacing : 0) + 56 };
}
