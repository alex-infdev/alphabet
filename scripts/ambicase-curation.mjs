// Reviewed against dev/ambicase.html at a common baseline and scale.
// These are local outline corrections, not a shared serif skeleton.
// merge: [first row, last row, source column, receiving column].
// drop: [row, column] for isolated sampling specks on curved boundaries.
export const curation = {
  A: { drop: [[23,13]], merge: [[25,25,9,8]], note: 'Keep the swept lower-left bowl separate from the heavy right diagonal.' },
  B: { drop: [[15,16],[23,18]], merge: [[8,8,9,8],[8,8,10,11]], note: 'Two unequal bowls; remove flecks at their narrow meeting.' },
  C: { drop: [[7,16],[23,4]], merge: [[11,11,13,14]], note: 'Round top terminal and open lower-right wedge, not a circular C.' },
  D: { drop: [[13,20],[20,5],[20,15]], merge: [[7,7,3,4]], note: 'Preserve the curled left foot inside the large asymmetric bowl.' },
  E: { drop: [[25,6]], merge: [[7,7,2,3]], note: 'Middle hook and curved lower arm are independent of the top serif.' },
  F: { drop: [[7,16]], merge: [[13,15,9,8],[18,24,9,8]], note: 'Hooked cap above a lowercase-like stem; absorb the stem boundary sliver.' },
  G: { drop: [[8,5],[20,13]], merge: [[14,25,18,17]], note: 'Heavy right descender and low ball terminal; retain the open upper bowl.' },
  H: { merge: [[15,15,10,11]], note: 'The curved rising bridge sits below the conventional uppercase crossbar.' },
  I: { merge: [[4,4,5,6]], note: 'Keep the detached high dot and narrow serif stem at their original heights.' },
  J: { drop: [[27,0],[28,5]], merge: [[7,7,12,11]], note: 'Dot is independent; leftward hook extends beyond the advance origin.' },
  K: { drop: [[13,17],[17,10]], merge: [[25,25,12,13]], note: 'Curved upper diagonal ends in a ball; lower diagonal remains a heavy wedge.' },
  L: { merge: [[24,24,12,13]], note: 'Retain rising curved foot rather than replacing it with a square serif.' },
  M: { drop: [[7,8],[8,20],[9,22],[24,18]], merge: [[11,24,27,26]], note: 'Preserve both arched shoulders and the central enclosed descending loop.' },
  N: { merge: [[11,24,4,5],[10,17,18,19],[10,24,20,19]], note: 'Arched heavy left entrance contrasts with a genuinely thin right upright.' },
  O: { drop: [[6,10],[21,8],[23,9]], merge: [[15,18,21,20]], note: 'Unequal curved sides, narrow top and bottom, elongated counter.' },
  P: { drop: [[17,14]], merge: [[16,16,19,18]], note: 'Bowl joins the tall stem well above its below-baseline serif.' },
  Q: { drop: [[18,8]], merge: [[13,15,7,6],[25,25,15,16]], note: 'Internal thin upstroke flows into a separate large curled descender.' },
  R: { drop: [[6,12],[6,15],[8,18]], merge: [[14,14,9,8]], note: 'Shoulder curls into a narrow waist and outward curved heavy leg.' },
  S: { drop: [[13,9],[14,11],[15,13],[17,7],[18,9],[19,11]], merge: [[10,10,16,15]], note: 'Remove sampling flecks along both sides of the calligraphic diagonal.' },
  T: { drop: [[9,5],[23,12],[25,16]], merge: [[7,13,2,3]], note: 'Hanging head serifs and a hooked baseline foot instead of a straight uppercase T.' },
  U: { drop: [[24,13]], merge: [[8,20,4,5],[7,7,22,21],[25,25,22,21]], note: 'Lowercase-like bowl retains its heavy right stem and projecting baseline serif.' },
  V: { drop: [[8,14],[16,11]], merge: [[7,7,10,9]], note: 'Hairline curved right stroke ends in a ball; retain narrow pointed bottom.' },
  W: { drop: [[14,5],[21,14],[25,9]], merge: [[25,25,12,11],[25,25,21,20]], note: 'Two heavy diagonals, thin rising strokes, and the high right ball terminal.' },
  X: { drop: [[8,14],[11,15],[18,9],[19,16]], merge: [[7,7,2,3]], note: 'Both thin diagonals curl into terminals, unlike a symmetric crossed skeleton.' },
  Y: { drop: [[8,20],[12,17],[18,9],[27,16]], merge: [[29,29,10,11]], note: 'Thin right branch meets the heavy diagonal, which curls well below baseline.' },
  Z: { drop: [[10,11],[14,14],[22,4]], merge: [[24,24,12,13]], note: 'Heavy diagonal and thin horizontal arms retain sloped wedge terminals.' },
};

export function curate(glyphs) {
  for (const [letter, edits] of Object.entries(curation)) {
    const rows = glyphs[letter].rows;
    for (const [row, col] of edits.drop ?? []) {
      if (!rows[row]?.some(cell => cell[0] === col)) throw new Error(`Missing drop ${letter}:${row}:${col}`);
      rows[row] = rows[row].filter(cell => cell[0] !== col);
    }
    for (const [first, last, from, to] of edits.merge ?? []) for (let row = first; row <= last; row++) {
      const source = rows[row]?.find(cell => cell[0] === from);
      const target = rows[row]?.find(cell => cell[0] === to);
      if (!source || !target) throw new Error(`Missing merge ${letter}:${row}:${from}->${to}`);
      const x = Math.min(source[1], target[1]), y = Math.min(source[2], target[2]);
      const right = Math.max(source[1] + source[3], target[1] + target[3]);
      const bottom = Math.max(source[2] + source[4], target[2] + target[4]);
      target.splice(1, 4, x, y, right - x, bottom - y);
      rows[row] = rows[row].filter(cell => cell !== source);
    }
  }
  return glyphs;
}
