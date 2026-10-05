import { test, expect } from '@playwright/test';

test('Folk registration, aliases, metrics, geometry/export parity and masks',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    // @ts-expect-error Vite module
    const {styles}=await import('/src/styles/index.ts');
    // @ts-expect-error Vite module
    const {FOLK_GLYPHS}=await import('/src/styles/folk-ornamental.ts');
    // @ts-expect-error Vite module
    const {exportSvg}=await import('/src/utils/export-svg.ts');
    // @ts-expect-error Vite module
    const {wordLayout}=await import('/src/utils/word-layout.ts');
    // @ts-expect-error Vite module
    const {initialState}=await import('/src/state.ts');
    const style=styles[2], rows=[];
    for(const pixelation of [0,60,100]) {
      const state={params:{...style.defaults,ornament:100,pixelation,seed:123},edits:{}};
      const render=(letter:string,seed=123)=>style.renderGlyph({letter,state:{...state,params:{...state.params,seed}},selected:new Set(),interactive:false});
      const a=render('R'),b=render('R',456);
      const xml=exportSvg(style,state,{letters:[],word:'II CULTURE 50% €5',ink:'#123456'});
      const doc=new DOMParser().parseFromString(xml,'image/svg+xml');
      const ids=[...doc.querySelectorAll('[id]')].map(n=>n.id);
      const live=render('I'),exported=doc.querySelector('#letter-0-I');
      rows.push({aliases:render('r').outerHTML===a.outerHTML,
        stableBase:a.querySelector('[data-folk-base]').innerHTML===b.querySelector('[data-folk-base]').innerHTML,
        native:doc.querySelectorAll('text,image,use,foreignObject,parsererror').length===0,
        uniqueIds:new Set(ids).size===ids.length,
        parity:JSON.stringify([...live.querySelectorAll('path')].map(p=>p.getAttribute('d')))===JSON.stringify([...exported!.querySelectorAll('path')].map(p=>p.getAttribute('d'))),
        masks:[...doc.querySelectorAll('[mask]')].every(n=>doc.getElementById(n.getAttribute('mask')!.slice(5,-1))),
        wide:style.glyphWidth('W',state)>style.glyphWidth('I',state),
        layout:wordLayout(style,state,'a i').glyphs.map((g:any)=>g.letter).join(''),
        nodes:a.querySelectorAll('*').length});
    }
    const old=initialState(styles,JSON.stringify({version:1,activeStyle:'soft-pixel',styles:{},word:'OLD'}));
    const defaultState={params:style.defaults,edits:{}};
    const glyph=FOLK_GLYPHS.M;
    return {ids:styles.map((s:any)=>s.id),rows,migrated:old.activeStyle==='soft-pixel'&&old.styles['folk-ornamental'].params.ornament===40,
      fontTracking:style.glyphWidth('M',defaultState)===glyph.advance*style.defaults.scale+4};
  });
  expect(result.ids).toEqual(['botanical','soft-pixel','folk-ornamental']);
  expect(result.migrated).toBe(true);
  expect(result.fontTracking).toBe(true);
  for(const row of result.rows) {
    for(const key of ['aliases','stableBase','native','uniqueIds','parity','masks','wide'] as const)expect(row[key],key).toBe(true);
    expect(row.layout).toBe('A I');expect(row.nodes).toBeLessThan(100);
  }
});

test('Folk controls, focus, word composition and persistence work on desktop and mobile',async({page})=>{
  await page.goto('/');await page.locator('[data-style="2"]').click();
  await expect(page.locator('[data-style="2"]')).toBeInViewport();
  await page.locator('.glyph-art-button[data-focus="Q"]').click();
  await page.locator('[data-action="back"]').click();
  for(const [name,value] of [['ornament','80'],['pixelation','60'],['seed','12345']])await page.locator(`input[name="${name}"]`).fill(value);
  await page.locator('[data-action="word"]').click();await page.locator('#word-input').fill('culture 50%');
  await expect(page.locator('.word-svg')).toHaveAttribute('aria-label','Word CULTURE 50%, Folk Ornamental');
  const before=await page.locator('.word-svg').innerHTML();
  await page.reload();
  await expect(page.locator('#word-input')).toHaveValue('CULTURE 50%');
  for(const [name,value] of [['ornament','80'],['pixelation','60'],['seed','12345']])await expect(page.locator(`input[name="${name}"]`)).toHaveValue(value);
  await expect(page.locator('.word-svg')).toHaveAttribute('aria-label','Word CULTURE 50%, Folk Ornamental');
  expect(await page.locator('.word-svg').innerHTML()).toBe(before);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
