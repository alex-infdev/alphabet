import { glyph, ink, line, dot, dots, flower, vine } from './model.ts';
import type { FolkGlyph } from './model.ts';

/** Original contours, authored in a common cap 24 / baseline 112 coordinate system.
 * Large black forms and hairline structures are explicit, separately quantizable
 * components. Each counter, terminal and anchor is composed for this glyph. */
export const FOLK_LETTERS: Record<string, FolkGlyph> = {
  C: glyph(82, [
    ink('M70 34C65 16 33 19 20 39C10 53 9 85 20 102C30 119 56 120 72 103L69 99C51 115 31 108 29 83C26 63 29 39 40 29C49 21 60 25 62 31C53 27 48 34 51 40C54 48 68 47 70 34Z'),
    ink('M67 92L72 89L72 110L65 109Z'),
  ], [dots('outer-spine',7,62),flower('open-bowl',49,72),vine('baseline-exit',57,111,-65,35,34),vine('upper-terminal',66,26,135,20,72)], 'Narrow left black crescent, generous bowl, inward bell terminal and rising foot.'),
  U: glyph(83, [
    ink('M12 24L37 24L34 30L34 88C34 107 40 115 49 114C30 126 17 112 17 91L17 30L10 29Z'),
    line('M66 28L66 85C66 110 53 120 40 113',2.5),
    ink('M56 24L76 24L77 29L68 30L64 35L63 29L56 29Z'),
    ink('M11 24L14 19L18 24Z'),
  ], [dots('left-of-stem',9,43),vine('bowl-exit',44,114,-75,35,30),vine('inner-upright',55,99,180,43,30,-1)], 'Monumental left upright paired with a fine descending right stroke and deep bowl.'),
  L: glyph(72, [
    ink('M10 24L38 24L35 30L35 102C35 111 48 114 57 106L66 91L68 111C45 119 22 110 9 114L9 109L18 106L18 30L10 29Z'),
    ink('M35 95C31 111 35 123 46 127C33 130 24 124 23 111Z'),
  ], [dots('outside-stem',10,42),vine('inner-serif',43,103,180,55,28),flower('foot-counter',53,99,67)], 'Tall slab with a sunk keel below the baseline and a compact rising beak.'),
  T: glyph(86, [
    ink('M9 24C27 27 53 26 77 21L76 44L72 44C68 29 60 28 54 29L54 111C54 122 47 130 36 128C46 124 35 117 36 107L36 29C23 28 16 31 12 46L8 46Z'),
    ink('M28 111C27 123 19 125 16 119C14 115 20 110 23 115C24 107 14 107 12 114C9 128 30 134 41 124L40 112Z'),
  ], [dots('above-cap',26,15,90),vine('left-of-stem',28,106,180,44,28,-1),vine('right-of-stem',61,106,180,44,34),flower('head-aperture',63,39,72)], 'Broad curved canopy, heavy descending spine, and unequal double-hooked foot.'),
  R: glyph(88, [
    ink('M10 24L40 24L36 30L36 110L43 112L43 116L9 114L9 110L18 107L18 30L10 29Z'),
    ink('M35 37C42 10 77 17 77 43C77 58 64 67 48 67C66 66 65 97 76 105L84 102L84 108C61 123 52 103 50 84C48 70 44 68 35 68L35 64C55 66 62 51 59 36C56 22 43 23 35 43Z'),
  ], [dots('left-stem',9,43),flower('upper-counter',47,44),vine('leg-exit',73,108,-70,22,58),dots('lower-counter',44,86,0,78)], 'Open asymmetric shoulder with a tight waist and an outward kicked heavy leg.'),
  E: glyph(76, [
    ink('M10 24L65 24L67 43L63 43C57 28 49 27 34 29L34 61L51 61L57 50L60 51L59 78L55 78C54 67 45 66 34 67L34 107C49 117 62 106 68 91L71 93L68 113L9 114L9 110L18 106L18 30L10 29Z'),
    ink('M34 28L42 22L58 24L58 27Z'),
  ], [dots('cap-rhythm',44,16,90),flower('lower-counter',49,88),vine('lower-terminal',63,109,-80,20,59),vine('middle-joint',41,64,5,25,75)], 'Uneven arms, recessed waist, high beak and cupped lower arm around an eccentric counter.'),
  A: glyph(90, [
    ink('M43 23L49 21L80 106L87 111L86 115L56 114L55 110L63 107L42 44L37 30Z'),
    line('M42 33L17 107',2.7),
    ink('M7 109L17 104L25 106L31 114L7 114Z'),
    line('M24 83C35 77 48 81 60 79',2.5),
    ink('M43 23C33 30 25 38 24 45C19 37 27 22 43 23Z'),
  ], [dots('upper-counter',38,60),flower('lower-counter',40,95,35),vine('crossbar-exit',24,82,20,31,56,-1),vine('left-foot',17,109,-85,34,78)], 'Offset sharp crown, bowed hairline leg, heavy right wedge and scalloped low crossbar.'),
  B: glyph(88, [
    ink('M10 24L40 24L36 30L36 108L44 113L10 114L10 110L18 106L18 30L10 29Z'),
    ink('M35 27C60 15 77 28 76 44C75 55 64 61 51 62C82 61 84 87 73 104C64 118 47 120 34 108L36 104C54 119 64 105 63 87C62 70 54 63 35 65L35 60C54 61 61 53 59 39C58 26 49 24 35 32Z'),
    ink('M20 26C10 18 1 27 5 34C10 40 17 31 11 29C17 32 19 30 20 26Z'),
  ], [flower('lower-bowl',48,87),dots('outside-stem',9,45),vine('upper-joint',40,27,80,25,58),vine('bowl-exit',67,104,-50,24,80)], 'Small raised top bowl over a deep drop-shaped lower bowl, not two identical lobes.'),
  D: glyph(92, [
    ink('M11 24L41 24L37 29L37 104L29 115L10 114L10 110L19 106L19 30L11 29Z'),
    ink('M36 27C62 13 86 35 86 66C86 100 65 122 35 112L36 107C60 116 69 88 67 61C65 35 56 23 36 32Z'),
    ink('M22 29C10 37 5 34 8 28C10 25 14 27 14 30C19 28 21 26 22 29Z'),
  ], [vine('inner-stem',47,103,180,57,34),{ ...flower('outer-bowl',73,71,67), knockout: true },dots('below-serif',23,123,90,20)], 'Narrow structural slab and inflated right bowl, with a small backward cap hook.'),
  F: glyph(76, [
    ink('M10 24L68 23L67 47L63 47C61 29 48 28 35 29L35 61L50 61L56 51L59 51L58 80L54 80C53 67 44 66 35 67L35 106L47 113L47 117L9 114L9 110L18 106L18 30L10 29Z'),
  ], [dots('outside-spine',9,43),vine('open-lower-arm',46,108,180,32,33),flower('upper-counter',49,43,60),vine('head-exit',65,26,135,21,79)], 'Overhanging canopy and low spurred foot with a large open lower-right field.'),
  G: glyph(90, [
    ink('M72 34C66 18 38 18 23 37C9 54 9 85 21 104C30 119 51 120 63 108L59 104C40 115 30 101 29 78C27 57 32 34 44 28C53 23 61 26 63 31C53 29 51 35 54 41C59 49 73 44 72 34Z'),
    ink('M52 69L83 69L83 74L75 77L75 108C74 129 57 137 45 128C56 132 59 120 58 108L58 77L52 74Z'),
  ], [flower('open-counter',46,70),dots('outer-crescent',7,61),vine('descending-spur',60,115,-95,29,55),vine('cap-exit',65,26,130,21,78)], 'Crescent bowl with a heavy dropped right spur and low return hook.'),
  H: glyph(89, [
    ink('M9 24L37 24L34 30L34 107L41 112L41 116L9 114L9 110L17 107L17 30L9 29Z'),
    ink('M55 24L81 24L80 29L73 32L73 108L83 111L83 115L52 115L52 111L58 106L58 30L54 29Z'),
    line('M33 77C40 61 48 58 60 62',3),
  ], [vine('bridge',43,69,0,30,33),dots('right-shoulder',80,44),flower('upper-bridge',46,43,65)], 'Unequal pillars joined by a low climbing bridge, leaving the upper interior open.'),
  I: glyph(48, [
    ink('M8 24L39 24L39 29L32 33L32 105L41 111L41 115L7 114L7 110L16 105L16 32L8 29Z'),
    ink('M16 26L21 20L32 24L28 28Z'),
  ], [dots('outside-left',8,45),vine('right-serif',34,108,180,38,44),{ ...flower('stem-foot',24,99,80), knockout: true }], 'Compressed ceremonial pillar, diagonal cap notch and projecting lower bracket.'),
  J: glyph(59, [
    ink('M23 24L52 24L52 29L45 32L45 100C45 122 30 132 16 125C3 119 5 104 14 104C24 104 25 114 18 118C29 123 30 106 29 94L29 32L23 29Z'),
  ], [dots('above-head',30,16,90),vine('inside-hook',22,112,180,33,37,-1),flower('upper-spine',38,44,78)], 'Long dropped fishhook, inward ball terminal and an offset high cap.'),
  K: glyph(89, [
    ink('M9 24L37 24L34 30L34 107L42 112L42 116L9 114L9 110L17 106L17 30L9 29Z'),
    line('M34 79C57 68 67 51 69 34',3),
    dot(68,31,6),
    ink('M43 72C57 62 63 98 78 107L86 108L86 113C65 120 57 105 51 89L43 80L34 81L34 77Z'),
  ], [flower('upper-junction',47,50),dots('outside-spine',9,47),vine('kicked-leg',71,108,-60,25,59),vine('inside-leg',43,81,0,27,80)], 'A climbing bowed arm with a bell tip balances a broad, low kicked leg.'),
  M: glyph(111, [
    ink('M9 24L33 24L57 79L80 24L102 24L102 29L94 32L94 106L103 112L103 116L72 114L72 110L78 105L78 38L55 92L50 93L28 41L28 103L36 111L36 115L9 114L9 110L17 105L17 31L9 29Z'),
    line('M55 90C64 104 58 119 49 116C43 113 46 101 51 98',2.4),
  ], [dots('left-negative',9,48),vine('inner-left',37,102,180,38,35,-1),vine('inner-right',68,102,180,38,57),flower('low-loop',52,109,82)], 'Broad planted shoulders, a deep central notch and a small structural descending loop.'),
  N: glyph(91, [
    ink('M10 25C22 17 31 23 36 35L73 112L62 116L24 39C19 29 17 26 10 30Z'),
    line('M18 30L18 107',2.8),
    line('M72 29L72 113',2.6),
    ink('M8 110L18 103L30 111L30 115L8 115Z'),
    ink('M62 24L83 24L83 28L74 32L70 34L62 29Z'),
  ], [flower('upper-open',53,46),dots('left-of-upright',10,67),vine('lower-counter',38,109,180,31,57),vine('cap-serif',76,28,150,24,82)], 'Heavy bowed diagonal suspended between two contrasting hairline uprights.'),
  O: glyph(91, [
    ink('M49 21C23 20 11 39 11 68C11 98 27 117 48 117C71 117 82 96 82 65C82 38 67 21 49 21ZM49 26C64 25 65 43 64 68C64 97 60 113 46 112C30 111 29 93 29 67C29 40 34 25 49 26Z'),
  ], [vine('inner-oval',46,99,180,55,34),dots('outside-curve',84,60,0,18),flower('inner-crown',46,39,65),vine('lower-exit',53,113,-80,27,83)], 'Tall uneven oval with displaced almond-shaped counter and dense sidewalls.'),
  P: glyph(85, [
    ink('M10 24L39 24L36 30L36 114C37 124 31 128 24 127L19 122L19 31L10 29Z'),
    ink('M35 27C58 15 78 27 77 48C77 67 58 77 35 72L35 67C52 74 61 62 60 44C59 28 49 23 35 32Z'),
    ink('M10 111L28 105L45 112L45 116L10 116Z'),
  ], [flower('bowl',47,47),dots('outer-stem',10,49),vine('lower-right',44,111,180,29,57),vine('cap-joint',41,27,80,24,82)], 'Deep upper bowl, open lower field and a sunk upright below the foot serif.'),
  Q: glyph(96, [
    ink('M48 21C25 21 11 39 11 66C11 94 27 111 47 111C69 111 83 93 83 64C83 36 67 21 48 21ZM48 26C62 26 66 43 65 66C65 93 59 106 46 106C31 104 29 86 29 65C29 41 35 26 48 26Z'),
    ink('M46 94C37 115 49 135 69 130C81 127 81 115 76 114C70 112 67 118 72 121C61 130 57 111 55 99Z'),
    line('M45 103C42 94 46 84 50 82',2.5),
  ], [flower('inner-bowl',47,54),dots('outside-right',87,55),vine('tail-exit',68,128,-85,20,57),vine('inner-bottom',40,94,180,24,79)], 'High oval over a separately curled descending tail with an interior hairline entrance.'),
  S: glyph(80, [
    ink('M66 31C56 17 31 18 20 32C8 49 21 64 40 74C59 84 65 91 58 104C51 118 28 112 20 97C26 101 31 98 31 93C30 84 16 83 14 96L13 113L18 109C36 123 63 119 70 101C79 80 63 68 44 58C27 49 22 42 29 32C37 19 56 24 59 33C50 31 47 39 52 44C60 53 73 42 66 31Z'),
  ], [flower('upper-open',39,40,34),dots('left-waist',9,63),vine('lower-bowl',43,110,-85,29,59),vine('upper-exit',63,28,125,22,80)], 'Opposed hooked bells, an oblique heavy waist and unequal open bowls.'),
  V: glyph(87, [
    ink('M9 24L38 24L38 29L32 32L56 98L49 118L44 119L14 32L8 29Z'),
    line('M53 104L74 31',2.7),
    ink('M62 24L83 24L83 29L75 33L69 34L62 29Z'),
  ], [dots('left-diagonal',16,62,0,17),vine('open-wedge',47,87,180,40,36),flower('right-terminal',71,41,75)], 'Long wedge descending past the baseline, contrasted with a fine rising arm.'),
  W: glyph(115, [
    ink('M7 24L34 24L34 29L29 32L46 94L41 122L34 123L12 32L7 29Z'),
    ink('M47 24L72 24L72 29L65 32L83 95L78 117L72 117L50 35Z'),
    line('M43 105L58 52',2.5),
    line('M81 105L104 32',2.5),
    ink('M94 24L112 24L112 29L104 33L99 33L94 29Z'),
  ], [flower('left-valley',39,77,36),vine('right-valley',82,86,180,36,34),dots('outside-arm',108,60),vine('lower-joint',56,61,0,35,77)], 'Two unequal black diagonals, paired low points and a narrow bridging hairline.'),
  X: glyph(88, [
    ink('M9 24L39 24L39 29L32 32L76 106L84 111L84 115L54 114L54 110L60 106L16 32L9 29Z'),
    line('M72 31L19 106',2.7),
    ink('M60 24L82 24L82 29L71 34L60 29Z'),
    ink('M7 110L18 103L29 111L29 115L7 115Z'),
    dot(17,106,4),
  ], [flower('upper-wedge',48,41),dots('left-side',10,68),vine('lower-wedge',43,94,0,27,59)], 'Asymmetric diagonal cross with a heavy falling stroke and a tucked lower bell.'),
  Y: glyph(88, [
    ink('M8 24L36 24L36 29L31 32L54 72L51 83L46 82L14 32L8 29Z'),
    line('M53 74L74 31',2.7),
    ink('M64 24L83 24L83 29L75 32L69 33L64 29Z'),
    ink('M45 72L61 72L61 107C61 127 49 134 36 127C31 124 29 117 33 115C39 111 43 118 38 121C49 128 45 105 45 99Z'),
  ], [dots('upper-fork',52,44),vine('lower-left',39,108,180,26,35,-1),flower('descender-side',68,104,72)], 'High open fork flowing into a long heavy hooked descender.'),
  Z: glyph(82, [
    ink('M14 24L73 24L73 29L31 108C50 113 62 108 69 93L73 93L71 115L9 115L9 110L51 29C34 25 23 31 15 43L11 43Z'),
    ink('M18 24L22 19L28 24Z'),
  ], [dots('cap-rhythm',35,16,90),flower('lower-open',48,93),vine('upper-counter',27,47,5,26,59),vine('foot-exit',65,109,-70,22,81)], 'Dense descending ribbon with an asymmetric curved cap and a sharp rising lower beak.'),
};
