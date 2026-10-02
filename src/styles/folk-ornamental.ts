import type { AlphabetStyle, RenderContext, StyleState } from '../types';
import { glyphSvg, svgElement } from '../utils/svg';
import { glyphKey } from './characters';
import { FOLK_LETTERS } from './folk/letters';
import { FOLK_SYMBOLS } from './folk/symbols';
import type { Shape } from './folk/model';
import { composeOrnament } from './folk/ornament';
import { interpret } from './folk/geometry';

export const FOLK_GLYPHS = { ...FOLK_LETTERS, ...FOLK_SYMBOLS };
const derived = new Map<string, { base:Shape[]; ornament:ReturnType<typeof composeOrnament> }>();
function geometry(letter:string, ornament:number, pixelation:number, seed:number) {
  const key=`${letter}:${ornament}:${pixelation}:${seed}`;
  const cached=derived.get(key);if(cached)return cached;
  const glyph=FOLK_GLYPHS[letter];
  if(!glyph)throw new Error(`Unsupported Folk Ornamental glyph: ${letter}`);
  const result={base:glyph.base.map(shape=>interpret(shape,pixelation)),ornament:composeOrnament(glyph,letter,ornament,seed).map(item=>({...item,shapes:item.shapes.map(shape=>interpret(item.knockout?{...shape,motif:'dot'}:shape,pixelation))}))};
  if(derived.size>=384)derived.delete(derived.keys().next().value!);
  derived.set(key,result);return result;
}
const widthOf = (letter:string,state:StyleState) => FOLK_GLYPHS[letter.toUpperCase()].width*Number(state.params.scale)+4;
function shapeNode(shape:Shape, fill='currentColor'): SVGPathElement {
  return svgElement('path',{d:shape.d,fill:shape.stroke?'none':fill,'fill-rule':'evenodd',...(shape.stroke?{stroke:fill,'stroke-width':shape.stroke,'stroke-linecap':'round','stroke-linejoin':'round'}:{})});
}
function renderGlyph({letter,state,layout,instance}:RenderContext):SVGSVGElement {
  letter=letter.toUpperCase();
  const glyph=FOLK_GLYPHS[letter],p=state.params,scale=Number(p.scale);
  if(!glyph)throw new Error(`Unsupported Folk Ornamental glyph: ${letter}`);
  const width=layout==='word'?widthOf(letter,state):144;
  const svg=glyphSvg(letter,'Folk Ornamental');svg.setAttribute('viewBox',`0 0 ${width} 150`);
  const group=svgElement('g',{transform:`translate(${(width-glyph.width*scale)/2} ${75*(1-scale)}) scale(${scale})`});svg.append(group);
  if(Number(p.pixelation)>25)group.setAttribute('shape-rendering','crispEdges');
  const data=geometry(letter,Number(p.ornament),Number(p.pixelation),Number(p.seed));
  const base=svgElement('g',{'data-folk-base':letter});group.append(base);
  const cutouts=data.ornament.filter(item=>item.knockout);
  if(cutouts.length) {
    const id=`folk-cut-${(instance??glyphKey(letter)).replace(/[^\w-]/g,'-')}`;
    const defs=svgElement('defs'),mask=svgElement('mask',{id,maskUnits:'userSpaceOnUse',x:-30,y:-20,width:glyph.width+60,height:190,'mask-type':'luminance'});
    mask.append(svgElement('rect',{x:-30,y:-20,width:glyph.width+60,height:190,fill:'white'}));
    for(const item of cutouts)for(const shape of item.shapes)mask.append(shapeNode(shape,'black'));
    defs.append(mask);svg.prepend(defs);base.setAttribute('mask',`url(#${id})`);
  }
  for(const shape of data.base)base.append(shapeNode(shape));
  for(const item of data.ornament.filter(item=>!item.knockout)) {
    const motif=svgElement('g',{'data-folk-anchor':item.name,'data-anchor-x':item.at[0],'data-anchor-y':item.at[1]});
    for(const shape of item.shapes)motif.append(shapeNode(shape));group.append(motif);
  }
  return svg;
}
export const folkOrnamental:AlphabetStyle={
  id:'folk-ornamental',name:'Folk Ornamental',subtitle:'Authored display forms',
  description:'Monumental letterforms with rooted folk ornament.',material:'CONTOURS / FOLK',
  defaults:{ornament:40,pixelation:0,seed:2048,scale:.9,spacing:3,rowSpacing:16,labels:true},
  controls:[
    {type:'range',key:'ornament',label:'Ornament · minimal to dense',min:0,max:100,step:1},
    {type:'range',key:'pixelation',label:'Pixelation · smooth to coarse',min:0,max:100,step:1},
    {type:'number',key:'seed',label:'Seed',min:0,max:999999,step:1},
    {type:'action',key:'regenerate',label:'Randomize seed'},
    {type:'range',key:'scale',label:'Glyph scale',min:.65,max:1.1,step:.01,group:'layout'},
    {type:'range',key:'spacing',label:'Letter spacing',min:0,max:40,step:1,unit:'px',group:'layout'},
    {type:'range',key:'rowSpacing',label:'Row spacing',min:0,max:48,step:1,unit:'px',group:'layout'},
    {type:'toggle',key:'labels',label:'Show glyph labels',group:'layout'},
  ],
  renderGlyph,glyphWidth:widthOf,specimenWidth:144,
  randomize:random=>({ornament:Math.round(25+random()*50),pixelation:Math.round(random()*85)}),
};
