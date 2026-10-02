import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FOLK_LETTERS } from '../src/styles/folk/letters.ts';
import { FOLK_SYMBOLS } from '../src/styles/folk/symbols.ts';
import { SUPPORTED_CHARACTERS } from '../src/styles/characters.ts';
import { composeOrnament } from '../src/styles/folk/ornament.ts';
import { interpret, contours } from '../src/styles/folk/geometry.ts';

const glyphs={...FOLK_LETTERS,...FOLK_SYMBOLS};
test('Folk has authored geometry for the entire repertoire at all treatment extremes',()=>{
  assert.deepEqual(Object.keys(glyphs).sort(),[...SUPPORTED_CHARACTERS].sort());
  assert.ok(FOLK_LETTERS.W.width>FOLK_LETTERS.I.width*2);
  for(const [char,glyph] of Object.entries(glyphs)) {
    assert.ok(glyph.width>0); assert.ok(glyph.note.length>0);
    assert.equal(glyph.base.length===0,char===' ');
    assert.equal(new Set(glyph.anchors.map(a=>a.name)).size,glyph.anchors.length);
    for(const ornament of [0,40,100]) {
      const motifs=composeOrnament(glyph,char,ornament,123);
      if(ornament===0)assert.equal(motifs.length,0);
      for(const pixelation of [0,20,26,60,100])for(const shape of [...glyph.base,...motifs.flatMap(m=>m.shapes)]) {
        const result=interpret(shape,pixelation);
        assert.ok(result.d.length>0); assert.ok(!/NaN|Infinity/.test(result.d));
        assert.ok(contours(result.d).length>0);
        if(pixelation>25)assert.ok(!/[CQ]/.test(result.d));
      }
    }
  }
});
test('seed changes bounded ornament, leaves base geometry intact, and treatment never changes anchors',()=>{
  const before=JSON.stringify(glyphs);
  for(const [char,glyph] of Object.entries(FOLK_LETTERS)) {
    const a=composeOrnament(glyph,char,80,123);
    assert.deepEqual(a,composeOrnament(glyph,char,80,123));
    assert.notDeepEqual(a,composeOrnament(glyph,char,80,456));
    for(const pixelation of [0,60,100]) {
      const treated=a.map(m=>({...m,shapes:m.shapes.map(s=>interpret(s,pixelation))}));
      assert.deepEqual(treated.map(m=>[m.name,m.at]),a.map(m=>[m.name,m.at]));
    }
  }
  assert.equal(JSON.stringify(glyphs),before);
});
test('coarse straight diagonals and closing edges remain staircases, not bounding rectangles',()=>{
  const shape=interpret({d:'M0 0L60 60L48 60Z'},100);
  const points=contours(shape.d)[0].points;
  assert.ok(points.length>30);
  for(let i=1;i<points.length;i++) {
    const [x,y]=points[i],[px,py]=points[i-1];
    assert.ok(x===px||y===py);
    assert.ok(Math.abs(x-px)<=6&&Math.abs(y-py)<=6);
  }
});
