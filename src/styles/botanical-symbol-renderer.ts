import type { RenderContext } from '../types';
import { glyphSvg, svgElement } from '../utils/svg';
import { seededRandom } from '../utils/random';
import { BOTANICAL_SYMBOLS } from './botanical-symbols';
import { configureWind } from './botanical-wind';
import { asciiMark, ASCII_OUTLINES } from './botanical-marks';

// Drawn ASCII-like marks, not font glyphs. Their open strokes match the letter
// system's stems, parentheses, slashes, seed dots, and little star flowers.
const marks: Record<string, string> = {
  '|': 'M0 -3.5V3.5', ':': 'M0 -2v.5M0 1.5v.5', ';': 'M0 -2v.5M0 1q1 2 -1 3',
  '(': 'M1 -3Q-2 0 1 3', ')': 'M-1 -3Q2 0 -1 3', '-': 'M-2.5 0H2.5',
  '~': 'M-3 0Q-1 -2 0 0T3 0', '/': 'M-2 3L2 -3', '\\': 'M-2 -3L2 3',
  "'": 'M.5 -3L-.5 -1', '`': 'M-.5 -3L.5 -1', '.': 'M0 2v.5',
  v: 'M-2 -2L0 2L2 -2', '^': 'M-2 2L0 -2L2 2',
  o: 'M0 -2.2C3 -2.2 3 2.2 0 2.2C-3 2.2 -3 -2.2 0 -2.2',
  '*': 'M0 -3V3M-2.6 -1.5L2.6 1.5M-2.6 1.5L2.6 -1.5',
};

export function renderBotanicalSymbol({ letter, state, layout }: RenderContext): SVGSVGElement {
  const design = BOTANICAL_SYMBOLS[letter];
  const p = state.params;
  const svg = glyphSvg(letter, 'Botanical ASCII');
  const width = layout === 'word' ? design.width : 120;
  svg.setAttribute('viewBox', `0 0 ${width} 150`);
  if (letter === ' ') return svg;
  const random = seededRandom(Number(p.seed) + letter.charCodeAt(0) * 7919);
  const paletteRandom = seededRandom(Number(p.seed) + letter.charCodeAt(0) * 1597);
  const palette = [...String(p.characters ?? '')].filter(char => Object.hasOwn(ASCII_OUTLINES, char));
  const scale = Number(p.scale);
  const group = svgElement('g', { transform: `translate(${width / 2} 75) scale(${scale} ${scale * Number(p.lineHeight)}) translate(${-design.width / 2} -75)`, fill: 'none', stroke: 'currentColor', 'stroke-width': .9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const sway = svgElement('g'); group.append(sway); svg.append(group);
  const mark = (parent: SVGGElement, kind: string, x: number, y: number, angle = 0, size = 1, opacity = 1) => {
    if (palette.length) {
      parent.append(asciiMark(palette[Math.floor(paletteRandom()*palette.length)], x, y+2*size, 7*size, angle, opacity));
    } else parent.append(svgElement('path', { d: marks[kind], transform: `translate(${x} ${y}) rotate(${angle}) scale(${size})`, opacity }));
  };
  const bud = (parent: SVGGElement, x: number, y: number) => {
    parent.append(svgElement('path', { d: `M${x} ${y-2.6}C${x+3.5} ${y-3} ${x+3.2} ${y+3.2} ${x} ${y+3}C${x-3.2} ${y+3} ${x-3.5} ${y-2} ${x} ${y-2.6}Z`, fill: 'currentColor', 'stroke-width': .5 }));
    // One tiny sepal is enough on punctuation; preserve its compact footprint.
    if (random() < Number(p.flowers)) mark(parent, "'", x + 3.2, y - 2, -25, .7);
  };
  for (const path of design.paths) {
    const branch = svgElement('g'); sway.append(branch);
    for (let i = 1; i < path.length; i++) {
      const [ax, ay] = path[i-1], [bx, by] = path[i];
      const dx = (bx-ax)*16, dy = (by-ay)*16, length = Math.hypot(dx,dy);
      if (!length) continue;
      const nx = -dy/length, ny = dx/length;
      const steps = Math.max(1, Math.ceil(length / (6.2 - Number(p.density)*2)));
      const x0 = 14+ax*16, y0 = 27+ay*16;
      const bend = (random()-.5)*Number(p.distortion)*2*design.restraint;
      branch.append(svgElement('path', { d: `M${x0} ${y0}Q${x0+dx/2+nx*bend} ${y0+dy/2+ny*bend} ${x0+dx} ${y0+dy}`, 'stroke-width': .65, opacity: .75 }));
      for (let j=0; j<steps; j++) {
        const t=(j+.5)/steps, x=x0+dx*t, y=y0+dy*t;
        const kind = Math.abs(dy)>Math.abs(dx)*1.7 ? ['|',':',';'] : Math.abs(dy)<3 ? ['~','-',"'"] : dx*dy>0 ? ['\\',';'] : ['/',':'];
        mark(branch, kind[Math.floor(random()*kind.length)], x,y,0,.85);
        if (random()<Number(p.density)*.7*design.restraint) {
          const side=random()>.5?1:-1;
          mark(branch, side>0?'(':')',x+nx*side*2.7,y+ny*side*2.7,(random()-.5)*30,.85,.85);
        }
        if (random()<Number(p.growth)*.55*design.restraint) {
          const side=random()>.5?1:-1, reach=(3+random()*4*Number(p.growth))*design.restraint;
          mark(branch,side>0?'/':'\\',x+nx*side*reach/2,y+ny*side*reach/2,0,.7,.8);
          mark(branch,random()>.5?'v':')',x+nx*side*reach,y+ny*side*reach,0,.8,.9);
          if(random()<Number(p.branching)) mark(branch,':',x+nx*side*(reach+2),y+ny*side*(reach+2),0,.65,.7);
        }
        if (random()<Number(p.flowers)*.16*design.restraint) mark(branch,random()>.5?'*':'o',x+nx*3,y+ny*3,0,.9);
      }
    }
  }
  for(const [x,y] of design.buds) { const branch=svgElement('g'); sway.append(branch); bud(branch,14+x*16,27+y*16); }
  configureWind(sway,p,letter);
  return svg;
}
