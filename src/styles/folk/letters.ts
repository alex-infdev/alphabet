import outlines from './ambicase-outlines.json' with { type: 'json' };
import { glyph, ink, flower, bloom, vine } from './model.ts';
import type { Anchor, FolkGlyph } from './model.ts';

/** Verified Ambicase outlines, with ornament composed in the actual counters
 * and at structural exits. The body and advances remain seed-independent. */
const arrangements: Record<string, { anchors: Anchor[]; note: string }> = {
  A: { anchors: [vine('curled-bowl',38,108,180,27,12,-1),flower('upper-counter',47,71,64)], note: 'Swept left bowl and heavy right diagonal; a sprig follows the low bowl.' },
  B: { anchors: [bloom('lower-bowl',49,106,180,21),flower('upper-bowl',45,53,64)], note: 'Unequal source bowls; the lower sprig and upper flower occupy distinct counter spaces.' },
  C: { anchors: [vine('rising-terminal',59,109,180,31,12),{...flower('bell-carving',65,50,67),knockout:true}], note: 'Deep crescent and inward bell; a sprig rises from the lower terminal.' },
  D: { anchors: [vine('curled-foot',45,109,180,43,12,-1),{...flower('outer-bowl-carving',78,76,66),knockout:true}], note: 'The curled foot feeds a tall interior branch; the outer bowl carries a small carving.' },
  E: { anchors: [vine('cupped-foot',56,109,180,28,12),{...flower('middle-hook-carving',59,74,66),knockout:true}], note: 'Hooked middle arm and cupped lower bowl; one branch fills the lower opening.' },
  F: { anchors: [vine('stem-exit',40,109,180,31,12),{...flower('head-carving',33,42,68),knockout:true}], note: 'Arched head and tall stem; a rising sprig fills the open lower field.' },
  G: { anchors: [vine('dropped-spur',50,128,180,30,12,-1),flower('open-counter',47,72,66)], note: 'Crescent, heavy dropped spur and low ball remain intact; ornament follows the descending return.' },
  H: { anchors: [vine('low-bridge',56,103,180,26,12),flower('arched-shoulder',60,51,65)], note: 'Rising bridge and asymmetric shoulder define separate ornamental fields.' },
  I: { anchors: [{...vine('foot-exit',43,110,180,29,12),size:7},{...flower('dot-carving',31,15,67),knockout:true}], note: 'Detached high dot and narrow bracketed stem; one branch is rooted at the foot.' },
  J: { anchors: [vine('hook-return',21,129,180,26,12,-1),{...flower('dot-carving',32,15,67),knockout:true}], note: 'High dot and leftward descender; a compact branch rises inside the hook.' },
  K: { anchors: [{...vine('kicked-leg',45,111,180,25,12),size:6.5},flower('upper-open',52,63,66)], note: 'Curled upper arm and heavy lower wedge; the sprig follows the leg return.' },
  L: { anchors: [vine('rising-foot',49,108,180,37,12),{...flower('stem-carving',27,70,68),knockout:true}], note: 'Rising curved foot opens into a tall sprig; the upright gets a small carved mark.' },
  M: { anchors: [vine('left-shoulder',48,108,180,29,12,-1),vine('right-shoulder',88,108,180,27,64)], note: 'Arched shoulders and enclosed central loop; sprigs occupy the side counters.' },
  N: { anchors: [vine('arched-entrance',42,108,180,30,12),{...flower('shoulder-carving',36,48,68),knockout:true}], note: 'Heavy curved entrance and fine right upright; a branch fills the lower opening.' },
  O: { anchors: [bloom('inner-oval',52,111,180,32),flower('inner-crown',52,54,65)], note: 'Unequal sidewalls and elongated counter; sprig and flower leave an open interval.' },
  P: { anchors: [vine('descending-foot',44,124,180,30,12),flower('upper-bowl',52,59,65)], note: 'Raised bowl and descending serif; ornament follows the lower opening.' },
  Q: { anchors: [vine('curled-tail',63,132,180,27,12,-1),flower('inner-bowl',48,67,65)], note: 'Internal upstroke and large curled tail remain clear, balanced by a counter flower.' },
  R: { anchors: [{...vine('waist-return',44,78,0,29,12),size:7},flower('upper-shoulder',53,54,65)], note: 'Shoulder narrows into the waist and outward leg; ornament follows these two gestures.' },
  S: { anchors: [bloom('lower-bell',38,110,180,23),{...flower('upper-bell-carving',55,49,67),knockout:true}], note: 'Unequal hooked bells; the lower sprig avoids the narrow diagonal waist.' },
  T: { anchors: [{...vine('hooked-foot',62,110,180,28,12,-1),size:7},{...flower('stem-carving',46,55,68),knockout:true}], note: 'Hanging canopy and curled foot; one branch returns along the foot.' },
  U: { anchors: [vine('inner-bowl',46,111,180,32,12),{...flower('right-stem-carving',81,73,68),knockout:true}], note: 'Lowercase-like bowl and heavy right upright; a planted sprig fills the bowl.' },
  V: { anchors: [{...bloom('point-return',52,110,180,33),size:5.6},{...flower('upper-bell-carving',73,42,67),knockout:true}], note: 'Fine rising curve and high ball terminal; a sprig follows the open wedge.' },
  W: { anchors: [{...vine('left-valley',51,111,180,29,12,-1),size:6.4},{...vine('right-valley',87,111,180,27,64),size:6.4}], note: 'Unequal paired sprigs follow the source valleys and fine rising strokes.' },
  X: { anchors: [vine('lower-return',48,110,180,24,12),flower('upper-wedge',48,55,65)], note: 'Heavy falling stroke and fine curled diagonals; ornament fills opposing wedges.' },
  Y: { anchors: [vine('descending-return',47,131,180,29,12,-1),flower('open-fork',57,64,65)], note: 'Fine right branch and long curled descender; a sprig follows the lower return.' },
  Z: { anchors: [bloom('lower-arm',49,110,180,21),{...flower('head-carving',55,38,68),knockout:true}], note: 'Diagonal ribbon and sloped wedge terminals; a low sprig fills the lower opening.' },
};

export const FOLK_LETTERS: Record<string, FolkGlyph> = Object.fromEntries(
  Object.entries(outlines.glyphs).map(([letter, source]) => [letter,
    { ...glyph(source.width, [ink(source.path)], arrangements[letter].anchors, arrangements[letter].note), advance: source.advance }]),
);
