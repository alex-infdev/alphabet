import { seededRandom } from '../../utils/random.ts';
import { dot, ink, line } from './model.ts';
import type { FolkGlyph, Shape } from './model.ts';
import { transform } from './geometry.ts';

export type Ornament = { name: string; at: [number,number]; shapes: Shape[]; knockout: boolean };
const ease = (v:number) => { const t = Math.max(0,Math.min(1,v)); return t*t*(3-2*t); };

/** Eight broad petals and a small carved centre: readable at specimen size. */
export function rosette(radius=6): Shape {
  const points = Array.from({length:16},(_,i) => {
    const angle = i*Math.PI/8, r = i%2 ? radius*.57 : radius;
    return [Math.sin(angle)*r,Math.cos(angle)*r];
  });
  const middle = (i:number) => [(points[i][0]+points[(i+1)%16][0])/2,(points[i][1]+points[(i+1)%16][1])/2];
  const d = `M${middle(15).join(' ')}` + points.map((p,i) => `Q${p.join(' ')} ${middle(i).join(' ')}`).join('') + 'Z' + dot(0,0,radius*.2).d;
  return {...ink(d),motif:'rosette'};
}
function leaf(x:number,y:number,side:number,size:number): Shape {
  const tipX=x+side*size*.85, tipY=y+size*1.15;
  return {...ink(`M${x} ${y}Q${x+side*size} ${y+size*.08} ${tipX} ${tipY}Q${x+side*size*.08} ${y+size} ${x} ${y}Z`), motif:'leaf',
    // The stepped treatment uses a deliberately broad diamond, not snapped
    // Bézier handles that collapse the blade into a thin scrap of contour.
    coarse:`M${x} ${y}L${x+side*size*.82} ${y+size*.2}L${tipX} ${tipY}L${x+side*size*.05} ${y+size*.8}Z`};
}

/** Each seed makes a bounded variation of an authored attachment. The ornament
 * budget grows a few strong motifs; it never scatters dots around the glyph. */
export function composeOrnament(glyph:FolkGlyph,character:string,ornament:number,seed:number): Ornament[] {
  const result:Ornament[]=[];
  glyph.anchors.forEach((anchor,index) => {
    const random=seededRandom(seed+character.charCodeAt(0)*7919+index*1543);
    const activation=ease((ornament-anchor.stage-(random()-.5)*3)/18);
    if(activation<=0)return;
    // Secondary accents enter as legible motifs rather than growing through a
    // long interval of stray specks. Their attachments remain fixed.
    const presence=anchor.stage>=60?.65+.35*activation:activation;
    const local:Shape[]=[];
    if(anchor.kind==='dots') {
      // Keep the independently authored symbols' seed accents restrained.
      local.push(dot(0,0,2.6*presence),dot(0,8,1.7*presence));
    } else if(anchor.kind==='flower') {
      const length=(anchor.length??0)*presence;
      const radius=(anchor.size??(anchor.knockout?2.4:6.8))*(1+(random()-.5)*.12)*presence;
      if(length) {
        local.push(line(`M0 0Q2 ${length*.45} 0 ${length}`,2));
        local.push(leaf(0,length*.2,random()>.5?1:-1,6.5*presence));
      }
      local.push(transform(rosette(radius),0,length));
    } else {
      const side=anchor.side??(random()>.5?1:-1);
      const length=(anchor.length??30)*presence*(.96+random()*.08);
      const bend=side*(2+random()*2),end=side*1.5;
      local.push(line(`M0 0C${bend} ${length*.3} ${-bend*.5} ${length*.72} ${end} ${length}`,2.05));
      const leaves=(anchor.length??30)>36||ornament>76?3:2;
      const size=((anchor.size??8.4)+1.2*ease((ornament-48)/40))*presence;
      for(let i=0;i<leaves;i++) {
        const t=.12+i*(.58/Math.max(1,leaves-1)),u=1-t;
        const x=3*u*u*t*bend+3*u*t*t*(-bend*.5)+t*t*t*end;
        local.push(leaf(x,length*t,side,size));
        local.push(leaf(x,length*t,-side,size*.88));
      }
      // One seed-shaped terminal keeps the plant silhouette closed and clear.
      local.push(leaf(end,length*.82,side,5.4*presence));
    }
    result.push({name:anchor.name,at:anchor.at,knockout:!!anchor.knockout,shapes:local.map(shape=>transform(shape,...anchor.at,anchor.angle??0))});
  });
  return result;
}
