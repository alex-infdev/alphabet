import { seededRandom } from '../../utils/random.ts';
import { dot, ink, line } from './model.ts';
import type { FolkGlyph, Shape } from './model.ts';
import { transform } from './geometry.ts';

export type Ornament = { name: string; at: [number,number]; shapes: Shape[]; knockout: boolean };
const ease=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
export function rosette(radius=4): Shape {
  // A single rounded silhouette avoids overlapping even-odd petal holes.
  const pts=Array.from({length:20},(_,i)=>{const a=i*Math.PI/10,r=i%4===0?radius*.66:i%2?radius*.86:radius;return [Math.sin(a)*r,Math.cos(a)*r];});
  const middle=(i:number)=>[(pts[i][0]+pts[(i+1)%20][0])/2,(pts[i][1]+pts[(i+1)%20][1])/2];
  const start=middle(19);
  const d=`M${start[0]} ${start[1]}`+pts.map((p,i)=>`Q${p[0]} ${p[1]} ${middle(i).join(' ')}`).join('')+'Z'+dot(0,0,radius*.2).d;
  return {...ink(d),motif:'rosette'};
}
const leaf = (x: number,y:number,side:number,size:number): Shape => ({...ink(`M${x} ${y}C${x+side*size*.1} ${y-size*.8} ${x+side*size*.85} ${y-size*1.2} ${x+side*size} ${y-size*1.4}C${x+side*size*1.05} ${y-size*.5} ${x+side*size*.65} ${y} ${x} ${y}Z`),motif:'leaf'});

/** The seed selects bounded variants at authored anchors. Pixelation is purposely
 * absent from this function, so changing treatment cannot reshuffle composition. */
export function composeOrnament(glyph: FolkGlyph, character: string, ornament: number, seed: number): Ornament[] {
  const result: Ornament[]=[];
  glyph.anchors.forEach((anchor,index)=>{
    const random=seededRandom(seed+character.charCodeAt(0)*7919+index*1543);
    const threshold=anchor.stage+(random()-.5)*5;
    const presence=ease((ornament-threshold)/10);
    if(presence<=0)return;
    const local:Shape[]=[];
    if(anchor.kind==='dots') {
      const rhythm=random()>.5?[0,9,19]:[0,10,20,29];
      for(const [i,y] of rhythm.entries())local.push(dot(0,y,(i===1?2.5:2)*presence));
      if(ornament>72)local.push(dot(4,33,1.5*ease((ornament-72)/15)));
    } else if(anchor.kind==='flower') {
      local.push(rosette((anchor.knockout?2.5:4.2)*presence));
      if(ornament>72&&!anchor.knockout) {
        const grow=ease((ornament-72)/20);
        local.push(line(`M0 4Q3 9 0 ${4+10*grow}`,1.25));
        local.push(leaf(0,9,1,4*grow));
      }
    } else {
      const side=anchor.side??(random()>.5?1:-1);
      const length=(anchor.length??30)*presence*(.9+.1*ease((ornament-46)/24));
      const bend=side*(4+random()*4), end=side*2;
      local.push(line(`M0 0C${bend} ${length*.32} ${-bend*.6} ${length*.72} ${end} ${length}`,1.35));
      const leaves=ornament<50?2:ornament<72?3:4;
      const leafSize=(7.5+2.5*ease((ornament-48)/25))*presence;
      for(let i=0;i<leaves;i++) {
        const t=(i+1)/(leaves+1),u=1-t;
        const x=3*u*u*t*bend+3*u*t*t*(-bend*.6)+t*t*t*end;
        local.push(leaf(x,length*t,i%2?side:-side,leafSize));
        if((anchor.length??30)>=40)local.push(leaf(x,length*t,i%2?-side:side,leafSize*.85));
      }
      if(ornament>52) {
        const curl=ease((ornament-52)/24),r=6*curl;
        local.push(line(`M${end} ${length}C${end+side*r*2} ${length+r} ${end+side*r*2} ${length-r*2} ${end+side*r} ${length-r*2}C${end} ${length-r*2} ${end} ${length-r} ${end+side*r} ${length-r}`,1.25));
      }
      if(ornament>84) {
        const grow=ease((ornament-84)/16);
        local.push(line(`M0 ${length*.4}Q${-side*8*grow} ${length*.45} ${-side*12*grow} ${length*.7}`,1.2));
        local.push(leaf(-side*10*grow,length*.64,-side,4.5*grow));
      }
    }
    result.push({name:anchor.name,at:anchor.at,knockout:!!anchor.knockout,shapes:local.map(shape=>transform(shape,...anchor.at,anchor.angle??0))});
  });
  return result;
}
