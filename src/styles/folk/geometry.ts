import type { Point, Shape } from './model.ts';

type Command = { op: string; values: number[] };
const lengths: Record<string, number> = { M:2, L:2, Q:4, C:6, Z:0 };
const commands = new Map<string, Command[]>();
function parse(d: string): Command[] {
  const found = commands.get(d); if (found) return found;
  const tokens = d.match(/[MLQCZ]|-?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/gi) ?? [];
  const result: Command[] = [];
  for (let i=0;i<tokens.length;) {
    const op=tokens[i++], count=lengths[op];
    if (count === undefined) throw new Error(`Unsupported Folk path command ${op}`);
    const values=tokens.slice(i,i+count).map(Number); i+=count;
    if(values.length!==count || values.some(v=>!Number.isFinite(v))) throw new Error('Invalid Folk geometry');
    result.push({op,values});
  }
  // Bounded: ornament paths vary with seed/settings; do not keep an infinite archive.
  if(commands.size>=1800) commands.clear();
  commands.set(d,result); return result;
}
const fmt = (v: number) => Number(v.toFixed(3));
const snap = (v: number, grid: number) => fmt(Math.round(v/grid)*grid);
export const gridFor = (pixelation: number): number => pixelation <= 25 ? pixelation / 25 * .7 : 1 + (pixelation-25)/75*5;

/** Evaluate the actual Bézier geometry, not pixels or an SVG screenshot. */
export function contours(d: string, tolerance = .5): { points: Point[]; closed: boolean }[] {
  const result: { points: Point[]; closed: boolean }[] = [];
  let cursor: Point=[0,0], current: Point[]=[];
  for(const {op,values:v} of parse(d)) {
    if(op==='M') { current=[[v[0],v[1]]]; result.push({points:current,closed:false}); cursor=current[0]; }
    else if(op==='Z') { if(result.length) result[result.length-1].closed=true; }
    else if(op==='L') { cursor=[v[0],v[1]];current.push(cursor); }
    else {
      const start=cursor, end:Point=[v[v.length-2],v[v.length-1]];
      const controls:Point[]=op==='Q'?[[v[0],v[1]]]:[[v[0],v[1]],[v[2],v[3]]];
      const polygon=[start,...controls,end];
      const length=polygon.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-polygon[i][0],p[1]-polygon[i][1]),0);
      const steps=Math.max(2,Math.ceil(length/Math.max(tolerance, .3)));
      for(let i=1;i<=steps;i++) {
        const t=i/steps,u=1-t;
        const p:Point=op==='Q' ? [u*u*start[0]+2*u*t*v[0]+t*t*end[0],u*u*start[1]+2*u*t*v[1]+t*t*end[1]]
          : [u*u*u*start[0]+3*u*u*t*v[0]+3*u*t*t*v[2]+t*t*t*end[0],u*u*u*start[1]+3*u*u*t*v[1]+3*u*t*t*v[3]+t*t*t*end[1]];
        current.push(p);
      }
      cursor=end;
    }
  }
  return result;
}

/** Grid-walk each contour boundary. Filled counters remain separate loops;
 * hairlines become connected cell chains so coarse quantization cannot erase them. */
export function interpret(shape: Shape, pixelation: number): Shape {
  if(pixelation<=0) return shape;
  const grid=gridFor(pixelation);
  if(pixelation<=25) return {...shape,d:parse(shape.d).map(({op,values})=>op+values.map(v=>snap(v,grid)).join(' ')).join('')};
  const loops=contours(shape.d,grid*.25);
  if(shape.motif==='dot' || shape.motif==='rosette') {
    const points=loops[0].points;
    const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0]));
    const minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
    const cx=snap((minX+maxX)/2-grid/2,grid),cy=snap((minY+maxY)/2-grid/2,grid);
    const tile=(x:number,y:number)=>`M${fmt(x)} ${fmt(y)}L${fmt(x+grid)} ${fmt(y)}L${fmt(x+grid)} ${fmt(y+grid)}L${fmt(x)} ${fmt(y+grid)}Z`;
    if(shape.motif==='rosette' && maxX-minX>4) return {...shape,d:tile(cx,cy)+tile(cx-grid,cy)+tile(cx+grid,cy)+tile(cx,cy-grid)+tile(cx,cy+grid)};
    if(Math.min(maxX-minX,maxY-minY)<grid*1.6)return {...shape,d:tile(cx,cy)};
  }
  if(shape.stroke) {
    const cells=new Set<string>();
    const radius=Math.max(0,Math.floor((shape.stroke/grid-1)/2));
    for(const loop of loops) {
      const pts=loop.closed?[...loop.points,loop.points[0]]:loop.points;
      for(let i=1;i<pts.length;i++) {
        const a=pts[i-1],b=pts[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/grid*3));
        for(let j=0;j<=steps;j++) {
          const x=Math.floor((a[0]+(b[0]-a[0])*j/steps)/grid),y=Math.floor((a[1]+(b[1]-a[1])*j/steps)/grid);
          for(let dx=-radius;dx<=radius;dx++)for(let dy=-radius;dy<=radius;dy++)cells.add(`${x+dx},${y+dy}`);
        }
      }
    }
    return { d:[...cells].map(key=>{const [x,y]=key.split(',').map(Number);return `M${fmt(x*grid)} ${fmt(y*grid)}L${fmt((x+1)*grid)} ${fmt(y*grid)}L${fmt((x+1)*grid)} ${fmt((y+1)*grid)}L${fmt(x*grid)} ${fmt((y+1)*grid)}Z`;}).join(''),role:shape.role };
  }
  return {...shape,d:loops.map(loop=>{
    // Straight diagonal edges need the same grid walk as curves, including
    // the implicit closing edge. Snapping only their endpoints makes a box.
    const sampled:Point[]=[];
    for(let i=0;i<loop.points.length;i++) {
      const a=loop.points[i],b=loop.points[(i+1)%loop.points.length];
      const steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/(grid*.25)));
      for(let j=0;j<steps;j++)sampled.push([a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps]);
    }
    const points=sampled.map(([x,y])=>[snap(x,grid),snap(y,grid)] as Point);
    if(!points.length)return '';
    let [x,y]=points[0],d=`M${x} ${y}`;
    for(const [nx,ny] of [...points.slice(1),points[0]]) {
      if(nx===x&&ny===y)continue;
      // Two axis-aligned moves retain the ordered contour and produce real steps.
      if(nx!==x)d+=`L${nx} ${y}`;
      if(ny!==y)d+=`L${nx} ${ny}`;
      x=nx;y=ny;
    }
    return d+'Z';
  }).join('')};
}

/** Transform authored local motif coordinates before grid interpretation so all
 * components share one page-aligned grid, even on rotated vine anchors. */
export function transform(shape: Shape, x: number, y: number, angle=0, scale=1): Shape {
  const r=angle*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
  return {...shape,stroke:shape.stroke===undefined?undefined:shape.stroke*scale,d:parse(shape.d).map(({op,values})=>{
    const coords=[];
    for(let i=0;i<values.length;i+=2)coords.push(fmt(x+scale*(values[i]*c-values[i+1]*s)),fmt(y+scale*(values[i]*s+values[i+1]*c)));
    return op+coords.join(' ');
  }).join('')};
}
