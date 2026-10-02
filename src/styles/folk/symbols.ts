import { glyph, ink, line, dot, dots, flower, vine } from './model.ts';
import type { FolkGlyph } from './model.ts';
import { FOLK_LETTERS } from './letters.ts';
import { transform } from './geometry.ts';
import { rosette } from './ornament.ts';

/** Punctuation and numerals are independently authored members of this family. */
export const FOLK_SYMBOLS: Record<string,FolkGlyph> = {
  ' ':glyph(38,[],[],'Blank advance.'),
  '.':glyph(30,[dot(15,109,4)],[],'Heavy seed at the baseline.'),
  ',':glyph(31,[ink('M12 105C21 100 26 112 13 122L10 121C18 115 18 113 15 113C9 114 8 108 12 105Z')],[],'Seed turning into a hanging hook.'),
  ':':glyph(30,[dot(15,65,3.8),dot(15,109,3.8)],[],'Related high and low seeds.'),
  ';':glyph(32,[dot(15,65,3.8),ink('M12 105C21 100 26 112 13 122L10 121C18 115 18 113 15 113C9 114 8 108 12 105Z')],[],'Paired seed and descending hook.'),
  "'":glyph(29,[ink('M12 24C22 19 26 31 13 44L10 43C18 34 17 32 14 33C7 34 7 26 12 24Z')],[],'High hanging seed.'),
  '"':glyph(47,[ink('M10 24C20 19 24 31 11 44L8 43C16 34 15 32 12 33C5 34 5 26 10 24Z'),ink('M29 24C39 19 43 31 30 44L27 43C35 34 34 32 31 33C24 34 24 26 29 24Z')],[],'Twin high gestures with a clear interval.'),
  '!':glyph(40,[ink('M12 24L29 24L24 88L18 91Z'),dot(21,109,5)], [dots('beside-stem',8,45,0,40)],'A tapered monumental stem over a bell seed.'),
  '?':glyph(69,[ink('M14 35C18 16 51 17 57 34C67 58 41 68 37 83L31 90L28 88C27 66 44 61 42 39C41 21 24 23 23 33C34 26 37 45 26 46C15 48 11 41 14 35Z'),dot(33,109,5)], [flower('open-hook',30,55,40),vine('lower-hook',36,80,55,17,69)],'Off-centre display hook with a falling inner throat.'),
  '-':glyph(47,[ink('M9 69L38 67L38 74L9 75Z')],[],'Short oblique bar.'),
  '–':glyph(70,[ink('M8 69L62 67L62 74L8 75Z')],[],'Medium oblique bar.'),
  '—':glyph(108,[ink('M8 69L100 67L100 74L8 75Z')],[],'Long oblique bar.'),
  '_':glyph(72,[ink('M8 114L64 114L64 119L8 119Z')],[],'Low rule.'),
  '(':glyph(42,[ink('M33 16C4 40 4 97 32 124L35 123C18 96 18 43 36 18Z')],[dots('inner-curve',26,64,0,40)],'Heavy central curved bracket tapering at both ends.'),
  ')':glyph(42,[ink('M9 16C38 40 38 97 10 124L7 123C24 96 24 43 6 18Z')],[dots('inner-curve',16,64,0,40)],'Companion curved bracket.'),
  '[':glyph(41,[ink('M32 17L11 17L11 122L32 122L32 118L23 118L23 21L32 21Z')],[vine('inner-stalk',27,104,180,28,62)],'Rigid slab bracket with fine end bars.'),
  ']':glyph(41,[ink('M9 17L30 17L30 122L9 122L9 118L18 118L18 21L9 21Z')],[vine('inner-stalk',14,104,180,28,62)],'Companion slab bracket.'),
  '{':glyph(49,[ink('M38 17C18 14 21 33 21 47C21 60 17 65 9 68L9 72C18 76 21 79 21 93C21 111 18 125 38 123L38 119C26 118 33 103 33 92C33 78 27 73 20 70C27 67 33 62 33 47C33 35 26 21 38 21Z')],[flower('central-joint',20,70,60)],'Organic double-curved brace with a pinched centre.'),
  '}':glyph(49,[ink('M11 17C31 14 28 33 28 47C28 60 32 65 40 68L40 72C31 76 28 79 28 93C28 111 31 125 11 123L11 119C23 118 16 103 16 92C16 78 22 73 29 70C22 67 16 62 16 47C16 35 23 21 11 21Z')],[flower('central-joint',29,70,60)],'Companion organic brace.'),
  '/':glyph(56,[line('M10 118L46 21',4),ink('M41 22L47 17L50 24Z')],[dots('beside-diagonal',19,68,22,53)],'Leaning stem with a sharp high tip.'),
  '\\':glyph(56,[line('M10 21L46 118',4),ink('M6 22L10 17L15 24Z')],[dots('beside-diagonal',39,68,-22,53)],'Falling stem with a sharp high tip.'),
  '&':glyph(92,[
    ink('M74 108C55 82 27 57 25 42C21 24 43 16 55 27C69 41 48 55 32 68C14 82 16 107 34 113C49 119 65 107 73 89L78 72L73 71C65 91 52 110 40 108C21 104 27 85 39 73C55 58 67 45 63 32C56 9 18 17 15 39C13 57 44 89 58 109C69 121 81 119 85 110L83 106Z'),
    line('M64 72L85 72',3),
  ],[flower('lower-loop',38,90,35),dots('outer-bowl',8,67),vine('foot-exit',73,112,-80,22,65)],'Unequal intertwined loops and a descending black diagonal.'),
  '@':glyph(106,[
    ink('M72 47L73 87C83 95 95 84 95 64C95 37 77 23 55 23C26 23 11 43 11 70C11 104 42 123 77 111L76 107C46 118 23 98 24 69C24 39 36 27 55 27C76 27 88 42 88 64C88 80 83 89 79 85L81 43ZM65 45C45 34 30 49 30 72C30 94 43 101 60 87L65 90L72 87L70 44ZM60 50L60 81C46 100 41 85 42 69C42 50 51 44 60 50Z'),
  ],[dots('lower-exterior',39,122,90,24),flower('inner-counter',51,66,60)],'Heavy inner bowl and light enclosure, leaving a clear spiral exit.'),
  '#':glyph(82,[line('M32 25L23 113',4),line('M59 25L50 113',4),ink('M10 51L72 48L72 56L10 59Z'),ink('M7 83L69 80L69 88L7 91Z')],[flower('middle-window',41,69,48)],'Four crossing bars with a diagonal rhythm and open centre.'),
  '%':glyph(97,[line('M15 114L83 23',3),ink('M29 23C9 23 9 59 29 59C48 59 49 23 29 23ZM29 27C37 26 36 55 29 55C21 55 21 28 29 27Z'),ink('M69 78C49 78 49 114 69 114C89 114 88 78 69 78ZM69 82C77 82 77 110 69 110C61 110 61 82 69 82Z')],[dots('middle-diagonal',41,68,45,60)],'Two compact asymmetric counters and a hairline slash.'),
  '+':glyph(72,[ink('M29 44L42 44L40 64L62 63L62 71L40 70L42 94L30 94L32 70L10 71L10 63L32 64Z')],[dots('above-cross',36,32,90,45)],'Contrasting arms with pinched joints.'),
  '=':glyph(72,[ink('M10 53L62 51L62 59L10 61Z'),ink('M10 80L62 78L62 86L10 88Z')],[],'Paired slightly rising rules.'),
  '*':glyph(54,[transform(rosette(12),27,47)], [dots('below-rosette',27,70,0,63)],'Compact five-petal folk star.'),
  '<':glyph(66,[ink('M55 43L16 70L55 98L53 103L9 74L9 68L53 39Z')],[],'A fine open wedge with a heavy elbow.'),
  '>':glyph(66,[ink('M11 43L50 70L11 98L13 103L57 74L57 68L13 39Z')],[],'Companion open wedge.'),
  '$':glyph(80,[...FOLK_LETTERS.S.base,line('M41 15L41 126',2.4)],[dots('left-waist',7,61),flower('lower-bowl',44,96,56)],'The family S crossed by one uninterrupted fine stem.'),
  '€':glyph(83,[...FOLK_LETTERS.C.base,line('M9 61L60 61',3.5),line('M9 75L55 75',3.5)],[dots('outside-curve',7,86),flower('lower-counter',48,91,53)],'Crescent with two short interior rules.'),
  '£':glyph(77,[ink('M61 34C60 17 30 18 23 33C17 46 28 57 28 77C28 94 24 104 12 111L12 116C27 108 45 122 67 113L69 98L65 98C56 119 40 102 27 108C51 89 45 70 38 51C31 30 39 23 48 28C42 37 50 44 56 41C60 40 62 37 61 34Z'),line('M12 72L60 72',3)],[dots('lower-counter',54,84),vine('low-exit',53,113,-75,24,57)],'Curled top bell over a swelling stem and loose sweeping foot.'),
  '0':glyph(81,[ink('M41 22C19 22 11 44 11 70C11 97 21 117 41 117C62 117 72 95 72 68C72 42 62 22 41 22ZM40 27C51 27 54 45 54 70C54 96 51 112 41 112C31 112 29 94 29 68C29 43 31 27 40 27Z')],[flower('counter',41,69,39),dots('outside',7,60)],'Tall narrow oval with a deep slit counter.'),
  '1':glyph(52,[ink('M11 40L11 35C24 32 28 28 31 22L38 22L37 106L46 112L46 116L11 115L11 111L21 106L21 38Z')],[dots('left-field',11,57),vine('right-serif',40,108,180,31,54)],'Flagged narrow column and low asymmetric bracket.'),
  '2':glyph(77,[ink('M12 38C16 17 51 17 62 32C78 53 48 72 30 91L18 105C41 99 47 120 62 99L67 98L66 116C45 124 31 109 12 116L10 110C17 85 52 67 49 40C48 23 28 22 24 33C37 25 42 46 28 49C17 50 10 45 12 38Z')],[flower('lower-open',43,87,40),dots('left-mid',9,65),vine('foot',51,111,-70,22,77)],'High bell hook and a sloping heavy diagonal into a waved foot.'),
  '3':glyph(75,[ink('M14 31C26 18 55 18 64 34C73 49 60 62 48 66C74 71 75 102 56 114C40 124 16 116 12 102C9 92 21 88 27 94C33 101 28 109 20 106C30 118 50 113 52 97C56 77 46 70 30 70L30 64C48 65 53 52 50 39C47 24 28 23 16 37Z')],[flower('upper-open',31,46,38),dots('left-waist',9,67),vine('lower-bowl',44,114,-80,23,75)],'Small upper turn and a deep heavy lower bowl.'),
  '4':glyph(81,[ink('M49 22L63 22L63 83L73 83L73 91L63 91L63 107L71 112L71 116L39 115L39 111L47 107L47 91L10 91L10 85ZM47 34L17 83L47 83Z')],[flower('open-triangle',34,69,43),dots('right-stem',72,44)],'Angular open counter and monumental right spine.'),
  '5':glyph(77,[ink('M16 24L65 24L62 38L23 32L20 61C39 48 67 60 67 86C69 114 37 127 18 112C7 103 12 90 21 91C32 93 28 109 21 106C32 120 51 111 50 89C50 67 34 62 17 72L12 69Z')],[flower('open-bowl',32,83,39),dots('cap',34,16,90),vine('foot',43,113,-70,22,76)],'Slanted canopy over a deep heavy bowl and low hooked bell.'),
  '6':glyph(79,[ink('M64 28C52 15 26 24 17 43C3 73 11 107 31 116C56 126 74 102 67 78C63 58 43 54 28 68C29 42 40 21 57 28C44 32 50 44 58 42C66 40 70 32 64 28ZM29 75C46 50 56 76 52 96C49 120 29 116 28 91Z')],[flower('lower-counter',40,87,43),dots('left-spine',7,58)],'Climbing fine neck above a heavy inward lower bowl.'),
  '7':glyph(76,[ink('M12 24L67 24L67 30C44 59 43 88 40 117L23 117C25 80 41 52 58 34C40 42 25 28 15 45L11 45Z')],[dots('upper-bar',31,16,90),vine('open-diagonal',40,87,165,31,44)],'Waved head and a swelling descender rather than a straight diagonal.'),
  '8':glyph(80,[ink('M41 22C15 21 6 48 30 65C3 77 7 111 31 117C59 126 80 98 59 76L49 66C77 52 69 22 41 22ZM39 27C53 26 57 49 45 59C23 46 22 28 39 27ZM33 72C60 87 63 111 43 113C20 115 22 87 33 72Z')],[dots('outer-waist',8,68),flower('lower-counter',39,96,42)],'Offset figure-eight bowls with a pinched diagonal crossing.'),
  '9':glyph(79,[ink('M39 22C13 22 4 49 15 69C23 83 42 84 52 72C52 94 41 119 22 109C36 107 29 92 21 97C7 105 18 120 34 118C61 115 72 86 69 55C68 34 57 22 39 22ZM38 27C53 27 55 52 52 65C38 91 21 56 30 35C32 29 35 27 38 27Z')],[flower('upper-counter',41,50,40),dots('right-descender',74,83)],'High heavy bowl flowing into a long tapering lower hook.'),
};
