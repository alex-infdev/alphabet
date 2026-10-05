import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FOLK_LETTERS } from '../src/styles/folk/letters.ts';
import { FOLK_SYMBOLS } from '../src/styles/folk/symbols.ts';
import { SUPPORTED_CHARACTERS } from '../src/styles/characters.ts';
import { composeOrnament } from '../src/styles/folk/ornament.ts';
import { interpret, contours, transform, gridFor } from '../src/styles/folk/geometry.ts';
import { rosette } from '../src/styles/folk/ornament.ts';
import source from '../dev/ambicase-reference.json' with { type: 'json' };
import outlines from '../src/styles/folk/ambicase-outlines.json' with { type: 'json' };

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

test('Folk preserves the supplied Ambicase silhouettes, counters and proportional advances', () => {
  assert.equal(outlines.sha256, source.sha256);
  assert.equal(outlines.sha256, '974f5559c060580a146c5e11e1fdfd9446d2c766955a911f469bb3dfbc121ea4');
  for (const [letter, reference] of Object.entries(source.glyphs)) {
    const glyph = FOLK_LETTERS[letter];
    assert.equal(glyph.width, Number((reference.advance * .13 + 16).toFixed(3)));
    assert.equal(glyph.advance, Number((reference.advance * .13).toFixed(3)));
    assert.equal(glyph.base[0].d, transform({ d: reference.path }, 8, 112, 0, .13).d);
    assert.equal(contours(glyph.base[0].d).length, contours(reference.path).length, `${letter} retains its counters and detached components`);
    assert.ok(!glyph.anchors.some(anchor => anchor.kind === 'dots'), `${letter} has no scattered dot column`);
    assert.equal(composeOrnament(glyph, letter, 40, 2048).length, 1, `${letter} has one primary ornamental gesture`);
    assert.ok(glyph.anchors.length <= 2);
  }
  assert.equal(contours(FOLK_LETTERS.I.base[0].d).length, 2, 'I retains the independent high dot');
  assert.equal(contours(FOLK_LETTERS.J.base[0].d).length, 2, 'J retains the independent high dot');
});

test('stepped blossoms retain their optical size and coarse body pitch matches the chart', () => {
  const bounds = (shape: { d: string }) => {
    const points = contours(shape.d).flatMap(loop => loop.points);
    return { width: Math.max(...points.map(p => p[0])) - Math.min(...points.map(p => p[0])), height: Math.max(...points.map(p => p[1])) - Math.min(...points.map(p => p[1])) };
  };
  const flower = transform(rosette(6.8), 45, 70);
  const smooth = bounds(flower);
  for (const pixelation of [26, 60, 100]) {
    const stepped = interpret(flower, pixelation), size = bounds(stepped);
    assert.ok(!/[CQ]/.test(stepped.d));
    assert.ok(size.width >= smooth.width * .65 && size.width <= smooth.width * 1.5);
    assert.ok(size.height >= smooth.height * .65 && size.height <= smooth.height * 1.5);
  }
  assert.equal(gridFor(100), 4.16);
});

test('leaf treatments preserve their authored attachments through rotation and density', () => {
  for (const letter of ['C', 'L', 'M', 'R', 'T', 'W']) {
    const glyph = FOLK_LETTERS[letter];
    for (const ornament of [40, 80, 100]) {
      for (const motif of composeOrnament(glyph, letter, ornament, 2048)) {
        const anchor = glyph.anchors.find(anchor => anchor.name === motif.name)!;
        assert.deepEqual(motif.at, anchor.at);
        for (const leaf of motif.shapes.filter(shape => shape.motif === 'leaf')) {
          assert.ok(leaf.coarse, 'leaves have an explicit geometric treatment');
          const first = contours(leaf.d)[0].points[0], coarseFirst = contours(leaf.coarse!)[0].points[0];
          assert.deepEqual(first, coarseFirst, 'smooth and geometric leaves start at the same stem attachment');
          const stepped = interpret(leaf, 100);
          assert.ok(!/[CQ]/.test(stepped.d));
        }
      }
    }
  }
});
